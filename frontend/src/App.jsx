import React, { useState, useEffect } from "react";
import { Dropdown } from "react-bootstrap"; // Importing react-bootstrap for dropdowns
import "bootstrap/dist/css/bootstrap.min.css"; // Importing Bootstrap styles
import './App.css';

const App = () => {
  const [data, setData] = useState(null);
  const [selectedOption, setSelectedOption] = useState("Option 1");
  const [markers, setMarkers] = useState([
    { lat: 34.0522, lng: -118.2437, message: "Los Angeles" }, // Example marker (LA)
    { lat: 36.1699, lng: -115.1398, message: "Las Vegas" },  // Example marker (Vegas)
  ]);

  // Fetch data from the backend when the component mounts
  useEffect(() => {
    fetch("/") // Using relative path (proxy set up in vite.config.js)
      .then((response) => response.json())
      .then((data) => setData(data))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  // Handle dropdown selection
  const handleDropdownSelect = (eventKey) => {
    setSelectedOption(eventKey);
    console.log(`Selected: ${eventKey}`);
  };

  return (
    <div>
      {/* Header Section */}
      <header
        style={{
          backgroundColor: "#333",
          color: "white",
          padding: "1rem",
          textAlign: "center", // Center the header text
        }}
      >
        <h1>Storm Chasing App</h1>
      </header>

      {/* Menu Bar with Tabs */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          backgroundColor: "#444",
          padding: "10px",
        }}
      >
        <div
          style={{
            padding: "10px",
            cursor: "pointer",
            color: "white",
            backgroundColor: selectedOption === "Option 1" ? "#555" : "#444",
          }}
          onClick={() => setSelectedOption("Option 1")}
        >
          Option 1
        </div>
        <div
          style={{
            padding: "10px",
            cursor: "pointer",
            color: "white",
            backgroundColor: selectedOption === "Option 2" ? "#555" : "#444",
          }}
          onClick={() => setSelectedOption("Option 2")}
        >
          Option 2
        </div>
        <div
          style={{
            padding: "10px",
            cursor: "pointer",
            color: "white",
            backgroundColor: selectedOption === "Option 3" ? "#555" : "#444",
          }}
          onClick={() => setSelectedOption("Option 3")}
        >
          Option 3
        </div>
      </div>

      {/* Dropdown to toggle data */}
      <div style={{ padding: "1rem", textAlign: "center" }}>
        <Dropdown onSelect={handleDropdownSelect}>
          <Dropdown.Toggle variant="success" id="dropdown-basic">
            Select Data: {selectedOption}
          </Dropdown.Toggle>

          <Dropdown.Menu>
            <Dropdown.Item eventKey="Option 1">Option 1</Dropdown.Item>
            <Dropdown.Item eventKey="Option 2">Option 2</Dropdown.Item>
            <Dropdown.Item eventKey="Option 3">Option 3</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {/* Data from Backend */}
      <div style={{ padding: "1rem" }}>
        <h2>Data from Backend:</h2>
        {data ? (
          <pre>{JSON.stringify(data, null, 2)}</pre>
        ) : (
          <p>Loading data...</p>
        )}
      </div>

      {/* Map Container (placeholder for map later) */}
      <div
        style={{
          height: "600px",
          width: "100%",
          backgroundColor: "#e0e0e0", // Placeholder background color for map container
        }}
      >
        <h3 style={{ textAlign: "center", paddingTop: "250px", color: "#888" }}>
          Map will be here
        </h3>
      </div>
    </div>
  );
};

export default App;
