"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../services/auth");
module.exports = (APP_CONFIG) => {
    const router = express_1.Router();
    const logger = APP_CONFIG.logger;
    const authService = new auth_1.AuthService(process.env.NODE_API_HOST || 'http://localhost:3000', APP_CONFIG.proxy_cookie);
    router.post('/login', (req, res, next) => {
        const body = req.body;
        if (!body || !body.Email || !body.Password || !body.ApplicationId) {
            return res.status(400).send({ Error: 'ApplicationId, Email, and Password are required fields' });
        }
        authService.login(body.ApplicationId, body.Email, body.Password)
            .subscribe(resp => res.send(resp), err => {
            logger.logError(err);
            return res.status(err.Status).send({ Error: 'Could not log you in' });
        });
    });
    router.get('/valid', (req, res, next) => {
        if (res.locals.auth && res.locals.auth.length) {
            return res.send(true);
        }
        else {
            return res.send(false);
        }
    });
    return router;
};
