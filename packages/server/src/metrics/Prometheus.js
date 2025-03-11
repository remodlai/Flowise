"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Prometheus = void 0;
const Interface_Metrics_1 = require("../Interface.Metrics");
const prom_client_1 = __importStar(require("prom-client"));
const utils_1 = require("@components/utils");
class Prometheus {
    constructor(app) {
        this.app = app;
        this.register = new prom_client_1.default.Registry();
    }
    getName() {
        return 'Prometheus';
    }
    async initializeCounters() {
        const serviceName = process.env.METRICS_SERVICE_NAME || 'FlowiseAI';
        this.register.setDefaultLabels({
            app: serviceName
        });
        // look at the FLOWISE_COUNTER enum in Interface.Metrics.ts and get all values
        // for each counter in the enum, create a new promClient.Counter and add it to the registry
        this.counters = new Map();
        const enumEntries = Object.entries(Interface_Metrics_1.FLOWISE_METRIC_COUNTERS);
        enumEntries.forEach(([name, value]) => {
            // derive proper counter name from the enum value (chatflow_created = Chatflow Created)
            const properCounterName = name.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
            this.counters.set(value, new prom_client_1.default.Counter({
                name: value,
                help: `Total number of ${properCounterName}`,
                labelNames: ['status']
            }));
        });
        // in addition to the enum counters, add a few more custom counters
        // version, http_request_duration_ms, http_requests_total
        const versionGaugeCounter = new prom_client_1.default.Gauge({
            name: 'flowise_version_info',
            help: 'Flowise version info.',
            labelNames: ['version']
        });
        const { version } = await (0, utils_1.getVersion)();
        versionGaugeCounter.set({ version: 'v' + version }, 1);
        this.counters.set('flowise_version', versionGaugeCounter);
        this.httpRequestDurationMicroseconds = new prom_client_1.default.Histogram({
            name: 'http_request_duration_ms',
            help: 'Duration of HTTP requests in ms',
            labelNames: ['method', 'route', 'code'],
            buckets: [1, 5, 15, 50, 100, 200, 300, 400, 500] // buckets for response time from 0.1ms to 500ms
        });
        this.counters.set('http_request_duration_ms', this.httpRequestDurationMicroseconds);
        this.requestCounter = new prom_client_1.Counter({
            name: 'http_requests_total',
            help: 'Total number of HTTP requests',
            labelNames: ['method', 'path', 'status']
        });
        this.counters.set('http_requests_total', this.requestCounter);
        this.registerMetrics();
        await this.setupMetricsEndpoint();
    }
    async setupMetricsEndpoint() {
        // Add Prometheus middleware to the app
        this.app.use('/api/v1/metrics', async (req, res) => {
            res.set('Content-Type', this.register.contentType);
            const currentMetrics = await this.register.metrics();
            res.send(currentMetrics).end();
        });
        // Runs before each requests
        this.app.use((req, res, next) => {
            res.locals.startEpoch = Date.now();
            next();
        });
        // Runs after each requests
        this.app.use((req, res, next) => {
            res.on('finish', async () => {
                if (res.locals.startEpoch) {
                    this.requestCounter.inc();
                    const responseTimeInMs = Date.now() - res.locals.startEpoch;
                    this.httpRequestDurationMicroseconds
                        .labels(req.method, req.baseUrl, res.statusCode.toString())
                        .observe(responseTimeInMs);
                }
            });
            next();
        });
    }
    incrementCounter(counter, payload) {
        // increment the counter with the payload
        if (this.counters.has(counter)) {
            ;
            this.counters.get(counter).labels(payload).inc();
        }
    }
    registerMetrics() {
        if (process.env.METRICS_INCLUDE_NODE_METRICS !== 'false') {
            // enable default metrics like CPU usage, memory usage, etc.
            prom_client_1.default.collectDefaultMetrics({ register: this.register });
        }
        // Add our custom metrics to the registry
        for (const counter of this.counters.values()) {
            this.register.registerMetric(counter);
        }
    }
}
exports.Prometheus = Prometheus;
//# sourceMappingURL=Prometheus.js.map