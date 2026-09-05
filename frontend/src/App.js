import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/context/CartContext";
import { LangProvider } from "@/context/LangContext";
import { Toaster } from "@/components/ui/sonner";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import ProductDetail from "@/pages/ProductDetail";
import Learn from "@/pages/Learn";
import GuideDetail from "@/pages/GuideDetail";
import Cart from "@/pages/Cart";
import Checkout from "@/pages/Checkout";
import OrderSuccess from "@/pages/OrderSuccess";
import Discover from "@/pages/Discover";
import Admin from "@/pages/Admin";

function App() {
  return (
    <div className="App min-h-screen bg-[#1A1917] text-[#F0EAD6]">
      <BrowserRouter>
        <LangProvider>
          <CartProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/shop/:slug" element={<ProductDetail />} />
                <Route path="/discover" element={<Discover />} />
                <Route path="/learn" element={<Learn />} />
                <Route path="/learn/:slug" element={<GuideDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order/:orderId" element={<OrderSuccess />} />
                <Route path="/admin" element={<Admin />} />
              </Routes>
            </Layout>
            <Toaster position="top-right" theme="dark" richColors />
          </CartProvider>
        </LangProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
