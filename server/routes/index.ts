import {Router} from 'express';
import {Config} from '../models/config';

const getRoutes = (APP_CONFIG: Config): Router => {
    const router = Router();

    // PUBLIC
    // router.use('/pusher', require('./pusher')(APP_CONFIG));
    // router.use('/auth', require('./auth')(APP_CONFIG));
    router.use('/test', require('./test')(APP_CONFIG));

    // AuthGate
    // router.use((req, res, next) => {
    //     if (!res.locals.usersession) {
    //         return res.status(401).send('Unauthenticated');
    //     } else {
    //         return next();
    //     }
    // });

    // PRIVATE ROUTES GO BELOW HERE

    // Return middleware router
    return router;
}

export = getRoutes