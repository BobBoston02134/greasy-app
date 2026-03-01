/**
 * Environment Configuration
 *
 * Three environments:
 * - local: localhost development, test Stripe keys, dev database
 * - sandbox: sandbox.greasy.ai, test Stripe keys, dev database, shows banner
 * - production: greasy.ai, live Stripe keys, prod database
 */

export type AppEnvironment = 'local' | 'sandbox' | 'production';

export function getAppEnvironment(): AppEnvironment {
  const envVar = process.env.NEXT_PUBLIC_APP_ENV;

  if (envVar === 'production') return 'production';
  if (envVar === 'sandbox') return 'sandbox';
  return 'local';
}

export function isProduction(): boolean {
  return getAppEnvironment() === 'production';
}

export function isSandbox(): boolean {
  return getAppEnvironment() === 'sandbox';
}

export function isLocal(): boolean {
  return getAppEnvironment() === 'local';
}

export function isTestMode(): boolean {
  // Both local and sandbox use test Stripe keys
  return !isProduction();
}

export function shouldShowSandboxBanner(): boolean {
  return isSandbox();
}

/**
 * Get the appropriate base URL for the current environment
 */
export function getBaseUrl(): string {
  const env = getAppEnvironment();

  switch (env) {
    case 'production':
      return 'https://greasy.ai';
    case 'sandbox':
      return 'https://sandbox.greasy.ai';
    case 'local':
    default:
      return 'http://localhost:3000';
  }
}

/**
 * Environment configuration summary for debugging
 */
export function getEnvConfig() {
  const env = getAppEnvironment();

  return {
    environment: env,
    stripeMode: isProduction() ? 'live' : 'test',
    database: isProduction() ? 'production' : 'development',
    baseUrl: getBaseUrl(),
    showSandboxBanner: shouldShowSandboxBanner(),
  };
}
