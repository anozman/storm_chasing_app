import React, { useState, useEffect } from "react";
import { Dropdown, DropdownButton } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import MapComponent from "./MapComponent"; // Import the reusable map component

const App = () => {
  const [radarSites, setRadarSites] = useState({});
  const [selectedRadar, setSelectedRadar] = useState(null);
  const [data, setData] = useState(null); // Backend data

  // Fetch radar sites from radar_sites.json
  useEffect(() => {
    fetch("/radar_sites.json")
      .then((response) => response.json())
      .then((data) => {
        setRadarSites(data);
        const defaultRadar = data["KTLX"] ? "KTLX" : Object.keys(data)[0]; // Set KTLX if available, else first radar
        setSelectedRadar(defaultRadar);
      })
      .catch((error) => console.error("Error loading radar sites:", error));
  }, []);

  // Fetch data from the backend
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

  // Sort radar sites: non-TDWR sites alphabetically, TDWR sites at the bottom
  const sortedRadarSites = Object.keys(radarSites)
    .filter((site) => site !== selectedRadar) // Exclude selected radar
    .sort((a, b) => {
      const isTDWR_A = a.startsWith("T");
      const isTDWR_B = b.startsWith("T");

      if (isTDWR_A && !isTDWR_B) return 1; // Move TDWR sites to the bottom
      if (!isTDWR_A && isTDWR_B) return -1;

      return radarSites[a].name.localeCompare(radarSites[b].name);
    });

  // Determine zoom level based on radar type
  const isTDWR = selectedRadar && selectedRadar.startsWith("T");
  const defaultZoom = isTDWR ? 10 : 7; // More zoomed in for TDWR radars

  return (
    <div className="container">
      {/* Header Section */}
      <header className="header">
        <title>TornAIdo</title>
        <h1>Storm Chasing App</h1>
      </header>

      {/* Dropdown Menu */}
      <div className="dropdown-container">
        <DropdownButton
          id="dropdown-radar"
          title={selectedRadar ? `RADAR ${selectedRadar}` : "Loading..."}
          variant="primary"
          onSelect={handleRadarSelect}
          disabled={!selectedRadar}
        >
          {/* Selected Radar at the Top */}
          {selectedRadar && radarSites[selectedRadar] && (
            <Dropdown.Item
              eventKey={selectedRadar}
              key={selectedRadar}
              active
              className="selected-radar"
            >
              {`${selectedRadar}, ${radarSites[selectedRadar].name}, ${radarSites[selectedRadar].state}`}
            </Dropdown.Item>
          )}

          {/* Scrollable List of Radars */}
          <div className="dropdown-scroll">
            {sortedRadarSites.map((site) => (
              <Dropdown.Item eventKey={site} key={site}>
                {`${site}, ${radarSites[site].name}, ${radarSites[site].state}`}
              </Dropdown.Item>
            ))}
          </div>
        </DropdownButton>
      </div>

      {/* Data from Backend */}
      <div className="data-container">
        <h2>Data from Backend:</h2>
        {data ? <pre>{JSON.stringify(data, null, 2)}</pre> : <p>Loading data...</p>}
      </div>

      {/* Map Container */}
      {selectedRadar && radarSites[selectedRadar] && (
        <div className="map-container">
          <MapComponent
            center={[radarSites[selectedRadar].lat, radarSites[selectedRadar].lon]} // Center map on selected radar site
            zoom={defaultZoom} // Adjusted zoom level
            overlays={[]} // No overlays currently
          />
        </div>
      )}
    </div>
  );
};

export default App;
