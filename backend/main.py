#----------------------------------------------------------------------------------------------------------
# IMPORTS
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

# Custom NEXRAD API imports
from RT_data_query import find_latest_scan, download_chunks, assemble_chunks

#----------------------------------------------------------------------------------------------------------
# INITIALIZATION
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
# ROUTES
#----------------------------------------------------------------------------------------------------------

@app.get("/get-latest-scan/{radar_id}")
async def get_latest_scan(radar_id: str):
    # Get the latest scan files
    print("Finding latest scan...")
    latest_files = find_latest_scan(radar_id)
    
    if not latest_files:
        return {"error": "No files found for the latest scan."}

    # Create a filename for the combined file (e.g., KTLX_20250129-150000.bin)
    timestamp = latest_files[0]['Key'].split("-")[0]
    current_time = datetime.now().strftime("%Y%m%d-%H%M%S")
    filename = f"{radar_id}_{current_time}.bin"
    output_file_path = os.path.join("../data", filename)

    # Download chunks
    downloaded_files = download_chunks(latest_files, download_dir="../data")

    # Combine downloaded chunks into one file
    assemble_chunks(downloaded_files, output_file_path)

    return {"message": f"Radar scan data saved as {filename}"}

#----------------------------------------------------------------------------------------------------------
# SERVING THE REACT FRONTEND
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
