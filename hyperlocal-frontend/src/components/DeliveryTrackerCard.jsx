import React, { useEffect, useMemo, useState } from 'react';

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function DeliveryTrackerCard() {
  const start = { x: 40, y: 120 };
  const mid1 = { x: 140, y: 60 };
  const mid2 = { x: 230, y: 140 };
  const end = { x: 320, y: 90 };

  const [t, setT] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setT((prev) => (prev >= 1 ? 0 : Math.min(1, prev + 0.01)));
    }, 120);
    return () => clearInterval(id);
  }, []);

  const rider = useMemo(() => {
    if (t < 0.33) {
      const tt = t / 0.33;
      return { x: lerp(start.x, mid1.x, tt), y: lerp(start.y, mid1.y, tt) };
    }
    if (t < 0.66) {
      const tt = (t - 0.33) / 0.33;
      return { x: lerp(mid1.x, mid2.x, tt), y: lerp(mid1.y, mid2.y, tt) };
    }
    const tt = (t - 0.66) / 0.34;
    return { x: lerp(mid2.x, end.x, tt), y: lerp(mid2.y, end.y, tt) };
  }, [t]);

  const etaMin = Math.max(1, Math.round((1 - t) * 18));

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-gray-500">Live delivery</div>
          <div className="text-lg font-black text-gray-900">Delivery boy en route</div>
          <div className="text-sm font-semibold text-gray-600 mt-1">
            ETA: <span className="font-black text-brand-900">{etaMin} min</span>
          </div>
        </div>
        <div className="text-xs font-black px-3 py-1.5 rounded-full bg-brand-50 text-brand-900 border border-brand-100">
          {Math.round(t * 100)}% done
        </div>
      </div>

      <div className="px-5 pb-5">
        <div className="rounded-2xl bg-brand-50 border border-brand-100 overflow-hidden">
          <svg viewBox="0 0 360 180" className="w-full h-44">
            <path
              d="M20 150 C 80 120, 120 40, 170 70 S 260 160, 340 95"
              fill="none"
              stroke="#0F172A"
              strokeOpacity="0.12"
              strokeWidth="14"
              strokeLinecap="round"
            />
            <path
              d="M20 150 C 80 120, 120 40, 170 70 S 260 160, 340 95"
              fill="none"
              stroke="#16A34A"
              strokeOpacity="0.25"
              strokeWidth="6"
              strokeLinecap="round"
            />

            <circle cx={start.x} cy={start.y} r="10" fill="#16A34A" />
            <text x={start.x + 14} y={start.y + 4} fontSize="12" fill="#0F172A" opacity="0.7">
              Shop
            </text>

            <circle cx={end.x} cy={end.y} r="10" fill="#0F172A" opacity="0.8" />
            <text x={end.x + 14} y={end.y + 4} fontSize="12" fill="#0F172A" opacity="0.7">
              Home
            </text>

            <g transform={`translate(${rider.x}, ${rider.y})`}>
              <circle r="12" fill="#16A34A" />
              <circle r="6" fill="#F0FDF4" />
            </g>
          </svg>
        </div>

        <div className="mt-3 text-xs font-semibold text-gray-500">
          Current location updates are simulated for the demo (fake map).
        </div>
      </div>
    </div>
  );
}
