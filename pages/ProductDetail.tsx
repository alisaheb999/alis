
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../App';

const ProductDetail: React.FC = () => {
  const { id } = useParams();
  const { t, products } = useApp();
  const product = products.find(p => p.id === Number(id)) || products[0];
  
  const [timeLeft, setTimeLeft] = useState({ h: 2, m: 43, s: 3 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { h, m, s } = prev;
        if (s > 0) s--;
        else if (m > 0) { s = 59; m--; }
        else if (h > 0) { s = 59; m = 59; h--; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (num: number) => num < 10 ? `0${num}` : num;

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumbs */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="container mx-auto px-4 py-3 flex items-center space-x-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-400 overflow-x-auto whitespace-nowrap">
          <Link to="/" className="hover:text-primary-yellow">Home</Link>
          <i className="fas fa-chevron-right text-[8px] opacity-30"></i>
          <span className="text-gray-900 line-clamp-1">{product.title}</span>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-16">
          {/* Left: Product Image */}
          <div className="relative">
            <div className="sticky top-[100px]">
              <div className="rounded-[32px] overflow-hidden border border-gray-100 shadow-2xl relative">
                <img src={product.image} alt={product.title} className="w-full object-cover" />
                {product.oldPrice && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black shadow-lg uppercase tracking-widest">
                    Sale!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="space-y-6 md:space-y-8">
            <h1 className="text-xl md:text-4xl font-black text-gray-900 leading-tight">
              {product.title}
            </h1>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: 'fa-bolt', label: 'Instant' },
                { icon: 'fa-shield', label: 'Genuine' },
                { icon: 'fa-headset', label: 'Support' },
                { icon: 'fa-clock', label: 'Limited' }
              ].map((f, i) => (
                <div key={i} className="bg-gray-50 p-3 rounded-2xl text-center border border-gray-100 flex flex-col items-center">
                  <i className={`fas ${f.icon} text-primary-yellow text-base mb-1`}></i>
                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-tighter">{f.label}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border-2 border-yellow-100 p-5 md:p-8 rounded-[40px] shadow-sm relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-yellow text-gray-900 px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">
                Limited Time Offer
              </div>

              <div className="flex items-center justify-center space-x-3 md:space-x-4 mb-6 pt-2">
                {['h', 'm', 's'].map((unit) => (
                  <React.Fragment key={unit}>
                    <div className="text-center">
                      <div className="bg-gray-900 text-white w-10 md:w-14 h-10 md:h-14 flex items-center justify-center rounded-2xl text-lg md:text-2xl font-black shadow-xl">
                        {formatTime(timeLeft[unit as keyof typeof timeLeft])}
                      </div>
                      <span className="text-[8px] md:text-[10px] uppercase font-black text-gray-400 mt-2 block">{unit === 'h' ? 'Hours' : unit === 'm' ? 'Minutes' : 'Seconds'}</span>
                    </div>
                    {unit !== 's' && <span className="text-xl font-black text-gray-200">:</span>}
                  </React.Fragment>
                ))}
              </div>

              <div className="flex items-center justify-center space-x-4 mb-8">
                 <span className="text-gray-300 line-through text-lg font-bold">৳ {product.oldPrice}</span>
                 <span className="text-3xl md:text-5xl font-black text-gray-900">৳ {product.price}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link to="/checkout" className="bg-primary-yellow text-gray-900 py-4 md:py-5 rounded-2xl text-center font-black uppercase text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-primary-yellow/20">
                  Buy Now
                </Link>
                <a href="https://wa.me/+8801610049970" className="border-2 border-[#25D366] text-[#25D366] py-4 md:py-5 rounded-2xl text-center font-black uppercase text-sm hover:bg-[#25D366] hover:text-white transition-all flex items-center justify-center">
                  <i className="fab fa-whatsapp mr-2 text-xl"></i>
                  WhatsApp Order
                </a>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-8">
              <div className="flex space-x-6 md:space-x-10 border-b border-gray-100">
                <button className="pb-4 border-b-2 border-primary-yellow font-black text-sm uppercase tracking-widest text-gray-900">Description</button>
                <button className="pb-4 text-gray-300 font-black text-sm uppercase tracking-widest hover:text-gray-400">Reviews</button>
              </div>
              <div className="py-8 text-gray-600 leading-relaxed text-sm md:text-base font-medium space-y-4">
                <p>আমাদের সকল ডিজিটাল প্রোডাক্ট ১০০% জেনুইন এবং লাইফটাইম ব্যবহারের উপযোগী। আপনি পেমেন্ট করার পর সাথে সাথে ডাউনলোড লিংক পেয়ে যাবেন।</p>
                <div className="bg-yellow-50 p-4 rounded-2xl border-l-4 border-primary-yellow text-xs md:text-sm">
                  <strong>বিশেষ দ্রষ্টব্য:</strong> যেকোনো সমস্যায় আমাদের সাপোর্ট টিমে যোগাযোগ করুন।
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
