import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Validate DATABASE_URL
if (!process.env.DATABASE_URL) {
    throw new Error(
        'DATABASE_URL environment variable is not set. Please add your Neon connection string to .env.local'
    );
}

// Create the Neon client
const sql = neon(process.env.DATABASE_URL);

// Create the Drizzle instance with schema
export const db = drizzle(sql, { schema });

// Export for use in actions
export { schema };
