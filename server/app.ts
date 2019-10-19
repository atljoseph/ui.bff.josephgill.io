import {join} from 'path';
import {createServer} from 'http';
import {cpus} from 'os';
import * as cluster from 'cluster';
import * as spdy from 'spdy';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as compress from 'compression';
import * as express from 'express';
import * as morgan from 'morgan';
import * as dotenv from 'dotenv';

import {Config} from './models/config';
import {HelpersService} from './services/helpers';
import {LoggingService} from './services/logger';
// import {JWTService} from './services/jwt';

const dotenvConfig: dotenv.DotenvConfigOptions = {}
dotenv.config(dotenvConfig);

const APP_CONFIG: Config = {
    environment: process.env.BFF_ENVIRONMENT || 'dev',
    cookie_name: process.env.BFF_COOKIE_NAME || '__joe_dev',
    proxy_cookie: process.env.BFF_PROXY_COOKIE || 'access_token_dev',
    cookie_secret: process.env.BFF_COOKIE_SECRET || 'cookie_secret',
    port: (+process.env.BFF_PORT) || 4205,
    log_level: process.env.BFF_MORGAN_LOG_LEVEL || 'short',
    client_root: process.env.BFF_CLIENT_ROOT || join(__dirname, '../client/'),
    max_workers: +(process.env.BFF_MAX_THREADS || cpus().length),
};

APP_CONFIG.cookie_blacklist = ['access_token_dev', 'access_token_uat', APP_CONFIG.cookie_name];

console.log(JSON.stringify(APP_CONFIG, null, 2));

if (cluster.isMaster) {
    // master thread

    const numCPUs = Math.max(2, Math.min(cpus().length, APP_CONFIG.max_workers));
    const workers: cluster.Worker[] = [];
    console.log('[ master ]: App starting on port', APP_CONFIG.port);
    console.log(`[ master ]: Spinning up ${numCPUs - 1} workers`);
    for (let i=1; i < numCPUs; i++) {
        const worker = HelpersService.forkWorker();
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
            const newWorker = HelpersService.forkWorker();
            workers.push(newWorker);
        }
    });

    process.on('exit', () => {
        console.log('[ master ]: killing workers');
        workers.forEach((worker) => worker.kill());
    });

} else {
    // worker thread(s)

    // Services
    const loggingService = new LoggingService();
    APP_CONFIG.logger = loggingService;

    // const jwtService = new JWTService();
    // APP_CONFIG.jwtService = jwtService;

    // set up an express server
    const app = express();

    // use compression
    app.use(compress());

    // use cookieParser with secret
    app.use(cookieParser(APP_CONFIG.cookie_secret));

    // logging
    app.use(
        morgan(
            APP_CONFIG.log_level || ((tokens, req, res) => LoggingService.customLogger(tokens, req, res)),
            {
                stream: loggingService.logStream
            }
        )
    );

    // redirect http to https
    app.use(require('./middleware/httpredir')(APP_CONFIG));

    // enable cors
    app.use((req, res, next) => {
        const origin = req.get('origin');
        // Allow CORS from extension. Hardcode to extension id once deployed
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

    // Defeat the IE 11 cache without ruining PWA caching
    app.use((req, res, next) => {
        res.set('Expires', '0');
        return next();
    });

    // set up http vs https
    let server;
    if (process.env.BFF_HTTPS) {
        let ssl_config = {
            key: (process.env.BFF_SSLKEY ? HelpersService.tryLoad(process.env.BFF_SSLKEY) : undefined),
            cert: (process.env.BFF_SSLCERT ? HelpersService.tryLoad(process.env.BFF_SSLCERT) : undefined),
            ca: (process.env.BFF_SSLCHAIN ? HelpersService.tryLoad(process.env.BFF_SSLCHAIN) : undefined),
            pfx: (process.env.BFF_SSLPFX ? HelpersService.tryLoad(process.env.BFF_SSLPFX) : undefined)
        };
        server = spdy.createServer(ssl_config, app);
        let redir = express();
        redir.get('*', (req, res, next) => {
        let httpshost = `https://${req.headers.host}${req.url}`;
        return res.redirect(httpshost);
        });
        redir.listen(80);
    } else {
        server = createServer(app);
    }

    // use authing middleware
    // app.use(require('./middleware/auth')(APP_CONFIG));

    /*------- Proxy Routes -------*/
    app.use('/go', require('./proxy-routes/go')(APP_CONFIG));
    // app.use('/upload', require('./routes/proxy/upload')(APP_CONFIG));

    /*---- Body Parser ----*/
    app.use(bodyParser.json({limit: '100mb'}));
    app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

    /*-------- API --------*/
    app.use(['/api', '/bff', '/extension'], require('./routes')(APP_CONFIG));

    /*------- Angular client on Root ------- */
    app.use('/wb-assets/',
      express.static(join(APP_CONFIG.client_root, './wb-assets'),
      {maxAge: 0, setHeaders: HelpersService.changeContentType})
    );

    // Render static files
    app.get('*.*', express.static(APP_CONFIG.client_root, {maxAge: 0}));

    // Standard Client-side Angular for all pages
    app.get('*', (req, res, next) => {
        if (!/\.html/i.test(req.path) && /\./i.test(req.path)) {
            return next();
        }
        return res.sendFile(join(APP_CONFIG.client_root, './index.html'));
    });

    // if route not resolved above, return 404
    app.all('*', (req, res) => {
        return res.status(404).send({Message: '404 UNKNOWN ROUTE'});
    });

    // listen
    server.listen(APP_CONFIG.port);

    if (cluster.isMaster) {
        console.log('APP LISTENING ON PORT', APP_CONFIG.port);
    }
}
