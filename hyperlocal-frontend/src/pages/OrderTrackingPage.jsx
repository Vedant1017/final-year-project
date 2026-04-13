import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import io from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

const riderIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#16A34A;border:3px solid #fff;box-shadow:0 0 10px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const homeIcon = L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#0F172A;border:3px solid #fff;box-shadow:0 0 10px rgba(0,0,0,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

export function OrderTrackingPage() {
  const { id } = useParams();
  const { user } = useAuthStore();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Map state
  const [riderPos, setRiderPos] = useState(null);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await api.get(`/checkout/orders/${id}`);
        setOrder(data.order);
        if (data.order.chats) {
          setMessages(data.order.chats);
        }
      } catch (e) {
        setError(e?.message ?? 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  useEffect(() => {
    if (!order) return;

    // Chat socket
    const chatSocket = io(import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '') : 'http://localhost:3001');
    chatSocket.emit('joinOrderChat', order.id);
    chatSocket.on('newMessage', (msg) => {
      if (msg.orderId === order.id) {
        setMessages((prev) => [...prev, msg]);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    });

    // Location socket
    let locSocket;
    if (order.status === 'OUT_FOR_DELIVERY' && order.deliveryManId) {
      locSocket = io(import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '') : 'http://localhost:3001');
      locSocket.emit('watchDelivery', order.deliveryManId);
      locSocket.on('locationUpdate', (data) => {
        if (data.deliveryManId === order.deliveryManId) {
          setRiderPos([data.lat, data.lng]);
        }
      });
    }

    return () => {
      chatSocket.disconnect();
      if (locSocket) locSocket.disconnect();
    };
  }, [order]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !order) return;
    
    const chatSocket = io(import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace('/api/v1', '') : 'http://localhost:3001');
    chatSocket.emit('sendMessage', {
      orderId: order.id,
      senderId: user.id,
      senderRole: user.role,
      text: newMessage
    });
    setNewMessage('');
    setTimeout(() => chatSocket.disconnect(), 1000);
  };

  if (loading) return <div className="p-10 text-center font-bold text-gray-500">Loading Order Tracking...</div>;
  if (error) return <div className="p-10 text-center font-bold text-red-600">{error}</div>;
  if (!order) return null;

  const statusColors = {
    PENDING_PAYMENT: 'bg-gray-100 text-gray-800',
    PAID: 'bg-blue-100 text-blue-800',
    PACKING: 'bg-amber-100 text-amber-800',
    OUT_FOR_DELIVERY: 'bg-indigo-100 text-indigo-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800'
  };

  const hasMap = order.status === 'OUT_FOR_DELIVERY' && order.deliveryDetails?.lat && order.deliveryDetails?.lng;
  const destinationPos = order.deliveryDetails?.lat ? [order.deliveryDetails.lat, order.deliveryDetails.lng] : null;

  return (
    <div className="min-h-screen bg-brand-50 pb-20">
      <header className="bg-white border-b border-gray-100 p-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/customer" className="font-black text-brand-900">← Back</Link>
          <div className="text-sm font-bold text-gray-700">Track Order</div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Order Info */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-xs text-gray-500 font-semibold mb-1">Order ID: {order.id}</div>
              <div className={`inline-flex px-3 py-1 rounded-full text-xs font-black ${statusColors[order.status]}`}>
                {order.status.replace(/_/g, ' ')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 font-semibold">Total</div>
              <div className="text-xl font-black text-gray-900">₹{order.totalAmount}</div>
            </div>
          </div>
        </div>

        {/* Live Map */}
        {order.status === 'OUT_FOR_DELIVERY' && (
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div className="font-black text-gray-900 text-lg mb-4 flex justify-between items-center">
              <span>Live tracking</span>
              {riderPos ? <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md animate-pulse">Rider connected</span> : <span className="text-xs text-gray-500">Waiting for GPS...</span>}
            </div>
            {hasMap && (
              <div className="h-64 rounded-2xl overflow-hidden border border-gray-100 relative z-0">
                <MapContainer center={destinationPos} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={destinationPos} icon={homeIcon}>
                    <Popup>Delivery Address</Popup>
                  </Marker>
                  {riderPos && (
                    <Marker position={riderPos} icon={riderIcon}>
                      <Popup>Delivery Man</Popup>
                    </Marker>
                  )}
                  {riderPos && destinationPos && (
                    <Polyline positions={[riderPos, destinationPos]} color="#16A34A" dashArray="5, 10" />
                  )}
                </MapContainer>
              </div>
            )}
          </div>
        )}

        {/* Chat Component */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col h-96">
          <div className="p-4 border-b border-gray-100 font-black text-gray-900 shadow-sm">
            Support Chat
          </div>
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 text-xs font-semibold py-10">No messages yet. Send a message to the store owner!</div>
            ) : (
              messages.map((m, idx) => {
                const isMe = m.senderId === user.id;
                return (
                  <div key={idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] p-3 rounded-2xl text-sm font-semibold shadow-sm ${isMe ? 'bg-brand-900 text-white rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}>
                      {m.text}
                      <div className={`text-[10px] mt-1 ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {m.senderRole}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>
          <form className="p-3 border-t border-gray-100 bg-white flex gap-2 rounded-b-3xl" onSubmit={sendMessage}>
            <input
              className="flex-1 rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Ask for help..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button type="submit" className="bg-brand-900 text-white px-4 py-2 rounded-xl font-black text-sm hover:bg-brand-500 transition-colors">
              Send
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
