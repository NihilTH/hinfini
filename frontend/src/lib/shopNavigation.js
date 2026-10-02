export function shopReturn(location, category) {
  if (location.pathname === '/shop') return '/shop' + (location.search || '');
  const saved = new URLSearchParams(location.search || '').get('from');
  if (saved && /^\/shop(?:\?[^#\\]*)?$/.test(saved)) return saved;
  return category ? `/shop?category=${encodeURIComponent(category)}` : '/shop';
}
export function productLink(product, location) {
  return `/shop/${encodeURIComponent(product.slug)}?from=${encodeURIComponent(shopReturn(location, product.category))}`;
}

export function adjacentProducts(products, slug) {
  const index = products.findIndex(p => p.slug === slug);
  if (products.length < 2 || index < 0) return null;
  return [products[(index + products.length - 1) % products.length], products[(index + 1) % products.length]];
}
