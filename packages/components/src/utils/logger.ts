import { createLogger, transports, format } from 'winston'
const { combine, timestamp, printf, errors } = format

const logger = createLogger({
    format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.json(),
        printf(({ level, message, timestamp, stack, ...metadata }) => {
            const text = `${timestamp} [${level.toUpperCase()}]: ${message}`
            const meta = Object.keys(metadata).length ? `\n${JSON.stringify(metadata, null, 2)}` : ''
            return stack ? `${text}${meta}\n${stack}` : `${text}${meta}`
        }),
        errors({ stack: true })
    ),
    defaultMeta: {
        package: 'components'
    },
    transports: [
        new transports.Console({
            level: 'debug'
        })
    ]
})

export default logger
