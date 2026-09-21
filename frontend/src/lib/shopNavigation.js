export function shopReturn(location, category) {
  if (location.pathname === '/shop') return '/shop' + (location.search || '');
  const saved = new URLSearchParams(location.search || '').get('from');
  if (saved && /^\/shop(?:\?[^#\\]*)?$/.test(saved)) return saved;
  return category ? `/shop?category=${encodeURIComponent(category)}` : '/shop';
}
export function productLink(product, location) {
  return `/shop/${encodeURIComponent(product.slug)}?from=${encodeURIComponent(shopReturn(location, product.category))}`;
}
