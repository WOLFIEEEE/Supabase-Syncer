/**
 * Health Endpoint Tests
 * 
 * Tests for the /api/health endpoint.
 */

import { GET } from '../route';

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => Promise.resolve({
    from: () => ({
      select: () => ({
        limit: () => Promise.resolve({ data: [{ id: '1' }], error: null }),
      }),
    }),
  })),
}));

// Mock fetch for backend health check
global.fetch = jest.fn();

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ status: 'healthy' }),
    });
  });

  it('should return health status', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('checks');
    expect(data).toHaveProperty('metrics');
  });

  it('should include uptime in response', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('uptime');
    expect(typeof data.uptime).toBe('number');
    expect(data.uptime).toBeGreaterThanOrEqual(0);
  });

  it('should include memory metrics', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.metrics).toHaveProperty('memory');
    expect(data.metrics.memory).toHaveProperty('used');
    expect(data.metrics.memory).toHaveProperty('total');
    expect(data.metrics.memory).toHaveProperty('percentage');
  });

  it('should check supabase status', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.checks).toHaveProperty('supabase');
    expect(data.checks.supabase).toHaveProperty('status');
  });

  it('should check backend status', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.checks).toHaveProperty('backend');
    expect(data.checks.backend).toHaveProperty('status');
  });

  it('should check encryption status', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.checks).toHaveProperty('encryption');
    expect(data.checks.encryption).toHaveProperty('status');
  });

  it('should return valid timestamp format', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
