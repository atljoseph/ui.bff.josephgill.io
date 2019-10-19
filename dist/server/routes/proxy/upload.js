"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const httpProxy = require("http-proxy-middleware");
const proxy_1 = require("../../services/proxy");
module.exports = (APP_CONFIG) => {
    const router = express_1.Router();
    const logger = APP_CONFIG.logger;
    const API_HOST = process.env.UPLOAD_API_HOST || 'https://id3xfu5sw0.execute-api.us-east-1.amazonaws.com';
    function onError(error, req, res) {
        logger.logError(error, 'PROXY ERROR');
    }
    function onProxyReq(proxyReq, req, res) {
        if (res.locals.auth) {
            proxyReq.setHeader('Authorization', `Bearer ${res.locals.authHeader}`);
        }
        if (res.locals.authCookie) {
            const incomingCookies = proxyReq.getHeader('Cookie');
            const cookieString = proxy_1.ProxyService.formatAuthCookie(incomingCookies, APP_CONFIG.proxy_cookie, res.locals.authCookie, APP_CONFIG.cookie_blacklist);
            proxyReq.setHeader('Cookie', cookieString);
        }
    }
    function onProxyRes(proxyRes, req, res) {
        if (proxyRes && proxyRes.statusCode && proxyRes.statusCode > 499) {
            proxy_1.ProxyService.parseErrorResponse(proxyRes, req.originalUrl.replace(/^\/upload\//i, '/'), req.method)
                .subscribe(errorResponse => logger.logError(errorResponse, 'ERROR RESPONSE FROM API'), err => logger.logError('Error parsing api error'));
        }
    }
    const proxyOpts = {
        changeOrigin: true,
        target: API_HOST,
        onError,
        onProxyReq,
        onProxyRes,
        pathRewrite: {
            '^/upload/': '/'
        },
        logLevel: 'silent'
    };
    router.use('/', httpProxy(proxyOpts));
    return router;
};
