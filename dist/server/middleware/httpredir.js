"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
module.exports = (APP_CONFIG) => {
    const router = express_1.Router();
    router.use((req, res, next) => {
        let proto = req.headers['x-forwarded-proto'];
        if (Array.isArray(proto)) {
            proto = proto[0];
        }
        if (!proto || /https(:\/\/)?$/i.test(proto)) {
            return next();
        }
        else {
            const proxyHost = req.headers['x-forwarded-host'];
            const redir = `https://${proxyHost || req.hostname}${req.originalUrl}`;
            return res.redirect(301, redir);
        }
    });
    return router;
};
