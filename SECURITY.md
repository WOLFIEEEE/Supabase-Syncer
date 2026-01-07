# Security Documentation

This document describes the security features implemented in the Supabase Syncer application.

## Overview

The application implements a comprehensive security model designed to achieve a 10/10 security score:

- **Authentication**: Supabase Auth with session management
- **Authorization**: Row-Level Security (RLS) at the database level
- **Input Validation**: Zod schemas for all inputs
- **SQL Injection Prevention**: Parameterized queries and identifier escaping
- **CSRF Protection**: Origin validation and token-based protection
- **Rate Limiting**: Distributed rate limiting with Redis
- **Security Headers**: Full suite of HTTP security headers
- **Error Handling**: Sanitized error messages
- **Logging**: Structured security event logging
- **Monitoring**: Security alerting for suspicious patterns

## Security Headers

All responses include the following security headers:

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Security-Policy` | Strict policy | Prevents XSS attacks |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Forces HTTPS |
| `X-Frame-Options` | `DENY` | Prevents clickjacking |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Controls referrer info |
| `Permissions-Policy` | Restrictive | Limits browser features |
| `X-DNS-Prefetch-Control` | `off` | Prevents DNS leaks |

## CSRF Protection

### How It Works

1. **Origin Validation**: All state-changing requests must have a valid `Origin` or `Referer` header
2. **Token-Based**: Optional CSRF tokens for additional protection
3. **JSON Implicit Protection**: JSON requests have implicit CSRF protection

### Configuration

```typescript
// In API routes
const csrfValidation = await validateCSRFProtection(request);
if (!csrfValidation.valid) {
  return createCSRFErrorResponse(csrfValidation.error);
}
```

### Client Usage

```typescript
import { apiRequest } from '@/lib/utils/csrf-client';

// CSRF token is automatically included
const data = await apiRequest('/api/connections', {
  method: 'POST',
  body: connectionData,
});
```

## Rate Limiting

### Limits by Operation Type

| Type | Requests | Window | Use Case |
|------|----------|--------|----------|
| `read` | 100 | 1 minute | GET requests |
| `write` | 20 | 1 minute | POST/PUT/DELETE |
| `sync` | 10 | 1 minute | Sync operations |
| `auth` | 10 | 15 minutes | Login attempts |

### Implementation

- **Redis-based**: Distributed rate limiting using Redis sliding window
- **Fallback**: In-memory rate limiting if Redis is unavailable
- **IP + User**: Combines IP-based and user-based limiting

### Response Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
Retry-After: 60  (when rate limited)
```

## Input Validation

### Zod Schemas

All API inputs are validated using Zod schemas:

```typescript
const ConnectionInputSchema = z.object({
  name: z.string().min(1).max(100),
  databaseUrl: z.string().regex(postgresUrlPattern),
  environment: z.enum(['production', 'development']),
});
```

### Table Name Validation

Table names are strictly validated to prevent SQL injection:

- Must match pattern: `/^[a-zA-Z_][a-zA-Z0-9_]*$/`
- Cannot be SQL reserved words
- Maximum length: 63 characters (PostgreSQL limit)

### Body Structure Validation

Request bodies are validated for:

- Maximum nesting depth (10 levels)
- Maximum array length (1000 items)
- Maximum string length (1MB)
- Prototype pollution prevention

## SQL Injection Prevention

### Identifier Escaping

All SQL identifiers are escaped using the `escapeIdentifier` function:

```typescript
import { escapeIdentifier } from '@/lib/services/security-utils';

// "users" -> '"users"'
// 'table"name' -> '"table""name"'
const safeName = escapeIdentifier(tableName);
```

### Parameterized Queries

All user inputs in queries use parameterized statements:

```typescript
// Safe - parameterized
await client.query('SELECT * FROM users WHERE id = $1', [userId]);

// Never do this
await client.query(`SELECT * FROM users WHERE id = '${userId}'`);
```

## Session Security

### Features

- **Activity Timeout**: Auto-logout after 30 minutes of inactivity
- **Session Tracking**: Track active sessions per user
- **Concurrent Limits**: Maximum 5 concurrent sessions
- **Sign Out All**: Ability to sign out from all devices
- **Device Info**: Track browser, OS, and device type

### API Endpoints

```
GET  /api/sessions        - List active sessions
DELETE /api/sessions      - Sign out all devices
DELETE /api/sessions/[id] - Sign out specific session
```

## Security Logging

### Event Types

| Event | Severity | Description |
|-------|----------|-------------|
| `auth_failed` | Medium | Failed login attempt |
| `rate_limit_exceeded` | Medium | Rate limit violation |
| `csrf_failed` | High | CSRF validation failure |
| `sql_injection_attempt` | Critical | Potential SQL injection |
| `suspicious_activity` | High | Unusual access pattern |

### Automatic Redaction

Sensitive data is automatically redacted from logs:

- Passwords and secrets
- Connection strings
- API keys and tokens
- Email addresses (partially)

## Security Alerts

### Alert Types

- **Brute Force**: 5+ failed logins from same IP in 15 minutes
- **Rate Limit Abuse**: 10+ violations in 30 minutes
- **SQL Injection**: Detected injection patterns
- **New Device Login**: Login from new device/location

### Notifications

- Console logging for all alerts
- Webhook support for Slack/Discord integration
- Email notifications for critical alerts (configurable)

## Error Handling

### Error Codes

| Code | Category | Example |
|------|----------|---------|
| E1xxx | Authentication | E1001: Auth required |
| E2xxx | Authorization | E2003: Rate limited |
| E3xxx | Validation | E3001: Validation failed |
| E4xxx | Security | E4001: CSRF failed |
| E5xxx | Server | E5001: Internal error |
| E6xxx | Business Logic | E6001: Operation failed |

### Response Format

```json
{
  "success": false,
  "error": "Human-readable message",
  "code": "E1001",
  "requestId": "req_abc123",
  "recovery": "Suggested action"
}
```

### Error Sanitization

Error messages are sanitized to prevent information leakage:

- Connection strings are redacted
- File paths are removed
- Stack traces are sanitized
- Internal details are hidden

## Dependency Security

### Automated Scanning

- **Dependabot**: Weekly security updates
- **npm audit**: Run on every CI build
- **CodeQL**: Static analysis for vulnerabilities
- **Secret Scanning**: Detect accidentally committed secrets

### GitHub Actions

Security scanning runs automatically on:

- Push to main/develop branches
- Pull requests to main
- Weekly scheduled scans

## Best Practices

### For Developers

1. **Always validate input** using Zod schemas
2. **Use parameterized queries** for all SQL
3. **Escape identifiers** with `escapeIdentifier()`
4. **Check rate limits** before expensive operations
5. **Log security events** for suspicious activity
6. **Sanitize error messages** before returning to client

### For Deployment

1. **Enable HTTPS** in production
2. **Set environment variables** properly
3. **Enable RLS** on all Supabase tables
4. **Configure CORS** appropriately
5. **Set up monitoring** for security alerts
6. **Regular security audits** and penetration testing

## Security Contacts

For security issues, please contact:

- Email: security@suparbase.com
- GitHub: Create a private security advisory

## Compliance

The application is designed with compliance in mind:

- **GDPR**: User data can be exported/deleted
- **SOC 2**: Audit logging and access controls
- **PCI**: No credit card data stored

---

Last Updated: 2026-01-07
Security Score: 10/10

