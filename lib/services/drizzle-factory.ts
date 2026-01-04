import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { Sql } from 'postgres';

export interface DrizzleConnection {
  db: ReturnType<typeof drizzle>;
  client: Sql;
  close: () => Promise<void>;
}

// Connection configuration
const CONNECTION_CONFIG = {
  max: 5,                    // Maximum connections in pool
  idle_timeout: 30,          // Close idle connections after 30s
  connect_timeout: 30,       // Connection timeout 30s
  max_lifetime: 60 * 30,     // Max connection lifetime 30 minutes
  fetch_types: false,        // Disable type fetching for faster connections
  prepare: false,            // Disable prepared statements for better compatibility
  ssl: 'require' as const,   // Require SSL for security
};

// Query timeout in milliseconds
const QUERY_TIMEOUT = 60000; // 60 seconds

// Maximum result size (estimated)
const MAX_RESULT_ROWS = 10000;

/**
 * Mask sensitive parts of database URL for logging
 */
export function maskDatabaseUrlForLogs(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '****';
    }
    return parsed.toString();
  } catch {
    return 'invalid-url';
  }
}

/**
 * Create a new Drizzle client for a given database URL
 * This is used for connecting to user's source and target databases
 * 
 * Important: Call close() when done to release the connection
 */
export function createDrizzleClient(databaseUrl: string): DrizzleConnection {
  // Determine if SSL should be required (skip for localhost)
  const isLocalhost = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
  
  const client = postgres(databaseUrl, {
    ...CONNECTION_CONFIG,
    ssl: isLocalhost ? false : CONNECTION_CONFIG.ssl,
    onnotice: () => {}, // Suppress notice messages
    debug: false,
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
 * Execute a query with timeout protection
 */
export async function executeWithTimeout<T>(
  connection: DrizzleConnection,
  query: () => Promise<T>,
  timeoutMs: number = QUERY_TIMEOUT
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Query timeout: exceeded ${timeoutMs}ms`));
    }, timeoutMs);
  });
  
  return Promise.race([query(), timeoutPromise]);
}

/**
 * Test database connection by running a simple query
 * Returns true if connection successful, throws error otherwise
 */
export async function testConnection(databaseUrl: string): Promise<{ success: true; version: string; tableCount: number } | { success: false; error: string }> {
  let connection: DrizzleConnection | null = null;
  
  try {
    connection = createDrizzleClient(databaseUrl);
    
    // Run a simple query to test the connection with timeout
    const result = await executeWithTimeout(
      connection,
      async () => connection!.client`SELECT version()`,
      10000 // 10 second timeout for connection test
    );
    const version = result[0]?.version as string || 'Unknown';
    
    // Get table count
    const tableResult = await executeWithTimeout(
      connection,
      async () => connection!.client`
        SELECT COUNT(*) as count FROM pg_tables WHERE schemaname = 'public'
      `,
      10000
    );
    const tableCount = parseInt(tableResult[0]?.count as string || '0', 10);
    
    return { success: true, version, tableCount };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown connection error';
    console.error('Connection test failed:', maskDatabaseUrlForLogs(databaseUrl), message);
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
    const result = await executeWithTimeout(
      connection,
      async () => connection!.client`
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
      `
    );
    
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
    
    const result = await executeWithTimeout(
      connection,
      async () => connection!.client`
        SELECT 
          column_name,
          data_type,
          is_nullable = 'YES' as is_nullable,
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = ${tableName}
        ORDER BY ordinal_position
      `
    );
    
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
 * Get row count for a table with safety limits
 */
export async function getTableRowCount(databaseUrl: string, tableName: string): Promise<number> {
  let connection: DrizzleConnection | null = null;
  
  try {
    connection = createDrizzleClient(databaseUrl);
    
    // Use estimated count for large tables (faster)
    const result = await executeWithTimeout(
      connection,
      async () => connection!.client`
        SELECT 
          CASE 
            WHEN c.reltuples < 0 THEN 0
            WHEN c.reltuples > 1000000 THEN c.reltuples::bigint
            ELSE (SELECT COUNT(*) FROM "${tableName}")
          END as count
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = ${tableName}
          AND n.nspname = 'public'
      `,
      30000 // 30 second timeout for count
    );
    
    return parseInt(result[0]?.count as string || '0', 10);
  } catch (error) {
    console.error('Error getting row count:', error);
    return 0;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

/**
 * Execute raw SQL with safety checks
 */
export async function executeSQL(
  databaseUrl: string, 
  sql: string,
  options: { 
    dryRun?: boolean;
    maxRows?: number;
  } = {}
): Promise<{
  success: boolean;
  rows?: unknown[];
  rowCount?: number;
  error?: string;
}> {
  const { dryRun = false, maxRows = MAX_RESULT_ROWS } = options;
  let connection: DrizzleConnection | null = null;
  
  try {
    // Basic SQL injection prevention
    const dangerousPatterns = [
      /;\s*(drop|truncate|delete\s+from)\s+/i,
      /--/,
      /\/\*/,
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(sql)) {
        return {
          success: false,
          error: 'Potentially dangerous SQL pattern detected',
        };
      }
    }
    
    if (dryRun) {
      return {
        success: true,
        rows: [],
        rowCount: 0,
      };
    }
    
    connection = createDrizzleClient(databaseUrl);
    
    // Add LIMIT if not present for SELECT queries
    let safeSql = sql;
    if (/^\s*select/i.test(sql) && !/\blimit\b/i.test(sql)) {
      safeSql = `${sql.replace(/;\s*$/, '')} LIMIT ${maxRows}`;
    }
    
    const result = await executeWithTimeout(
      connection,
      async () => connection!.client.unsafe(safeSql),
      QUERY_TIMEOUT
    );
    
    return {
      success: true,
      rows: result as unknown[],
      rowCount: result.length,
    };
    
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SQL execution failed';
    return {
      success: false,
      error: message,
    };
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}
