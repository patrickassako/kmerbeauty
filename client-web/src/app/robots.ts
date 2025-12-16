import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/profile/', '/admin/'], // Hide private areas/admin if any
        },
        sitemap: 'https://kmrbeauty.com/sitemap.xml',
    };
}
