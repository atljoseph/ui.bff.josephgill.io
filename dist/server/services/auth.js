"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const request = require("request");
const rxjs_1 = require("rxjs");
class AuthService {
    constructor(_authAPI, _authCookieName) {
        this._authAPI = _authAPI;
        this._authCookieName = _authCookieName;
    }
    login(applicationId, username, password) {
        return new rxjs_1.Observable(obs => {
            request({
                method: 'POST',
                url: `${this._authAPI}/api/applications/${applicationId}/authenticate`,
                json: {
                    username,
                    password
                }
            }, (error, response, body) => {
                let status = 500;
                if (response && response.statusCode) {
                    status = response.statusCode;
                }
                if (error) {
                    return obs.error({ Status: status, Message: error });
                }
                if (status > 399) {
                    return obs.error({ Status: status, Message: body || 'Could not log in' });
                }
                if (response && response.headers['set-cookie']) {
                    const authToken = response.headers['set-cookie'].find(sc => sc.indexOf(`${this._authCookieName}=`) === 0);
                    if (authToken) {
                        const value = authToken.replace(/^.*?=([^;]+);.*$/, '$1');
                        if (value && value.length) {
                            body['token'] = value;
                        }
                    }
                }
                obs.next(body);
                return obs.complete();
            });
        });
    }
}
exports.AuthService = AuthService;
