
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NAVIGATION_CATEGORIES } from '../constants';
import { useApp } from '../App';

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { lang, setLang, t, settings } = useApp();
  const navigate = useNavigate();

  const handleLanguageToggle = (l: 'bn' | 'en') => {
    setLang(l);
    setIsMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-white z-[2000] shadow-sm border-b border-gray-100 glass-effect">
      <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
        <div className="flex-shrink-0">
          <Link to="/">
            <img 
              src={settings.logoUrl} 
              alt={settings.siteName} 
              className="h-8 md:h-10 w-auto object-contain hover:opacity-80 transition-opacity"
            />
          </Link>
        </div>

        <nav className="hidden xl:flex items-center space-x-1">
          {NAVIGATION_CATEGORIES.map((cat) => (
            <div key={cat.id} className="relative group">
              <button className="px-3 py-2 text-[13px] font-bold text-gray-800 hover:text-primary-yellow transition-colors flex items-center uppercase tracking-tight">
                {cat.name}
                {cat.subCategories && <i className="fas fa-caret-down ml-1 text-[10px] opacity-40"></i>}
              </button>
              
              {cat.subCategories && (
                <div className="absolute top-full left-0 w-52 bg-white shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform group-hover:translate-y-0 translate-y-3 rounded-2xl py-3 border border-gray-100">
                  {cat.subCategories.map((sub) => (
                    <Link 
                      key={sub} 
                      to={`/`}
                      className="block px-5 py-2.5 text-[13px] font-bold text-gray-600 hover:bg-yellow-50 hover:text-primary-yellow transition-all"
                    >
                      {sub}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Link to="/admin" className="px-3 py-2 text-[13px] font-bold text-gray-400 hover:text-red-500 uppercase tracking-tight">
            {t('admin')}
          </Link>
        </nav>

        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-50 rounded-xl p-0.5 border border-gray-200">
            <button 
              onClick={() => handleLanguageToggle('bn')}
              className={`px-2.5 py-1 text-[10px] md:text-[11px] font-black rounded-lg transition-all ${lang === 'bn' ? 'bg-primary-yellow text-gray-900 shadow-sm' : 'text-gray-400'}`}
            >
              বাংলা
            </button>
            <button 
              onClick={() => handleLanguageToggle('en')}
              className={`px-2.5 py-1 text-[10px] md:text-[11px] font-black rounded-lg transition-all ${lang === 'en' ? 'bg-primary-yellow text-gray-900 shadow-sm' : 'text-gray-400'}`}
            >
              EN
            </button>
          </div>

          <div className="hidden md:flex items-center text-gray-800 ml-2">
            <button className="relative p-2 hover:text-primary-yellow transition-colors">
              <i className="fas fa-shopping-basket text-xl"></i>
              <span className="absolute top-0 right-0 bg-primary-yellow text-gray-900 text-[9px] w-5 h-5 flex items-center justify-center rounded-full font-black border-2 border-white">0</span>
            </button>
          </div>
          
          <button className="xl:hidden p-2 text-gray-800" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <i className={isMobileMenuOpen ? "fas fa-times text-xl" : "fas fa-bars-staggered text-xl"}></i>
          </button>
        </div>
      </div>

      <div className={`xl:hidden bg-white w-full border-t border-gray-100 absolute top-full left-0 h-[calc(100vh-64px)] overflow-y-auto z-[3000] transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { navigate('/admin'); setIsMobileMenuOpen(false); }} className="flex items-center justify-center space-x-2 bg-gray-50 py-4 rounded-2xl border border-gray-100 font-bold text-gray-800">
                <i className="fas fa-lock text-sm"></i>
                <span>Admin</span>
              </button>
              <button className="flex items-center justify-center space-x-2 bg-gray-50 py-4 rounded-2xl border border-gray-100 font-bold text-gray-800">
                <i className="fas fa-user-circle text-sm"></i>
                <span>Account</span>
              </button>
            </div>
            
            <div className="space-y-1">
              {NAVIGATION_CATEGORIES.map((cat) => (
                <div key={cat.id} className="group">
                  <div className="flex items-center justify-between py-4 border-b border-gray-50">
                    <Link to="/" className="text-gray-900 font-black text-base uppercase tracking-tight" onClick={() => setIsMobileMenuOpen(false)}>{cat.name}</Link>
                    {cat.subCategories && <i className="fas fa-chevron-right text-gray-300 text-[10px]"></i>}
                  </div>
                </div>
              ))}
            </div>
          </div>
      </div>
    </header>
  );
};

export default Header;
