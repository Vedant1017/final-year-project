import React, { useEffect, useMemo, useState, useRef } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import io from 'socket.io-client';

function OrderChat({ orderId, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    api.get(`owner/orders`).then(res => {
      const order = res.data.orders.find(o => o.id === orderId);
      if (!cancelled && order?.chats) setMessages(order.chats);
    });

    const chatSocket = io(import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '') : 'http://localhost:3001');
    chatSocket.emit('joinOrderChat', orderId);
    chatSocket.on('newMessage', (msg) => {
      if (msg.orderId === orderId) {
        setMessages((prev) => [...prev, msg]);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    });

    return () => {
      cancelled = true;
      chatSocket.disconnect();
    };
  }, [orderId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    const chatSocket = io(import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '') : 'http://localhost:3001');
    chatSocket.emit('sendMessage', {
      orderId,
      senderId: user.id,
      senderRole: user.role,
      text: newMessage
    });
    setNewMessage('');
    setTimeout(() => chatSocket.disconnect(), 1000);
  };

  return (
    <div className="mt-4 border border-gray-100 rounded-xl overflow-hidden shadow-inner flex flex-col max-h-64 h-64 bg-gray-50">
      <div className="p-2 border-b border-gray-100 bg-white font-black text-xs text-brand-900">Support Chat</div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-xs text-gray-400 py-6">No messages yet.</div>
        ) : (
          messages.map((m, idx) => {
            const isMe = m.senderId === user.id;
            return (
              <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-2 rounded-xl text-xs font-semibold ${isMe ? 'bg-brand-900 text-white rounded-tr-none' : 'bg-white border text-gray-800 rounded-tl-none'}`}>
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>
      <form onSubmit={sendMessage} className="p-2 border-t border-gray-100 bg-white flex gap-2">
        <input 
          className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-brand-500" 
          value={newMessage}
          onChange={e => setNewMessage(e.target.value)}
          placeholder="Type message..."
        />
        <button type="submit" className="bg-brand-900 text-white px-3 py-1 rounded-lg text-xs font-black">Send</button>
      </form>
    </div>
  );
}

function ShopSetupForm({ onComplete }) {
  const [formData, setFormData] = useState({
    name: '',
    shopType: 'Grocery',
    openTime: '09:00',
    closeTime: '21:00',
    ownerName: '',
    contactPhone: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('owner/setup-shop', formData);
      onComplete();
    } catch (e) {
      alert(e.message || 'Failed to setup shop');
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-brand-900 p-8 text-white">
        <h2 className="text-3xl font-black italic uppercase tracking-tight mb-2">Setup Your Shop</h2>
        <p className="text-brand-100 font-semibold">Welcome! Tell us a bit more about your business to get started.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Shop Name</label>
            <input
              required
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-semibold focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Sunny Day Groceries"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Shop Type</label>
            <select
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-semibold focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none"
              value={formData.shopType}
              onChange={e => setFormData({ ...formData, shopType: e.target.value })}
            >
              <option value="Grocery">Grocery</option>
              <option value="Medical">Medical / Pharmacy</option>
              <option value="Stationery">Stationery</option>
              <option value="Fruits & Veg">Fruits & Vegetables</option>
              <option value="Bakery">Bakery</option>
              <option value="Dairy">Dairy Products</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Business Hours</label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none"
                value={formData.openTime}
                onChange={e => setFormData({ ...formData, openTime: e.target.value })}
              />
              <span className="font-black text-gray-300">to</span>
              <input
                type="time"
                className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3.5 text-sm font-semibold outline-none"
                value={formData.closeTime}
                onChange={e => setFormData({ ...formData, closeTime: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Owner Name</label>
            <input
              required
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-semibold focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none"
              value={formData.ownerName}
              onChange={e => setFormData({ ...formData, ownerName: e.target.value })}
              placeholder="Your Full Name"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">Contact Number</label>
            <input
              required
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3.5 text-sm font-semibold focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all outline-none"
              value={formData.contactPhone}
              onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
              placeholder="e.g. +91 9876543210"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-brand-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-brand-900/20 hover:scale-[1.02] active:scale-[0.98] transition-all text-lg mt-4"
        >
          Create Shop Profile →
        </button>
      </form>
    </div>
  );
}

function ProductModal({ isOpen, onClose, product, shopId, onSave }) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    stock: 0,
    shopId: '',
    imageUrl: ''
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        price: product.price || '',
        stock: product.stock || 0,
        shopId: product.shopId || shopId,
        imageUrl: product.imageUrl || ''
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        description: '',
        price: '',
        stock: 0,
        shopId: shopId,
        imageUrl: ''
      });
    }
  }, [product, shopId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-black text-gray-900">{product ? 'Edit Product' : 'Add New Product'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-black text-xl">×</button>
        </div>
        
        <form onSubmit={(e) => {
          e.preventDefault();
          onSave(formData);
        }} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-700 mb-1 uppercase tracking-wider">Product Name</label>
            <input
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Organic Milk"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-700 mb-1 uppercase tracking-wider">SKU</label>
              <input
                required
                disabled={!!product}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none disabled:opacity-50"
                value={formData.sku}
                onChange={e => setFormData({ ...formData, sku: e.target.value })}
                placeholder="MILK-500"
              />
            </div>
            <div>
              <label className="block text-xs font-black text-gray-700 mb-1 uppercase tracking-wider">Price (₹)</label>
              <input
                required
                type="number"
                step="0.01"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 mb-1 uppercase tracking-wider">Initial Stock</label>
            <input
              required
              type="number"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
              value={formData.stock}
              onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) })}
            />
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 mb-1 uppercase tracking-wider">Image URL</label>
            <input
              type="text"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none"
              value={formData.imageUrl}
              onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://..."
            />
            <p className="text-[10px] text-gray-500 mt-1 font-semibold italic">
              Note: add image link only and upload the image on gdrive or any cloude platform and paste the link
            </p>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 mb-1 uppercase tracking-wider">Description</label>
            <textarea
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-brand-500 outline-none h-24 resize-none"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell customers more about this product..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 font-black py-3 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-brand-900 text-white font-black py-3 rounded-xl hover:bg-brand-950 transition-shadow shadow-lg shadow-brand-900/20"
            >
              {product ? 'Save Changes' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function OwnerDashboardPage() {
  const { token, logout, user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('orders');
  const [shops, setShops] = useState([]);
  const [restockAmountByProductId, setRestockAmountByProductId] = useState({});
  const [activeChatOrderId, setActiveChatOrderId] = useState(null);
  
  // CRUD states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [activeShopId, setActiveShopId] = useState(null);

  const load = async () => {
    if (!token) return;
    setError(null);
    try {
      const { data } = await api.get('owner/orders');
      setOrders(data.orders);
    } catch (e) {
      console.error(e);
    }
  };

  const loadInventory = async () => {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.get('owner/inventory');
      setShops(data.shops);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([load(), loadInventory()]);
      setLoading(false);
    };
    init();
  }, [token]);

  const changeStatus = async (orderId, status) => {
    if (!token) return;
    try {
      await api.post(`owner/orders/${orderId}/status`, { status });
      await load();
    } catch(e) {
      alert(e?.message ?? 'Failed to change status');
    }
  };

  const restock = async (productId) => {
    if (!token) return;
    const amt = restockAmountByProductId[productId] ?? 10;
    await api.post(`owner/products/${productId}/restock`, { amount: amt });
    await loadInventory();
  };

  const handleSaveProduct = async (formData) => {
    try {
      if (editingProduct) {
        await api.patch(`owner/products/${editingProduct.id}`, formData);
      } else {
        await api.post(`owner/products`, formData);
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      await loadInventory();
    } catch (e) {
      alert(e?.response?.data?.message ?? 'Action failed');
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`owner/products/${productId}`);
      await loadInventory();
    } catch (e) {
      alert(e?.response?.data?.message ?? 'Delete failed');
    }
  };

  const stats = useMemo(() => {
    const total = orders.length;
    const paid = orders.filter((o) => o.status === 'PAID').length;
    const fulfilled = orders.filter((o) => o.status === 'DELIVERED' || o.status === 'FULFILLED').length;
    const pending = orders.filter((o) => o.status === 'PENDING_PAYMENT').length;
    const revenue = orders
      .filter((o) => o.status !== 'PENDING_PAYMENT' && o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + Number(o.totalAmount ?? 0), 0);
    return { total, paid, fulfilled, pending, revenue };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
      if (!q) return true;
      return o.id.toLowerCase().includes(q);
    });
  }, [orders, statusFilter, search]);

  const statusOptions = ['PENDING_PAYMENT', 'PAID', 'PACKING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-brand-900 border-t-transparent rounded-full animate-spin mb-4" />
          <div className="font-black text-brand-900 uppercase">Loading Dashboard...</div>
        </div>
      </div>
    );
  }

  // SHOP ONBOARDING: If no shops, show setup form
  if (shops.length === 0) {
    return (
      <div className="min-h-screen bg-brand-50 pb-20">
        <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="font-black text-brand-900 text-lg uppercase tracking-tight">SnapCart • Business</div>
            <button onClick={logout} className="px-4 py-2 rounded-xl bg-gray-100 font-black text-gray-700 text-sm">Logout</button>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-12">
          <ShopSetupForm onComplete={loadInventory} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-50 pb-20">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <div className="font-black text-brand-900 text-lg uppercase tracking-tight">SnapCart • Business</div>
            <div className="text-xs text-brand-500 font-black px-2 py-0.5 bg-brand-50 rounded-lg inline-block">{user?.email}</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => (tab === 'orders' ? load() : loadInventory())}
              className="p-2 rounded-xl bg-gray-50 text-brand-900 border border-brand-100 hover:bg-brand-50 transition-colors"
              disabled={loading}
              title="Refresh Data"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>
            </button>
            <button onClick={logout} className="px-4 py-2 rounded-xl bg-gray-100 font-black text-gray-700 text-sm hover:bg-gray-200 transition-colors">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {error && <div className="mb-6 bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 font-black flex items-center gap-3">
          <span className="bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">!</span>
          {error}
        </div>}

        <div className="flex gap-1 bg-white p-1.5 rounded-2xl border border-gray-100 w-fit mb-8 shadow-sm">
          <button
            onClick={() => setTab('orders')}
            className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${
              tab === 'orders' ? 'bg-brand-900 text-white shadow-lg shadow-brand-900/20' : 'bg-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Orders Overview
          </button>
          <button
            onClick={() => {
              setTab('inventory');
              loadInventory().catch((e) => setError(e.message));
            }}
            className={`px-6 py-2.5 rounded-xl font-black text-sm transition-all ${
              tab === 'inventory' ? 'bg-brand-900 text-white shadow-lg shadow-brand-900/20' : 'bg-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            Inventory Management
          </button>
        </div>

        {tab === 'orders' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              {[
                { label: 'Total Orders', val: stats.total, color: 'text-gray-900' },
                { label: 'Pending', val: stats.pending, color: 'text-amber-600' },
                { label: 'Paid', val: stats.paid, color: 'text-blue-600' },
                { label: 'Delivered', val: stats.fulfilled, color: 'text-green-600' },
                { label: 'Revenue', val: `₹${stats.revenue.toFixed(2)}`, color: 'text-brand-900', large: true }
              ].map((s, i) => (
                <div key={i} className={`bg-white rounded-2xl border border-gray-100 p-5 shadow-sm ${s.large ? 'col-span-2 md:col-span-1' : ''}`}>
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</div>
                  <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row gap-5 md:items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-900"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900">Order History</h2>
                    <p className="text-xs font-semibold text-gray-400">{filteredOrders.length} transactions found</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 flex-wrap">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 text-xs font-black text-gray-700 outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="ALL">All Statuses</option>
                    {statusOptions.map(opt => <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/50">
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Order Details</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Customer</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Amount</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Status</th>
                      <th className="p-4 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="p-12 text-center text-gray-400 font-semibold italic">No orders found matching the filter.</td>
                      </tr>
                    ) : (
                      filteredOrders.map((o) => (
                        <React.Fragment key={o.id}>
                          <tr className={`hover:bg-brand-50/30 transition-colors ${activeChatOrderId === o.id ? 'bg-brand-50/50' : ''}`}>
                            <td className="p-4">
                              <div className="font-black text-gray-900 text-sm leading-tight mb-0.5">{o.id.substring(0, 8)}...</div>
                              <div className="text-[10px] text-gray-400 font-black">{new Date(o.createdAt).toLocaleDateString()} • {new Date(o.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                            </td>
                            <td className="p-4">
                              <div className="font-bold text-gray-800 text-xs">{o.deliveryDetails?.name || 'Guest'}</div>
                              <div className="text-[10px] text-gray-500 font-semibold">{o.deliveryDetails?.phone || 'No Phone'}</div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="font-black text-brand-900 text-sm">₹{o.totalAmount}</div>
                              <div className="text-[9px] text-gray-400 font-black uppercase tracking-tighter">{o.items?.length || 0} items</div>
                            </td>
                            <td className="p-4">
                              <select
                                value={o.status}
                                onChange={(e) => changeStatus(o.id, e.target.value)}
                                className={`rounded-lg px-2 py-1 text-[10px] font-black border transition-all focus:ring-2 focus:ring-brand-500 outline-none ${
                                  o.status === 'PAID' ? 'bg-blue-50 text-blue-700 border-blue-100' : 
                                  o.status === 'DELIVERED' ? 'bg-green-50 text-green-700 border-green-100' :
                                  'bg-gray-100 text-gray-700 border-gray-200'
                                }`}
                              >
                                {statusOptions.map(opt => <option key={opt} value={opt}>{opt.replace(/_/g, ' ')}</option>)}
                              </select>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => setActiveChatOrderId(activeChatOrderId === o.id ? null : o.id)}
                                className={`p-2 rounded-xl border transition-all ${
                                  activeChatOrderId === o.id ? 'bg-brand-900 text-white border-brand-900 shadow-md' : 'bg-white text-brand-900 border-brand-100 shadow-sm'
                                }`}
                                title="Open Support Chat"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                              </button>
                            </td>
                          </tr>
                          {activeChatOrderId === o.id && (
                            <tr>
                              <td colSpan="5" className="p-4 bg-brand-50/50 border-y border-brand-50">
                                <OrderChat orderId={o.id} user={user} />
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'inventory' && (
          <div className="space-y-8">
            {shops.length === 0 ? (
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300"><path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"/><path d="m3 9 2.45-4.9A2 2 0 0 1 7.24 3h9.52a2 2 0 0 1 1.8 1.1L21 9"/></svg>
                </div>
                <h3 className="text-gray-900 font-black">No Shops Linked</h3>
                <p className="text-sm text-gray-500 font-semibold mt-1">Please wait for admin approval or link a shop to manage inventory.</p>
              </div>
            ) : (
              shops.map((s) => (
                <div key={s.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden border-t-4 border-t-brand-900">
                  <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-black text-gray-900 italic uppercase">Shop: {s.name}</h2>
                      <div className="flex gap-2 items-center flex-wrap mt-2">
                        <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-100">Type: {s.shopType || 'General'}</span>
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">Hours: {s.openTime} - {s.closeTime}</span>
                        {s.contactPhone && <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">📞 {s.contactPhone}</span>}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveShopId(s.id);
                        setEditingProduct(null);
                        setIsModalOpen(true);
                      }}
                      className="px-4 py-2 bg-brand-900 text-white rounded-xl text-xs font-black shadow-lg shadow-brand-900/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      + Add New Product
                    </button>
                  </div>

                  <div className="divide-y divide-gray-50">
                    {s.products.length === 0 ? (
                      <div className="p-12 text-center text-gray-400 font-semibold italic">No products in this shop. Add your first item above!</div>
                    ) : (
                      s.products.map((p) => {
                        const amt = restockAmountByProductId[p.id] ?? 10;
                        return (
                          <div key={p.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-gray-50/50 transition-colors">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-black text-gray-900 truncate">{p.name}</h3>
                                <span className="text-[9px] font-black text-white bg-gray-900 px-1.5 rounded uppercase tracking-tighter">SKU: {p.sku}</span>
                              </div>
                              <p className="text-xs text-gray-500 font-semibold line-clamp-1 h-4">{p.description || 'No description provided'}</p>
                              <div className="mt-2 text-brand-900 font-black text-sm">₹{p.price}</div>
                            </div>
                            
                            <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                              <div className="shrink-0 text-center px-3 border-r border-gray-200">
                                <div className="text-[9px] font-black text-gray-400 uppercase">Stock</div>
                                <div className={`text-sm font-black ${p.stock <= 5 ? 'text-red-600' : 'text-gray-900'}`}>{p.stock}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min={1}
                                  value={amt}
                                  onChange={(e) => setRestockAmountByProductId(prev => ({ ...prev, [p.id]: parseInt(e.target.value) }))}
                                  className="w-16 bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-black outline-none focus:ring-2 focus:ring-brand-500"
                                />
                                <button
                                  onClick={() => restock(p.id)}
                                  className="text-[10px] font-black text-brand-900 uppercase hover:underline"
                                >
                                  Restock
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingProduct(p);
                                  setIsModalOpen(true);
                                }}
                                className="p-2 text-gray-400 hover:text-brand-900 hover:bg-brand-50 rounded-xl transition-all"
                                title="Edit Product"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                              </button>
                              <button
                                onClick={() => deleteProduct(p.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                title="Delete Product"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              ))
            )}

            <ProductModal
              isOpen={isModalOpen}
              onClose={() => {
                setIsModalOpen(false);
                setEditingProduct(null);
              }}
              product={editingProduct}
              shopId={activeShopId}
              onSave={handleSaveProduct}
            />
          </div>
        )}
      </main>
    </div>
  );
}
