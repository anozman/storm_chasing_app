# This file is the main script running the api queries from the NEXRAD real time data stream via AWS S3
# Any testing scripts will be done under the data exploration directory in the sample_query.py file
import os
import boto3
from botocore.config import Config
from botocore import UNSIGNED
from datetime import datetime

# Configure S3 client for unsigned requests
s3 = boto3.client(
    's3',
    region_name='us-east-1',
    config=Config(signature_version=UNSIGNED)
)

BUCKET_NAME = "unidata-nexrad-level2-chunks"

def find_latest_scan(radar_id):
    """
    Finds the latest radar scan for the specified radar station.

    Args:
        radar_id (str): The radar station ID (e.g., KTLX).

    Returns:
        list: A list of objects representing the chunks of the latest scan.
    """
    prefix = f"{radar_id}/"
    paginator = s3.get_paginator('list_objects_v2')
    response_iterator = paginator.paginate(Bucket=BUCKET_NAME, Prefix=prefix)

    latest_files = []
    latest_timestamp = None

    # Iterate through all objects in the bucket for the given radar ID
    for page in response_iterator:
        if 'Contents' not in page:
            continue
        for obj in page['Contents']:
            key_parts = obj['Key'].split("/")
            if len(key_parts) < 3:
                continue
            timestamp = key_parts[2].split("-")[0] + key_parts[2].split("-")[1]  # Extract the YYYYMMDDHHMMSS
            #print("Timestamp: ", timestamp)
            if not latest_timestamp or timestamp > latest_timestamp:
                latest_timestamp = timestamp
                latest_files = [obj]
            elif timestamp == latest_timestamp:
                latest_files.append(obj)

    print(f"Latest scan timestamp: {latest_timestamp}")
    print(f"Found {len(latest_files)} files for the latest scan.")
    return latest_files

def download_chunks(file_list, download_dir="../data"):
    """
    Downloads chunks for the latest radar scan.

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
        s3.download_file(BUCKET_NAME, chunk_key, local_file_path)
        print(f"Downloaded: {local_file_path}")
        local_file_paths.append(local_file_path)

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