import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowUpDown, MapPin, Tag, Info, ShoppingCart, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import { useCartStore } from '../store/useCartStore';
import { ProductImage } from './CustomerHomePage';



export function ProductDetailsPage() {
  const nav = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const { items, refresh, setQuantity, loading } = useCartStore();

  const storeQty = useMemo(() => {
    if (!product) return 0;
    const it = items.find((i) => i.productId === product.id);
    return it?.quantity ?? 0;
  }, [items, product]);

  const [localQty, setLocalQty] = useState(0);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    setLocalQty(storeQty);
  }, [storeQty]);

  useEffect(() => {
    (async () => {
      try {
        setError(null);
        const { data } = await api.get(`/products/${id}`);
        setProduct(data.product);
        await refresh();
      } catch (e) {
        setError(e?.message ?? 'Failed to load product');
      }
    })();
  }, [id]);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocationError('Enable location for price comparisons.')
    );
  }, []);

  useEffect(() => {
    if (product && userLocation) {
        const nameParts = product.name.toLowerCase().split(/\s+/);
        const fillers = [
            'organic', 'fresh', 'farm', 'premium', 'whole', 'natural', 'pure', 'ripe', 'red', 'white', 'black', 'green', 'fresh', 'best', 'quality',
            'kg', 'g', 'gram', 'ml', 'l', 'liter', 'pack', 'pc', 'piece', 'units', 'box', 'bottle'
        ];
        
        // Filter out fillers, numbers, and words starting with a number (like 500ml)
        const keywords = nameParts.filter(word => {
            if (fillers.includes(word)) return false;
            if (/^\d/.test(word)) return false; // Ignore if starts with a number
            if (word.length <= 1) return false; // Ignore single characters
            return true;
        });
        
        // If everything was filtered out, just use the first word to avoid empty search
        const q = keywords.length > 0 ? keywords.join(' ') : nameParts[0];

        api.get('discovery/search', {
            params: {
              q: q, 
              lat: userLocation.lat,
              lng: userLocation.lng
            }
        }).then(res => {
            // Filter out current product
            const filtered = (res.data.nearby_shops || []).filter(item => item.id !== id);
            setSimilarProducts(filtered);
        }).catch(console.error);
    }
  }, [product, userLocation, id]);

  if (error) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm max-w-md w-full">
          <div className="font-black text-gray-900">Could not load product</div>
          <div className="text-sm text-gray-600 font-semibold mt-1">{error}</div>
          <Link to="/customer" className="inline-block mt-4 text-brand-900 font-black underline">
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center px-4">
        <div className="text-gray-600 font-semibold">Loading…</div>
      </div>
    );
  }

  const handleUpdateCart = async () => {
    setUpdating(true);
    try {
      await setQuantity(product.id, localQty);
      // Wait for store to refresh it
      await refresh();
    } finally {
      setUpdating(false);
    }
  };

  const isChanged = localQty !== storeQty;

  return (
    <div className="min-h-screen bg-brand-50">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button onClick={() => nav(-1)} className="font-black text-brand-900 tracking-tight">
            ← Back
          </button>
          <Link to="/cart" className="font-black text-brand-900 hover:underline">
            Cart
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden md:flex md:gap-6">
          <div className="md:w-1/2">
            <ProductImage src={product.imageUrl} alt={product.name} />
          </div>
          <div className="md:w-1/2 p-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{product.sku}</div>
              <div className="text-3xl font-black text-gray-900 mt-2 leading-tight">{product.name}</div>
              <div className="text-sm text-gray-600 font-semibold mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100">{product.description ?? 'No description available.'}</div>
              
              <div className="mt-6 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-gray-500">Price</div>
                  <div className="text-3xl font-black text-brand-900">₹{product.price}</div>
                </div>
                <div className="text-sm font-black text-green-700 bg-green-100 px-3 py-1.5 rounded-full">{product.stock} in stock</div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-2xl w-max border border-gray-200">
                  <button
                    className="w-12 h-12 rounded-xl bg-white border border-gray-200 shadow-sm font-black text-brand-900 disabled:opacity-50 hover:bg-gray-100 transition-colors"
                    disabled={localQty <= 0}
                    onClick={() => setLocalQty(Math.max(0, localQty - 1))}
                  >
                    -
                  </button>
                  <div className="w-12 text-center text-xl font-black">{localQty}</div>
                  <button
                    className="w-12 h-12 rounded-xl bg-brand-900 shadow-sm text-white font-black disabled:opacity-50 hover:bg-brand-800 transition-colors"
                    disabled={product.stock <= 0}
                    onClick={() => setLocalQty(localQty + 1)}
                  >
                    +
                  </button>
                </div>
                
                <div className="flex gap-3 mt-2">
                  <button
                    disabled={!isChanged || updating}
                    onClick={handleUpdateCart}
                    className="flex-1 px-5 py-4 rounded-2xl bg-brand-900 text-white font-black hover:bg-brand-500 disabled:opacity-50 transition-all text-lg"
                  >
                    {updating ? 'Updating...' : isChanged ? 'Update Cart' : 'In Cart'}
                  </button>

                  <Link
                    to="/cart"
                    className="flex-1 text-center px-5 py-4 rounded-2xl bg-gray-900 text-white font-black hover:bg-gray-800 transition-all text-lg"
                  >
                    View Cart
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Market Comparison Section */}
        {similarProducts.length > 0 && (
            <div className="mt-10 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-6 border-b border-gray-50 bg-slate-900 text-white flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black italic uppercase tracking-tight">Market Comparison</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Finding the best price for "{product.name.split(' ')[0]}"</p>
                    </div>
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                        <ArrowUpDown size={18} className="text-brand-300" />
                    </div>
                </div>

                <div className="divide-y divide-gray-50">
                    {similarProducts.map((other, idx) => {
                        const priceDiff = parseFloat(other.price) - parseFloat(product.price);
                        const isCheaper = priceDiff < 0;
                        const isSame = priceDiff === 0;

                        return (
                            <div key={idx} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <ProductImage src={other.imageUrl} alt={other.product_name} className="w-16 h-16 rounded-xl" />
                                    <div className={`p-3 rounded-2xl flex flex-col items-center justify-center min-w-[64px] ${isCheaper ? 'bg-green-50 text-green-700' : isSame ? 'bg-slate-50 text-slate-500' : 'bg-amber-50 text-amber-700'}`}>
                                        <div className="text-[9px] font-black uppercase mb-0.5">Price</div>
                                        <div className="text-sm font-black">₹{other.price}</div>
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-900 group-hover:text-brand-900 transition-colors">{other.shop_name}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded-md text-slate-500">{other.brand}</span>
                                            <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 rounded-md text-slate-500">{other.quantity}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-6">
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-end gap-1">
                                            <MapPin size={10} /> {other.distance_km}km
                                        </div>
                                        <div className={`text-xs font-black mt-1 ${isCheaper ? 'text-green-600' : isSame ? 'text-slate-400' : 'text-amber-600'}`}>
                                            {isSame ? 'Same price' : `${isCheaper ? 'Cheaper' : 'More expensive'} by ₹${Math.abs(priceDiff).toFixed(2)}`}
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => nav(`/product/${other.id}`)} // Note: Discovery API needs to return product ID for this link
                                        className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-brand-900 group-hover:text-white transition-all shadow-sm"
                                    >
                                        <ChevronRight size={18} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
                <div className="p-4 bg-slate-50 text-center">
                    <p className="text-[10px] font-semibold text-slate-400 italic">Prices and availability are shown for shops within a 5km radius of your location.</p>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
