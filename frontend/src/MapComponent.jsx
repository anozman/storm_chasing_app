import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.heat"; // ✅ Ensure leaflet.heat is properly imported

// ✅ Global variable for the Leaflet map instance
let mapInstance = null;

const MapComponent = ({ center = [35.4676, -97.5164], zoom = 13, radarData = null, opacity = 0.8 }) => {
  const mapRef = useRef(null);
  const heatLayerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // ✅ Create the map only once
    if (!mapInstance) {
      mapInstance = L.map(mapRef.current).setView(center, zoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstance);
    } else {
      // ✅ Update center/zoom dynamically
      mapInstance.setView(center, zoom);
    }

    return () => {
      // ✅ Do NOT remove the map on unmount; keep it persistent
    };
  }, [center, zoom]);

  useEffect(() => {
    if (!radarData || !radarData.latitude || !radarData.longitude || !radarData.values) return;
    if (!mapInstance) return;
  
    // ✅ Remove previous heatmap
    if (heatLayerRef.current) {
      mapInstance.removeLayer(heatLayerRef.current);
    }
  
    // ✅ Convert reflectivity (dBZ) to heatmap-friendly values
    const heatmapData = radarData.latitude.map((lat, i) => {
      let value = radarData.values[i];
  
      // Handle invalid values: NaN, Infinity, negative values
      if (!Number.isFinite(value)) value = 0;
      if (value < -30) value = 0; // Ignore unrealistic low values
      if (value > 75) value = 75; // Cap extreme values
  
      // Normalize reflectivity (0 to 1 scale for heatmap)
      const intensity = (value + 30) / 105; // Normalizes -30 dBZ (0) to 75 dBZ (1)
  
      return [lat, radarData.longitude[i], intensity];
    });
  
    try {
      if (typeof L.heatLayer !== "function") {
        console.error("Error: L.heatLayer is not available.");
        return;
      }
  
      heatLayerRef.current = L.heatLayer(heatmapData, {
        radius: 20,
        blur: 15,
        maxZoom: 10,
        opacity: opacity,
        gradient: { 0.1: "blue", 0.4: "cyan", 0.6: "yellow", 0.8: "red", 1: "darkred" },
      });
  
      heatLayerRef.current.addTo(mapInstance);
    } catch (error) {
      console.error("Error creating heatmap layer:", error);
    }
  }, [radarData, opacity]);

  useEffect(() => {
    const canvas = document.querySelector("canvas");
    if (canvas) {
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
    }
  }, []);
  

  return <div id="map-container" ref={mapRef} style={{ height: "800px", width: "100%" }}></div>;
};

export default MapComponent;
