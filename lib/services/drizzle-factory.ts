import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { Sql } from 'postgres';

export interface DrizzleConnection {
  db: ReturnType<typeof drizzle>;
  client: Sql;
  close: () => Promise<void>;
}

/**
 * Create a new Drizzle client for a given database URL
 * This is used for connecting to user's source and target databases
 * 
 * Important: Call close() when done to release the connection
 */
export function createDrizzleClient(databaseUrl: string): DrizzleConnection {
  const client = postgres(databaseUrl, {
    max: 5,
    idle_timeout: 30,
    connect_timeout: 15,
  });
  
  const db = drizzle(client);
  
  return {
    db,
    client,
    close: async () => {
      await client.end();
    },
  };
}

/**
 * Test database connection by running a simple query
 * Returns true if connection successful, throws error otherwise
 */
export async function testConnection(databaseUrl: string): Promise<{ success: true; version: string; tableCount: number } | { success: false; error: string }> {
  let connection: DrizzleConnection | null = null;
  
  try {
    connection = createDrizzleClient(databaseUrl);
    
    // Run a simple query to test the connection
    const result = await connection.client`SELECT version()`;
    const version = result[0]?.version as string || 'Unknown';
    
    // Get table count
    const tableResult = await connection.client`
      SELECT COUNT(*) as count FROM pg_tables WHERE schemaname = 'public'
    `;
    const tableCount = parseInt(tableResult[0]?.count as string || '0', 10);
    
    return { success: true, version, tableCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown connection error';
    return { success: false, error: message };
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

/**
 * Get list of tables from a database that are eligible for syncing
 * Tables must have 'id' (UUID) and 'updated_at' (timestamp) columns
 */
export async function getSyncableTables(databaseUrl: string): Promise<string[]> {
  let connection: DrizzleConnection | null = null;
  
  try {
    connection = createDrizzleClient(databaseUrl);
    
    // Query for tables that have both 'id' and 'updated_at' columns
    const result = await connection.client`
      SELECT DISTINCT t.table_name
      FROM information_schema.tables t
      INNER JOIN information_schema.columns c1 
        ON t.table_name = c1.table_name 
        AND t.table_schema = c1.table_schema
        AND c1.column_name = 'id'
      INNER JOIN information_schema.columns c2 
        ON t.table_name = c2.table_name 
        AND t.table_schema = c2.table_schema
        AND c2.column_name = 'updated_at'
      WHERE t.table_schema = 'public'
        AND t.table_type = 'BASE TABLE'
        AND t.table_name NOT LIKE 'pg_%'
        AND t.table_name NOT LIKE '_prisma_%'
        AND t.table_name NOT LIKE 'drizzle_%'
      ORDER BY t.table_name
    `;
    
    return result.map((row) => row.table_name as string);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

/**
 * Get table schema information
 */
export async function getTableSchema(databaseUrl: string, tableName: string): Promise<{
  columnName: string;
  dataType: string;
  isNullable: boolean;
  columnDefault: string | null;
}[]> {
  let connection: DrizzleConnection | null = null;
  
  try {
    connection = createDrizzleClient(databaseUrl);
    
    const result = await connection.client`
      SELECT 
        column_name,
        data_type,
        is_nullable = 'YES' as is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
      ORDER BY ordinal_position
    `;
    
    return result.map((row) => ({
      columnName: row.column_name as string,
      dataType: row.data_type as string,
      isNullable: row.is_nullable as boolean,
      columnDefault: row.column_default as string | null,
    }));
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

/**
 * Get row count for a table
 */
export async function getTableRowCount(databaseUrl: string, tableName: string): Promise<number> {
  let connection: DrizzleConnection | null = null;
  
  try {
    connection = createDrizzleClient(databaseUrl);
    
    // Using sql identifier for table name safely
    const result = await connection.client.unsafe(
      `SELECT COUNT(*) as count FROM "${tableName}"`
    );
    
    return parseInt(result[0]?.count as string || '0', 10);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

