"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
module.exports = (APP_CONFIG) => {
    const router = express_1.Router();
    const jwtService = APP_CONFIG.jwtService;
    router.use((req, res, next) => {
        if (res.locals.auth) {
            return next();
        }
        if ((!req.signedCookies || !req.signedCookies[APP_CONFIG.cookie_name]) && !req.get('Authorization')) {
            res.locals.auth = null;
            return next();
        }
        let accessToken;
        if (req.signedCookies && req.signedCookies[APP_CONFIG.cookie_name]) {
            accessToken = req.signedCookies[APP_CONFIG.cookie_name];
            res.locals.authCookie = req.signedCookies[APP_CONFIG.cookie_name];
            res.locals.authHeader = jwtService.getBody(req.signedCookies[APP_CONFIG.cookie_name]);
        }
        if (!accessToken && req.get('Authorization')) {
            const authHeader = req.get('Authorization');
            if (/^bearer /i.test(authHeader)) {
                const headerToken = authHeader.replace(/^bearer\s+/i, '');
                accessToken = headerToken;
                res.locals.authCookie = headerToken;
                res.locals.authHeader = jwtService.getBody(headerToken);
            }
        }
        if (!accessToken) {
            delete res.locals.auth;
            return next();
        }
        res.locals.auth = accessToken;
        jwtService.decodeToken(accessToken).subscribe(userInfo => {
            res.locals.user = userInfo;
            return next();
        }, err => {
            res.locals.user = null;
            return next();
        });
    });
    return router;
};
