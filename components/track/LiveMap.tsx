
'use client';

// @ts-nocheck
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon path issues with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Markers
const kitchenIcon = new L.DivIcon({
  html: `
    <div class="relative flex items-center justify-center w-8 h-8">
      <div class="bg-surface-container-lowest p-2 rounded-full shadow-lg border-2 border-primary-container z-10 flex items-center bg-white justify-center">
        <span class="material-symbols-outlined text-primary text-xl" style="font-variation-settings: 'FILL' 1;">restaurant</span>
      </div>
    </div>
  `,
  className: 'bg-transparent',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const customerIcon = new L.DivIcon({
  html: `
    <div class="relative flex items-center justify-center w-8 h-8">
      <div class="bg-primary p-2 rounded-full shadow-lg border-2 border-surface z-10 flex items-center justify-center">
        <span class="material-symbols-outlined text-white text-xl" style="font-variation-settings: 'FILL' 1;">person_pin_circle</span>
      </div>
    </div>
  `,
  className: 'bg-transparent',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const courierIcon = new L.DivIcon({
  html: `
    <div class="relative flex items-center justify-center w-8 h-8">
      <div class="absolute inset-0 bg-[#FD712F] rounded-full opacity-40 animate-ping"></div>
      <div class="bg-secondary-container p-2 rounded-full shadow-2xl z-10 flex items-center justify-center">
        <span class="material-symbols-outlined text-white text-lg" style="font-variation-settings: 'FILL' 1;">directions_bike</span>
      </div>
    </div>
  `,
  className: 'bg-transparent',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

function MapController({ bounds, route }: { bounds: L.LatLngBounds | null; route: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [bounds, map, route]);
  return null;
}

interface LiveMapProps {
  orderStatus: string;
  deliveryAddress: string;
}

export default function LiveMap({ orderStatus, deliveryAddress }: LiveMapProps) {
  const [kitchenPos, setKitchenPos] = useState<[number, number]>([8.8471, 7.8776]); // Keffi, Nasarawa Default
  const [customerPos, setCustomerPos] = useState<[number, number] | null>(null);
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);

  const isDispatched = orderStatus === 'dispatched';
  const isDelivered = orderStatus === 'delivered';
  const isPreparing = ['pending', 'confirmed', 'preparing', 'ready_for_pickup'].includes(orderStatus);

  useEffect(() => {
    const fetchCoordsAndRoute = async () => {
      try {
        // 1. Geocode Customer Address
        // Append context to improve reliability
        const searchQuery = encodeURIComponent(`${deliveryAddress}, Keffi, Nigeria`);
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${searchQuery}&limit=1`);
        const geoData = await geoRes.json();

        let destination: [number, number] | null = null;
        if (geoData && geoData.length > 0) {
          destination = [parseFloat(geoData[0].lat), parseFloat(geoData[0].lon)];
          setCustomerPos(destination);
        } else {
          // Fallback if not found: offset from kitchen slightly just to show something local
          destination = [kitchenPos[0] - 0.005, kitchenPos[1] - 0.005];
          setCustomerPos(destination);
        }

        // 2. Fetch OSRM Route Geometry
        const osrmRes = await fetch(`https://router.project-osrm.org/route/v1/driving/${kitchenPos[1]},${kitchenPos[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`);
        const osrmData = await osrmRes.json();

        if (osrmData.routes && osrmData.routes.length > 0) {
          // OSRM returns GeoJSON coordinates as [lng, lat], we need [lat, lng] for Leaflet
          const coordinates = osrmData.routes[0].geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]) as [number, number][];
          setRouteCoords(coordinates);

          // Calculate Bounds based on route
          const latLngs = coordinates.map((c) => L.latLng(c[0], c[1]));
          const routeBounds = L.latLngBounds(latLngs);
          setBounds(routeBounds);
        } else {
          // Fallback route line
          setRouteCoords([kitchenPos, destination]);
          setBounds(L.latLngBounds([kitchenPos, destination]));
        }

      } catch (error) {
        console.error('Map routing error:', error);
      }
    };

    if (deliveryAddress) {
      fetchCoordsAndRoute();
    }
  }, [deliveryAddress, kitchenPos]);

  // Determine Courier position based on status
  // If active delivery, place it midway. If delivered, place it at destination. Otherwise at kitchen.
  let courierPos: [number, number] = kitchenPos;
  if (isDelivered && customerPos) {
    courierPos = customerPos;
  } else if (isDispatched && routeCoords.length > 0) {
    // Pick the middle coordinate of the route to simulate being halfway there
    const midIndex = Math.floor(routeCoords.length / 2);
    courierPos = routeCoords[midIndex];
  }

  return (
    <MapContainer
      center={kitchenPos}
      zoom={14}
      zoomControl={false}
      attributionControl={false}
      className="w-full h-full z-0"
    >
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
      />
      <MapController bounds={bounds} route={routeCoords} />

      {/* Route SVG Polyline */}
      {routeCoords.length > 0 && (
        <Polyline positions={routeCoords} color="#FD712F" weight={4} dashArray="8, 8" opacity={0.8} />
      )}

      {/* Markers */}
      <Marker position={kitchenPos} icon={kitchenIcon} />
      {customerPos && <Marker position={customerPos} icon={customerIcon} />}

      {/* Animated Courier Marker */}
      {(isDispatched || isDelivered) && customerPos && (
        <Marker position={courierPos} icon={courierIcon} />
      )}
    </MapContainer>
  );
}
