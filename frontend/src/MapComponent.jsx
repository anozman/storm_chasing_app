import React, { useEffect, useRef } from "react";
import L from "leaflet"; // Import Leaflet
import "leaflet/dist/leaflet.css"; // Import Leaflet's styles

const MapComponent = ({ center = [35.4676, -97.5164], zoom = 13, overlays = [] }) => {
  const mapRef = useRef(null); // Reference for the map container

  useEffect(() => {
    // Initialize the map
    const map = L.map(mapRef.current).setView(center, zoom);

    // Add a tile layer (OpenStreetMap as the provider)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    // Add overlays to the map (if any)
    overlays.forEach((overlay) => {
      L.geoJSON(overlay.data, { style: overlay.style }).addTo(map);
    });

    // Cleanup on component unmount
    return () => {
      map.remove();
    };
  }, [center, zoom, overlays]);

  return (
    <div
    id = 'map-container'
      ref={mapRef}
      style={{
        height: "800px", // Adjust height as needed
        width: "100%", // Full width of the container
      }}
    ></div>
  );
};

export default MapComponent;
