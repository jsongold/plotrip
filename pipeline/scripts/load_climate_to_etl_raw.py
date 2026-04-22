"""Load merged climate JSON from Supabase Storage into a database table.

Usage:
    cd pipeline
    uv run python scripts/load_climate_to_etl_raw.py --table etl_raw --path ss:///etl-raw/climate/all_cities.json
"""

import argparse
import hashlib
import json
import os
from pathlib import Path
from urllib.request import Request, urlopen

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / ".env", override=False)

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
CHUNK_SIZE = 5


def storage_download(bucket, path):
    url = f"{SUPABASE_URL}/storage/v1/object/{bucket}/{path}"
    req = Request(url, headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
    })
    with urlopen(req) as resp:
        return json.loads(resp.read())


def upsert_rows(table, rows):
    url = f"{SUPABASE_URL}/rest/v1/{table}"
    data = json.dumps(rows).encode()
    req = Request(url, data=data, method="POST", headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    })
    with urlopen(req):
        pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--table", required=True, help="Target table name")
    parser.add_argument("--path", required=True, help="Storage path (e.g. ss:///etl-raw/climate/all_cities.json)")
    args = parser.parse_args()

    path = args.path.removeprefix("ss:///")
    bucket = path.split("/", 1)[0]
    object_path = path.split("/", 1)[1]

    print(f"Downloading {bucket}/{object_path}...")
    entries = storage_download(bucket, object_path)
    print(f"Loaded {len(entries)} entries")

    rows = []
    for payload in entries:
        payload_hash = hashlib.sha256(json.dumps(payload).encode()).hexdigest()
        rows.append({
            "source": "open-meteo-archive",
            "payload_hash": payload_hash,
            "payload": payload,
        })

    for i in range(0, len(rows), CHUNK_SIZE):
        chunk = rows[i:i + CHUNK_SIZE]
        try:
            upsert_rows(args.table, chunk)
            print(f"  chunk {i+1}-{i+len(chunk)} ok")
        except Exception as e:
            print(f"  chunk {i+1}-{i+len(chunk)} error: {e}")

    print("Done.")


if __name__ == "__main__":
    main()
