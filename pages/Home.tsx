
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { REVIEWS } from '../constants';
import { useApp } from '../App';

const Home: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { t, lang, products } = useApp();

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-full">
      {/* Hero / Search Section */}
      <section className="bg-white py-8 md:py-20 border-b border-gray-50">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="inline-block bg-yellow-50 text-primary-yellow px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-widest mb-4 md:mb-6 border border-yellow-100">
             Digital Market Guru
          </div>
          <h1 className="text-2xl md:text-5xl font-black mb-4 md:mb-6 leading-tight text-gray-900 px-2">
             {t('bestSelling')}
          </h1>
          <p className="text-sm md:text-xl font-bold text-gray-700 mb-3 px-4">{t('topPicks')}</p>
          <p className="text-gray-400 mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed text-xs md:text-base px-6">
            {lang === 'bn' 
              ? 'জনপ্রিয় ওয়ার্ডপ্রেস থিম, প্লাগিন, স্ক্রিপ্ট, ইবুক এবং ডিজিটাল টুলস সব এক জায়গায়। আমাদের সেরা পণ্যগুলো দেখুন।'
              : 'Popular themes, plugins, scripts, eBooks and digital tools all in one place. Explore our top picks.'}
          </p>

          <div className="relative flex max-w-xl mx-auto px-2">
            <div className="flex-grow relative">
              <input 
                type="text" 
                placeholder={t('searchPlaceholder')}
                className="w-full pl-10 md:pl-12 pr-4 py-3 md:py-4 rounded-l-2xl border-2 border-gray-100 focus:border-primary-yellow focus:outline-none transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <i className="fas fa-magnifying-glass absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            </div>
            <button className="bg-primary-yellow text-gray-900 px-5 md:px-10 py-3 md:py-4 rounded-r-2xl font-black hover:bg-gray-900 hover:text-white transition-all shadow-sm text-xs md:text-sm active:scale-95">
              {t('searchBtn')}
            </button>
          </div>
        </div>
      </section>

      {/* Product Grid */}
      <section className="container mx-auto px-3 md:px-4 py-8 md:py-16">
        <div className="flex items-center justify-between mb-8 md:mb-12">
           <h2 className="text-lg md:text-2xl font-black border-l-4 border-primary-yellow pl-3 uppercase tracking-tight text-gray-900">
             Featured Items
           </h2>
           <Link to="/" className="text-[11px] md:text-sm font-black text-gray-400 hover:text-primary-yellow uppercase tracking-widest">
              {t('viewAll')} →
           </Link>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-8">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
             <i className="fas fa-search text-gray-300 text-4xl mb-4"></i>
             <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No items found</p>
          </div>
        )}
      </section>

      {/* Benefits - Cleaner for Mobile */}
      <section className="bg-white py-12 md:py-20 border-t border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {[
              { icon: 'fa-bolt', title: 'Fast Access', desc: 'Download your items instantly after payment.' },
              { icon: 'fa-shield-halved', title: '100% Genuine', desc: 'Authentic products with clean source code.' },
              { icon: 'fa-headset', title: '24/7 Support', desc: 'Expert help whenever you need it via WhatsApp.' }
            ].map((benefit, i) => (
              <div key={i} className="flex items-start p-6 bg-gray-50 rounded-2xl border border-gray-100 group">
                <div className="w-12 h-12 bg-primary-yellow rounded-xl flex items-center justify-center shrink-0 mr-4 shadow-lg shadow-primary-yellow/20">
                  <i className={`fas ${benefit.icon} text-gray-900 text-lg`}></i>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-tight text-gray-900 mb-1">{benefit.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed font-medium">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
