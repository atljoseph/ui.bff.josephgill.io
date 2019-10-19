"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const httpProxy = require("http-proxy-middleware");
const proxy_1 = require("../../services/proxy");
module.exports = (APP_CONFIG) => {
    const router = express_1.Router();
    const logger = APP_CONFIG.logger;
    const API_HOST = process.env.GO_API_HOST || 'http://localhost:8080/v1/api';
    function onError(error, req, res) {
        logger.logError(error, 'PROXY ERROR');
    }
    function onProxyReq(proxyReq, req, res) {
        console.log('onProxyReq ===========>', req.url);
    }
    function onProxyRes(proxyRes, req, res) {
        console.log('onProxyRes ===========>', proxyRes.statusMessage, proxyRes.statusCode, proxyRes.body);
        if (proxyRes && proxyRes.statusCode && proxyRes.statusCode > 399) {
            proxy_1.ProxyService.parseErrorResponse(proxyRes, req.originalUrl.replace(/^\/go\//i, '/'), req.method)
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
            '^/go/': '/'
        },
        logLevel: 'silent'
    };
    router.use('/', httpProxy(proxyOpts));
    return router;
};
