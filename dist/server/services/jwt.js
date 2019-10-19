"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const rxjs_1 = require("rxjs");
const jwt = require("jsonwebtoken");
class JWTService {
    constructor() {
        this._baseConfig = {
            algorithm: process.env.JWT_ALGO || 'HS256',
            issuer: process.env.JWT_ISS || 'FlorishAPI',
            expiresIn: process.env.JWT_EXP || (7 * 24 * 60 * 60),
        };
        this._jwtSecret = process.env.JWT_SECRET || 'myjwtsecret';
    }
    getBody(token) {
        const tp = (token || '').split('.', 3);
        if (!tp || tp.length < 3) {
            return null;
        }
        return tp[1];
    }
    encodeToken(payload, config) {
        return rxjs_1.Observable.create(obs => {
            jwt.sign(payload, this._jwtSecret, config, (err, token) => {
                if (err) {
                    return obs.error(err);
                }
                else {
                    obs.next(token);
                    return obs.complete();
                }
            });
        });
    }
    decodeToken(token) {
        return rxjs_1.Observable.create(obs => {
            jwt.verify(token, this._jwtSecret, {
                algorithms: [this._baseConfig.algorithm],
                ignoreExpiration: false,
                ignoreNotBefore: false,
                clockTimestamp: Math.floor(new Date().valueOf() / 1000),
                clockTolerance: 10,
            }, (err, decoded) => {
                if (err) {
                    return obs.error(err);
                }
                else {
                    obs.next(decoded);
                    return obs.complete();
                }
            });
        });
    }
}
exports.JWTService = JWTService;
