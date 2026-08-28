import { PrismaClient, Prisma } from '@prisma/client';

const datasourceUrl = process.env.DATABASE_URL;

if (!datasourceUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

const prisma = new PrismaClient({
  datasourceUrl,
});

export default prisma;