import os
import pyart
import numpy as np
from glob import glob
from datetime import datetime

def get_radar_elevations(file_path):
    """Extract and return radar elevation angles from a NEXRAD file."""
    try:
        radar = pyart.io.read_nexrad_archive(file_path)
        elevations = radar.fixed_angle["data"]  # Extract elevation angles
        rounded_elevations = [float("%.02f"%(angle)) for angle in elevations]
        rounded_elevations = set(rounded_elevations)  # Remove duplicates
        return rounded_elevations
    except Exception as e:
        print(f"Error reading radar file: {e}")
        return []
    
def get_radar_fields(file_path):
    """Extract and return radar fields from a NEXRAD file."""
    try:
        radar = pyart.io.read_nexrad_archive(file_path)
        radar_fields = list(radar.fields.keys())  # Extract field names
        return radar_fields
    except Exception as e:
        print(f"Error reading radar file: {e}")
        return []
    
def find_latest_radar_file(radar_id, data_dir="../data"):
    """
    Finds the most recent radar file for the given radar_id.
    
    Args:
        radar_id (str): The radar station ID (e.g., KTLX).
        data_dir (str): Directory where radar files are stored.

    Returns:
        str: Path to the latest radar file or None if no files are found.
    """
    search_pattern = os.path.join(data_dir, f"{radar_id}_*.bin")
    radar_files = glob(search_pattern)

    if not radar_files:
        return None

    # Extract timestamps from filenames and sort to find the latest
    radar_files.sort(key=lambda f: datetime.strptime(f.split("_")[-1].split(".")[0], "%Y%m%d-%H%M%S"), reverse=True)

    return radar_files[0]

def sanitize_data(data_array):
    """Replace NaN and infinite values with None (JSON-compliant)."""
    return [
        None if np.isnan(v) or np.isinf(v) else float(v)
        for v in data_array
    ]

def extract_radar_data(file_path, field, elevation):
    try:
        radar = pyart.io.read_nexrad_archive(file_path)
        sweep_index = np.argmin(np.abs(radar.fixed_angle['data'] - elevation))

        if field not in radar.fields:
            raise ValueError(f"Field '{field}' not found in radar data.")

        radar_data = radar.fields[field]['data'][sweep_index]
        gate_lats = radar.gate_latitude['data'][sweep_index]
        gate_lons = radar.gate_longitude['data'][sweep_index]

        # Ensure the data is JSON-serializable
        sanitized_values = sanitize_data(radar_data.filled(np.nan).flatten())

        return {
            "latitude": sanitize_data(gate_lats.flatten()),
            "longitude": sanitize_data(gate_lons.flatten()),
            "values": sanitized_values,
        }
    except Exception as e:
        print(f"Error processing radar file {file_path}: {e}")
        return None