import { shopReturn, productLink } from './shopNavigation';
const product = {slug:'gyertya', category:'forma-gyertyak'};
test.each(['', '?category=All', '?category=forma-gyertyak&q=piros&sort=price_asc'])('preserves exact list URL %s through product links', search => {
 const href=productLink(product,{pathname:'/shop',search});
 const location={pathname:'/shop/gyertya',search:href.slice(href.indexOf('?'))};
 expect(shopReturn(location,product.category)).toBe('/shop'+search);
 const related=productLink({...product,slug:'masik'},location);
 expect(shopReturn({pathname:'/shop/masik',search:related.slice(related.indexOf('?'))},'egyeb')).toBe('/shop'+search);
});
test('direct product links fall back to their category',()=>{
 expect(shopReturn({pathname:'/shop/gyertya',search:''},product.category)).toBe('/shop?category=forma-gyertyak');
});
test.each(['https://example.com','//example.com','/admin','/shop/other','/shop?x=\\evil'])('rejects unsafe return URL %s',from=>{
 expect(shopReturn({pathname:'/shop/gyertya',search:'?from='+encodeURIComponent(from)})).toBe('/shop');
});
