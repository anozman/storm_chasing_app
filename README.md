# Storm Chasing App

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Version History](#Version-History)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [AI Training Procedure](#ai-training-procedure)
- [Data Streams](#data-streams)
- [Versioning](#versioning)
- [Contributions](#contributions)
- [License](#license)

---

## Overview
The **Storm Chasing App** is an interactive, map-driven application designed for storm chasers to monitor radar data and visualize AI-based predictions. The app combines a Python-based backend with a sleek, interactive React.js frontend.

![Version](https://img.shields.io/badge/version-0.1.0-blue?style=for-the-badge)
## Version History

| Version | Release Date | Notes                          |
|---------|--------------|--------------------------------|
| 0.1.0   | 2025-01-14   | Initial Development   |

---

## Features
- **Interactive Map**: Interactive map provided by Deck.gl and Mapbox.gl.
- **AI Predictions**: Real-time storm tracking and analysis using AI models.
- **Custom Data Streams**: Pull and process radar data asynchronously.
- **User-Friendly Interface**: Dropdowns and menus for data selection and customization.
- **Extensible Design**: Built for future features like GPS integration.

---

## Tech Stack and implementations

### Backend
The backend is build upon the **FastAPI** library to deliver fast and efficient data queries and deliveries. The backend also consists of a lot of radar data provessing, provided by the **Py-ART toolkit**. This toolkit was specially created for handling NexRad radar data via the AWS S3 bucket system.

### Frontend
The frontend is built using React.js. This framework gives a lot of versatility and control to create a website that will effectively achieve our desired functionality. The mapping utility used is Deck.gl over Mapbox.gl, which is an open source interactive mapping tool. Using the combination of these utilities allows for the user to interact with high fidelity radar data and utilize the zoom features of the mapping utility to view the storms at both the gate-to-gate level and further on the mesoscale level. Using this mapping setup, the hope is to also optimize the user experience with interacting with the different data toggles seemlessly without having to wait on data to reload when switching products. On initialization all the radars within the NexRad radar network are sorted alphabetically by site name, with the top radar being the currently selected radar. **Currently**, to reload data, the user must click on the radar button and re-select the current radar site or enter a new site. This will hopefully be changed in the future.

The data is currently being plotted using GeoJson as a FeatureCollection of Point geometries. The goal is to switch to polygons, so the radar gate boundaries will be plotted directly (and with no border linewidth).

### AI
This will likely be in Tensorflow or PyTorch. My experience is in Tensorflow, but the ML API is somewhat out of date in comparison to PyTorch. Tensorflow will still likely be used to process the data such that the data can be properly prepared and pushed to the AI for training.

### **System Architecture Diagram**

A nice documented system architecture diagram can be added here at some point but I am over it at the moment

---

## Installation
### Prerequisites:
- Python 3.10+
- Node.js 16+
- npm or yarn
- Anaconda or conda derivative

### Setup:

**Backend**

Import the anaconda environment as follows:
```
cd ../storm_chasing_app
```
```
conda create -f env.yml
```

**Frontend**

Install and configure react.js
```
cd ..storm_chasing_app/
npm create vite@latest frontend -- --template react
```
Install and dependencies
```
npm install
```
If configured correctly, this running this command should populate the base template for the react.js + vite frontend on your local host.
```
npm run dev
```
Installing other dependencies needed for the application
```
npm install @deck.gl/react @deck.gl/core @deck.gl/layers react-map-gl maplibre-gl
```

And the following should be your file structure:
```
backend/
├── main.py
├── RT_data_query.py
├── RT_data_processing.py
frontend/
├── node_modules/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   ├── main.jsx
│   └── MapComponent.jsx
├── .gitignore
├── index.html
├── package.json
├── README.md
├── vite.config.js
Data/
├── {Radar data files fully inflated/assembled}
```

### Booting application from terminal

Any edits that are made within the frontend directory, the following command needs to be run in *frontend/* directory before running the backend
```
npm run build
```
Upon success, navagate to *backend/* and run the following command:
```
uvicorn main:app --reload
```
To run the final product with the backend as the server, run the app using the following command:
```
uvicorn main:app --host 0.0.0.0 --port 8000
```

---

## Usage


## Data
Radar data is provided by the NWS Radar API accessable through AWS. In using the NexRad API, we can access both a live radar feed in addition to archive data which is used to train the AI. The Jupyter notebooks in the data exploration directory was for that main intent, in addition to potentially debugging what the radar data should look like between the data pull and plotting ont the final website.

## Future Features
Here is where I would like to catelog any future features that I may develop in the future
- Data overlays: SPC Outlooks, SPC MDs, SPC Mesoanalysis
- Non-radar pages: AI metrics and event reanalysis, External reference to SPC products
- Radar data async query toggles and memory/storage management

## Contributions

This section lists several sources that were used for the development of the app.

- [Radar API](https://github.com/awslabs/open-data-docs/tree/main/docs/noaa/noaa-nexrad#accessing-the-real-time-data)
- [Radar Visualization Toolkit - Py-ART doi: 10.5334/jors.119](https://openresearchsoftware.metajnl.com/articles/10.5334/jors.119)
