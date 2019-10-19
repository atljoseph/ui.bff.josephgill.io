import {Observable} from 'rxjs';
import * as jwt from 'jsonwebtoken';
import {JWTConfig, JWTAlgorithm, BasePayload} from '../models/jwt';

export class JWTService {

    private _baseConfig: JWTConfig;
    private _jwtSecret: string;

    constructor() {
        this._baseConfig = {
            algorithm: (process.env.JWT_ALGO as JWTAlgorithm) || 'HS256',
            issuer: process.env.JWT_ISS || 'FlorishAPI',
            expiresIn: process.env.JWT_EXP || (7 * 24 * 60 * 60),
        }
        this._jwtSecret = process.env.JWT_SECRET || 'myjwtsecret';
    }

    getBody(token: string): string {
        const tp = (token || '').split('.', 3);
        if (!tp || tp.length < 3) {
            // not a jwt
            return null;
        }
        return tp[1];
    }

    encodeToken<T extends BasePayload>(payload: T, config: JWTConfig): Observable<string> {
        return Observable.create(obs => {
            jwt.sign(payload, this._jwtSecret, config, (err, token) => {
                if (err) {
                    return obs.error(err);
                } else {
                    obs.next(token);
                    return obs.complete();
                }
            });
        });
    }

    decodeToken<T extends BasePayload>(token: string): Observable<T> {
        return Observable.create(obs => {
            jwt.verify(token, this._jwtSecret, {
                algorithms: [this._baseConfig.algorithm],
                ignoreExpiration: false,
                ignoreNotBefore: false,
                clockTimestamp: Math.floor(new Date().valueOf()/1000),
                clockTolerance: 10, // allow 10s of drift between servers
            }, (err, decoded) => {
                if (err) {
                    return obs.error(err);
                } else {
                    obs.next(decoded);
                    return obs.complete();
                }
            });
        });
    }
}
