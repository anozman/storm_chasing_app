#----------------------------------------------------------------------------------------------------------
#
# IMPORTS
#
#----------------------------------------------------------------------------------------------------------

# FastAPI imports
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
from fastapi.responses import FileResponse
from starlette.requests import Request

# Data handling imports
from datetime import datetime 
#import numpy as np

# Custom NEXRAD API imports
from RT_data_query import find_latest_scan, download_chunks, assemble_chunks
from RT_data_processing import get_radar_elevations, get_radar_fields, find_latest_radar_file, extract_radar_data

#----------------------------------------------------------------------------------------------------------
#
# INITIALIZATION
#
#----------------------------------------------------------------------------------------------------------

app = FastAPI()

# Defining endpoints
#origins = [
#    "http://localhost:8000"
#]

# Enable CORS if necessary
app.add_middleware(
    CORSMiddleware,
    #allow_origins=origins,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#----------------------------------------------------------------------------------------------------------
#
# ROUTES
#
#----------------------------------------------------------------------------------------------------------

########################################
# Downloading data and extracting metadata
########################################

@app.get("/get-latest-scan/{radar_id}")
async def get_latest_scan(radar_id: str):
    # Get the latest scan files
    print("Finding latest scan...")
    latest_files, timestamp = find_latest_scan(radar_id)
    
    if not latest_files:
        return {"error": "No files found for the latest scan."}

    # Create a filename for the combined file (e.g., KTLX_20250129-150000.bin)
    #current_time = datetime.now().strftime("%Y%m%d-%H%M%S")
    current_time = timestamp[0:8] + "-" + timestamp[8:]
    filename = f"{radar_id}_{current_time}.bin"
    output_file_path = os.path.join("../data", filename)

    if os.path.exists(output_file_path):
        return {"message": f"Radar scan data already exists as {filename}"}

    # Download chunks
    downloaded_files = download_chunks(latest_files, download_dir="../data")

    # Combine downloaded chunks into one file
    assemble_chunks(downloaded_files, output_file_path)

    return {"message": f"Radar scan data saved as {filename}"}

@app.get("/get-radar-elevations/{radar_id}")
async def get_radar_elevations_api(radar_id: str, target_file: str = None):
    """API to return elevation angles for a radar"""
    if target_file:
        file_path = f"../data/{target_file}"
    else:
        ### Using the get_latest_scan logic 
        print("Finding latest scan...")
        latest_files, timestamp = find_latest_scan(radar_id)
        
        if not latest_files:
            return {"error": "No files found for the latest scan."}

        current_time = timestamp[0:8] + "-" + timestamp[8:]
        filename = f"{radar_id}_{current_time}.bin"
        output_file_path = os.path.join("../data", filename)

        if not os.path.exists(output_file_path):
            # Download chunks
            downloaded_files = download_chunks(latest_files, download_dir="../data")
            # Combine downloaded chunks into one file
            assemble_chunks(downloaded_files, output_file_path)

        file_path = output_file_path
    print("File path: ", file_path)
    if not os.path.exists(file_path):
        return {"error": "Radar file not found"}
    
    angles = get_radar_elevations(file_path)
    return {"elevation_angles": angles}

@app.get("/get-radar-fields/{radar_id}")
async def get_radar_fields_api(radar_id: str, target_file: str = None):
    """API to return available radar fields for a radar scan."""
    if target_file:
        file_path = f"../data/{target_file}"
    else:
        print("Finding latest scan...")
        latest_files, timestamp = find_latest_scan(radar_id)
        
        if not latest_files:
            return {"error": "No files found for the latest scan."}

        current_time = timestamp[0:8] + "-" + timestamp[8:]
        filename = f"{radar_id}_{current_time}.bin"
        output_file_path = os.path.join("../data", filename)

        if not os.path.exists(output_file_path):
            downloaded_files = download_chunks(latest_files, download_dir="../data")
            assemble_chunks(downloaded_files, output_file_path)

        file_path = output_file_path

    print("File path: ", file_path)
    if not os.path.exists(file_path):
        return {"error": "Radar file not found"}
    
    fields = get_radar_fields(file_path)
    return {"radar_fields": fields}

@app.get("/get-dropdowns/{radar_id}")
async def get_radar_fields_api(radar_id: str):
    """API to return elevation angles and radar fields for a radar scan."""
    print("Finding latest scan...")
    latest_files, timestamp = find_latest_scan(radar_id)
    
    if not latest_files:
        return {"error": "No files found for the latest scan."}

    current_time = timestamp[0:8] + "-" + timestamp[8:]
    filename = f"{radar_id}_{current_time}.bin"
    output_file_path = os.path.join("../data", filename)

    if not os.path.exists(output_file_path):
        downloaded_files = download_chunks(latest_files, download_dir="../data")
        assemble_chunks(downloaded_files, output_file_path)

    file_path = output_file_path

    print("File path: ", file_path)
    if not os.path.exists(file_path):
        return {"error": "Radar file not found"}
    
    angles = get_radar_elevations(file_path)
    fields = get_radar_fields(file_path)
    return {"elevation_angles": angles, "radar_fields": fields}

########################################
# Data Overlays
########################################

@app.get("/get/{field}/{tilt}/{radar_id}")
async def get_radar_data(field: str, tilt: float, radar_id: str):
    """
    API endpoint to fetch radar data for a given field, elevation angle, and radar site.
    """
    # Find the latest available radar file
    radar_file = find_latest_radar_file(radar_id)

    if not radar_file:
        return {"error": f"No radar file found for {radar_id}"}

    # Extract radar data
    radar_data = extract_radar_data(radar_file, field, tilt)

    if not radar_data:
        return {"error": f"Failed to extract {field} data at {tilt}° from {radar_id}"}

    return radar_data

#----------------------------------------------------------------------------------------------------------
#
# SERVING THE REACT FRONTEND
#
#----------------------------------------------------------------------------------------------------------

# Serve the React build files
frontend_path = os.path.join(os.path.dirname(__file__), "../frontend/dist")
if os.path.exists(frontend_path):  # Ensure the build directory exists
    print("Mounting React frontend...")
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")
else:
    print("⚠️ React frontend not found. Make sure to build it with `npm run build`.")
#app.mount("/", StaticFiles(directory=frontend_path, html=True))

# Ensure that the root URL ("/") correctly serves React's index.html
@app.get("/")
async def serve_index():
    index_path = os.path.join(frontend_path, "index.html")
    if os.path.exists(index_path):
        print("Serving React frontend...")
        return FileResponse(index_path)
    return {"error": "Frontend build missing. Run `npm run build`."}
