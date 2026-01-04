import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Type for the database instance
type DatabaseType = PostgresJsDatabase<typeof schema>;

// Lazy singleton connection for the app's own database
let database: DatabaseType | null = null;

function createDatabase(): DatabaseType {
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

// Getter for lazy initialization
function getDb(): DatabaseType {
  if (!database) {
    database = createDatabase();
  }
  return database;
}

// Export the getter as a property with proper typing
export const db = {
  get query() {
    return getDb().query;
  },
  insert: <T extends Parameters<DatabaseType['insert']>[0]>(table: T) => getDb().insert(table),
  update: <T extends Parameters<DatabaseType['update']>[0]>(table: T) => getDb().update(table),
  delete: <T extends Parameters<DatabaseType['delete']>[0]>(table: T) => getDb().delete(table),
  select: <T extends Parameters<DatabaseType['select']>[0]>(fields?: T) => getDb().select(fields as T),
  selectDistinct: <T extends Parameters<DatabaseType['selectDistinct']>[0]>(fields?: T) => getDb().selectDistinct(fields as T),
};

// Export types
export type Database = DatabaseType;

