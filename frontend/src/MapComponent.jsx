import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MapComponent = ({ center = [35.4676, -97.5164], zoom = 6, opacity = 0.8, radarGeoJson = null }) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const radarLayerRef = useRef(null);

  // Initialize map on first render
  useEffect(() => {
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(center, zoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapInstanceRef.current);
    }
  }, []); // Only run once on mount

  // ✅ Update center/zoom when props change
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(center, zoom);
    }
  }, [center, zoom]);

  // Update radar layer on new data or opacity change
  useEffect(() => {
    if (!radarGeoJson || !mapInstanceRef.current) return;
  
    // Clear existing radar layer
    if (radarLayerRef.current) {
      radarLayerRef.current.clearLayers();
    } else {
      radarLayerRef.current = L.geoJSON(null, {
        pointToLayer: (feature, latlng) => {
          return L.circleMarker(latlng, {
            radius: 4,
            fillColor: feature.properties?.color || "#0000FF",
            color: "#000",
            weight: 0.5,
            opacity: 1,
            fillOpacity: opacity,
          });
        },
        style: (feature) => {
          return {
            fillColor: feature.properties?.color || "#0000FF",
            color: "#000",
            weight: 0.5,
            opacity: 1,
            fillOpacity: opacity,
          };
        },
        onEachFeature: (feature, layer) => {
          if (feature.properties?.value !== undefined) {
            layer.bindTooltip(`Value: ${feature.properties.value.toFixed(2)}`);
          }
        }
      }).addTo(mapInstanceRef.current);
    }
  
    // Add new data
    radarLayerRef.current.addData(radarGeoJson);
  }, [radarGeoJson, opacity]);

  return <div ref={mapRef} style={{ height: "800px", width: "100%" }} />;
};

export default MapComponent;
