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
- [Contributing](#contributing)
- [License](#license)

---

## Overview
The **Storm Chasing App** is an interactive, map-driven application designed for storm chasers to monitor radar data, process storm patterns, and visualize AI-based predictions. The app combines a Python-based backend with a sleek, interactive React.js frontend.

![Version](https://img.shields.io/badge/version-0.1.0-blue?style=for-the-badge)
## Version History

| Version | Release Date | Notes                          |
|---------|--------------|--------------------------------|
| 0.1.0   | 2025-01-14   | Initial Development   |

---

## Features
- **Interactive Map**: Visualize radar data with Mapbox.
- **AI Predictions**: Real-time storm tracking and analysis using AI models.
- **Custom Data Streams**: Pull and process radar data asynchronously.
- **User-Friendly Interface**: Dropdowns and menus for data selection and customization.
- **Extensible Design**: Built for future features like GPS integration.

---

## Architecture
The app is divided into three main components:

### **System Architecture Diagram**

A nice documented system architecture diagram can be added here at some point but I am over it at the moment

---

## Installation
### Prerequisites:
- Python 3.9+
- Node.js 16+
- npm or yarn
- Mapbox API key

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

And the following should be your file structure:
```
backend/
├── main.py
frontend/
├── node_modules/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.css
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── .gitignore
├── index.html
├── package.json
├── README.md
├── vite.config.js
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

---

## Usage


