import express, { Request, Response, NextFunction } from 'express'
import path from 'path'
import cors from 'cors'
import http from 'http'
import { DataSource } from 'typeorm'
import { MODE } from './Interface'
import { getNodeModulesPackagePath, getEncryptionKey } from './utils'
import logger, { expressRequestLogger } from './utils/logger'
import { getDataSource } from './DataSource'
import { NodesPool } from './NodesPool'
import { ChatFlow } from './database/entities/ChatFlow'
import { CachePool } from './CachePool'
import { AbortControllerPool } from './AbortControllerPool'
import { RateLimiterManager } from './utils/rateLimit'
import { getAPIKeys } from './utils/apiKey'
import { sanitizeMiddleware, getCorsOptions, getAllowedIframeOrigins } from './utils/XSS'
import { Telemetry } from './utils/telemetry'
import flowiseApiV1Router from './routes'
import errorHandlerMiddleware from './middlewares/errors'
import { SSEStreamer } from './utils/SSEStreamer'
import { validateAPIKey } from './utils/validateKey'
import { IMetricsProvider } from './Interface.Metrics'
import { Prometheus } from './metrics/Prometheus'
import { OpenTelemetry } from './metrics/OpenTelemetry'
import { QueueManager } from './queue/QueueManager'
import { RedisEventSubscriber } from './queue/RedisEventSubscriber'
import { WHITELIST_URLS } from './utils/constants'
import 'global-agent/bootstrap'
import { authenticateUser } from './utils/supabaseAuth'
import { IUser } from './Interface'
import { setupSupabaseStorage } from './utils/setupSupabaseStorage'
import apiRoutes from './routes/api'
import { applicationContextMiddleware } from './middlewares/applicationContextMiddleware'
import { jwtDebugMiddleware } from './middleware/jwtDebug'
import { authenticateApiKey } from './middleware/authenticateApiKey'
import storageRoutes from './routes/storage'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: IUser
            tenants?: any[]
            roles?: any[]
            permissions?: any[]
        }
    }
}

declare global {
    namespace Express {
        namespace Multer {
            interface File {
                bucket: string
                key: string
                acl: string
                contentType: string
                contentDisposition: null
                storageClass: string
                serverSideEncryption: null
                metadata: any
                location: string
                etag: string
            }
        }
    }
}

export class App {
    app: express.Application
    nodesPool: NodesPool
    abortControllerPool: AbortControllerPool
    cachePool: CachePool
    telemetry: Telemetry
    rateLimiterManager: RateLimiterManager
    AppDataSource: DataSource = getDataSource()
    sseStreamer: SSEStreamer
    metricsProvider: IMetricsProvider
    queueManager: QueueManager
    redisSubscriber: RedisEventSubscriber
    Supabase: SupabaseClient | null = null

    constructor() {
        this.app = express()
    }
    async initDatabase() {
        // Initialize database
        try {
            await this.AppDataSource.initialize()
            logger.info('📦 [server]: Data Source is initializing...')

            // Run Migrations Scripts
            await this.AppDataSource.runMigrations({ transaction: 'each' })

            // Initialize nodes pool
            //RMODL TODO: NodesPool relies on the legacy database, especially for credentials.  This causes our problems and needs refactor.
            this.nodesPool = new NodesPool()
            await this.nodesPool.initialize()

            // Initialize abort controllers pool
            this.abortControllerPool = new AbortControllerPool()

            // Initialize API keys
            await getAPIKeys()

            // Initialize encryption key
            await getEncryptionKey()

            // Initialize Rate Limit
            this.rateLimiterManager = RateLimiterManager.getInstance()
            await this.rateLimiterManager.initializeRateLimiters(await getDataSource().getRepository(ChatFlow).find())

            // Initialize cache pool
            this.cachePool = new CachePool()

            // Initialize telemetry
            this.telemetry = new Telemetry()

            // Initialize SSE Streamer
            this.sseStreamer = new SSEStreamer()

            // Init Queues
            if (process.env.MODE === MODE.QUEUE) {
                this.queueManager = QueueManager.getInstance()
                this.queueManager.setupAllQueues({
                    componentNodes: this.nodesPool.componentNodes,
                    telemetry: this.telemetry,
                    cachePool: this.cachePool,
                    appDataSource: this.AppDataSource,
                    abortControllerPool: this.abortControllerPool
                })
                this.redisSubscriber = new RedisEventSubscriber(this.sseStreamer)
                await this.redisSubscriber.connect()
            }

            logger.info('📦 [server]: Data Source has been initialized!')
        } catch (error) {
            logger.error('❌ [server]: Error during Data Source initialization:', error)
        }
    }

    async initSupabase() {
        try {
            logger.info('[server]: Initializing Supabase client')
            
            const supabaseUrl = process.env.SUPABASE_URL
            const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
            
            if (!supabaseUrl || !supabaseServiceKey) {
                logger.warn('[server]: Supabase URL or service key not provided, Supabase integration will not be available')
                return
            }
            
            this.Supabase = createClient(supabaseUrl, supabaseServiceKey, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false
                }
            })
            
            // Test the connection
            const { error } = await this.Supabase.from('secrets').select('id').limit(1)
            
            if (error) {
                logger.error(`[server]: Failed to connect to Supabase: ${error.message}`)
                this.Supabase = null
            } else {
                logger.info('[server]: Supabase client initialized successfully')
            }
        } catch (error) {
            logger.error(`[server]: Error initializing Supabase client: ${error}`)
            this.Supabase = null
        }
    }

    getSupabaseClient(): SupabaseClient {
        if (!this.Supabase) {
            throw new Error('Supabase client not initialized')
        }
        return this.Supabase
    }

    async config() {
        // Limit is needed to allow sending/receiving base64 encoded string
        const flowise_file_size_limit = process.env.FLOWISE_FILE_SIZE_LIMIT || '50mb'
        this.app.use(express.json({ limit: flowise_file_size_limit }))
        this.app.use(express.urlencoded({ limit: flowise_file_size_limit, extended: true }))
        if (process.env.NUMBER_OF_PROXIES && parseInt(process.env.NUMBER_OF_PROXIES) > 0)
            this.app.set('trust proxy', parseInt(process.env.NUMBER_OF_PROXIES))

        // Allow access from specified domains
        this.app.use(cors(getCorsOptions()))

        // Allow embedding from specified domains.
        this.app.use((req, res, next) => {
            const allowedOrigins = getAllowedIframeOrigins()
            if (allowedOrigins == '*') {
                next()
            } else {
                const csp = `frame-ancestors ${allowedOrigins}`
                res.setHeader('Content-Security-Policy', csp)
                next()
            }
        })

        // Switch off the default 'X-Powered-By: Express' header
        this.app.disable('x-powered-by')

        // Add the expressRequestLogger middleware to log all requests
        this.app.use(expressRequestLogger)

        // Add the sanitizeMiddleware to guard against XSS
        this.app.use(sanitizeMiddleware)

        // Add a special route for secrets that bypasses authentication
        const secretsRouter = require('./routes/secrets').default
        this.app.use('/api/v1/secrets', secretsRouter)

        // Use API key authentication middleware first
        this.app.use('/api/v1', authenticateApiKey)

        // Use Supabase authentication middleware for API routes
        this.app.use('/api/v1', authenticateUser)
        
        // Add JWT debug middleware to log claims
        if (process.env.DEBUG_JWT === 'true') {
            this.app.use('/api/v1', jwtDebugMiddleware)
        }
        
        // Use application context middleware for API routes
        this.app.use('/api/v1', applicationContextMiddleware)

        if (process.env.ENABLE_METRICS === 'true') {
            switch (process.env.METRICS_PROVIDER) {
                // default to prometheus
                case 'prometheus':
                case undefined:
                    this.metricsProvider = new Prometheus(this.app)
                    break
                case 'open_telemetry':
                    this.metricsProvider = new OpenTelemetry(this.app)
                    break
                // add more cases for other metrics providers here
            }
            if (this.metricsProvider) {
                await this.metricsProvider.initializeCounters()
                logger.info(`📊 [server]: Metrics Provider [${this.metricsProvider.getName()}] has been initialized!`)
            } else {
                logger.error(
                    "❌ [server]: Metrics collection is enabled, but failed to initialize provider (valid values are 'prometheus' or 'open_telemetry'."
                )
            }
        }

        // Initialize Supabase before other services that might depend on it
        await this.initSupabase()

        // Mount the main API router
        this.app.use('/api/v1', flowiseApiV1Router)
        
        // Mount the custom roles API router directly (not nested)
        this.app.use('/api/v1', apiRoutes)
        
        // Mount the storage API router
        this.app.use('/api/v1', storageRoutes)

        // ----------------------------------------
        // Configure number of proxies in Host Environment
        // ----------------------------------------
        this.app.get('/api/v1/ip', (request, response) => {
            response.send({
                ip: request.ip,
                msg: 'Check returned IP address in the response. If it matches your current IP address ( which you can get by going to http://ip.nfriedly.com/ or https://api.ipify.org/ ), then the number of proxies is correct and the rate limiter should now work correctly. If not, increase the number of proxies by 1 and restart Cloud-Hosted Flowise until the IP address matches your own. Visit https://docs.flowiseai.com/configuration/rate-limit#cloud-hosted-rate-limit-setup-guide for more information.'
            })
        })

        if (process.env.MODE === MODE.QUEUE) {
            this.app.use('/admin/queues', this.queueManager.getBullBoardRouter())
        }

        // ----------------------------------------
        // Serve UI static
        // ----------------------------------------
        //const packagePath = getNodeModulesPackagePath('flowise-ui')
        const packagePath = getNodeModulesPackagePath('remodl-platform-ui')
        const uiBuildPath = path.join(packagePath, 'build')
        const uiHtmlPath = path.join(packagePath, 'build', 'index.html')

        this.app.use('/', express.static(uiBuildPath))

        // All other requests not handled will return React app
        this.app.use((req: Request, res: Response) => {
            res.sendFile(uiHtmlPath)
        })

        // Error handling
        this.app.use(errorHandlerMiddleware)
    }

    async stopApp() {
        try {
            const removePromises: any[] = []
            removePromises.push(this.telemetry.flush())
            if (this.queueManager) {
                removePromises.push(this.redisSubscriber.disconnect())
            }
            await Promise.all(removePromises)
        } catch (e) {
            logger.error(`❌[server]: Flowise Server shut down error: ${e}`)
        }

        // Close Supabase connection if it exists
        if (this.Supabase) {
            logger.info('[server]: Closing Supabase connection')
            this.Supabase = null
        }
    }
}

let serverApp: App | undefined

export async function start(): Promise<void> {
    serverApp = new App()
    await serverApp.initDatabase()
    await serverApp.config()

    // Initialize Supabase Storage buckets if Supabase credentials are available
    // This ensures all required storage buckets exist with proper RLS policies
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
        try {
            await setupSupabaseStorage()
            logger.info('Supabase Storage buckets initialized successfully')
        } catch (error) {
            logger.error('Failed to initialize Supabase Storage buckets:', error)
        }
    }

    const host = process.env.HOST || '0.0.0.0'
    const port = parseInt(process.env.PORT || '3000', 10)

    serverApp.app.listen(port, host, () => {
        logger.info(`Remodl AI Platform Server running at http://${host}:${port}`)
    })
}

export function getInstance(): App | undefined {
    return serverApp
}
