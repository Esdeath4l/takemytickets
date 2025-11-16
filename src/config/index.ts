import dotenv from 'dotenv';

dotenv.config();

export const config = {
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://reviews:reviews@localhost:5432/reviews?schema=public',
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  JWT_PUBLIC_KEY: process.env.JWT_PUBLIC_KEY || '',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};
