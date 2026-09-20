import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { CartProvider, useCart, cartLineKey } from '../CartContext';
jest.mock('@/context/LangContext', () => ({ useLang: () => ({ t: k => k, tr: p => p.name, lang: 'hu' }) }));
jest.mock('sonner', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
let host, root, cart;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; localStorage.clear(); host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(async () => { await act(async () => root.unmount()); host.remove(); });
test('colours stay separate and share stock; changing or removing one keeps the other', async () => {
 function Probe() { cart = useCart(); return null; }
 await act(async () => root.render(<CartProvider><Probe /></CartProvider>));
 const p = { product_id: 'p1', name: 'Nyuszi', stock: 3, price: 1000, color_options: ['Piros', 'Fehér'] };
 await act(async () => { expect(cart.add(p, 1)).toBe(false); });
 await act(async () => { cart.add(p, 1, 'Piros'); });
 await act(async () => { cart.add(p, 1, 'Fehér'); });
 expect(cart.items.map(i => i.color)).toEqual(['Piros', 'Fehér']);
 await act(async () => { expect(cart.add(p, 2, 'Piros')).toBe(false); });
 await act(async () => { cart.updateQty(cartLineKey(cart.items[0]), 2); });
 expect(cart.items.map(i => i.quantity)).toEqual([2, 1]);
 await act(async () => { cart.remove(cartLineKey(cart.items[0])); });
 expect(cart.items.map(i => i.color)).toEqual(['Fehér']);
 expect(cart.subtotal).toBe(1000);
});
