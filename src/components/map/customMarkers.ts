import L from 'leaflet';
import { OrderPriority } from '../../types';

export function createDepotIcon(name: string): L.DivIcon {
  return L.divIcon({
    className: 'custom-depot-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-10 h-10 bg-[#168E6A] text-white rounded-2xl flex items-center justify-center shadow-lg border-2 border-white">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-[#FBB03B]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -20],
  });
}

export function createStopIcon(
  stopNumber: number,
  priority: OrderPriority,
  isCompleted: boolean,
  isLocked: boolean,
  isLate: boolean
): L.DivIcon {
  let bgColor = 'bg-[#168E6A] text-white';
  let borderColor = 'border-white';

  if (isCompleted) {
    bgColor = 'bg-[#168E6A] text-white';
    borderColor = 'border-white';
  } else if (isLate) {
    bgColor = 'bg-rose-600 text-white';
    borderColor = 'border-rose-200';
  } else if (priority === 'critical' || priority === 'high') {
    bgColor = 'bg-[#FBB03B] text-[#292D32]';
    borderColor = 'border-white';
  } else {
    bgColor = 'bg-[#168E6A] text-white';
    borderColor = 'border-white';
  }

  const lockBadge = isLocked
    ? `<div class="absolute -top-1 -right-1 w-4 h-4 bg-[#FBB03B] text-[#292D32] rounded-full flex items-center justify-center text-[9px] font-bold shadow border border-white">🔒</div>`
    : '';

  const content = isCompleted
    ? `<svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
    : `<span class="text-xs font-black">${stopNumber}</span>`;

  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div class="relative flex items-center justify-center transition-transform hover:scale-110">
        <div class="w-7 h-7 ${bgColor} ${borderColor} border-2 rounded-full flex items-center justify-center shadow-md">
          ${content}
        </div>
        ${lockBadge}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

export function createDriverIcon(): L.DivIcon {
  return L.divIcon({
    className: 'custom-driver-marker',
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-9 h-9 bg-[#FBB03B] text-[#292D32] rounded-full flex items-center justify-center shadow-lg border-2 border-white driver-marker-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <path d="M9 17h6"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  });
}
