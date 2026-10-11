/** JSON-LD builders (schema.org). All URLs are made absolute with the site URL. */
import type { Category, Product, PublicConfig } from '../shared/types';
import { absUrl } from './head';

const ctx = 'https://schema.org';

/** PNG twin of a product SVG (Open Graph / rich results need raster images). */
export function productPng(p: Product): string {
  return p.image.replace(/^\/img\/products\/([^/]+)\.svg$/, '/img/products/png/$1.png');
}

export function organizationSchema(config: PublicConfig) {
  return {
    '@context': ctx,
    '@type': 'OnlineStore',
    '@id': absUrl('/#organization'),
    name: config.storeName,
    url: absUrl('/'),
    logo: absUrl('/img/brand/logo.svg'),
    image: absUrl('/img/brand/og.png'),
    description: `${config.storeName} sells ${config.serverName} in-game money, spawners, mystery boxes and items with fast in-game delivery, daily free spins and discount coupons.`,
    sameAs: config.discordInvite && /^https?:\/\//.test(config.discordInvite) ? [config.discordInvite] : undefined,
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
    publisher: { '@id': absUrl('/#organization') },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: absUrl('/shop?q={search_term_string}') },
      'query-input': 'required name=search_term_string',
    },
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
          seller: { '@id': absUrl('/#organization') },
        }
      : {
          '@type': 'Offer',
          priceCurrency: 'USD',
          price: (p.priceCents / 100).toFixed(2),
          availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          url: absUrl(`/product/${p.slug}`),
          itemCondition: 'https://schema.org/NewCondition',
          seller: { '@id': absUrl('/#organization') },
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

export function articleSchema(opts: { title: string; description: string; path: string; datePublished: string; dateModified?: string; author: string; image?: string }) {
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
    publisher: { '@id': absUrl('/#organization') },
  };
}

export function webPageSchema(name: string, path: string, description?: string) {
  return { '@context': ctx, '@type': 'WebPage', name, url: absUrl(path), description, isPartOf: { '@id': absUrl('/#website') } };
}
