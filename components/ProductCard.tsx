
import React from 'react';
import { Link } from 'react-router-dom';
import { Product } from '../types';
// Fixed: useLanguage was not exported from App, changing to useApp
import { useApp } from '../App';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  // Fixed: using useApp instead of useLanguage
  const { t } = useApp();
  const discountPercent = product.oldPrice 
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) 
    : 0;

  return (
    <div className="group bg-white rounded-3xl border border-gray-100 p-2.5 flex flex-col justify-between product-card-shadow transition-all duration-300 relative">
      {discountPercent > 0 && (
        <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-[10px] md:text-[11px] font-black px-2 py-1 rounded-lg shadow-lg">
           <span>{discountPercent}%</span> <span className="text-[8px] opacity-80">{t('off')}</span>
        </div>
      )}

      <Link to={`/product/${product.id}`}>
        <div className="relative overflow-hidden rounded-2xl mb-4 bg-gray-50">
          <img 
            src={product.image} 
            alt={product.title} 
            className="w-full h-auto aspect-square object-cover group-hover:scale-110 transition-transform duration-700"
          />
        </div>
        <h3 className="text-[14px] md:text-[15px] font-bold text-gray-800 leading-tight mb-3 px-1 min-h-[42px] group-hover:text-primary-yellow transition-colors line-clamp-2">
          {product.title}
        </h3>
      </Link>
      
      <div className="mt-auto">
        <div className="flex items-center justify-between px-1 mb-4">
          <div className="flex items-center text-yellow-400 text-xs">
            <i className="fas fa-star mr-1"></i>
            <span className="text-gray-600 font-bold">5.0</span>
          </div>
          <div className="text-right flex flex-col">
            {product.oldPrice && (
              <span className="text-[10px] text-gray-400 line-through">
                {t('currency')} {product.oldPrice}
              </span>
            )}
            <span className="text-sm md:text-lg font-black text-gray-900">
              {t('currency')} {product.price}
            </span>
          </div>
        </div>
        
        <Link to={`/product/${product.id}`} className="w-full bg-primary-yellow text-gray-900 font-bold py-3 rounded-2xl hover:bg-gray-900 hover:text-white border-2 border-primary-yellow transition-all flex items-center justify-center space-x-2 shadow-sm">
          <i className="fas fa-cart-plus text-sm"></i>
          <span className="text-xs uppercase tracking-wider">{t('orderNow')}</span>
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
