import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet's default icon issue
const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export type AddressData = {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
};

type Props = {
    position?: [number, number]; // [lat, lng]
    onLocationSelect: (lat: number, lon: number, address?: AddressData) => void;
};

// Reverse geocoding using OpenStreetMap Nominatim API
const reverseGeocode = async (lat: number, lng: number): Promise<AddressData | null> => {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
            {
                headers: {
                    'Accept-Language': 'en',
                    'User-Agent': 'HotelBookingApp/1.0'
                }
            }
        );
        const data = await response.json();

        if (data && data.address) {
            const addr = data.address;
            return {
                street: addr.road || addr.residential || addr.neighbourhood || '',
                city: addr.city || addr.town || addr.village || addr.municipality || '',
                state: addr.state || addr.region || '',
                country: addr.country || '',
                zipCode: addr.postcode || ''
            };
        }
        return null;
    } catch (error) {
        console.error('Reverse geocoding failed:', error);
        return null;
    }
};

const LocationPicker = ({ position, onLocationSelect }: Props) => {
    const mapRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Default to New Delhi, India if no position
    const defaultPosition: [number, number] = [28.6139, 77.2090];
    const center = position || defaultPosition;

    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        // Initialize map
        const map = L.map(containerRef.current).setView(center, 13);
        mapRef.current = map;

        // Add tile layer with a nicer style
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);

        // Add initial marker if position exists
        if (position) {
            markerRef.current = L.marker(position).addTo(map);
        }

        // Handle click events
        map.on("click", async (e: L.LeafletMouseEvent) => {
            const { lat, lng } = e.latlng;

            // Update or create marker
            if (markerRef.current) {
                markerRef.current.setLatLng([lat, lng]);
            } else {
                markerRef.current = L.marker([lat, lng]).addTo(map);
            }

            // Reverse geocode to get address
            setIsLoading(true);
            const address = await reverseGeocode(lat, lng);
            setIsLoading(false);

            onLocationSelect(lat, lng, address || undefined);
        });

        // Cleanup
        return () => {
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, []);

    // Update marker when position prop changes
    useEffect(() => {
        if (!mapRef.current) return;

        if (position) {
            if (markerRef.current) {
                markerRef.current.setLatLng(position);
            } else {
                markerRef.current = L.marker(position).addTo(mapRef.current);
            }
            mapRef.current.setView(position, mapRef.current.getZoom());
        }
    }, [position]);

    return (
        <div className="relative">
            <div
                ref={containerRef}
                className="h-[400px] w-full rounded-xl overflow-hidden shadow-lg border-2 border-gray-200"
                style={{ height: "400px", width: "100%" }}
            />
            {isLoading && (
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-xl">
                    <div className="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                        <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        <span className="text-gray-700 font-medium">Getting address...</span>
                    </div>
                </div>
            )}
            <p className="mt-2 text-sm text-gray-500 text-center">
                📍 Click on the map to select your property location
            </p>
        </div>
    );
};

export default LocationPicker;
