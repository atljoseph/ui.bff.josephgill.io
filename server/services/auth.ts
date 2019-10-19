// import * as request from 'request';
// import { Observable } from 'rxjs';

// export class AuthService {

//     constructor(
//         private _authAPI: string,
//         private _authCookieName: string,
//     ) {
//     }

//     login(applicationId: string, username: string, password: string): Observable<any> {
//         return new Observable(obs => {
//             request({
//                 method: 'POST',
//                 url: `${this._authAPI}/api/applications/${applicationId}/authenticate`,
//                 json: {
//                     username,
//                     password
//                 }
//             }, (error, response, body) => {
//                 let status = 500;
//                 if (response && response.statusCode) {
//                     status = response.statusCode;
//                 }
//                 if (error) {
//                     return obs.error({Status: status, Message: error});
//                 }
//                 if (status > 399) {
//                     return obs.error({Status: status, Message: body || 'Could not log in'});
//                 }
//                 if (response && response.headers['set-cookie']){
//                     const authToken = response.headers['set-cookie'].find(sc => sc.indexOf(`${this._authCookieName}=`) === 0);
//                     if (authToken) {
//                         const value = authToken.replace(/^.*?=([^;]+);.*$/, '$1');
//                         if (value && value.length) {
//                             body['token'] = value;
//                         }
//                     }
//                 }
//                 obs.next(body);
//                 return obs.complete();
//             });
//         });
//     }
// }
