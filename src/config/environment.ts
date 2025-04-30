export interface Environment {
  apiUrl: string;
  apiVersion: string;
  timeout: number;
  enableDebug: boolean;
  sentryDsn?: string;
}

const environments: Record<string, Environment> = {
  development: {
    apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000',
    apiVersion: 'v1',
    timeout: 10000,
    enableDebug: true
  },
  test: {
    apiUrl: 'http://localhost:5000',
    apiVersion: 'v1',
    timeout: 5000,
    enableDebug: true
  },
  production: {
    apiUrl: process.env.REACT_APP_API_URL || 'https://freelancer-app-chi.vercel.app',
    apiVersion: 'v1',
    timeout: 5000,
    enableDebug: false,
    sentryDsn: process.env.REACT_APP_SENTRY_DSN
  }
};

const currentEnv = process.env.NODE_ENV || 'development';

export const environment: Environment = environments[currentEnv];

// Validiere die Umgebungskonfiguration
const requiredEnvVars = ['apiUrl', 'apiVersion'];
const missingVars = requiredEnvVars.filter(key => !environment[key as keyof Environment]);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

export default environment; 