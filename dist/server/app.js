"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const http_1 = require("http");
const os_1 = require("os");
const cluster = require("cluster");
const spdy = require("spdy");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const compress = require("compression");
const express = require("express");
const morgan = require("morgan");
const dotenv = require("dotenv");
const helpers_1 = require("./services/helpers");
const logger_1 = require("./services/logger");
const dotenvConfig = {};
dotenv.config(dotenvConfig);
const APP_CONFIG = {
    environment: process.env.BFF_ENVIRONMENT || 'dev',
    cookie_name: process.env.BFF_COOKIE_NAME || '__joe_dev',
    proxy_cookie: process.env.BFF_PROXY_COOKIE || 'access_token_dev',
    cookie_secret: process.env.BFF_COOKIE_SECRET || 'cookie_secret',
    port: (+process.env.BFF_PORT) || 4205,
    log_level: process.env.BFF_MORGAN_LOG_LEVEL || 'short',
    client_root: process.env.BFF_CLIENT_ROOT || path_1.join(__dirname, '../client/'),
    max_workers: +(process.env.BFF_MAX_THREADS || os_1.cpus().length),
};
APP_CONFIG.cookie_blacklist = ['access_token_dev', 'access_token_uat', APP_CONFIG.cookie_name];
console.log(JSON.stringify(APP_CONFIG, null, 2));
if (cluster.isMaster) {
    const numCPUs = Math.max(2, Math.min(os_1.cpus().length, APP_CONFIG.max_workers));
    const workers = [];
    console.log('[ master ]: App starting on port', APP_CONFIG.port);
    console.log(`[ master ]: Spinning up ${numCPUs - 1} workers`);
    for (let i = 1; i < numCPUs; i++) {
        const worker = helpers_1.HelpersService.forkWorker();
        workers.push(worker);
    }
    cluster.on('listening', (worker) => {
        console.log(`[ worker ${worker.id} ]: Ready and listening!`);
    });
    cluster.on('message', (worker, messages, handle) => {
        if (Array.isArray(messages) && messages.shift() === 'console') {
            console.log(`[ worker ${worker.id} ]:`, ...messages);
        }
    });
    cluster.on('exit', (worker, code, signal) => {
        const deadIndex = workers.findIndex(w => w.id === worker.id);
        if (deadIndex >= 0) {
            workers.splice(deadIndex, 1);
        }
        if (!worker.exitedAfterDisconnect) {
            console.log(`[ master ]: replacing crashed worker ${worker.id}`);
            const newWorker = helpers_1.HelpersService.forkWorker();
            workers.push(newWorker);
        }
    });
    process.on('exit', () => {
        console.log('[ master ]: killing workers');
        workers.forEach((worker) => worker.kill());
    });
}
else {
    const loggingService = new logger_1.LoggingService();
    APP_CONFIG.logger = loggingService;
    const app = express();
    app.use(compress());
    app.use(cookieParser(APP_CONFIG.cookie_secret));
    app.use(morgan(APP_CONFIG.log_level || ((tokens, req, res) => logger_1.LoggingService.customLogger(tokens, req, res)), {
        stream: loggingService.logStream
    }));
    app.use(require('./middleware/httpredir')(APP_CONFIG));
    app.use((req, res, next) => {
        const origin = req.get('origin');
        if (origin && /^((moz)|(chrome))-extension:\/\//.test(origin)) {
            res.header('Access-Control-Allow-Origin', origin);
            res.header('Access-Control-Allow-Headers', '*');
            return next();
        }
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', '*');
        return next();
    });
    app.options('*', (req, res, next) => res.send(true));
    app.use((req, res, next) => {
        res.set('Expires', '0');
        return next();
    });
    let server;
    if (process.env.BFF_HTTPS) {
        let ssl_config = {
            key: (process.env.BFF_SSLKEY ? helpers_1.HelpersService.tryLoad(process.env.BFF_SSLKEY) : undefined),
            cert: (process.env.BFF_SSLCERT ? helpers_1.HelpersService.tryLoad(process.env.BFF_SSLCERT) : undefined),
            ca: (process.env.BFF_SSLCHAIN ? helpers_1.HelpersService.tryLoad(process.env.BFF_SSLCHAIN) : undefined),
            pfx: (process.env.BFF_SSLPFX ? helpers_1.HelpersService.tryLoad(process.env.BFF_SSLPFX) : undefined)
        };
        server = spdy.createServer(ssl_config, app);
        let redir = express();
        redir.get('*', (req, res, next) => {
            let httpshost = `https://${req.headers.host}${req.url}`;
            return res.redirect(httpshost);
        });
        redir.listen(80);
    }
    else {
        server = http_1.createServer(app);
    }
    app.use('/go', require('./proxy-routes/go')(APP_CONFIG));
    app.use(bodyParser.json({ limit: '100mb' }));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
    app.use(['/api', '/bff', '/extension'], require('./routes')(APP_CONFIG));
    app.use('/wb-assets/', express.static(path_1.join(APP_CONFIG.client_root, './wb-assets'), { maxAge: 0, setHeaders: helpers_1.HelpersService.changeContentType }));
    app.get('*.*', express.static(APP_CONFIG.client_root, { maxAge: 0 }));
    app.get('*', (req, res, next) => {
        if (!/\.html/i.test(req.path) && /\./i.test(req.path)) {
            return next();
        }
        return res.sendFile(path_1.join(APP_CONFIG.client_root, './index.html'));
    });
    app.all('*', (req, res) => {
        return res.status(404).send({ Message: '404 UNKNOWN ROUTE' });
    });
    server.listen(APP_CONFIG.port);
    if (cluster.isMaster) {
        console.log('APP LISTENING ON PORT', APP_CONFIG.port);
    }
}
