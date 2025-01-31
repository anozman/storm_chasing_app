import os
import pyart

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
