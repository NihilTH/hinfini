import "@/App.css";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { LangProvider, useLang } from "@/context/LangContext";
import { CatalogProvider } from "@/context/CatalogContext";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import { About, Events, CustomCandles } from "@/pages/Studio";

import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import OrderSuccess from "@/pages/OrderSuccess";
import Discover from "@/pages/Discover";
import Legal from "@/pages/Legal";
import Admin from "@/pages/Admin";

function NotFound() {
  const { t } = useLang();
  return (
    <div className="max-w-2xl mx-auto px-6 py-32 text-center" data-testid="not-found">
      <div className="overline mb-4">404</div>
      <h1 className="font-serif-display text-5xl">{t("err.notFound")}</h1>
      <Link to="/" className="btn-primary mt-8 focus-ring">H'INFINI</Link>
    </div>
  );
}

function App() {
  return (
    <div className="App min-h-screen bg-[#1A1917] text-[#F0EAD6]">
      <BrowserRouter>
        <LangProvider>
          <CatalogProvider>
            <CartProvider>
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Shop />} />
                  <Route path="/shop/:slug" element={<ProductDetail />} />
                  <Route path="/discover" element={<Discover />} />
                  <Route path="/bemutatkozas" element={<About />} />
                  <Route path="/esemenyek" element={<Events />} />
                  <Route path="/egyedi-gyertyak" element={<CustomCandles />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order/:orderId" element={<OrderSuccess />} />
                  <Route path="/admin" element={<Admin />} />
                  <Route path="/:page" element={<Legal />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
              <Toaster position="top-right" theme="dark" richColors />
            </CartProvider>
          </CatalogProvider>
        </LangProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
