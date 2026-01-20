
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../App';

const MobileBottomMenu: React.FC = () => {
  const { t } = useApp();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="xl:hidden fixed bottom-0 left-0 w-full bg-white flex justify-around items-center py-3 pb-6 px-4 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-[4000] border-t border-gray-100 glass-effect">
      <Link to="/" className={`flex flex-col items-center px-4 py-1 rounded-xl transition-all ${isActive('/') ? 'text-primary-yellow' : 'text-gray-400'}`}>
        <i className={`fas fa-house ${isActive('/') ? 'text-xl' : 'text-lg'} mb-1`}></i>
        <span className="text-[9px] font-black uppercase tracking-widest">{t('home')}</span>
      </Link>
      
      <Link to="/" className={`flex flex-col items-center px-4 py-1 rounded-xl transition-all ${isActive('/shop') ? 'text-primary-yellow' : 'text-gray-400'}`}>
        <i className="fas fa-fire text-lg mb-1"></i>
        <span className="text-[9px] font-black uppercase tracking-widest">{t('shop')}</span>
      </Link>

      <div className="relative -top-8">
        <Link to="/" className="flex flex-col items-center bg-primary-yellow text-gray-900 w-16 h-16 rounded-[24px] border-[6px] border-[#fcfcfc] shadow-2xl justify-center active:scale-90 transition-transform">
          <i className="fas fa-shopping-basket text-2xl"></i>
          <span className="absolute -top-1 -right-1 bg-gray-900 text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full font-black border-2 border-white">0</span>
        </Link>
      </div>

      <Link to="/" className={`flex flex-col items-center px-4 py-1 rounded-xl transition-all ${isActive('/wish') ? 'text-primary-yellow' : 'text-gray-400'}`}>
        <i className="fas fa-heart text-lg mb-1"></i>
        <span className="text-[9px] font-black uppercase tracking-widest">{t('wish')}</span>
      </Link>

      <Link to="/admin" className={`flex flex-col items-center px-4 py-1 rounded-xl transition-all ${isActive('/admin') ? 'text-primary-yellow' : 'text-gray-400'}`}>
        <i className={`fas fa-circle-user ${isActive('/admin') ? 'text-xl' : 'text-lg'} mb-1`}></i>
        <span className="text-[9px] font-black uppercase tracking-widest">{t('user')}</span>
      </Link>
    </div>
  );
};

export default MobileBottomMenu;
