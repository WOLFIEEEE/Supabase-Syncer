# Next.js 16 Complete Documentation

**Version**: 16.1.1 (Latest as of 2025)  
**Release Date**: October 21, 2025  
**React Version**: 19.2.3  
**Node.js Requirement**: 20.9.0 or higher

---

## Table of Contents

1. [Overview & Key Changes](#overview--key-changes)
2. [App Router File Conventions](#app-router-file-conventions)
3. [Special Files](#special-files)
4. [Route Groups](#route-groups)
5. [Middleware → Proxy Migration](#middleware--proxy-migration)
6. [Server vs Client Components](#server-vs-client-components)
7. [API Routes](#api-routes)
8. [Metadata & SEO](#metadata--seo)
9. [Caching & Performance](#caching--performance)
10. [Configuration](#configuration)
11. [Best Practices](#best-practices)
12. [Breaking Changes](#breaking-changes)

---

## Overview & Key Changes

### Major Updates in Next.js 16

1. **Turbopack is Default** - Rust-based bundler now stable and default
2. **Proxy Replaces Middleware** - `middleware.ts` → `proxy.ts`
3. **Cache Components** - New caching model with `"use cache"` directive
4. **React 19.2** - Latest React features integrated
5. **Enhanced Routing** - Layout deduplication and incremental prefetching
6. **React Compiler** - Stable support for automatic memoization

### System Requirements

- **Node.js**: 20.9.0 or higher
- **TypeScript**: 5.1.0 or higher (if using TypeScript)
- **Browsers**: Chrome 111+, Edge 111+, Firefox 111+, Safari 16.4+

---

## App Router File Conventions

Next.js 16 uses the **App Router** by default. The file structure determines routing behavior.

### Core File Types

#### 1. `page.tsx` / `page.js`
- **Purpose**: UI component for a route
- **Required**: Yes (for routes to be accessible)
- **Location**: `app/[route]/page.tsx`
- **Export**: Default export of a React component

```typescript
// app/dashboard/page.tsx
export default function DashboardPage() {
  return <div>Dashboard</div>;
}
```

#### 2. `layout.tsx` / `layout.js`
- **Purpose**: Shared UI that wraps pages
- **Required**: Yes (root layout at `app/layout.tsx`)
- **Location**: `app/[route]/layout.tsx`
- **Export**: Default export with `children` prop

```typescript
// app/layout.tsx (Root Layout - REQUIRED)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

#### 3. `route.ts` / `route.js`
- **Purpose**: API endpoint handler
- **Location**: `app/api/[route]/route.ts`
- **Export**: Named exports for HTTP methods

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ users: [] });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ created: true });
}
```

#### 4. `loading.tsx` / `loading.js`
- **Purpose**: Loading UI shown while page loads
- **Location**: `app/[route]/loading.tsx`
- **Export**: Default export of loading component

```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return <div>Loading...</div>;
}
```

#### 5. `error.tsx` / `error.js`
- **Purpose**: Error UI for error boundaries
- **Location**: `app/[route]/error.tsx`
- **Export**: Default export with `error` and `reset` props

```typescript
// app/dashboard/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

#### 6. `not-found.tsx` / `not-found.js`
- **Purpose**: 404 page for route
- **Location**: `app/[route]/not-found.tsx`
- **Export**: Default export

```typescript
// app/dashboard/not-found.tsx
export default function NotFound() {
  return <h2>Not Found</h2>;
}
```

#### 7. `template.tsx` / `template.js`
- **Purpose**: Similar to layout but creates new instance per route
- **Location**: `app/[route]/template.tsx`
- **Use Case**: Animations, state resets between routes

#### 8. `default.tsx` / `default.js`
- **Purpose**: Fallback UI for parallel routes
- **Location**: `app/@[slot]/default.tsx`
- **Use Case**: Advanced routing patterns

---

## Special Files

### Root-Level Special Files

#### `favicon.ico`
- **Location**: `app/favicon.ico` (preferred) or `public/favicon.ico`
- **Note**: Next.js 16 prefers `app/favicon.ico`

#### `robots.ts` / `robots.js`
- **Location**: `app/robots.ts`
- **Purpose**: Generate robots.txt
- **Export**: Default export returning `MetadataRoute.Robots`

```typescript
// app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/private/',
    },
    sitemap: 'https://example.com/sitemap.xml',
  };
}
```

#### `sitemap.ts` / `sitemap.js`
- **Location**: `app/sitemap.ts`
- **Purpose**: Generate sitemap.xml
- **Export**: Default export returning `MetadataRoute.Sitemap`

```typescript
// app/sitemap.ts
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://example.com',
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
  ];
}
```

#### `opengraph-image.tsx` / `opengraph-image.jpg`
- **Location**: `app/opengraph-image.tsx` or `app/opengraph-image.jpg`
- **Purpose**: Generate Open Graph images

#### `icon.tsx` / `icon.png`
- **Location**: `app/icon.tsx` or `app/icon.png`
- **Purpose**: App icon/favicon

#### `apple-icon.tsx` / `apple-icon.png`
- **Location**: `app/apple-icon.tsx` or `app/apple-icon.png`
- **Purpose**: Apple touch icon

---

## Route Groups

Route groups organize routes without affecting URL structure. Folders wrapped in parentheses `(folderName)` are ignored in the URL.

### Syntax
```
app/
  (auth)/
    login/
      page.tsx        → /login
    signup/
      page.tsx        → /signup
  (dashboard)/
    settings/
      page.tsx        → /settings
```

### Use Cases

1. **Organize by Layout**
```typescript
// app/(auth)/layout.tsx
export default function AuthLayout({ children }) {
  return (
    <div className="auth-container">
      {children}
    </div>
  );
}
```

2. **Multiple Layouts**
```
app/
  (marketing)/
    about/
      page.tsx        → /about (uses marketing layout)
  (shop)/
    products/
      page.tsx        → /products (uses shop layout)
```

3. **Conditional Layouts**
- Different layouts for different route groups
- Shared components per group
- Organized file structure

---

## Middleware → Proxy Migration

### ⚠️ CRITICAL CHANGE IN NEXT.JS 16

**`middleware.ts` is DEPRECATED and replaced by `proxy.ts`**

### Migration Steps

1. **Rename File**: `middleware.ts` → `proxy.ts`
2. **Update Export**: Change function name to `proxy`
3. **Update Function Signature**: Use default export

### Before (Next.js 15 and earlier)
```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: '/about/:path*',
};
```

### After (Next.js 16)
```typescript
// proxy.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function proxy(request: NextRequest) {
  // Your middleware logic here
  return NextResponse.next();
}

export const config = {
  matcher: '/about/:path*',
};
```

### Why This Change?

- **Clarity**: Makes network boundary explicit
- **Runtime**: Runs on Node.js runtime (more predictable)
- **Naming**: Better reflects the function's purpose

### Common Use Cases

```typescript
// proxy.ts - Authentication
export default function proxy(request: NextRequest) {
  const token = request.cookies.get('token');
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

// proxy.ts - Security Headers
export default function proxy(request: NextRequest) {
  const response = NextResponse.next();
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

// proxy.ts - Path Rewriting
export default function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === '/old-path') {
    return NextResponse.rewrite(new URL('/new-path', request.url));
  }
  
  return NextResponse.next();
}
```

### Config Matcher

```typescript
export const config = {
  matcher: [
    // Match all paths except:
    // - api routes
    // - _next/static (static files)
    // - _next/image (image optimization)
    // - favicon.ico (favicon file)
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

---

## Server vs Client Components

### Server Components (Default)

- **Runs on**: Server only
- **Can Access**: Directly access databases, file system, etc.
- **Cannot Use**: Browser APIs, hooks like `useState`, `useEffect`
- **Bundle Size**: Not included in client bundle
- **Use When**: Fetching data, accessing backend resources

```typescript
// app/users/page.tsx (Server Component by default)
import { db } from '@/lib/db';

export default async function UsersPage() {
  const users = await db.users.findMany();
  
  return (
    <div>
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

### Client Components

- **Runs on**: Browser
- **Can Use**: Browser APIs, React hooks, event handlers
- **Cannot Access**: Direct database access, file system
- **Bundle Size**: Included in client bundle
- **Use When**: Interactivity, browser APIs, state management

```typescript
// components/Counter.tsx
'use client';

import { useState } from 'react';

export default function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
}
```

### When to Use "use client"

Add `'use client'` directive when:
- Using React hooks (`useState`, `useEffect`, etc.)
- Using browser APIs (`window`, `document`, `localStorage`, etc.)
- Using event handlers (`onClick`, `onChange`, etc.)
- Using third-party libraries that require client-side JavaScript

### Best Practice: Composition

```typescript
// app/dashboard/page.tsx (Server Component)
import { getData } from '@/lib/api';
import ClientDashboard from '@/components/ClientDashboard';

export default async function DashboardPage() {
  const data = await getData(); // Server-side fetch
  
  return <ClientDashboard initialData={data} />;
}

// components/ClientDashboard.tsx (Client Component)
'use client';

export default function ClientDashboard({ initialData }) {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <div>Server Data: {initialData.title}</div>
      <button onClick={() => setCount(count + 1)}>
        Client State: {count}
      </button>
    </div>
  );
}
```

---

## API Routes

### Route Handler Structure

API routes use `route.ts` files in the `app/api` directory.

### HTTP Methods

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'GET request' });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  return NextResponse.json({ message: 'POST request', body });
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({ message: 'PUT request' });
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json({ message: 'PATCH request' });
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({ message: 'DELETE request' });
}
```

### Dynamic Routes

```typescript
// app/api/users/[id]/route.ts
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  return NextResponse.json({ userId: id });
}
```

### Request & Response

```typescript
// Reading request data
export async function POST(request: NextRequest) {
  // JSON body
  const json = await request.json();
  
  // Form data
  const formData = await request.formData();
  
  // URL search params
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  
  // Headers
  const authHeader = request.headers.get('authorization');
  
  // Cookies
  const token = request.cookies.get('token');
  
  return NextResponse.json({ success: true });
}
```

### Response Helpers

```typescript
// JSON response
return NextResponse.json({ data: 'value' });

// Text response
return new NextResponse('Hello World');

// Redirect
return NextResponse.redirect(new URL('/dashboard', request.url));

// Rewrite
return NextResponse.rewrite(new URL('/internal', request.url));

// Set headers
const response = NextResponse.json({ data: 'value' });
response.headers.set('X-Custom-Header', 'value');
return response;

// Set cookies
const response = NextResponse.json({ data: 'value' });
response.cookies.set('token', 'value', {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
});
return response;
```

---

## Metadata & SEO

### Static Metadata

```typescript
// app/layout.tsx or app/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Title',
  description: 'Page description',
  keywords: ['keyword1', 'keyword2'],
  authors: [{ name: 'Author Name' }],
  openGraph: {
    title: 'OG Title',
    description: 'OG Description',
    images: ['/og-image.jpg'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Twitter Title',
    description: 'Twitter Description',
  },
};
```

### Dynamic Metadata

```typescript
// app/users/[id]/page.tsx
export async function generateMetadata({ params }): Promise<Metadata> {
  const user = await getUser(params.id);
  
  return {
    title: user.name,
    description: user.bio,
  };
}
```

### Metadata Template

```typescript
// app/layout.tsx
export const metadata: Metadata = {
  title: {
    default: 'Default Title',
    template: '%s | Site Name',
  },
};

// app/about/page.tsx
export const metadata: Metadata = {
  title: 'About', // Becomes "About | Site Name"
};
```

---

## Caching & Performance

### Cache Components (Next.js 16 Feature)

Enable explicit caching with `"use cache"` directive:

```typescript
// next.config.ts
const nextConfig = {
  cacheComponents: true,
};

export default nextConfig;
```

```typescript
// app/data/page.tsx
"use cache";

export default async function DataPage() {
  const data = await fetchData(); // Cached automatically
  return <div>{data}</div>;
}
```

### Data Fetching & Caching

```typescript
// fetch() is cached by default
const data = await fetch('https://api.example.com/data', {
  next: { revalidate: 3600 }, // Revalidate every hour
});

// Force dynamic
const data = await fetch('https://api.example.com/data', {
  cache: 'no-store',
});

// Revalidate tag
import { revalidateTag } from 'next/cache';

revalidateTag('users');
```

### refresh() API (Next.js 16)

```typescript
'use server';

import { refresh } from 'next/cache';

export async function updateData() {
  await db.update();
  refresh(); // Refresh uncached data
}
```

---

## Configuration

### next.config.ts

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Turbopack is default, use --webpack to opt out
  // output: 'standalone', // For Docker deployments
  
  // Cache Components
  cacheComponents: true,
  
  // React Compiler
  reactCompiler: true,
  
  // Experimental features
  experimental: {
    turbopackFileSystemCacheForDev: true, // Beta
  },
  
  // Images
  images: {
    minimumCacheTTL: 14400, // 4 hours (default in Next.js 16)
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384], // 16 removed in v16
    qualities: [75], // Default in v16
    dangerouslyAllowLocalIP: false, // Security restriction
    maximumRedirects: 3, // Default in v16
  },
  
  // Headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Custom-Header',
            value: 'value',
          },
        ],
      },
    ];
  },
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/old',
        destination: '/new',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
```

---

## Best Practices

### File Organization

```
app/
  (auth)/
    login/
      page.tsx
    layout.tsx
  (dashboard)/
    dashboard/
      page.tsx
    layout.tsx
  api/
    users/
      route.ts
  layout.tsx          # Root layout (required)
  page.tsx            # Home page
  favicon.ico
  robots.ts
  sitemap.ts
```

### Component Organization

```
components/
  ui/                 # Reusable UI components
  features/           # Feature-specific components
  layout/             # Layout components
```

### Server vs Client

- **Default to Server Components** - Better performance
- **Use Client Components only when needed** - Interactivity, hooks, browser APIs
- **Compose** - Server fetches data, passes to Client component

### Performance

- Use `loading.tsx` for better UX
- Implement `error.tsx` for error handling
- Leverage route groups for code splitting
- Use metadata for SEO
- Enable React Compiler for automatic memoization

### Security

- Use `proxy.ts` for authentication checks
- Set security headers in `proxy.ts` or `next.config.ts`
- Validate input in API routes
- Use environment variables for secrets

---

## Breaking Changes

### 1. Middleware → Proxy

- **Action**: Rename `middleware.ts` to `proxy.ts`
- **Action**: Change export to `export default function proxy()`
- **Impact**: High - Security and routing may break

### 2. Turbopack Default

- **Action**: Test builds with Turbopack
- **Fallback**: Use `--webpack` flag if issues
- **Impact**: Medium - Build process changes

### 3. Node.js 20.9.0+ Required

- **Action**: Upgrade Node.js
- **Impact**: High - App won't run on older versions

### 4. TypeScript 5.1.0+ Required

- **Action**: Upgrade TypeScript
- **Impact**: Medium - Type errors may appear

### 5. AMP Support Removed

- **Action**: Remove AMP-related code
- **Impact**: Low - Only affects AMP users

### 6. `next lint` Deprecated

- **Action**: Use ESLint or Biome directly
- **Impact**: Low - Linting still works

### 7. Runtime Config Removed

- **Action**: Use environment variables instead
- **Impact**: Medium - Configuration changes needed

### 8. Image Configuration Changes

- `minimumCacheTTL`: 60s → 14400s (4 hours)
- `imageSizes`: 16 removed from defaults
- `qualities`: [1..100] → [75]
- `maximumRedirects`: unlimited → 3

---

## Migration Checklist

- [ ] Upgrade Node.js to 20.9.0+
- [ ] Upgrade TypeScript to 5.1.0+ (if using)
- [ ] Rename `middleware.ts` → `proxy.ts`
- [ ] Update proxy function export
- [ ] Test with Turbopack (or use `--webpack`)
- [ ] Remove AMP code (if any)
- [ ] Update image configuration
- [ ] Replace runtime config with env variables
- [ ] Update linting setup
- [ ] Test all routes and API endpoints
- [ ] Review and update caching strategies
- [ ] Enable React Compiler (optional but recommended)

---

## Resources

- **Official Docs**: https://nextjs.org/docs
- **Next.js 16 Blog**: https://nextjs.org/blog/next-16
- **Upgrade Guide**: https://nextjs.org/docs/app/guides/upgrading/version-16
- **App Router Docs**: https://nextjs.org/docs/app
- **API Reference**: https://nextjs.org/docs/app/api-reference

---

**Last Updated**: Based on Next.js 16.1.1 (October 2025)  
**This documentation reflects the latest Next.js 16 features and conventions.**


