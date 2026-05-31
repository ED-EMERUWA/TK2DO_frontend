export const env = {
  PORT: process.env.PORT || '3000',
  BACKEND_ORIGIN: process.env.BACKEND_ORIGIN || 'http://192.168.1.64:4000',
  JWT_SECRET: process.env.JWT_SECRET || '',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
};
