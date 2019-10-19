import {LoggingService} from '../services/logger';
// import { JWTService } from '../services/jwt';

export interface Config {
    environment: string;
    cookie_name: string;
    proxy_cookie: string;
    cookie_secret: string;
    port: number;
    log_level: string;
    client_root: string;
    max_workers: number;
    cookie_blacklist?: string[];
    // jwtService?: JWTService;
    logger?: LoggingService;
}
