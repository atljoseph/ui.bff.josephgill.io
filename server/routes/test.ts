import {Router} from 'express';
import {Config} from '../models/config';

module.exports = (APP_CONFIG: Config) => {
    const router = Router();
    const logger = APP_CONFIG.logger;

    router.get('/', (req, res) => {
        return res.send({ test: "hello world from BFF" });
    });

    return router;
}
