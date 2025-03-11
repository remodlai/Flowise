import { createLogger, transports, format } from 'winston'

const { combine, timestamp, printf, errors } = format

// Create a simple logger that doesn't depend on the server package
const logger = createLogger({
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.json(),
        printf(({ level, message, timestamp, stack }) => {
            const text = `${timestamp} [${level.toUpperCase()}]: ${message}`
            return stack ? text + '\n' + stack : text
        }),
        errors({ stack: true })
    ),
    defaultMeta: {
        package: 'components'
    },
    level: 'debug',
    transports: [
        new transports.Console({
            level: 'debug'
        })
    ]
})

export default logger 