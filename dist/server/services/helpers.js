"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cluster_1 = require("cluster");
const fs_1 = require("fs");
class HelpersService {
    static tryLoad(filePath) {
        if (!filePath || !filePath.length) {
            return undefined;
        }
        try {
            return fs_1.readFileSync(filePath);
        }
        catch (err) {
            console.log('Could not load', filePath);
            return undefined;
        }
    }
    static forkWorker() {
        const worker = cluster_1.fork();
        worker.on('exit', (code, signal) => {
            console.log(`[ worker ${worker.id} ]: exiting with code {${code}}${signal ? ` in response to signal {${signal}}` : ''}`);
        });
        worker.on('error', (err) => {
            console.error(`[ worker ${worker.id} ]: ERROR`, err);
        });
        return worker;
    }
    static changeContentType(res, path, stat) {
        res.set('content-type', 'application/javascript');
    }
}
exports.HelpersService = HelpersService;
