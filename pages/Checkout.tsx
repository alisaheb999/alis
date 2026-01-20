
import React from 'react';
// Fixed: useLanguage was not exported from App, changing to useApp
import { useApp } from '../App';
import { PRODUCTS } from '../constants';

const Checkout: React.FC = () => {
  // Fixed: using useApp instead of useLanguage
  const { t } = useApp();
  const cartProduct = PRODUCTS[0]; // Demo product in cart

  return (
    <div className="bg-[#f7f8f9] min-h-screen py-10">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="flex items-center justify-center space-x-4 mb-10 text-xs md:text-sm font-bold uppercase tracking-widest text-gray-400">
           <span className="text-primary-yellow">1. Cart</span>
           <i className="fas fa-chevron-right text-[10px]"></i>
           <span className="text-gray-900 border-b-2 border-primary-yellow">2. Information</span>
           <i className="fas fa-chevron-right text-[10px]"></i>
           <span>3. Finish</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Billing Form */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-black mb-6 border-b pb-4">Billing Details</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">First Name</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:border-primary-yellow focus:outline-none transition-all" placeholder="Enter first name" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Last Name</label>
                  <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:border-primary-yellow focus:outline-none transition-all" placeholder="Enter last name" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Phone (optional)</label>
                <input type="text" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:border-primary-yellow focus:outline-none transition-all" placeholder="017XXXXXXXX" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Email Address</label>
                <input type="email" className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:border-primary-yellow focus:outline-none transition-all" placeholder="example@email.com" />
              </div>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-black mb-6 border-b pb-4">Order Details</h2>
            <div className="space-y-4">
              <div className="flex justify-between text-sm font-bold border-b pb-4">
                <span>Product</span>
                <span>Subtotal</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <div className="flex items-center space-x-3 max-w-[70%]">
                  <img src={cartProduct.image} className="w-12 h-12 rounded-lg" />
                  <span className="text-xs font-medium text-gray-600 line-clamp-2">{cartProduct.title} × 1</span>
                </div>
                <span className="font-bold">৳ {cartProduct.price}</span>
              </div>
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span className="font-bold">৳ {cartProduct.price}</span>
                </div>
                <div className="flex justify-between text-lg font-black pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary-yellow">৳ {cartProduct.price}</span>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-2xl border-2 border-primary-yellow mt-6">
                 <div className="flex items-center mb-3">
                   <div className="w-4 h-4 rounded-full border-4 border-primary-yellow mr-2"></div>
                   <span className="font-bold text-sm">Pay with ZiNiPay</span>
                 </div>
                 <p className="text-[10px] text-gray-400">Pay securely with Bkash, Nagad, Rocket, and all BD gateways via ZiNiPay.</p>
              </div>

              <button className="w-full bg-primary-yellow text-gray-900 py-4 rounded-2xl font-black uppercase text-sm mt-6 hover:bg-gray-900 hover:text-white transition-all shadow-lg">
                Place Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
