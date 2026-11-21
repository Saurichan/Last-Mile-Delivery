import React, { useEffect, useState, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useStore } from '../../store/useStore';
import { createDepotIcon, createStopIcon, createDriverIcon } from './customMarkers';
import { Order, RouteStop } from '../../types';
import {
  Lock,
  Unlock,
  Phone,
  Clock,
  MapPin,
} from 'lucide-react';

interface DeliveryMapProps {
  interactive?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  showOriginalRoute?: boolean;
}

// Helper component to auto-fit map view to valid points
function MapController({
  points,
  recenterTrigger,
}: {
  points: [number, number][];
  recenterTrigger: number;
}) {
  const map = useMap();

  useEffect(() => {
    const validPoints = points.filter(
      (p) =>
        Array.isArray(p) &&
        p.length === 2 &&
        typeof p[0] === 'number' &&
        !isNaN(p[0]) &&
        typeof p[1] === 'number' &&
        !isNaN(p[1])
    );

    if (validPoints.length === 0) return;

    try {
      if (validPoints.length === 1) {
        map.setView(validPoints[0], 14, { animate: true });
      } else {
        const bounds = L.latLngBounds(validPoints);
        if (bounds.isValid()) {
          map.fitBounds(bounds, {
            padding: [45, 45],
            maxZoom: 15,
            animate: true,
          });
        }
      }
    } catch (e) {
      console.warn('Leaflet fitBounds error handled gracefully:', e);
    }
  }, [points, recenterTrigger, map]);

  return null;
}

// Click listener inside Leaflet container
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export const DeliveryMap: React.FC<DeliveryMapProps> = ({
  interactive = true,
  onMapClick,
  showOriginalRoute = true,
}) => {
  const {
    business,
    orders,
    currentRoutePlan,
    toggleLockStop,
    updateOrder,
    driverSim,
  } = useStore();

  const [recenterCounter, setRecenterCounter] = useState(0);

  // Derive points for auto-fit bounds
  const mapPoints: [number, number][] = useMemo(() => {
    const pts: [number, number][] = [];
    if (business?.depot && typeof business.depot.lat === 'number') {
      pts.push([business.depot.lat, business.depot.lng]);
    }
    orders.forEach((o) => {
      if (o?.customer && typeof o.customer.lat === 'number') {
        pts.push([o.customer.lat, o.customer.lng]);
      }
    });
    return pts;
  }, [business, orders]);

  const defaultCenter: [number, number] = useMemo(() => {
    if (business?.depot?.lat && business?.depot?.lng) {
      return [business.depot.lat, business.depot.lng];
    }
    return [13.3409, 77.1012]; // Tumakuru default coordinates
  }, [business]);

  return (
    <div className="relative w-full h-full min-h-[280px] rounded-3xl overflow-hidden shadow-subtle border border-[#EAECEA] dark:border-[#495059] font-sans">
      <MapContainer
        key={`${defaultCenter[0].toFixed(4)}-${defaultCenter[1].toFixed(4)}`}
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={interactive}
        dragging={interactive}
        touchZoom={interactive}
        doubleClickZoom={interactive}
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController points={mapPoints} recenterTrigger={recenterCounter} />

        {onMapClick && <MapClickHandler onMapClick={onMapClick} />}

        {/* 1. Depot Marker */}
        {business?.depot && (
          <Marker
            position={[business.depot.lat, business.depot.lng]}
            icon={createDepotIcon(business.depot.name)}
            zIndexOffset={500}
          >
            <Popup>
              <div className="p-1 space-y-1 text-zinc-900 dark:text-zinc-100 min-w-[180px]">
                <div className="font-extrabold text-xs text-[#168E6A] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{business.depot.name}</span>
                </div>
                <div className="text-[11px] text-[#B4B6B7]">{business.depot.address}</div>
                <div className="text-[10px] text-[#168E6A] font-semibold pt-1">
                  Start & Return Hub • 08:30 AM
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 2. Customer Order Markers */}
        {orders
          .filter((order) => order?.customer && typeof order.customer.lat === 'number' && typeof order.customer.lng === 'number')
          .map((order) => {
          const stopInfo: RouteStop | undefined = currentRoutePlan?.stops.find(
            (s) => s.orderId === order.id
          );
          const stopNum = stopInfo ? stopInfo.stopIndex : orders.indexOf(order) + 1;
          const isLocked = !!order.isLocked;
          const isCompleted = order.status === 'delivered';
          const isLate = !!stopInfo?.isLate;

          return (
            <Marker
              key={order.id}
              position={[order.customer.lat, order.customer.lng]}
              icon={createStopIcon(
                stopNum,
                order.priority,
                isCompleted,
                isLocked,
                isLate
              )}
              draggable={interactive}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target;
                  const pos = marker.getLatLng();
                  updateOrder(order.id, {
                    customer: {
                      ...order.customer,
                      lat: pos.lat,
                      lng: pos.lng,
                    },
                  });
                },
              }}
            >
              <Popup>
                <div className="p-1 space-y-2 text-zinc-900 dark:text-zinc-100 min-w-[210px] text-xs">
                  <div className="flex items-center justify-between border-b border-[#EAECEA] dark:border-[#495059] pb-1">
                    <span className="font-bold text-[#292D32] dark:text-white">
                      Stop #{stopNum} • {order.orderNumber}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        order.priority === 'critical' || order.priority === 'high'
                          ? 'bg-[#FFF7EB] text-[#C47D1A]'
                          : 'bg-[#E8F6F1] text-[#168E6A]'
                      }`}
                    >
                      {order.priority}
                    </span>
                  </div>

                  <div>
                    <div className="font-semibold text-xs text-[#292D32] dark:text-white">{order.customer.name}</div>
                    <div className="text-[11px] text-[#B4B6B7]">{order.customer.address}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[11px] text-[#B4B6B7] bg-[#F7F8F7] dark:bg-[#292D32] p-1.5 rounded-xl">
                    <div>
                      <span className="text-[10px] text-[#B4B6B7] block">Weight:</span>
                      <span className="font-semibold text-[#292D32] dark:text-white">{order.weightKg} kg</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#B4B6B7] block">Window:</span>
                      <span className="font-semibold text-[#292D32] dark:text-white">
                        {order.timeWindow ? `${order.timeWindow.start}-${order.timeWindow.end}` : 'Flexible'}
                      </span>
                    </div>
                  </div>

                  {stopInfo && (
                    <div className="flex items-center justify-between text-xs text-[#168E6A] font-bold">
                      <span>Est. Arrival:</span>
                      <span>{stopInfo.estimatedArrival}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 gap-2">
                    <button
                      onClick={() => toggleLockStop(order.id)}
                      className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-xl bg-[#F7F8F7] dark:bg-[#292D32] border border-[#EAECEA] dark:border-[#495059] text-zinc-800 dark:text-zinc-200"
                    >
                      {isLocked ? <Lock className="w-3 h-3 text-[#FBB03B]" /> : <Unlock className="w-3 h-3 text-[#B4B6B7]" />}
                      <span>{isLocked ? 'Locked' : 'Lock Stop'}</span>
                    </button>

                    <a
                      href={`tel:${order.customer.phone}`}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1 bg-[#168E6A] text-white font-bold rounded-xl shadow-xs"
                    >
                      <Phone className="w-3 h-3" />
                      Call
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* 3. Original Route Line (Dashed) */}
        {showOriginalRoute && currentRoutePlan?.originalRoadGeometry && (
          <Polyline
            positions={currentRoutePlan.originalRoadGeometry}
            pathOptions={{
              color: '#B4B6B7',
              weight: 2.5,
              dashArray: '5, 8',
              opacity: 0.7,
            }}
          />
        )}

        {/* 4. Optimized Route Line (Primary Green #168E6A) */}
        {currentRoutePlan?.roadGeometry && (
          <Polyline
            positions={currentRoutePlan.roadGeometry}
            pathOptions={{
              color: '#168E6A',
              weight: 4.5,
              opacity: 0.95,
              lineJoin: 'round',
            }}
          />
        )}

        {/* 5. Live Simulated Driver Marker */}
        {(driverSim.isPlaying || driverSim.progressPercent > 0) && (
          <Marker
            position={[driverSim.currentLat, driverSim.currentLng]}
            icon={createDriverIcon()}
            zIndexOffset={1000}
          >
            <Popup>
              <div className="p-1 text-xs space-y-1">
                <div className="font-bold text-[#168E6A] flex items-center gap-1">
                  <span>🛵</span> COURIER IN TRANSIT
                </div>
                <div>Status: <strong className="text-[#168E6A]">En Route</strong></div>
                <div>Progress: <strong>{Math.round(driverSim.progressPercent)}%</strong></div>
                <div>Next: <strong>Stop #{driverSim.currentStopIndex + 1}</strong></div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Map Recenter Button */}
      <div className="absolute top-3 right-3 z-[400]">
        <button
          onClick={() => setRecenterCounter((c) => c + 1)}
          className="p-2 bg-white/95 dark:bg-[#33383F]/95 hover:bg-white text-zinc-700 dark:text-zinc-200 rounded-2xl shadow-subtle border border-[#EAECEA] dark:border-[#495059] backdrop-blur transition"
          title="Recenter Map"
        >
          <MapPin className="w-4 h-4 text-[#168E6A]" />
        </button>
      </div>

      {/* Clean Route Legend Overlay */}
      <div className="absolute bottom-3 left-3 z-[400] bg-white/95 dark:bg-[#33383F]/95 border border-[#EAECEA] dark:border-[#495059] backdrop-blur rounded-2xl px-3 py-2 text-[11px] text-[#292D32] dark:text-zinc-200 shadow-subtle space-y-1">
        <div className="flex items-center gap-2">
          <span className="w-3 h-1.5 bg-[#168E6A] rounded"></span>
          <span className="font-bold">Optimized Route</span>
        </div>
        {showOriginalRoute && currentRoutePlan?.originalRoadGeometry && (
          <div className="flex items-center gap-2">
            <span className="w-3 h-0.5 border-b-2 border-dashed border-[#B4B6B7]"></span>
            <span className="text-[#B4B6B7]">Manual Sequence</span>
          </div>
        )}
      </div>
    </div>
  );
};
