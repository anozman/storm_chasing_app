# This file is the main script running the api queries from the NEXRAD real time data stream via AWS S3
# Any testing scripts will be done under the data exploration directory in the sample_query.py file
import os
import boto3
from botocore.config import Config
from botocore import UNSIGNED
from datetime import datetime
import time

# Configure S3 client for unsigned requests
s3 = boto3.client(
    's3',
    region_name='us-east-1',
    config=Config(signature_version=UNSIGNED)
)

BUCKET_NAME = "unidata-nexrad-level2-chunks"
MAX_WAIT_TIME = 60  # Max time (seconds) before using fallback
WAIT_INTERVAL = 5  # Time (seconds) between rechecks

def find_latest_scan(radar_id, local_dir="../data"):
    """
    Finds the latest radar scan and ensures all chunks (S, I, and E) are available.

    Args:
        radar_id (str): The radar station ID (e.g., KTLX).
        local_dir (str): Directory where radar files are stored.

    Returns:
        tuple: (list of file objects, timestamp of the latest scan)
    """
    prefix = f"{radar_id}/"
    paginator = s3.get_paginator('list_objects_v2')
    
    latest_files = []
    previous_files = []
    latest_timestamp = None
    previous_timestamp = None
    #elapsed_time = 0

    #while elapsed_time < MAX_WAIT_TIME:
    ### BEGIN - Commented out the while loop to test the function
    response_iterator = paginator.paginate(Bucket=BUCKET_NAME, Prefix=prefix)
    
    temp_latest_files = []
    temp_previous_files = []
    temp_latest_timestamp = None
    temp_previous_timestamp = None
    chunk_types = set()

    # Iterate through all objects in the bucket for the given radar ID
    for page in response_iterator:
        if 'Contents' not in page:
            continue
        for obj in page['Contents']:
            key_parts = obj['Key'].split("/")
            if len(key_parts) < 3:
                continue
            
            timestamp = key_parts[2].split("-")[0] + key_parts[2].split("-")[1]  # Extract timestamp
            chunk_type = key_parts[-1].split(".")[0][-1]  # Extract last character (chunk type)

            if not temp_latest_timestamp or timestamp > temp_latest_timestamp:
                temp_previous_timestamp = temp_latest_timestamp
                temp_previous_files = temp_latest_files

                temp_latest_timestamp = timestamp
                temp_latest_files = [obj]
                chunk_types = {chunk_type}
            elif timestamp == temp_latest_timestamp:
                temp_latest_files.append(obj)
                chunk_types.add(chunk_type)

    # Ensure we have both a latest and previous timestamp
    if temp_previous_timestamp:
        latest_files = temp_latest_files
        previous_files = temp_previous_files
        latest_timestamp = temp_latest_timestamp
        previous_timestamp = temp_previous_timestamp
    
    print(f"Latest scan: {latest_timestamp} ({len(latest_files)} chunks) | Chunks: {chunk_types}")

    # Check if the scan contains at least one "S", multiple "I", and one "E"
    if 'S' in chunk_types and 'E' in chunk_types and len(chunk_types) > 2:
        print(f"Scan {latest_timestamp} is complete. Proceeding with download.")
        return latest_files, latest_timestamp

    # Check for a previous scan in local storage
    previous_file_path = os.path.join(local_dir, f"{radar_id}_{previous_timestamp[0:8]}-{previous_timestamp[8:]}.bin")
    if os.path.exists(previous_file_path):
        print(f"Using previous scan {previous_timestamp} as fallback.")
        return previous_files, previous_timestamp

        # Wait before retrying
        #time.sleep(WAIT_INTERVAL)
        #elapsed_time += WAIT_INTERVAL

    # If timeout, use previous scan if available
    if previous_files:
        #print(f"Timeout reached! Using previous scan {previous_timestamp}.")
        print(f"Using previous scan {previous_timestamp}.")
        return previous_files, previous_timestamp
    else:
        #print(f"Timeout reached! No previous scan available. Using incomplete latest scan {latest_timestamp}.")
        print(f"No previous scan available. Using incomplete latest scan {latest_timestamp}.")
        return latest_files, latest_timestamp

def download_chunks(file_list, download_dir="../data"):
    """
    Downloads all chunks for the latest radar scan.
    
    Args:
        file_list (list): List of objects representing chunks to download.
        download_dir (str): Directory to save downloaded chunks.
    
    Returns:
        list: List of paths to the downloaded chunk files.
    """
    os.makedirs(download_dir, exist_ok=True)
    local_file_paths = []

    for file_obj in file_list:
        chunk_key = file_obj['Key']
        local_file_path = os.path.join(download_dir, os.path.basename(chunk_key))

        try:
            s3.download_file(BUCKET_NAME, chunk_key, local_file_path)
            print(f"Downloaded: {local_file_path}")
            local_file_paths.append(local_file_path)
        except Exception as e:
            print(f"Error downloading {chunk_key}: {e}")

    return local_file_paths

def assemble_chunks(local_file_paths, output_file):
    """
    Combines all downloaded chunks into a single file.

    Args:
        local_file_paths (list): Paths to the downloaded chunk files.
        output_file (str): Path for the final combined file.
    """
    with open(output_file, "wb") as combined_file:
        for file_path in sorted(local_file_paths):
            with open(file_path, "rb") as chunk_file:
                combined_file.write(chunk_file.read())
            os.remove(file_path)  # Optionally delete individual chunk files
            print(f"Deleted: {file_path}")
    print(f"Combined file saved to: {output_file}")