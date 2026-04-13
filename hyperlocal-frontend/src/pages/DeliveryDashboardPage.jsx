import React, { useEffect, useState, useRef } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import io from 'socket.io-client';

function DeliveryOrderChat({ orderId, user }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    // We already have the order details in parent, so we can pass messages or fetch here.
    // Easiest is to just fetch the specific order if we need existing chats.
    api.get(`delivery/orders/mine`).then(res => {
      const order = res.data.orders.find(o => o.id === orderId);
      if (!cancelled && order?.chats) setMessages(order.chats);
    }).catch(e => console.error(e));

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
      senderRole: user.role, // "DELIVERY_MAN"
      text: newMessage
    });
    setNewMessage('');
    setTimeout(() => chatSocket.disconnect(), 1000);
  };

  return (
    <div className="mt-4 mx-4 border border-gray-100 rounded-xl overflow-hidden shadow-inner flex flex-col max-h-64 h-64 bg-gray-50">
      <div className="p-2 border-b border-gray-100 bg-white font-black text-xs text-brand-900">Delivery Support Chat</div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <div className="text-center text-xs text-gray-400 py-6">No messages yet. Message customer or owner.</div>
        ) : (
          messages.map((m, idx) => {
            const isMe = m.senderId === user.id;
            return (
              <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-2 rounded-xl text-xs font-semibold ${isMe ? 'bg-brand-900 text-white rounded-tr-none' : 'bg-white border text-gray-800 rounded-tl-none'}`}>
                  {m.text}
                  <div className={`text-[9px] mt-1 opacity-70`}>{m.senderRole}</div>
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

export function DeliveryDashboardPage() {
  const { token, logout, user } = useAuthStore();
  const [activeChatOrderId, setActiveChatOrderId] = useState(null);
  const [activeQrOrderId, setActiveQrOrderId] = useState(null);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [locationError, setLocationError] = useState(null);
  const [simulateGps, setSimulateGps] = useState(false);
  const locationInterval = useRef(null);
  const locSocketRef = useRef(null);

  const loadOrders = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [availRes, mineRes] = await Promise.all([
        api.get('delivery/orders/available'),
        api.get('delivery/orders/mine')
      ]);
      setAvailableOrders(availRes.data.orders);
      setMyOrders(mineRes.data.orders);
    } catch (e) {
      setError(e?.message ?? 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    
    // Connect location socket
    locSocketRef.current = io(import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '') : 'http://localhost:3001');

    return () => {
      if (locSocketRef.current) locSocketRef.current.disconnect();
      if (locationInterval.current) clearInterval(locationInterval.current);
    };
  }, [token]);

  // Start tracking only when they have OUT_FOR_DELIVERY orders
  useEffect(() => {
    const activeDelivery = myOrders.find(o => o.status === 'OUT_FOR_DELIVERY');
    
    if (activeDelivery && !locationInterval.current) {
      let simLat = user?.location?.lat || 28.7041;
      let simLng = user?.location?.lng || 77.1025;
      
      locationInterval.current = setInterval(() => {
        if (simulateGps && activeDelivery.deliveryDetails?.lat) {
          // move 1% closer to destination every 5 seconds
          simLat += (activeDelivery.deliveryDetails.lat - simLat) * 0.05;
          simLng += (activeDelivery.deliveryDetails.lng - simLng) * 0.05;
          setLocationError(null);
          locSocketRef.current?.emit('updateLocation', {
            deliveryManId: user.id,
            lat: simLat,
            lng: simLng
          });
        }
        else if (navigator.geolocation && !simulateGps) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setLocationError(null);
              locSocketRef.current?.emit('updateLocation', {
                deliveryManId: user.id,
                lat: pos.coords.latitude,
                lng: pos.coords.longitude
              });
            },
            (err) => {
              setLocationError('Failed to access actual GPS. Try "Simulate GPS" for demo.');
            }
          );
        }
      }, 5000); // broadcast every 5s
    } else if (!activeDelivery && locationInterval.current) {
      clearInterval(locationInterval.current);
      locationInterval.current = null;
    }
  }, [myOrders, user.id, simulateGps]);

  const acceptOrder = async (orderId) => {
    try {
      await api.post(`delivery/orders/${orderId}/accept`);
      loadOrders();
    } catch (e) {
      alert(e?.message ?? 'Failed to accept order');
    }
  };

  const deliverOrder = async (orderId) => {
    try {
      await api.post(`delivery/orders/${orderId}/deliver`);
      loadOrders();
    } catch (e) {
      alert(e?.message ?? 'Failed to complete order');
    }
  };

  return (

 
   <div className="min-h-screen bg-brand-50">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="font-black text-brand-900">SnapCart Lite • Delivery</div>
            <div className="text-sm text-gray-500 font-semibold">{user?.email}</div>
          </div>
          <button onClick={logout} className="px-4 py-2 rounded-xl bg-gray-100 font-black text-gray-700 hover:bg-gray-200">
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 font-semibold">{error}</div>}
        {locationError && <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl p-3 font-semibold">{locationError}</div>}

        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="text-xl font-black text-gray-900">Your Deliveries</div>
            <button 
              onClick={() => setSimulateGps(!simulateGps)}
              className={`px-3 py-1 text-xs font-black rounded-lg border ${simulateGps ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-gray-100 text-gray-600'}`}
            >
              {simulateGps ? 'Simulating GPS...' : 'Enable Demo GPS'}
            </button>
          </div>
          {myOrders.length === 0 ? (
            <div className="text-gray-500 font-semibold">You have no active deliveries.</div>
          ) : (
            <div className="space-y-3">
              {myOrders.map(o => (
                <React.Fragment key={o.id}>
                  <div className="border border-gray-100 bg-gray-50 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="font-black text-gray-900">Order {o.id.substring(0,8)}</div>
                      <div className="text-sm text-brand-900 font-bold bg-brand-50 inline-block px-2 rounded-md border border-brand-100 mt-1">{o.status}</div>
                      <div className="text-sm text-gray-600 font-semibold mt-2">
                        To: {o.deliveryDetails?.name} • {o.deliveryDetails?.phone}
                      </div>
                      <div className="text-xs text-gray-500">{o.deliveryDetails?.address}</div>
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setActiveQrOrderId(activeQrOrderId === o.id ? null : o.id)}
                          className="flex-1 px-4 py-2 rounded-xl bg-gray-100 text-gray-800 border border-gray-200 font-black hover:bg-gray-200 text-sm"
                        >
                          {activeQrOrderId === o.id ? 'Hide QR' : 'Payment QR'}
                        </button>
                        <button
                          onClick={() => setActiveChatOrderId(activeChatOrderId === o.id ? null : o.id)}
                          className="flex-1 px-4 py-2 rounded-xl bg-brand-50 text-brand-900 border border-brand-100 font-black hover:bg-brand-100 text-sm"
                        >
                          {activeChatOrderId === o.id ? 'Close Chat' : 'Help'}
                        </button>
                      </div>
                      {o.status === 'OUT_FOR_DELIVERY' && (
                        <button onClick={() => deliverOrder(o.id)} className="px-6 py-3 rounded-xl bg-green-600 text-white font-black hover:bg-green-700 mt-1">
                          Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                  {activeQrOrderId === o.id && (
                    <div className="mt-4 mx-4 p-6 bg-white border border-gray-100 rounded-xl shadow-inner flex flex-col items-center justify-center">
                      <div className="text-gray-900 font-black mb-1">UPI Payment Code</div>
                      <div className="text-xs text-gray-500 font-bold mb-4">Total: ₹{o.totalAmount}</div>
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&margin=10&data=${encodeURIComponent(`upi://pay?pa=shopowner@upi&pn=Local%20Delivery&am=${o.totalAmount}&cu=INR`)}`} 
                        alt="Payment QR"
                        className="rounded-xl border border-gray-100 shadow-sm"
                      />
                      <div className="text-[10px] text-gray-400 mt-4 text-center">Scan with any UPI app to pay directly.</div>
                    </div>
                  )}
                  {activeChatOrderId === o.id && (
                    <DeliveryOrderChat orderId={o.id} user={user} />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="text-xl font-black text-gray-900">Available Orders</div>
            <button onClick={loadOrders} disabled={loading} className="px-3 py-1 bg-brand-50 text-brand-900 font-bold rounded-lg border border-brand-100">
              Refresh
            </button>
          </div>
          {availableOrders.length === 0 ? (
            <div className="text-gray-500 font-semibold">No orders waiting for delivery right now.</div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {availableOrders.map(o => (
                <div key={o.id} className="border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="font-black text-gray-900">Order {o.id.substring(0,8)}</div>
                  <div className="text-xs text-gray-500 mb-2">{o.deliveryDetails?.address}</div>
                  <div className="text-sm font-bold text-brand-900 mb-3">Payout: ₹40.00</div>
                  <button onClick={() => acceptOrder(o.id)} className="w-full px-4 py-2 rounded-xl bg-brand-900 text-white font-black hover:bg-brand-500">
                    Accept Delivery
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
