import { Router } from 'express';
import * as httpProxy from 'http-proxy-middleware';
import { Config } from '../../models/config';
import { ProxyService } from '../../services/proxy';

module.exports = (APP_CONFIG: Config) => {
    const router = Router();
    const logger = APP_CONFIG.logger;

    const API_HOST = process.env.GO_API_HOST || 'http://localhost:8080/v1/api';

    function onError(error, req, res) {
        logger.logError(error, 'PROXY ERROR');
    }

    function onProxyReq(proxyReq, req, res) {
        console.log('onProxyReq ===========>', req.url)
        // if (res.locals.authHeader) {
        //     // add auth header to request
        //     proxyReq.setHeader('Authorization', `Bearer ${res.locals.authHeader}`);
        // }
        // if (res.locals.authCookie) {
        //     // Add the unsigned version of the auth cookie
        //     const incomingCookies = proxyReq.getHeader('Cookie');
        //     const cookieString = ProxyService.formatAuthCookie(incomingCookies, APP_CONFIG.proxy_cookie, res.locals.authCookie, APP_CONFIG.cookie_blacklist);
        //     proxyReq.setHeader('Cookie', cookieString);
        // }
    }

    function onProxyRes(proxyRes, req, res) {
        console.log('onProxyRes ===========>', proxyRes.statusMessage, proxyRes.statusCode, proxyRes.body)
        // if (proxyRes && proxyRes.headers && ('set-cookie' in proxyRes.headers)) {
        //     const proxyCookies = proxyRes.headers['set-cookie'];
        //     const resCookies = [];
        //     let appCookie;
        //     proxyCookies.forEach((c, i) => {
        //         const cOpts = ProxyService.parseProxyCookie(c);
        //         if (cOpts.name === APP_CONFIG.cookie_name) {
        //             appCookie = cOpts;
        //         } else {
        //             resCookies.push(c);
        //         }
        //     });
        //     proxyRes.headers['set-cookie'] = resCookies;
        //     if (appCookie) {
        //         res.cookie(appCookie.name, appCookie.value, {...appCookie.options, secure: req.secure});
        //     }
        // }
        if (proxyRes && proxyRes.statusCode && proxyRes.statusCode > 399) {
            ProxyService.parseErrorResponse(proxyRes, req.originalUrl.replace(/^\/go\//i, '/'), req.method)
            .subscribe(
                errorResponse => logger.logError(errorResponse, 'ERROR RESPONSE FROM API'),
                err => logger.logError('Error parsing api error')
            );
        }
    }

    const proxyOpts: httpProxy.Config = {
        changeOrigin: true,
        target: API_HOST,
        onError,
        onProxyReq,
        onProxyRes,
        pathRewrite: {
            '^/go/': '/'
        },
        logLevel: 'silent'
    };
    router.use('/', httpProxy(proxyOpts));

    return router;
};
