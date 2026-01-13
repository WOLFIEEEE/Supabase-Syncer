/**
 * Backend Server Configuration
 * 
 * Centralized configuration management with environment variable validation
 */

export interface Config {
  // Server
  port: number;
  host: string;
  nodeEnv: string;
  isDev: boolean;
  isProd: boolean;
  logLevel: string;
  
  // Security
  backendSharedSecret: string;
  
  // Supabase
  supabaseUrl: string;
  supabaseAnonKey: string;
  
  // Database
  databaseUrl: string | null;
  encryptionKey: string;
  
  // Redis
  redisUrl: string;
  
  // Rate Limiting (requests per minute)
  rateLimitSync: number;
  rateLimitSchema: number;
  rateLimitExecute: number;
  rateLimitRead: number;
  rateLimitAdmin: number;
  
  // Timeouts
  requestTimeout: number;
  syncTimeout: number;
  
  // CORS
  allowedOrigins: string[];
}

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (value === undefined) {
    if (defaultValue !== undefined) {
      return defaultValue;
    }
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getEnvVarInt(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (value === undefined) {
    return defaultValue;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a number, got: ${value}`);
  }
  return parsed;
}

function getEnvVarOptional(name: string): string | null {
  return process.env[name] || null;
}

function validateConfig(config: Config): void {
  const warnings: string[] = [];
  const errors: string[] = [];
  
  // Validate required fields in production
  if (config.isProd) {
    if (!config.backendSharedSecret || config.backendSharedSecret.length < 32) {
      errors.push('BACKEND_SHARED_SECRET must be at least 32 characters in production');
    }
    if (!config.encryptionKey || config.encryptionKey.length < 32) {
      errors.push('ENCRYPTION_KEY must be at least 32 characters in production');
    }
    if (!config.supabaseUrl) {
      warnings.push('NEXT_PUBLIC_SUPABASE_URL is not set - some features will be disabled');
    }
    if (!config.supabaseAnonKey) {
      warnings.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set - some features will be disabled');
    }
  }
  
  // Log warnings
  if (warnings.length > 0) {
    console.warn('Configuration warnings:');
    warnings.forEach(w => console.warn(`  - ${w}`));
  }
  
  // Only fail for critical errors
  if (errors.length > 0) {
    // #region agent log
    console.error('[DEBUG] config validation failed:', {errors});
    fetch('http://127.0.0.1:7243/ingest/dc998fd8-2859-44c1-bc48-bc4cedaa2ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'config.ts:99',message:'config validation failed',data:{errors},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.error('Configuration errors:');
    errors.forEach(e => console.error(`  - ${e}`));
    throw new Error(`Configuration validation failed: ${errors.join('; ')}`);
  }
}

export function loadConfig(): Config {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/dc998fd8-2859-44c1-bc48-bc4cedaa2ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'config.ts:106',message:'loadConfig entry',data:{nodeEnv:process.env.NODE_ENV},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const nodeEnv = getEnvVar('NODE_ENV', 'development');
  const isDev = nodeEnv === 'development';
  const isProd = nodeEnv === 'production';
  
  // Parse allowed origins
  const originsEnv = getEnvVar('ALLOWED_ORIGINS', '');
  const defaultOrigins = isDev 
    ? ['http://localhost:3000', 'http://127.0.0.1:3000']
    : [];
  
  // Add Vercel frontend URL if set
  const frontendUrl = getEnvVarOptional('FRONTEND_URL');
  const vercelOrigins: string[] = [];
  if (frontendUrl) {
    vercelOrigins.push(frontendUrl);
  }
  
  const allowedOrigins = originsEnv 
    ? [...originsEnv.split(',').map(o => o.trim()), ...vercelOrigins]
    : [...defaultOrigins, ...vercelOrigins];
  
  const config: Config = {
    // Server
    port: getEnvVarInt('PORT', 3001),
    host: getEnvVar('HOST', '0.0.0.0'),
    nodeEnv,
    isDev,
    isProd,
    logLevel: getEnvVar('LOG_LEVEL', isDev ? 'debug' : 'info'),
    
    // Security
    backendSharedSecret: getEnvVar('BACKEND_SHARED_SECRET', isDev ? 'dev-secret-minimum-32-characters-long' : ''),
    
    // Supabase
    supabaseUrl: getEnvVar('NEXT_PUBLIC_SUPABASE_URL', ''),
    supabaseAnonKey: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', ''),
    
    // Database
    databaseUrl: getEnvVarOptional('DATABASE_URL'),
    encryptionKey: getEnvVar('ENCRYPTION_KEY', isDev ? 'dev-encryption-key-32chars!' : ''),
    
    // Redis
    redisUrl: getEnvVar('REDIS_URL', 'redis://localhost:6379'),
    
    // Rate Limiting (requests per minute)
    rateLimitSync: getEnvVarInt('RATE_LIMIT_SYNC', 10),
    rateLimitSchema: getEnvVarInt('RATE_LIMIT_SCHEMA', 30),
    rateLimitExecute: getEnvVarInt('RATE_LIMIT_EXECUTE', 20),
    rateLimitRead: getEnvVarInt('RATE_LIMIT_READ', 100),
    rateLimitAdmin: getEnvVarInt('RATE_LIMIT_ADMIN', 50),
    
    // Timeouts (in milliseconds)
    requestTimeout: getEnvVarInt('REQUEST_TIMEOUT', 300000), // 5 minutes
    syncTimeout: getEnvVarInt('SYNC_TIMEOUT', 600000), // 10 minutes
    
    // CORS
    allowedOrigins,
  };
  
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/dc998fd8-2859-44c1-bc48-bc4cedaa2ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'config.ts:165',message:'before validateConfig',data:{hasBackendSecret:!!config.backendSharedSecret,hasEncryptionKey:!!config.encryptionKey,isProd},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  validateConfig(config);
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/dc998fd8-2859-44c1-bc48-bc4cedaa2ded',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'config.ts:167',message:'after validateConfig - success',data:{port:config.port,host:config.host},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  
  return config;
}

// Singleton config instance
let configInstance: Config | null = null;

export function getConfig(): Config {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}

export const config = getConfig();

