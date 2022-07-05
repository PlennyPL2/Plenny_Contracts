const fs = require('fs');
const path = require('path');
const winston = require('winston');
require('winston-daily-rotate-file');

const transportLogFile = new winston.transports.DailyRotateFile({
    level: 'error',
    filename: path.resolve("server/logs", 'DLSP-%DATE%.log'),
    datePattern: 'YYYY-MM-DD-HH',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d'
});

transportLogFile.on('rotate', function (oldFilename, newFilename) {
    // do something
});

const logConfiguration = {
    transports: [
        new winston.transports.Console(),
        transportLogFile
    ],
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.align(),
        winston.format.printf((info) => {
            const {
                timestamp, level, message, ...args
            } = info;

            const ts = timestamp.slice(0, 19).replace('T', ' ');
            return `${ts} [${level}]: ${message} ${Object.keys(args).length ? JSON.stringify(args, null, 4) : ''}`;
        }),
    )
};

const logger = winston.createLogger(logConfiguration);
logger.level = process.env.LOG_LEVEL || 'info';

module.exports = {
    logger: logger,
    accessLogStream: fs.createWriteStream(path.join(__dirname, '../logs/access.log'), {flags: 'a'})
}