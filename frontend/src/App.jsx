import React, { useState, useEffect } from "react";
import { Dropdown, DropdownButton, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import MapComponent from "./MapComponent"; // Import the reusable map component

const App = () => {
  const [radarSites, setRadarSites] = useState({});
  const [selectedRadar, setSelectedRadar] = useState(null);
  const [messages, setMessages] = useState([]); // Store messages in a list
  const [isLogOpen, setIsLogOpen] = useState(false); // Control dropdown state

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

  // Handle radar selection
  const handleRadarSelect = (eventKey) => {
    setSelectedRadar(eventKey);
    console.log(`Radar selected: ${eventKey}`);
    
    // Request the latest scan from the backend when a new radar is selected
    fetch(`/get-latest-scan/${eventKey}`)
      .then((response) => response.json())
      .then((data) => {
        const timestamp = new Date().toLocaleTimeString();
        const newMessage = `${timestamp} - ${data.message}`;

        setMessages((prevMessages) => [newMessage, ...prevMessages]); // Add to log (most recent first)
      })
      .catch((error) => {
        console.error("Error fetching latest scan:", error);
        setMessages((prevMessages) => [
          `${new Date().toLocaleTimeString()} - Error fetching scan data.`,
          ...prevMessages,
        ]);
      });
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

      {/* Message Log Dropdown */}
      <div className="message-log-container">
        <Button
          className="log-toggle"
          variant="dark"
          onClick={() => setIsLogOpen(!isLogOpen)}
        >
          {isLogOpen ? "▼ Hide Logs" : "▲ Show Logs"}
        </Button>
        
        {isLogOpen && (
          <div className="log-dropdown">
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <div key={index} className="log-entry">
                  {msg}
                </div>
              ))
            ) : (
              <p className="log-empty">No messages yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
