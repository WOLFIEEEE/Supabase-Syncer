import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Type for the database instance
type DatabaseType = PostgresJsDatabase<typeof schema>;

// Promise-based singleton to prevent race conditions
// Multiple concurrent requests will share the same promise
let databasePromise: Promise<DatabaseType> | null = null;

async function createDatabase(): Promise<DatabaseType> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const client = postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  });

  return drizzle(client, { schema });
}

// Getter for lazy initialization with race condition protection
async function getDb(): Promise<DatabaseType> {
  if (!databasePromise) {
    // Store the promise immediately to prevent concurrent creation
    databasePromise = createDatabase();
  }
  return databasePromise;
}

// Synchronous getter for backward compatibility (uses cached result)
let cachedDatabase: DatabaseType | null = null;
function getDbSync(): DatabaseType {
  if (!cachedDatabase) {
    // Initialize synchronously for existing code paths
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    const client = postgres(connectionString, {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    });
    cachedDatabase = drizzle(client, { schema });
    // Also set the promise for consistency
    databasePromise = Promise.resolve(cachedDatabase);
  }
  return cachedDatabase;
}

// Export the getter as a property with proper typing
// Uses synchronous getter for backward compatibility with existing code
export const db = {
  get query() {
    return getDbSync().query;
  },
  insert: <T extends Parameters<DatabaseType['insert']>[0]>(table: T) => getDbSync().insert(table),
  update: <T extends Parameters<DatabaseType['update']>[0]>(table: T) => getDbSync().update(table),
  delete: <T extends Parameters<DatabaseType['delete']>[0]>(table: T) => getDbSync().delete(table),
  select: <T extends Parameters<DatabaseType['select']>[0]>(fields?: T) => getDbSync().select(fields as T),
  selectDistinct: <T extends Parameters<DatabaseType['selectDistinct']>[0]>(fields?: T) => getDbSync().selectDistinct(fields as T),
};

// Export async getter for new code that needs race-condition safety
export { getDb as getDatabaseAsync };

// Export types
export type Database = DatabaseType;

