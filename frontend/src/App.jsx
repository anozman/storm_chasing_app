import React, { useState, useEffect } from "react";
import { Dropdown, DropdownButton } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import MapComponent from "./MapComponent"; // Import the reusable map component

const App = () => {
  const [data, setData] = useState(null); // Backend data
  const [selectedRadar, setSelectedRadar] = useState("Radar 1"); // Selected radar
  const [selectedOverlays, setSelectedOverlays] = useState([]); // Selected overlays
  const [menuTab, setMenuTab] = useState("Option 1"); // Active menu tab

  // Fetch data from the backend when the component mounts
  useEffect(() => {
    fetch("/") // Using relative path (proxy set up in vite.config.js)
      .then((response) => response.json())
      .then((data) => setData(data))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  // Handle radar selection
  const handleRadarSelect = (eventKey) => {
    setSelectedRadar(eventKey);
    console.log(`Radar selected: ${eventKey}`);
  };

  // Handle overlay selection
  const handleOverlayToggle = (overlay) => {
    if (selectedOverlays.includes(overlay)) {
      setSelectedOverlays(selectedOverlays.filter((item) => item !== overlay));
    } else {
      setSelectedOverlays([...selectedOverlays, overlay]);
    }
  };

  // Example overlays (could be fetched from backend or dynamically generated)
  const overlayData = [
    {
      id: "overlay1",
      name: "Overlay 1",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [-90.09, 29.95], // Example coordinates
            },
            properties: { name: "Point 1" },
          },
        ],
      },
      style: { color: "red" },
    },
    {
      id: "overlay2",
      name: "Overlay 2",
      data: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            geometry: {
              type: "LineString",
              coordinates: [
                [-90.09, 29.95],
                [-91.09, 30.95],
              ],
            },
            properties: { name: "Line 1" },
          },
        ],
      },
      style: { color: "blue" },
    },
  ];

  return (
    <div className="container">
      {/* Header Section */}
      <header className="header">
        <title>TornAIdo</title>
        <h1>Storm Chasing App</h1>
      </header>

      {/* Menu Bar with Tabs */}
      <div className="menu-bar">
        {["Option 1", "Option 2", "Option 3"].map((option) => (
          <div
            key={option}
            style={{
              padding: "10px",
              cursor: "pointer",
              color: "white",
              backgroundColor: menuTab === option ? "#555" : "#444",
            }}
            onClick={() => setMenuTab(option)}
          >
            {option}
          </div>
        ))}
      </div>

      {/* Dropdown Menus */}
      <div className="dropdown-container">
        {/* Radar Data Toggle */}
        <DropdownButton
          id="dropdown-radar"
          title={`Radar Data: ${selectedRadar}`}
          variant="primary"
          onSelect={handleRadarSelect}
        >
          {["Radar 1", "Radar 2", "Radar 3"].map((radar) => (
            <Dropdown.Item eventKey={radar} key={radar}>
              {radar}
            </Dropdown.Item>
          ))}
        </DropdownButton>

        {/* Data Overlays */}
        <DropdownButton
          id="dropdown-overlays"
          title="Data Overlays"
          variant="secondary"
          style={{ marginLeft: "1rem" }}
        >
          {overlayData.map((overlay) => (
            <Dropdown.Item
              key={overlay.id}
              as="div"
              style={{ display: "flex", alignItems: "center" }}
            >
              <input
                type="checkbox"
                checked={selectedOverlays.includes(overlay.id)}
                onChange={() => handleOverlayToggle(overlay.id)}
                style={{ marginRight: "0.5rem" }}
              />
              {overlay.name}
            </Dropdown.Item>
          ))}
        </DropdownButton>
      </div>

      {/* Data from Backend */}
      <div className="data-container">
        <h2>Data from Backend:</h2>
        {data ? (
          <pre>{JSON.stringify(data, null, 2)}</pre>
        ) : (
          <p>Loading data...</p>
        )}
      </div>

      {/* Map Container */}
      <div className="map-container">
        <MapComponent
          center={[35.4676, -97.5164]} // Default map center (New Orleans as an example)
          zoom={7} // Default zoom level
          overlays={overlayData.filter((overlay) => selectedOverlays.includes(overlay.id))}
        />
      </div>
    </div>
  );
};

export default App;
