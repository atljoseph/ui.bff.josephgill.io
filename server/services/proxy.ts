import { gunzipSync } from 'zlib';
import { Observable } from 'rxjs';

export class ProxyService {

    static parseErrorResponse(proxyRes, url: string, method: string): Observable<string> {
        const cleanRes = {
            httpVersion: proxyRes.httpVersion,
            headers: proxyRes.headers,
            trailers: proxyRes.trailers,
            url: url,
            method: method,
            statusCode: proxyRes.statusCode,
            statusMessage: proxyRes.statusMessage,
        };
        console.log(cleanRes)
        let buffer = Buffer.from('', 'utf8');
        return Observable.create(obs => {
            proxyRes
            .on('data', (chunk) => {
                buffer = Buffer.concat([buffer, chunk]);
            })
            .on('end', () => {
                try {
                    if ('content-encoding' in proxyRes.headers && (/gzip/i.test(proxyRes.headers['content-encoding']))) {
                        cleanRes['body'] = gunzipSync(buffer).toString('utf8');
                    } else {
                        cleanRes['body'] = buffer.toString('utf8');
                    }
                } catch (e) {
                    cleanRes['body'] = buffer.toString('utf8');
                } finally {
                    obs.next(JSON.stringify(cleanRes, null, 2));
                    return obs.complete();
                }
            });
        });
    }

    static parseProxyCookie(cookieString: string) {
        const cookieParts = cookieString.split(/;\s*/g);
        const val = cookieParts[0];
        const expPart = cookieParts.find(p => /^Expires=/i.test(p));
        const pathPart = cookieParts.find(p => /^Path=/i.test(p));
        const domainPart = cookieParts.find(p => /^Domain=/i.test(p));
        const httpOnly = !!cookieParts.find(p => /^HttpOnly/i.test(p));
        const config: any = [expPart, pathPart, domainPart].filter(v => !!v && v.length)
        .reduce((prev, curr)=> {
            const parts = curr.split('=', 2);
            if (parts && parts.length > 1) {
                prev[parts[0].toLowerCase().trim()] = parts[1];
            }
            return prev;
        }, {});
        const valParts = val.split(/=/, 2);
        const name = valParts[0];
        let cookieValue = '';
        if (valParts.length > 1) {
            cookieValue = valParts[1];
        }
        const defaultExpires = (new Date().valueOf() + (1000 * 60 * 60 * 24 * 7)); // 1 week from today
        config.expires = new Date(config.expires || defaultExpires);
        return {
            name,
            value: cookieValue,
            options: {
                ...config,
                httpOnly
            }
        };
    }

    static formatAuthCookie(existingCookies: string, name: string, value: string, blacklist?: string[]): string {
        let cookieMap = {};
        if (existingCookies && existingCookies.length) {
            cookieMap = existingCookies.split(/;\s*/g).reduce((prev, curr) => {
                const vp = curr.split('=', 2);
                if (vp.length < 2) {
                    vp.push('true'); // handle flag cookies
                }
                prev[vp[0]] = vp[1];
                return prev;
            }, {});
        }
        if (blacklist && blacklist.length) {
            blacklist.forEach(b => {
                delete cookieMap[b];
            });
        }
        cookieMap[name] = value;
        const cookieString = Object.keys(cookieMap).map(k => `${k}=${cookieMap[k]}`).join('; ');
        return cookieString;
    }
}
