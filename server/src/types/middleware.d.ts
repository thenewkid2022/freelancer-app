declare module '../../middleware/rateLimiter' {
  import { RequestHandler } from 'express';
  export const rateLimiter: RequestHandler;
}

declare module '../../middleware/security' {
  import { RequestHandler } from 'express';
  export const securityMiddleware: RequestHandler;
}

declare module '../../middleware/errorHandler' {
  import { ErrorRequestHandler } from 'express';
  export const errorHandler: ErrorRequestHandler;
}

declare module '../../config/config' {
  interface Config {
    env: string;
    port: number;
    database: {
      url: string;
    };
    jwt: {
      secret: string;
      expiresIn: string;
    };
    logging: {
      level: string;
    };
  }
  
  const config: Config;
  export default config;
} 