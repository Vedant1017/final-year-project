import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';

const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const shopIcon = DefaultIcon;
const homeIcon = DefaultIcon;

const riderIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:18px;height:18px;border-radius:999px;
    background:#16A34A;border:3px solid #F0FDF4;
    box-shadow:0 6px 14px rgba(0,0,0,0.18);
  "></div>`,
  iconSize: [18, 18],
  iconAnchor: [9, 9]
});

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpLatLng(a, b, t) {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}

export function LiveMapDelivery() {
  const shops = useMemo(
    () => [
      { id: 's1', name: 'Fresh Mart', pos: [12.9722, 77.595] },
      { id: 's2', name: 'Green Valley Store', pos: [12.9686, 77.6096] },
      { id: 's3', name: 'City Supermarket', pos: [12.9785, 77.5726] },
      { id: 's4', name: 'Local Organic Grocers', pos: [12.9592, 77.5906] },
      { id: 's5', name: 'Daily Needs Hub', pos: [12.9851, 77.6046] }
    ],
    []
  );

  const home = useMemo(() => ({ name: 'Home (destination)', pos: [12.9719, 77.615] }), []);

  const [activeShopId, setActiveShopId] = useState(shops[0].id);
  const activeShop = shops.find((s) => s.id === activeShopId) ?? shops[0];

  const route = useMemo(() => {
    const a = activeShop.pos;
    const b = home.pos;
    const mid1 = [lerp(a[0], b[0], 0.35) + 0.0025, lerp(a[1], b[1], 0.35) - 0.0018];
    const mid2 = [lerp(a[0], b[0], 0.7) - 0.0018, lerp(a[1], b[1], 0.7) + 0.0022];
    return [a, mid1, mid2, b];
  }, [activeShopId, activeShop, home]);

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
  }, [activeShopId]);

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => (p >= 1 ? 1 : Math.min(1, p + 0.005)));
    }, 150);
    return () => clearInterval(id);
  }, []);

  const riderPos = useMemo(() => {
    const segCount = route.length - 1;
    const scaled = progress * segCount;
    const idx = Math.min(segCount - 1, Math.floor(scaled));
    const t = scaled - idx;
    return lerpLatLng(route[idx], route[idx + 1], t);
  }, [route, progress]);

  const etaMin = Math.max(1, Math.round((1 - progress) * 18));

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-gray-500">Real-time map (simulated)</div>
          <div className="text-lg font-black text-gray-900">Delivery in progress</div>
          <div className="text-sm font-semibold text-gray-600 mt-1">
            From <span className="font-black text-brand-900">{activeShop.name}</span> →{' '}
            <span className="font-black text-gray-900">Home</span> • ETA{' '}
            <span className="font-black text-brand-900">{etaMin} min</span>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {shops.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveShopId(s.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-black border ${
                s.id === activeShopId ? 'bg-brand-900 text-white border-brand-900' : 'bg-brand-50 text-brand-900 border-brand-100'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      <div className="h-72 md:h-80">
        <MapContainer center={home.pos} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <Polyline pathOptions={{ color: '#16A34A', weight: 5, opacity: 0.6 }} positions={route} />

          <Marker position={activeShop.pos} icon={shopIcon}>
            <Popup>{activeShop.name}</Popup>
          </Marker>

          <Marker position={home.pos} icon={homeIcon}>
            <Popup>{home.name}</Popup>
          </Marker>

          <Marker position={riderPos} icon={riderIcon}>
            <Popup>Delivery boy (live)</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}
