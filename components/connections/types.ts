export interface Connection {
  id: string;
  name: string;
  environment: 'production' | 'development';
  createdAt: string;
  updatedAt: string;
}

export interface TableColumn {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  foreignKeyRef?: string;
}

export interface TableInfo {
  name: string;
  columns: TableColumn[];
  rowCount: number;
  primaryKeys: string[];
  foreignKeys: { column: string; references: string }[];
  indexes: string[];
}

export interface SchemaData {
  tables: TableInfo[];
  totalTables: number;
  totalRows: number;
}

export interface NewConnectionForm {
  name: string;
  databaseUrl: string;
  environment: 'production' | 'development';
}
