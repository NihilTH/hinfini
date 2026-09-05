import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLang } from "@/context/LangContext";

const CartContext = createContext(null);
const KEY = "hi_cart_v1";

const read = () => { try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } };

export const CartProvider = ({ children }) => {
  const { t, tr } = useLang();
  const [items, setItems] = useState(read);

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(items)); }, [items]);

  const add = (product, qty = 1) => {
    const stock = Number(product.stock ?? 0);
    if (stock <= 0) { toast.error(t("cart.soldOut")); return false; }
    const existing = items.find((i) => i.product_id === product.product_id);
    const nextQty = (existing?.quantity || 0) + qty;
    if (nextQty > stock) { toast.error(t("cart.maxStock", { n: stock })); return false; }
    setItems((prev) => {
      const ex = prev.find((i) => i.product_id === product.product_id);
      if (ex) return prev.map((i) => (i.product_id === product.product_id ? { ...i, quantity: nextQty, stock } : i));
      return [...prev, { product_id: product.product_id, slug: product.slug, name: product.name, name_en: product.name_en || "", price: product.price, image: product.image, image_alt: product.image_alt || "", unit: product.unit, unit_en: product.unit_en || "", stock, quantity: qty }];
    });
    toast.success(`${tr(product, "name")} ${t("cart.added")}`);
    return true;
  };
  const remove = (id) => setItems((p) => p.filter((i) => i.product_id !== id));
  const updateQty = (id, q) => {
    if (q < 1) return remove(id);
    const it = items.find((i) => i.product_id === id);
    if (it && it.stock != null && q > it.stock) { toast.error(t("cart.maxStock", { n: it.stock })); return; }
    setItems((p) => p.map((i) => (i.product_id === id ? { ...i, quantity: q } : i)));
  };
  const clear = () => setItems([]);
  const subtotal = useMemo(() => items.reduce((s, i) => s + i.price * i.quantity, 0), [items]);
  const count = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  return <CartContext.Provider value={{ items, add, remove, updateQty, clear, subtotal, count }}>{children}</CartContext.Provider>;
};

export const useCart = () => useContext(CartContext);
