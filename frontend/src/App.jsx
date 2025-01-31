import React, { useState, useEffect } from "react";
import { Dropdown, DropdownButton, Button } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import MapComponent from "./MapComponent"; // Import the reusable map component

const App = () => {
  const [radarSites, setRadarSites] = useState({});
  const [selectedRadar, setSelectedRadar] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLogOpen, setIsLogOpen] = useState(false);

  // New state for dropdowns
  const [elevationAngles, setElevationAngles] = useState([]);
  const [selectedElevation, setSelectedElevation] = useState(null);
  const [radarFields, setRadarFields] = useState([]);
  const [selectedField, setSelectedField] = useState("reflectivity");

  // Fetch radar sites
  useEffect(() => {
    fetch("/radar_sites.json")
      .then((response) => response.json())
      .then((data) => {
        setRadarSites(data);
        const defaultRadar = data["KTLX"] ? "KTLX" : Object.keys(data)[0];
        setSelectedRadar(defaultRadar);
      })
      .catch((error) => console.error("Error loading radar sites:", error));
  }, []);

  // Fetch elevation angles and radar fields when radar changes
  useEffect(() => {
    if (selectedRadar) {
      fetch(`/get-dropdowns/${selectedRadar}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.elevation_angles) {
            const roundedAngles = data.elevation_angles.map((angle) =>
              parseFloat(angle.toFixed(2))
            );
            setElevationAngles(roundedAngles);
            setSelectedElevation(roundedAngles[0]); // Default to first angle
          }
        if (data.radar_fields) {
          setRadarFields(data.radar_fields);
          if (!data.radar_fields.includes(selectedField)) {
            setSelectedField(data.radar_fields[0]); // Default to first available field
          }
        }
      })
      .catch((error) => console.error("Error dropdown data:", error));
    }   
  }, [selectedRadar]);
  // Handle dropdown selections
  const handleRadarSelect = (eventKey) => {
    setSelectedRadar(eventKey);

    fetch(`/get-latest-scan/${eventKey}`)
      .then((response) => response.json())
      .then((data) => {
        const timestamp = new Date().toLocaleTimeString();
        const newMessage = `${timestamp} - ${data.message}`;
        setMessages((prevMessages) => [newMessage, ...prevMessages]); // Add new message on top
      })
      .catch((error) => {
        console.error("Error fetching latest scan:", error);
        setMessages((prevMessages) => [
          `${new Date().toLocaleTimeString()} - Error fetching scan data.`,
          ...prevMessages,
        ]);
      });
  };

  const handleElevationSelect = (eventKey) => setSelectedElevation(parseFloat(eventKey));
  const handleFieldSelect = (eventKey) => setSelectedField(eventKey);

  return (
    <div className="container">
      {/* Header Section */}
      <header className="header">
        <title>TornAIdo</title>
        <h1>Storm Chasing App</h1>
      </header>

      {/* Dropdown Menu - Elevation | Radar | Data Fields */}
      <div className="dropdown-container">
        {/* Elevation Dropdown (Left) */}
        <DropdownButton
          id="dropdown-elevation"
          title={`Elevation: ${selectedElevation}°`}
          variant="secondary"
          onSelect={handleElevationSelect}
          disabled={elevationAngles.length === 0}
        >
          {elevationAngles.map((angle) => (
            <Dropdown.Item eventKey={angle} key={angle}>
              {angle.toFixed(2)}°
            </Dropdown.Item>
          ))}
        </DropdownButton>

        {/* Radar Selection Dropdown (Center, Scrollable) */}
        <DropdownButton
          id="dropdown-radar"
          title={selectedRadar ? `Radar: ${selectedRadar}` : "Loading..."}
          variant="primary"
          onSelect={handleRadarSelect}
          disabled={!selectedRadar}
        >
          {/* Selected Radar at the Top */}
          {selectedRadar && radarSites[selectedRadar] && (
            <Dropdown.Item eventKey={selectedRadar} key={selectedRadar} active>
              {`${selectedRadar}, ${radarSites[selectedRadar].name}, ${radarSites[selectedRadar].state}`}
            </Dropdown.Item>
          )}

          {/* Scrollable List of Radars */}
          <div className="dropdown-scroll">
            {Object.keys(radarSites)
              .filter((site) => site !== selectedRadar)
              .map((site) => (
                <Dropdown.Item eventKey={site} key={site}>
                  {`${site}, ${radarSites[site].name}, ${radarSites[site].state}`}
                </Dropdown.Item>
              ))}
          </div>
        </DropdownButton>

        {/* Data Field Dropdown (Right) */}
        <DropdownButton
          id="dropdown-field"
          title={`Field: ${selectedField}`}
          variant="secondary"
          onSelect={handleFieldSelect}
          disabled={radarFields.length === 0}
        >
          {radarFields.map((field) => (
            <Dropdown.Item eventKey={field} key={field}>
              {field}
            </Dropdown.Item>
          ))}
        </DropdownButton>
      </div>

      {/* Map Container */}
      {selectedRadar && radarSites[selectedRadar] && (
        <div className="map-container">
          <MapComponent
            center={[radarSites[selectedRadar].lat, radarSites[selectedRadar].lon]}
            zoom={selectedRadar.startsWith("T") ? 10 : 7}
            overlays={[]} // No overlays currently
          />
        </div>
      )}

      {/* Message Log Dropdown (Scrollable, Reverse Chronological Order) */}
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
