import React, { useState, useEffect } from "react";
import { Dropdown , DropdownButton} from "react-bootstrap"; // Importing react-bootstrap for dropdowns
import "bootstrap/dist/css/bootstrap.min.css"; // Importing Bootstrap styles
import './App.css';

const App = () => {
  const [data, setData] = useState(null);
  const [selectedRadar, setSelectedRadar] = useState("Radar 1");
  const [selectedOverlays, setSelectedOverlays] = useState([]);
  const [menuTab, setMenuTab] = useState("Option 1");

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

  return (
    <div className="container">
      {/* Header Section */}
      <header className="header">
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
      <div class = "dropdown-container">
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
          {["Overlay 1", "Overlay 2", "Overlay 3"].map((overlay) => (
            <Dropdown.Item
              key={overlay}
              as="div"
              style={{ display: "flex", alignItems: "center" }}
            >
              <input
                type="checkbox"
                checked={selectedOverlays.includes(overlay)}
                onChange={() => handleOverlayToggle(overlay)}
                style={{ marginRight: "0.5rem" }}
              />
              {overlay}
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
        <h3>Map will be here</h3>
      </div>
    </div>
  );
};

export default App;
