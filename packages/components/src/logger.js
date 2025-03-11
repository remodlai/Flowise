"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const { combine, timestamp, printf, errors } = winston_1.format;
// Create a simple logger that doesn't depend on the server package
const logger = (0, winston_1.createLogger)({
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.format.json(), printf(({ level, message, timestamp, stack }) => {
        const text = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        return stack ? text + '\n' + stack : text;
    }), errors({ stack: true })),
    defaultMeta: {
        package: 'components'
    },
    level: 'debug',
    transports: [
        new winston_1.transports.Console({
            level: 'debug'
        })
    ]
});
exports.default = logger;
//# sourceMappingURL=logger.js.map