import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://suparbase.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/guide',
          '/status',
          '/',
          '/features',
          '/privacy',
          '/terms',
          '/api/health',
          '/api/status',
          '/api/docs',
          '/api/features',
          '/api/version',
        ],
        disallow: [
          '/connections',
          '/sync',
          '/explorer',
          '/login',
          '/api/connections',
          '/api/sync',
          '/api/explorer',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

