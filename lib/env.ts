const getEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
};

export const env = {
  get SENDGRID_API_KEY() {
    return getEnv('SENDGRID_API_KEY');
  },
  get CRYPTRAC_NOTIFICATIONS_FROM() {
    return getEnv('CRYPTRAC_NOTIFICATIONS_FROM');
  },
  get CRYPTRAC_RECEIPTS_FROM() {
    return getEnv('CRYPTRAC_RECEIPTS_FROM');
  },
  get APP_ORIGIN() {
    return process.env.APP_ORIGIN || getEnv('NEXT_PUBLIC_APP_URL');
  },
};
