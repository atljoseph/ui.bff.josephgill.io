export type JWTAlgorithm = 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512' | 'ES256' | 'ES384' | 'ES512' | 'PS256' | 'PS384' | 'PS512' | 'none';

export interface JWTConfig {
    algorithm: JWTAlgorithm;
    expiresIn?: string | number;
    notBefore?: string | number;
    audience?: string;
    issuer?: string;
    jwtid?: string;
    subject?: string;
    noTimestamp?: boolean;
    header?: any;
    keyid?: string;
    mutatePayload?: boolean;
}

export interface BasePayload {
    application: string;
    permissions_lookup: {
      header: string;
      key: string;
    },
    username: string;
    _id: string;
    company: string;
    facilities: string[];
    first_name: string;
    last_name: string;
    cell_phone: string;
    last_login: string;
    last_password_reset: string;
    default_home_page: string;
    default_facility: string;
    iat: number;
    exp: number;
    iss: string;
}

export interface TokenResponse {
    access_token: string;
    issued: string;
    expires: string;
    username: string;
}
