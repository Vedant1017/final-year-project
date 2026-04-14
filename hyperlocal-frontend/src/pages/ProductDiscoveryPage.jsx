import React, { useState, useEffect, useMemo } from 'react';
import { Search, MapPin, Tag, Filter, ArrowUpDown, ChevronRight, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import { Link } from 'react-router-dom';
import { ProductImage } from './CustomerHomePage';

export function ProductDiscoveryPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('price'); // price, distance
  const [filters, setFilters] = useState({ brand: '', quantity: '' });
  const [userLocation, setUserLocation] = useState(null);

  // Get location on mount
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setError('Please enable location access to find nearby shops.')
    );
  }, []);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query) return;
    if (!userLocation) {
        alert('Detecting your location... please wait.');
        return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('discovery/search', {
        params: {
          q: query,
          lat: userLocation.lat,
          lng: userLocation.lng,
          sort: sortBy,
          brand: filters.brand,
          quantity: filters.quantity
        }
      });
      setResults(data);
    } catch (e) {
      setError(e.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  // Re-search when sort or filters change
  useEffect(() => {
    if (results) handleSearch();
  }, [sortBy, filters.brand, filters.quantity]);

  const brands = useMemo(() => {
    if (!results?.nearby_shops) return [];
    return [...new Set(results.nearby_shops.map(s => s.brand))].filter(Boolean);
  }, [results]);

  const quantities = useMemo(() => {
    if (!results?.nearby_shops) return [];
    return [...new Set(results.nearby_shops.map(s => s.quantity))].filter(Boolean);
  }, [results]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-white/80 backdrop-blur-xl sticky top-0 z-30 border-b border-slate-200">
        <div className="container mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center gap-3 mb-4">
            <Link to="/customer" className="p-2 hover:bg-slate-100 rounded-full transition-colors">
              <ChevronRight className="rotate-180" size={20} />
            </Link>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Price Comparison</h1>
          </div>

          <form onSubmit={handleSearch} className="relative group">
            <input
              type="text"
              className="w-full bg-slate-100 border-none rounded-2xl py-4 pl-12 pr-4 text-slate-900 font-bold placeholder:text-slate-400 focus:ring-4 focus:ring-brand-500/20 transition-all shadow-inner"
              placeholder="Search for 'milk', 'bread', 'eggs'..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-900 transition-colors" size={20} />
            <button 
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-brand-900 text-white px-4 py-1.5 rounded-xl font-black text-xs hover:bg-brand-950 transition-all shadow-lg shadow-brand-900/20"
            >
              FIND
            </button>
          </form>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8">
        {error && (
            <div className="mb-6 bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 font-black flex items-center gap-3">
                <XCircle size={18} /> {error}
            </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-brand-900 border-t-transparent rounded-full animate-spin" />
            <p className="font-black text-slate-400 uppercase tracking-widest text-xs animate-pulse">Scanning nearby shops...</p>
          </div>
        ) : results ? (
          <>
            {/* Filter & Sort Controls */}
            <div className="flex flex-wrap items-center gap-3 mb-8">
               <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                 <ArrowUpDown size={14} className="text-slate-400" />
                 <select 
                    value={sortBy} 
                    onChange={e => setSortBy(e.target.value)}
                    className="bg-transparent text-xs font-black outline-none"
                 >
                   <option value="price">Lowest Price</option>
                   <option value="distance">Nearest First</option>
                 </select>
               </div>

               {brands.length > 0 && (
                 <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                   <Tag size={14} className="text-slate-400" />
                   <select 
                      value={filters.brand} 
                      onChange={e => setFilters({...filters, brand: e.target.value})}
                      className="bg-transparent text-xs font-black outline-none"
                   >
                     <option value="">All Brands</option>
                     {brands.map(b => <option key={b} value={b}>{b}</option>)}
                   </select>
                 </div>
               )}

               {quantities.length > 0 && (
                 <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
                   <Filter size={14} className="text-slate-400" />
                   <select 
                      value={filters.quantity} 
                      onChange={e => setFilters({...filters, quantity: e.target.value})}
                      className="bg-transparent text-xs font-black outline-none"
                   >
                     <option value="">All Quantities</option>
                     {quantities.map(q => <option key={q} value={q}>{q}</option>)}
                   </select>
                 </div>
               )}
            </div>

            {/* Best Deal Hero */}
            {results.lowest_price && (
                <div className="relative mb-10 group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-brand-900 via-purple-500 to-pink-500 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200" />
                    <div className="relative bg-white rounded-3xl p-6 md:p-8 border border-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden">
                        <div className="absolute top-0 right-0 px-4 py-1.5 bg-brand-900 text-white font-black text-[10px] rounded-bl-2xl uppercase tracking-widest">
                            BEST PRICE GUARANTEED
                        </div>
                        <div>
                            <h2 className="text-slate-400 font-black text-xs uppercase tracking-widest mb-1">Cheapest {results.product} nearby</h2>
                            <div className="text-5xl font-black text-slate-900 tracking-tighter">₹{results.lowest_price.price}</div>
                            <div className="mt-4 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <div className="font-black text-slate-900 leading-tight">{results.lowest_price.shop_name}</div>
                                    <div className="text-xs font-bold text-slate-500">{results.lowest_price.brand} • {results.lowest_price.quantity}</div>
                                </div>
                            </div>
                        </div>
                        <button className="w-full md:w-auto px-8 py-4 bg-slate-900 text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-slate-900/20">
                            Visit Shop →
                        </button>
                    </div>
                </div>
            )}

            {/* List of Shops */}
            <div className="space-y-4">
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest px-1">Nearby Availability ({results.nearby_shops.length})</h3>
                {results.nearby_shops.map((shop, i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between group hover:border-brand-500 transition-colors">
                        <div className="flex items-center gap-4">
                            <ProductImage src={shop.imageUrl} alt={shop.product_name} className="w-16 h-16 rounded-xl" />
                            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl min-w-[70px]">
                                <span className="text-[10px] font-black text-slate-400 uppercase mb-1">Dist</span>
                                <span className="text-sm font-black text-slate-900">{shop.distance_km}km</span>
                            </div>
                            <div>
                                <h4 className="font-black text-slate-900 group-hover:text-brand-900 transition-colors">{shop.shop_name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-md font-bold text-slate-600 border border-slate-200">{shop.brand}</span>
                                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded-md font-bold text-slate-600 border border-slate-200">{shop.quantity}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-black text-slate-900">₹{shop.price}</div>
                            <div className="flex items-center justify-end gap-1 mt-1">
                                {shop.stock ? (
                                    <>
                                        <CheckCircle2 size={12} className="text-green-500" />
                                        <span className="text-[10px] font-black text-green-600 uppercase">In Stock</span>
                                    </>
                                ) : (
                                    <>
                                        <XCircle size={12} className="text-red-500" />
                                        <span className="text-[10px] font-black text-red-600 uppercase">Out of Stock</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <Search size={32} className="text-slate-300" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2 italic">Ready to compare?</h2>
            <p className="text-slate-500 font-semibold max-w-sm">Search for any product and we'll scan the nearest 5km to find you the absolute best price.</p>
          </div>
        )}
      </main>
    </div>
  );
}
