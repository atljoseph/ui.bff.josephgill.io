"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = require("stream");
const cluster_1 = require("cluster");
class LoggingService {
    constructor() {
        this.logStream = new stream_1.Writable();
        this.logStream.write = (chunk) => {
            if (chunk && chunk.length) {
                this.log(chunk.trim());
            }
            return true;
        };
    }
    log(...messages) {
        if (cluster_1.isMaster) {
            console.log(...messages);
        }
        else {
            process.send(['console', ...messages]);
        }
    }
    logError(error, preamble) {
        let e = error.toString();
        if (/^\s?\[\s?object/i.test(e)) {
            try {
                e = JSON.stringify(error);
            }
            catch (err) {
            }
        }
        console.error(`ERROR: ${preamble || ''} ${e}`);
    }
    static customLogger(tokens, req, res) {
        const ips = req.ips;
        if (ips.length < 1) {
            ips.push(req.headers['x-forwarded-for']);
        }
        return [
            req.ip,
            JSON.stringify(req.ips),
            tokens.method(req, res),
            tokens.url(req, res),
            tokens.status(req, res),
            tokens.res(req, res, 'content-length'),
            '-',
            tokens['response-time'](req, res), 'ms'
        ].join(' ');
    }
}
exports.LoggingService = LoggingService;
