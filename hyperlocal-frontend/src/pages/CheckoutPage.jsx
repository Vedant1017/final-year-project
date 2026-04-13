import React, { useMemo, useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { useCartStore } from '../store/useCartStore';

function LocationSelector({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });
  return position === null ? null : <Marker position={position}></Marker>;
}

export function CheckoutPage() {
  const nav = useNavigate();
  const { token, user } = useAuthStore();
  const { items, refresh } = useCartStore();
  
  const [step, setStep] = useState(1);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [orderInfo, setOrderInfo] = useState(null);
  
  const [deliveryDetails, setDeliveryDetails] = useState({
    name: user?.email ? user.email.split('@')[0] : '',
    phone: '',
    email: user?.email || '',
    address: user?.location?.address || '',
  });

  const [position, setPosition] = useState(
    user?.location?.lat ? { lat: user.location.lat, lng: user.location.lng } : { lat: 28.7041, lng: 77.1025 }
  );

  const [method, setMethod] = useState('UPI');

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    refresh();
    loadRazorpayScript();
  }, []);

  const handleCreateOrderAndPay = async () => {
    if (!token) return;
    if (!deliveryDetails.name || !deliveryDetails.phone || !deliveryDetails.address) {
      setError('Please fill in all delivery details');
      return;
    }
    
    setError(null);
    setLoading(true);

    try {
      // 1. Create order
      const { data: orderData } = await api.post('/checkout', {
        deliveryDetails: {
          ...deliveryDetails,
          lat: position.lat,
          lng: position.lng
        }
      });
      
      const orderId = orderData.order.id;
      setOrderInfo(orderData.order);
      
      if (method === 'COD') {
        // 2a. Post COD order
        await api.post('/checkout/payments/mock/confirm', { orderId, method });
        setStep(3);
        setTimeout(() => nav('/customer'), 2000);
      } else {
        // 2b. Razorpay Flow
        const { data: rzpOrderData } = await api.post('/checkout/payments/razorpay/create', { orderId });
        
        const options = {
          key: rzpOrderData.key_id, // This should normally be returned or stored in config
          amount: rzpOrderData.razorpayOrder.amount,
          currency: rzpOrderData.razorpayOrder.currency,
          name: "Hyperlocal Delivery",
          description: `Order #${orderId.substring(0, 8)}`,
          order_id: rzpOrderData.razorpayOrder.id,
          handler: async (response) => {
            try {
              setLoading(true);
              await api.post('/checkout/payments/razorpay/verify', {
                ...response,
                orderId
              });
              setStep(3);
              setTimeout(() => nav('/customer'), 2000);
            } catch (err) {
              setError('Payment verification failed. Please contact support.');
              setLoading(false);
            }
          },
          prefill: {
            name: deliveryDetails.name,
            email: deliveryDetails.email,
            contact: deliveryDetails.phone
          },
          theme: {
            color: "#111827"
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response) {
          setError(response.error.description);
          setLoading(false);
        });
        rzp.open();
      }
    } catch (e) {
      setError(e?.response?.data?.message ?? e?.message ?? 'Checkout failed');
      setLoading(false);
    }
  };

  if (items.length === 0 && step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm max-w-md w-full">
          <div className="font-black text-gray-900 text-lg">Your cart is empty</div>
          <Link to="/customer" className="text-brand-900 font-bold underline mt-2 inline-block">
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm max-w-xl w-full">
        {step === 1 && (
          <>
            <div className="text-xl font-black text-gray-900 mb-6">1. Delivery Details</div>
            {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 font-semibold">{error}</div>}
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black text-gray-700">Name</label>
                  <input
                    value={deliveryDetails.name}
                    onChange={(e) => setDeliveryDetails({ ...deliveryDetails, name: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-black text-gray-700">Phone</label>
                  <input
                    value={deliveryDetails.phone}
                    onChange={(e) => setDeliveryDetails({ ...deliveryDetails, phone: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                    placeholder="+1 234 567 890"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="text-xs font-black text-gray-700">Address line</label>
                <input
                  value={deliveryDetails.address}
                  onChange={(e) => setDeliveryDetails({ ...deliveryDetails, address: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Street, City, Postal Code"
                  required
                />
              </div>
              
              <div>
                <label className="text-xs font-black text-gray-700 block mb-1">Pin Location on Map</label>
                <div className="h-48 rounded-xl overflow-hidden border border-gray-200 relative z-0">
                  <MapContainer center={[position.lat, position.lng]} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                      attribution='&copy; OpenStreetMap'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationSelector position={position} setPosition={setPosition} />
                  </MapContainer>
                </div>
                <div className="text-xs text-gray-500 mt-1">Tap the map to set exact delivery pin</div>
              </div>

              <div className="pt-4 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => nav('/cart')}
                  className="px-6 py-3 rounded-xl bg-gray-100 text-gray-800 font-black hover:bg-gray-200"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (deliveryDetails.name && deliveryDetails.phone && deliveryDetails.address) setStep(2);
                    else setError('Fill all details');
                  }}
                  className="flex-1 rounded-xl bg-brand-900 text-white font-black py-3"
                >
                  Proceed to Payment
                </button>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-xl font-black text-gray-900 mb-6">2. Payment</div>
            {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 font-semibold">{error}</div>}
            
            <div className="grid grid-cols-2 gap-2 mb-6">
              {['UPI', 'CARD', 'NETBANKING', 'COD'].map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`px-3 py-2 rounded-xl border text-sm font-black ${
                    method === m ? 'bg-brand-900 text-white border-brand-900' : 'bg-brand-50 text-brand-900 border-brand-100'
                  }`}
                >
                  {m === 'COD' ? 'Cash on Delivery' : m}
                </button>
              ))}
            </div>
            
            <div className="text-xs text-gray-500 mb-6 font-semibold bg-gray-50 p-3 rounded-xl border border-gray-100">
              Mock payment selected: {method}. No real transaction will be made.
            </div>

            <div className="flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-xl bg-gray-100 text-gray-800 font-black hover:bg-gray-200"
                disabled={loading}
              >
                Back
              </button>
              <button
                onClick={handleCreateOrderAndPay}
                disabled={loading}
                className="flex-1 rounded-xl bg-brand-900 text-white font-black py-3 disabled:opacity-60"
              >
                {loading ? 'Processing...' : `Pay & Place Order`}
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <div className="text-center py-10">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-black">
              ✓
            </div>
            <div className="text-2xl font-black text-gray-900">Order Placed!</div>
            <div className="text-sm font-semibold text-gray-500 mt-2">
              Order ID: {orderInfo?.id}
            </div>
            <div className="text-xs text-gray-400 mt-4">Redirecting you to dashboard...</div>
          </div>
        )}
      </div>
    </div>
  );
}
