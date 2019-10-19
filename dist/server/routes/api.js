"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
module.exports = (APP_CONFIG) => {
    const router = express_1.Router();
    router.use('/auth', require('./auth')(APP_CONFIG));
    router.use('/test', require('./test')(APP_CONFIG));
    return router;
};
