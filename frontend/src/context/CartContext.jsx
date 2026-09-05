import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const CartContext = createContext(null);
const KEY = "hi_cart_v1";

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const add = (product, qty = 1) => {
    setItems((prev) => {
      const ex = prev.find((i) => i.product_id === product.product_id);
      if (ex) return prev.map((i) => i.product_id === product.product_id ? { ...i, quantity: i.quantity + qty } : i);
      return [...prev, { product_id: product.product_id, slug: product.slug, name: product.name, price: product.price, image: product.image, unit: product.unit, quantity: qty }];
    });
    toast.success(`${product.name} kosárba téve`);
  };
  const remove = (id) => setItems((p) => p.filter((i) => i.product_id !== id));
  const updateQty = (id, q) => { if (q < 1) return remove(id); setItems((p) => p.map((i) => i.product_id === id ? { ...i, quantity: q } : i)); };
  const clear = () => setItems([]);
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);
  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  return <CartContext.Provider value={{ items, add, remove, updateQty, clear, subtotal, count }}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
