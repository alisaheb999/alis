
import React, { useState } from 'react';
import { useApp } from '../App';
import { Product } from '../types';

type AdminTab = 'dashboard' | 'products' | 'settings' | 'orders';

const Admin: React.FC = () => {
  const { products, setProducts, settings, setSettings } = useApp();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    title: '',
    price: 0,
    oldPrice: 0,
    image: '',
    categories: ['Course'],
    tags: []
  });

  const [siteForm, setSiteForm] = useState(settings);

  const saveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setProducts(prev => prev.map(p => p.id === editingId ? { ...p, ...productForm } as Product : p));
      setEditingId(null);
    } else {
      const newProduct = { ...productForm, id: Date.now(), rating: 5 } as Product;
      setProducts(prev => [newProduct, ...prev]);
      setIsAdding(false);
    }
    setProductForm({ title: '', price: 0, oldPrice: 0, image: '', categories: ['Course'], tags: [] });
  };

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(siteForm);
    alert('Site settings updated successfully!');
  };

  const startEdit = (p: Product) => {
    setProductForm(p);
    setEditingId(p.id);
    setIsAdding(true);
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] flex flex-col md:flex-row">
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-[#1a1c1e] text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-gray-800 flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-yellow rounded-xl flex items-center justify-center">
            <i className="fas fa-shield-halved text-gray-900"></i>
          </div>
          <span className="font-black text-xl tracking-tighter uppercase">Admin Hub</span>
        </div>
        
        <nav className="flex-grow p-4 space-y-2">
          {[
            { id: 'dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
            { id: 'products', icon: 'fa-box-open', label: 'Products' },
            { id: 'orders', icon: 'fa-shopping-cart', label: 'Orders' },
            { id: 'settings', icon: 'fa-cog', label: 'Site Settings' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as AdminTab)}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl font-bold transition-all ${activeTab === item.id ? 'bg-primary-yellow text-gray-900 shadow-xl shadow-yellow-500/10' : 'text-gray-400 hover:bg-gray-800'}`}
            >
              <i className={`fas ${item.icon} text-lg`}></i>
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button className="w-full flex items-center space-x-3 px-4 py-3 text-red-500 font-bold hover:bg-red-500/10 rounded-xl transition-all">
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow p-4 md:p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-900 capitalize tracking-tight">{activeTab} Panel</h1>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1">Manage your store effortlessly</p>
          </div>
          {activeTab === 'products' && !isAdding && (
            <button 
              onClick={() => { setIsAdding(true); setEditingId(null); }}
              className="bg-primary-yellow text-gray-900 px-6 py-3 rounded-2xl font-black uppercase text-xs shadow-xl active:scale-95 transition-all flex items-center space-x-2"
            >
              <i className="fas fa-plus"></i>
              <span>Add Product</span>
            </button>
          )}
        </div>

        {/* Dashboard View */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Sales', value: '৳ 2.4M', icon: 'fa-coins', color: 'bg-green-500' },
                { label: 'Total Products', value: products.length, icon: 'fa-boxes', color: 'bg-blue-500' },
                { label: 'Active Orders', value: '14', icon: 'fa-shopping-bag', color: 'bg-orange-500' },
                { label: 'Visitors', value: '42.8K', icon: 'fa-users', color: 'bg-purple-500' }
              ].map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-center">
                  <div className={`w-12 h-12 ${stat.color} text-white rounded-2xl flex items-center justify-center mr-4 shadow-lg shadow-black/5`}>
                    <i className={`fas ${stat.icon} text-xl`}></i>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-xl font-black text-gray-900">{stat.value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                <h3 className="font-black text-lg mb-6 flex items-center justify-between">
                  <span>Recent Activity</span>
                  <i className="fas fa-ellipsis-h text-gray-300"></i>
                </h3>
                <div className="space-y-6">
                  {[1, 2, 3].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-primary-yellow">
                        <i className="fas fa-user-check text-sm"></i>
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-bold text-gray-800">New order placed by Rashed Ahmed</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">2 minutes ago</p>
                      </div>
                      <span className="text-xs font-black text-primary-yellow">৳ 450</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                <h3 className="font-black text-lg mb-6">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setActiveTab('settings')} className="p-4 bg-gray-50 rounded-2xl text-center hover:bg-yellow-50 transition-colors">
                    <i className="fas fa-tools text-primary-yellow text-2xl mb-2"></i>
                    <p className="text-xs font-black uppercase text-gray-700">Settings</p>
                  </button>
                  <button onClick={() => setActiveTab('products')} className="p-4 bg-gray-50 rounded-2xl text-center hover:bg-yellow-50 transition-colors">
                    <i className="fas fa-plus-circle text-primary-yellow text-2xl mb-2"></i>
                    <p className="text-xs font-black uppercase text-gray-700">New Product</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products View */}
        {activeTab === 'products' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isAdding ? (
              <div className="bg-white p-6 md:p-10 rounded-[40px] shadow-2xl border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-black uppercase tracking-tighter">
                    {editingId ? 'Edit Product' : 'Create New Product'}
                  </h2>
                  <button onClick={() => setIsAdding(false)} className="text-gray-400 hover:text-red-500"><i className="fas fa-times text-xl"></i></button>
                </div>

                <form onSubmit={saveProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-gray-400 uppercase mb-2">Product Title</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:border-primary-yellow focus:outline-none transition-all font-bold"
                      value={productForm.title}
                      onChange={e => setProductForm({...productForm, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase mb-2">Price (৳)</label>
                    <input 
                      required
                      type="number" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:border-primary-yellow focus:outline-none transition-all font-bold"
                      value={productForm.price}
                      onChange={e => setProductForm({...productForm, price: Number(e.target.value)})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase mb-2">Old Price (৳)</label>
                    <input 
                      type="number" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:border-primary-yellow focus:outline-none transition-all font-bold"
                      value={productForm.oldPrice}
                      onChange={e => setProductForm({...productForm, oldPrice: Number(e.target.value)})}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-gray-400 uppercase mb-2">Image URL</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:border-primary-yellow focus:outline-none transition-all font-bold"
                      value={productForm.image}
                      onChange={e => setProductForm({...productForm, image: e.target.value})}
                    />
                  </div>
                  <button type="submit" className="md:col-span-2 bg-gray-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all">
                    {editingId ? 'Save Changes' : 'Publish Product'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Product Info</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400">Pricing</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {products.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-4">
                              <img src={p.image} className="w-12 h-12 rounded-xl object-cover" alt="" />
                              <span className="font-bold text-gray-800 text-sm line-clamp-1">{p.title}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-black text-gray-900 text-sm">৳{p.price}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button onClick={() => startEdit(p)} className="w-9 h-9 bg-yellow-50 text-primary-yellow rounded-xl flex items-center justify-center hover:bg-primary-yellow hover:text-gray-900 transition-all">
                                <i className="fas fa-edit text-xs"></i>
                              </button>
                              <button onClick={() => setProducts(products.filter(item => item.id !== p.id))} className="w-9 h-9 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                                <i className="fas fa-trash-alt text-xs"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Settings View */}
        {activeTab === 'settings' && (
          <div className="bg-white p-8 md:p-12 rounded-[40px] shadow-sm border border-gray-100 animate-in fade-in duration-500">
            <h2 className="text-xl font-black mb-10 border-b pb-4 uppercase">Site Configuration</h2>
            <form onSubmit={saveSettings} className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Store Name</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:border-primary-yellow focus:outline-none font-bold"
                  value={siteForm.siteName}
                  onChange={e => setSiteForm({...siteForm, siteName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Logo URL</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:border-primary-yellow focus:outline-none font-bold"
                  value={siteForm.logoUrl}
                  onChange={e => setSiteForm({...siteForm, logoUrl: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">WhatsApp Number</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:border-primary-yellow focus:outline-none font-bold"
                  value={siteForm.whatsapp}
                  onChange={e => setSiteForm({...siteForm, whatsapp: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Facebook Link</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:border-primary-yellow focus:outline-none font-bold"
                  value={siteForm.facebook}
                  onChange={e => setSiteForm({...siteForm, facebook: e.target.value})}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Footer Copyright Text</label>
                <input 
                  type="text" 
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 focus:border-primary-yellow focus:outline-none font-bold"
                  value={siteForm.footerText}
                  onChange={e => setSiteForm({...siteForm, footerText: e.target.value})}
                />
              </div>
              <button type="submit" className="md:col-span-2 bg-primary-yellow text-gray-900 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-gray-900 hover:text-white transition-all">
                Update Store Configuration
              </button>
            </form>
          </div>
        )}

        {/* Orders View (Mock) */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden text-center py-20">
             <i className="fas fa-shopping-bag text-gray-100 text-9xl mb-6"></i>
             <h2 className="text-xl font-black text-gray-400 uppercase">Coming Soon</h2>
             <p className="text-gray-300 font-bold">Advanced order tracking system is being built.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
