export type TestStatus = 'passed' | 'failed' | 'skipped' | 'pending' | 'running';

export interface TestResult {
  name: string;
  status: TestStatus;
  message: string;
  details?: Record<string, unknown> | null;
}

