
import React, { useState, createContext, useContext, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import Admin from './pages/Admin';
import MobileBottomMenu from './components/MobileBottomMenu';
import { PRODUCTS as INITIAL_PRODUCTS } from './constants';
import { Product } from './types';

type Language = 'bn' | 'en';

interface SiteSettings {
  siteName: string;
  logoUrl: string;
  whatsapp: string;
  facebook: string;
  youtube: string;
  footerText: string;
}

interface AppContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  settings: SiteSettings;
  setSettings: React.Dispatch<React.SetStateAction<SiteSettings>>;
}

const translations: Record<Language, Record<string, string>> = {
  bn: {
    bestSelling: '🔥 সেরা বিক্রিত পণ্যসমূহ',
    topPicks: 'আপনার জন্য বিশেষ বাছাই',
    searchPlaceholder: 'সার্চ করুন...',
    searchBtn: 'খুঁজুন',
    viewAll: 'সকল পণ্য',
    orderNow: 'অর্ডার',
    buyNow: 'এখনি কিনুন',
    cart: 'কার্ট',
    home: 'হোম',
    shop: 'শপ',
    user: 'প্রোফাইল',
    off: 'ছাড়',
    currency: '৳',
    limitedOffer: 'সীমিত অফার',
    instantDownload: 'ডাউনলোড',
    support: 'সাপোর্ট',
    billingDetails: 'বিলিং তথ্য',
    placeOrder: 'অর্ডার করুন',
    wish: 'প্রিয়',
    admin: 'এডমিন'
  },
  en: {
    bestSelling: '🔥 Best Selling Products',
    topPicks: 'Top Picks Just for You',
    searchPlaceholder: 'Search here...',
    searchBtn: 'Search',
    viewAll: 'View All',
    orderNow: 'Order Now',
    buyNow: 'Buy Now',
    cart: 'Cart',
    home: 'Home',
    shop: 'Shop',
    user: 'Account',
    off: 'OFF',
    currency: '৳',
    limitedOffer: 'Limited Offer',
    instantDownload: 'Download',
    support: 'Support',
    billingDetails: 'Billing Info',
    placeOrder: 'Place Order',
    wish: 'Wishlist',
    admin: 'Admin'
  }
};

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'bn');
  
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [settings, setSettings] = useState<SiteSettings>(() => {
    const saved = localStorage.getItem('siteSettings');
    return saved ? JSON.parse(saved) : {
      siteName: 'Zoravex',
      logoUrl: 'https://zoravex.com/wp-content/uploads/2024/07/ACCORDION-FAQ-WordPress-Plugin-4-e1749376366876-1024x327.png',
      whatsapp: '+8801610049970',
      facebook: '#',
      youtube: '#',
      footerText: '©Digital Product 2025 | Made By Zoravex'
    };
  });

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('siteSettings', JSON.stringify(settings));
  }, [settings]);

  const t = (key: string) => translations[lang][key] || key;

  return (
    <AppContext.Provider value={{ lang, setLang, t, products, setProducts, settings, setSettings }}>
      <Router>
        <div className={`flex flex-col min-h-screen relative bg-[#f8f9fa] overflow-x-hidden ${lang === 'bn' ? 'font-bengali' : ''}`}>
          <Header />
          
          <main id="content" className="flex-grow pt-[70px] md:pt-[90px] pb-24 md:pb-12">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/admin" element={<Admin />} />
            </Routes>
          </main>

          <Footer />
          <MobileBottomMenu />

          <a 
            href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="fixed bottom-[100px] right-4 md:bottom-10 md:right-10 z-[1000] flex items-center bg-[#25D366] text-white p-3.5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all"
          >
            <i className="fab fa-whatsapp text-2xl"></i>
          </a>
        </div>
      </Router>
    </AppContext.Provider>
  );
};

export default App;
