// import {Router} from 'express';
// import {Config} from '../models/config';
// import { AuthService } from '../services/auth';

// // This is an optional set of auth endpoints to maintain a little more control over auth flow.
// // Instead of relying on proxied auth setting cookies, this calls the auth endpoint directly
// // and inspects the response;

// module.exports = (APP_CONFIG: Config) => {
//     const router = Router();
//     const logger = APP_CONFIG.logger;
//     const authService = new AuthService(
//         process.env.BFF_GO_API_HOST || 'http://localhost:3000',
//         APP_CONFIG.proxy_cookie
//     );

//     router.post('/login', (req, res, next) => {
//         const body = req.body;
//         if (!body || !body.Email || !body.Password || !body.ApplicationId) {
//             return res.status(400).send({Error: 'ApplicationId, Email, and Password are required fields'});
//         }
//         authService.login(body.ApplicationId, body.Email, body.Password)
//         .subscribe(
//             resp => res.send(resp),
//             err => {
//                 logger.logError(err);
//                 return res.status(err.Status).send({Error: 'Could not log you in'});
//             }
//         );
//     });

//     router.get('/valid', (req, res, next) => {
//         if (res.locals.auth && res.locals.auth.length) {
//             return res.send(true);
//         } else {
//             return res.send(false);
//         }
//     })

//     // Return middleware router
//     return router;
// }
