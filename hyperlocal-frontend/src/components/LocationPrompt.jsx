import React, { useState, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useAuthStore } from '../store/useAuthStore';

// Fix typical react-leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function LocationSelector({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : <Marker position={position}></Marker>;
}

export function LocationPrompt({ onComplete }) {
  const { updateLocation } = useAuthStore();
  const [position, setPosition] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const defaultCenter = [28.7041, 77.1025]; // Delhi

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!position && !address.trim()) {
      setError('Please select a location on the map or type an address.');
      return;
    }
    
    setError(null);
    setLoading(true);
    try {
      const lat = position ? position.lat : defaultCenter[0];
      const lng = position ? position.lng : defaultCenter[1];
      
      await updateLocation(lat, lng, address);
      if (onComplete) onComplete();
    } catch (err) {
      setError(err?.message || 'Failed to update location');
      setLoading(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setError("Location access denied or unavailable.")
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-lg border border-gray-100 max-w-xl w-full overflow-hidden flex flex-col max-h-screen">
        <div className="p-6 pb-2">
          <div className="text-2xl font-black text-gray-900">Set your location</div>
          <div className="text-sm font-semibold text-gray-500 mt-1">
            We need your location to show relevant stores and manage delivery effectively.
          </div>
        </div>

        <div className="flex-1 w-full relative z-0 mt-4" style={{ height: '300px', minHeight: '300px' }}>
          <MapContainer center={defaultCenter} zoom={12} scrollWheelZoom={true} style={{ height: '100%', width: '100%', position: 'absolute', inset: 0 }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationSelector position={position} setPosition={setPosition} />
          </MapContainer>
        </div>

        <div className="p-6 pt-4 flex flex-col gap-4 bg-gray-50">
          <div className="flex justify-between items-center relative z-10">
            <button 
              type="button"
              onClick={handleGetCurrentLocation}
              className="px-4 py-2 bg-brand-100 text-brand-900 font-bold rounded-xl text-xs hover:bg-brand-200 transition-colors"
            >
              ⌖ My current location
            </button>
            <span className="text-xs font-semibold text-gray-500">
              {position ? `Selected: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : 'Click map to drop pin'}
            </span>
          </div>

          <div>
            <label className="text-xs font-black text-gray-700">Manual Address (Optional)</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 1st block, Main street"
              className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {error && <div className="text-sm text-red-600 font-semibold">{error}</div>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full rounded-2xl bg-brand-900 text-white font-black py-3 hover:bg-brand-500 disabled:opacity-60 mt-1"
          >
            {loading ? 'Saving...' : 'Confirm Location'}
          </button>
        </div>
      </div>
    </div>
  );
}
