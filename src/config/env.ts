declare const process: {
  env: Record<string, string | undefined>;
};

const getRequiredEnv = (name: string): string => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`[env] Missing required environment variable: ${name}`);
  }

  return value;
};

export const FINNHUB_API_KEY = getRequiredEnv('EXPO_PUBLIC_FINNHUB_API_KEY');
export const AUTH0_DOMAIN = getRequiredEnv('EXPO_PUBLIC_AUTH0_DOMAIN');
export const AUTH0_CLIENT_ID = getRequiredEnv('EXPO_PUBLIC_AUTH0_CLIENT_ID');
export const AUTH0_SCHEME = getRequiredEnv('EXPO_PUBLIC_AUTH0_SCHEME');
