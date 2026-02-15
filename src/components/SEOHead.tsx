import { Helmet } from 'react-helmet-async';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface SEOHeadProps {
  title: string;
  description: string;
  canonicalPath: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  // For template pages
  templateName?: string;
  templateCategory?: string;
  price?: number;
  currency?: string;
  // For guide pages
  faqItems?: FAQItem[];
  breadcrumbs?: BreadcrumbItem[];
  // Social sharing image
  ogImage?: string;
}

const SEOHead = ({ 
  title, 
  description, 
  canonicalPath,
  type = 'article',
  publishedTime,
  modifiedTime,
  templateName,
  templateCategory,
  price = 9.99,
  currency = 'USD',
  faqItems,
  breadcrumbs,
  ogImage,
}: SEOHeadProps) => {
  const siteUrl = 'https://letterofdispute.com';
  const canonicalUrl = `${siteUrl}${canonicalPath}`;
  const defaultOgImage = `${siteUrl}/og-image.png`;
  const resolvedOgImage = ogImage || defaultOgImage;
  
  // WebApplication schema for template pages
  const webAppSchema = templateName ? {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: `${templateName} Generator`,
    description: description,
    url: canonicalUrl,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    browserRequirements: 'Requires JavaScript',
    offers: {
      '@type': 'Offer',
      price: price.toString(),
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
    },
    provider: {
      '@type': 'Organization',
      name: 'Letter of Dispute',
      url: siteUrl,
      logo: `${siteUrl}/ld-logo.svg`,
    },
    ...(templateCategory && {
      applicationSubCategory: templateCategory,
    }),
  } : null;

  // Generic Organization schema for non-template pages
  const organizationSchema = !templateName ? {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Letter of Dispute',
    url: siteUrl,
    logo: `${siteUrl}/ld-logo.svg`,
    description: 'Professional dispute letter templates for consumers',
  } : null;

  const articleSchema = type === 'article' ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    url: canonicalUrl,
    datePublished: publishedTime || new Date().toISOString(),
    dateModified: modifiedTime || new Date().toISOString(),
    publisher: {
      '@type': 'Organization',
      name: 'Letter of Dispute'
    }
  } : null;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content="Letter of Dispute" />
      <meta property="og:image" content={resolvedOgImage} />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={resolvedOgImage} />
      
      {/* Schema.org structured data */}
      {webAppSchema && (
        <script type="application/ld+json">
          {JSON.stringify(webAppSchema)}
        </script>
      )}
      
      {organizationSchema && (
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
      )}
      
      {articleSchema && (
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      )}
    </Helmet>
  );
};

export default SEOHead;
