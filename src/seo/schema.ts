/** JSON-LD builders (schema.org). All URLs are made absolute with the site URL. */
import type { Category, Product, PublicConfig } from '../shared/types';
import { absUrl } from './head';

const ctx = 'https://schema.org';

/** PNG twin of a product SVG (Open Graph / rich results need raster images). */
export function productPng(p: Product): string {
  return p.image.replace(/^\/img\/products\/([^/]+)\.svg$/, '/img/products/png/$1.png');
}

/** Real, owner-configured Discord invite (the shipped default is a placeholder). */
export function realDiscordInvite(config: PublicConfig): string | undefined {
  const u = config.discordInvite;
  return u && /^https?:\/\//.test(u) && !/your-invite/i.test(u) ? u : undefined;
}

/** Compact Organization node – embedded wherever a page references the store (publisher, seller). */
export function organizationRef(config: PublicConfig) {
  return {
    '@type': 'Organization',
    '@id': absUrl('/#organization'),
    name: config.storeName,
    url: absUrl('/'),
    logo: { '@type': 'ImageObject', url: absUrl('/img/brand/logo.png') },
  };
}

/** Compact WebSite node for isPartOf references. */
export function websiteRef(config: PublicConfig) {
  return { '@type': 'WebSite', '@id': absUrl('/#website'), name: config.storeName, url: absUrl('/') };
}

export function organizationSchema(config: PublicConfig) {
  const discord = realDiscordInvite(config);
  return {
    '@context': ctx,
    '@type': 'OnlineStore',
    '@id': absUrl('/#organization'),
    name: config.storeName,
    url: absUrl('/'),
    logo: { '@type': 'ImageObject', url: absUrl('/img/brand/logo.png') },
    image: absUrl('/img/brand/og.png'),
    description: `${config.storeName} sells ${config.serverName} in-game money, spawners, mystery boxes and items with fast in-game delivery, daily free spins and discount coupons.`,
    sameAs: discord ? [discord] : undefined,
    priceRange: '$',
    currenciesAccepted: 'USD',
    paymentAccepted: 'PayPal, Credit Card, Cryptocurrency',
    areaServed: 'Worldwide',
  };
}

export function websiteSchema(config: PublicConfig) {
  return {
    '@context': ctx,
    '@type': 'WebSite',
    '@id': absUrl('/#website'),
    name: config.storeName,
    url: absUrl('/'),
    publisher: organizationRef(config),
    // no SearchAction: Google retired the sitelinks search box (Nov 2024) and the
    // robots.txt keeps ?q= result pages out of the index
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': ctx,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: absUrl(it.path) })),
  };
}

export function faqSchema(faq: { q: string; a: string }[]) {
  if (!faq.length) return null;
  return {
    '@context': ctx,
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };
}

export function productSchema(p: Product, config: PublicConfig, category?: Category, description?: string) {
  const inStock = p.stock === null || p.stock === undefined || p.stock > 0;
  const lowest = p.bulkPricing?.length ? Math.min(p.priceCents, ...p.bulkPricing.map((b) => b.priceCents)) : p.priceCents;
  const offer =
    lowest !== p.priceCents
      ? {
          '@type': 'AggregateOffer',
          priceCurrency: 'USD',
          lowPrice: (lowest / 100).toFixed(2),
          highPrice: (p.priceCents / 100).toFixed(2),
          offerCount: (p.bulkPricing?.length ?? 0) + 1,
          availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          url: absUrl(`/product/${p.slug}`),
          seller: organizationRef(config),
        }
      : {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: (p.priceCents / 100).toFixed(2),
          availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          url: absUrl(`/product/${p.slug}`),
          itemCondition: 'https://schema.org/NewCondition',
          seller: organizationRef(config),
          shippingDetails: { '@type': 'OfferShippingDetails', shippingRate: { '@type': 'MonetaryAmount', value: '0', currency: 'USD' }, shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'US' } },
        };
  return {
    '@context': ctx,
    '@type': 'Product',
    '@id': absUrl(`/product/${p.slug}#product`),
    name: `${p.name} – ${config.serverName}`,
    description: description || p.shortDesc || p.description || `${p.name} for ${config.serverName}, delivered in-game.`,
    image: [absUrl(productPng(p)), absUrl(p.image)],
    sku: p.id,
    brand: { '@type': 'Brand', name: config.storeName },
    category: category?.name,
    url: absUrl(`/product/${p.slug}`),
    offers: offer,
  };
}

export function collectionSchema(name: string, path: string, products: Product[], description?: string) {
  return {
    '@context': ctx,
    '@type': 'CollectionPage',
    name,
    url: absUrl(path),
    description,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: products.length,
      itemListElement: products.slice(0, 50).map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: absUrl(`/product/${p.slug}`), name: p.name })),
    },
  };
}

export function articleSchema(opts: { title: string; description: string; path: string; datePublished: string; dateModified?: string; author: string; image?: string; config?: PublicConfig }) {
  return {
    '@context': ctx,
    '@type': 'Article',
    headline: opts.title,
    description: opts.description,
    mainEntityOfPage: absUrl(opts.path),
    url: absUrl(opts.path),
    image: absUrl(opts.image ?? '/img/brand/og.png'),
    datePublished: opts.datePublished,
    dateModified: opts.dateModified ?? opts.datePublished,
    author: { '@type': 'Organization', name: opts.author, url: absUrl('/') },
    publisher: opts.config ? organizationRef(opts.config) : { '@type': 'Organization', name: opts.author, url: absUrl('/'), logo: { '@type': 'ImageObject', url: absUrl('/img/brand/logo.png') } },
  };
}

export function webPageSchema(name: string, path: string, description?: string, config?: PublicConfig) {
  return {
    '@context': ctx,
    '@type': 'WebPage',
    name,
    url: absUrl(path),
    description,
    isPartOf: config ? websiteRef(config) : { '@type': 'WebSite', '@id': absUrl('/#website'), url: absUrl('/') },
  };
}
