"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const httpProxy = require("http-proxy-middleware");
const proxy_1 = require("../../services/proxy");
module.exports = (APP_CONFIG) => {
    const router = express_1.Router();
    const logger = APP_CONFIG.logger;
    const API_HOST = process.env.NODE_API_HOST || 'http://localhost:3000';
    function onError(error, req, res) {
        logger.logError(error, 'PROXY ERROR');
    }
    function onProxyReq(proxyReq, req, res) {
        if (res.locals.authHeader) {
            proxyReq.setHeader('Authorization', `Bearer ${res.locals.authHeader}`);
        }
        if (res.locals.authCookie) {
            const incomingCookies = proxyReq.getHeader('Cookie');
            const cookieString = proxy_1.ProxyService.formatAuthCookie(incomingCookies, APP_CONFIG.proxy_cookie, res.locals.authCookie, APP_CONFIG.cookie_blacklist);
            proxyReq.setHeader('Cookie', cookieString);
        }
    }
    function onProxyRes(proxyRes, req, res) {
        if (proxyRes && proxyRes.headers && ('set-cookie' in proxyRes.headers)) {
            const proxyCookies = proxyRes.headers['set-cookie'];
            proxyCookies.forEach((c, i) => {
                const cOpts = proxy_1.ProxyService.parseProxyCookie(c);
                if (cOpts.name === APP_CONFIG.proxy_cookie) {
                    res.cookie(APP_CONFIG.cookie_name, cOpts.value, Object.assign({}, cOpts.options, { domain: undefined, signed: true, secure: req.secure }));
                }
                else {
                    res.cookie(cOpts.name, cOpts.value, Object.assign({}, cOpts.options, { secure: req.secure }));
                }
            });
            delete proxyRes.headers['set-cookie'];
        }
        if (proxyRes && proxyRes.statusCode && proxyRes.statusCode > 399) {
            proxy_1.ProxyService.parseErrorResponse(proxyRes, req.originalUrl.replace(/^\/node\//i, '/'), req.method)
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
            '^/node/': '/'
        },
        logLevel: 'silent'
    };
    router.use('/', httpProxy(proxyOpts));
    return router;
};
