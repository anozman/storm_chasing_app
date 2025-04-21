import React, { useEffect, useRef, useState } from "react";
import MapGL from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { GeoJsonLayer } from "@deck.gl/layers";

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json";
const INITIAL_VIEW_STATE = {
  longitude: -97.0,
  latitude: 35.0,
  zoom: 6,
  pitch: 0,
  bearing: 0,
};

export default function MapComponent({ radarGeoJson, opacity, center, zoom }) {
  const [viewport, setViewport] = useState({
    ...INITIAL_VIEW_STATE,
    longitude: center[1],
    latitude: center[0],
    zoom: zoom || INITIAL_VIEW_STATE.zoom,
  });

  const deckRef = useRef();

  const radarLayer = new GeoJsonLayer({
    id: "radar-layer",
    data: radarGeoJson,
    pickable: true,
    stroked: false,
    filled: true,
    extruded: false,
    getFillColor: (feature) => {
      const hex = feature.properties?.color || "#FF00FF";
      const bigint = parseInt(hex.slice(1), 16);
      const r = (bigint >> 16) & 255;
      const g = (bigint >> 8) & 255;
      const b = bigint & 255;
      return [r, g, b, opacity * 255];
    },
    getLineColor: [0, 0, 0, 0],
    updateTriggers: {
      getFillColor: [radarGeoJson, opacity]
    },
    onHover: ({ object, x, y }) => {
      const tooltip = document.getElementById("tooltip");
      if (object && object.properties?.value !== undefined) {
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
        tooltip.innerHTML = `Value: ${object.properties.value.toFixed(2)}`;
        tooltip.style.display = "block";
      } else {
        tooltip.style.display = "none";
      }
    },
  });

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <DeckGL
        ref={deckRef}
        initialViewState={viewport}
        controller={true}
        layers={[radarLayer]}
      >
        <MapGL mapStyle={MAP_STYLE} />
      </DeckGL>
      <div
        id="tooltip"
        style={{
          position: "absolute",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          color: "white",
          padding: "4px 8px",
          borderRadius: "4px",
          pointerEvents: "none",
          display: "none",
          zIndex: 1000,
        }}
      />
    </div>
  );
}
