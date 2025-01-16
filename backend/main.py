from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os

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

# Serve the React build files
frontend_path = os.path.join(os.path.dirname(__file__), "../frontend/dist")
app.mount("/", StaticFiles(directory=frontend_path, html=True))

# Example API route
@app.get("/")
async def get_data():
    return {"message": "Hello from the backend!"}
