"use strict";
const express_1 = require("express");
const testRoute = (APP_CONFIG) => {
    const router = express_1.Router();
    const logger = APP_CONFIG.logger;
    router.get('/', (req, res) => {
        return res.send({ test: "hello world from BFF" });
    });
    return router;
};
module.exports = testRoute;
