import os
import pyart
import numpy as np
from glob import glob
from datetime import datetime
import json
import re

import matplotlib.pyplot as plt
import matplotlib.colors
import matplotlib

cmaps = {
    'reflectivity': {'cmap' : 'pyart_NWSRef', 'norm': (0,80)},
    'velocity': {'cmap' : 'pyart_NWSVel', 'norm' : (-30,30)},
    'spectrum_width': {'cmap' : 'pyart_NWS_SPW', 'norm' : (0,10)},
    'differential_reflectivity': {'cmap' : 'pyart_RefDiff', 'norm' : (-5,5)},
    'differential_phase': {'cmap' : 'pyart_SCook18', 'norm' : (0,180)},
    'cross_correlation_ratio': {'cmap' : 'pyart_Carbone42', 'norm' : (0,1)},
    'clutter_filter_power_removed': {'cmap' : 'pyart_NWSRef', 'norm': (0,80)}
}

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
    regex_pattern = re.compile(rf".*{radar_id}_\d{{8}}-\d{{6}}\.bin$")
    radar_files = [f for f in radar_files if regex_pattern.match(os.path.basename(f))]
    
    radar_files.sort(key=lambda f: datetime.strptime(f.split("_")[-1].split(".")[0], "%Y%m%d-%H%M%S"), reverse=True)

    return radar_files[0]

def sanitize_data(data_array):
    """Replace NaN and infinite values with None (JSON-compliant)."""
    return [
        None if np.isnan(v) or np.isinf(v) else float(v)
        for v in data_array
    ]

def extract_radar_data(file_path, field, elevation):
    """
    Extracts radar data, interpolates it onto a uniform lat/lon grid, and returns it as GeoJSON.
    """
    try:
        print(f"Opening radar file: {file_path}")
        radar = pyart.io.read_nexrad_archive(file_path)
        print("Radar file loaded successfully.")

        # Check if field exists
        if field not in radar.fields:
            raise ValueError(f"Field '{field}' not found in radar data. Available fields: {list(radar.fields.keys())}")

        # Find the closest elevation sweep
        sweep_index = np.argmin(np.abs(radar.fixed_angle["data"] - elevation))
        print(f"Selected sweep index: {sweep_index} for elevation {elevation}°")

        # Additional debugging to see the radar data
        raw_data = radar.get_field(sweep_index, field)
        print(f"Raw sweep shape: {raw_data.shape}, masked: {np.ma.is_masked(raw_data)}, valid pts: {np.count_nonzero(~raw_data.mask)}")


        # Convert radar data into a 2D lat/lon grid
        grid = pyart.map.grid_from_radars(
            radar, 
            grid_shape=(1, 500, 500),  # 500x500 resolution
            grid_limits=((0, 20000), (-150000, 150000), (-150000, 150000)),
            fields=[field]
        )

        print("Grid mapping completed successfully.")

        lat_grid = grid.point_latitude["data"][0]
        lon_grid = grid.point_longitude["data"][0]
        value_grid = grid.fields[field]["data"][0]

        lat_flat = lat_grid.flatten()
        lon_flat = lon_grid.flatten()
        val_flat = value_grid.flatten()

        # Bulky, only use for debug
        #print(f"Sample Data - Lat: {lat_grid[:5]}, Lon: {lon_grid[:5]}, Values: {value_grid[:5]}") 

        cmap = matplotlib.cm.get_cmap('pyart_NWSRef')  # Think about getting the color map from the radar package
        norm = matplotlib.colors.Normalize(vmin=np.nanmin(0), vmax=np.nanmax(60))  

        geojson_features = []
        # Iterate and build features ONLY for valid (unmasked) values
        for lat, lon, val in zip(lat_flat, lon_flat, val_flat):
            if np.ma.is_masked(val) or np.isnan(val) or np.isinf(val):
                continue
            color = matplotlib.colors.rgb2hex(cmap(norm(val)))
            geojson_features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [float(lon), float(lat)]
                },
                "properties": {
                    "value": float(val),
                    "color": color
                }
            })

        print(f"GeoJSON Data Prepared, Features: {len(geojson_features)}")

        return json.dumps({"type": "FeatureCollection", "features": geojson_features})

    except Exception as e:
        print(f"Error processing radar file {file_path}: {e}")
        return json.dumps({"error": str(e)})  # Ensure JSON response format

def extract_radar_polygons(file_path, field, elevation):
    try:
        radar = pyart.io.read_nexrad_archive(file_path)

        if field not in radar.fields:
            raise ValueError(f"Field '{field}' not found in radar data. Available fields: {list(radar.fields.keys())}")

        sweep_index = np.argmin(np.abs(radar.fixed_angle["data"] - elevation))
        radar_data = radar.get_field(sweep_index, field)

        print(f"Field: {field} Raw sweep shape: {radar_data.shape}, masked: {np.ma.is_masked(radar_data)}, valid pts: {np.count_nonzero(~radar_data.mask)}")

        use_grid_method = np.count_nonzero(~radar_data.mask) == 0

        if use_grid_method:
            print("Switching to gridding method due to fully masked sweep data")
            grid_shape = (1, 500, 500)
            grid_limits = ((0, 2000), (-150000, 150000), (-150000, 150000))
            grid = pyart.map.grid_from_radars(
                radar, 
                grid_shape=grid_shape, 
                grid_limits=grid_limits,
                fields=[field]
            )
            lat_grid = grid.point_latitude['data'][0]
            lon_grid = grid.point_longitude['data'][0]
            radar_data = grid.fields[field]['data'][0]
        else:
            azimuths = radar.get_azimuth(sweep_index)
            ranges = radar.range['data']
            lat_grid, lon_grid, _ = radar.get_gate_lat_lon_alt(sweep_index)

        features = []
        cmap = matplotlib.cm.get_cmap(cmaps[field]['cmap']) if 'cmap' in cmaps[field] else matplotlib.cm.get_cmap('pyart_NWSRef')
        norm = (matplotlib.colors.Normalize(vmin=cmaps[field]['norm'][0], vmax=cmaps[field]['norm'][1]) if 'norm' in cmaps[field]
                else matplotlib.colors.Normalize(vmin=0, vmax=75))
        print(f"Color map: {cmap.name}, Norm: {norm.vmin} to {norm.vmax}")

        lat_shape, lon_shape = lat_grid.shape
        for az_idx in range(lat_shape - 1):
            for r_idx in range(lon_shape - 1):
                value = radar_data[az_idx, r_idx]

                if np.ma.is_masked(value) or np.isnan(value) or np.isinf(value) or value == -9999:
                    continue

                lat1, lon1 = lat_grid[az_idx, r_idx], lon_grid[az_idx, r_idx]
                lat2, lon2 = lat_grid[az_idx, r_idx + 1], lon_grid[az_idx, r_idx + 1]
                lat3, lon3 = lat_grid[az_idx + 1, r_idx + 1], lon_grid[az_idx + 1, r_idx + 1]
                lat4, lon4 = lat_grid[az_idx + 1, r_idx], lon_grid[az_idx + 1, r_idx]

                color = matplotlib.colors.rgb2hex(cmap(norm(value)))

                feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Polygon",
                        "coordinates": [[[lon1, lat1], [lon2, lat2], [lon3, lat3], [lon4, lat4], [lon1, lat1]]]
                    },
                    "properties": {"value": float(value), "color": color}
                }
                features.append(feature)

        print(f"GeoJSON Data Prepared, Features: {len(features)}")

        return json.dumps({"type": "FeatureCollection", "features": features})

    except Exception as e:
        return json.dumps({"error": str(e)})