"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
module.exports = (APP_CONFIG) => {
    const router = express_1.Router();
    const logger = APP_CONFIG.logger;
    router.get('/', (req, res) => {
        return res.send({ test: "hello world from BFF" });
    });
    return router;
};
