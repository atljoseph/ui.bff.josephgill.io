import {Router} from 'express';
import {Config} from '../models/config';
import * as Pusher from 'pusher';

module.exports = (APP_CONFIG: Config) => {
    const router = Router();
    const logger = APP_CONFIG.logger;

    const pusherConfig = {
        appKey: process.env.PUSHER_KEY || '6817f8de567288f09de7',
        config: {
            cluster: process.env.PUSHER_CLUSTER || 'mt1',
            authEndpoint: '/bff/pusher/auth',
        }
    };

    let pusherClient;
    if (!process.env.PUSHER_KEY || !process.env.PUSHER_SECRET) {
        logger.logError('No pusher creds configured!');
    } else {
        pusherClient = new Pusher({
            appId: process.env.PUSHER_APP_ID || '701611',
            cluster: pusherConfig.config.cluster,
            key: pusherConfig.appKey,
            secret: process.env.PUSHER_SECRET || 'pushersecret',
        });
    }

    router.get('/config', (req, res) => {
        return res.send(pusherConfig);
    });

    router.post('/auth', (req, res) => {
        const body = req.body;
        if (!pusherClient || !body)  {
            return res.status(403).send({Error: 'FORBIDDEN'});
        }
        const socketId = body.socket_id;
        const channel = body.channel_name;
        if (!socketId || !channel) {
            return res.status(403).send({Error: 'FORBIDDEN'});
        }
        const auth = pusherClient.authenticate(socketId, channel);
        return res.send(auth);
    });

    return router;
}
