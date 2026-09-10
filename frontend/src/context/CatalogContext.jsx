import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "@/lib/api";
import { useLang } from "@/context/LangContext";

const CatalogContext = createContext(null);

export const CatalogProvider = ({ children }) => {
  const { catName } = useLang();
  const [categories, setCategories] = useState([]);
  const [config, setConfig] = useState({ free_shipping_from: 25000, shipping_home: 1990, shipping_pickup: 1290, payment_mode: "sandbox" });

  const reload = useCallback(() => {
    api.get("/categories").then(({ data }) => setCategories(data)).catch(() => {});
  }, []);
  useEffect(() => { reload(); api.get("/config").then(({ data }) => setConfig(data)).catch(() => {}); }, [reload]);

  const catLabel = useCallback((name) => {
    const c = categories.find((x) => x.name === name);
    return catName(c || name);
  }, [categories, catName]);

  const shippingFee = useCallback((subtotal, method = "home") => {
    if (subtotal >= config.free_shipping_from) return 0;
    return method === "pickup" ? config.shipping_pickup : config.shipping_home;
  }, [config]);

  return <CatalogContext.Provider value={{ categories, catLabel, config, shippingFee, reload }}>{children}</CatalogContext.Provider>;
};

export const useCatalog = () => useContext(CatalogContext);
