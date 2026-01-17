import pandas as pd
import requests
import io
import numpy as np
from PIL import Image, ImageSequence

CSV_URL = "https://s3.iiasa.ac.at/accelerator-prod/demo/Demo/sample.csv"
TIFF_URL = "https://s3.iiasa.ac.at/accelerator-prod/demo/Demo/sample.tif"

_CSV_CACHE = None
_RASTER_CACHE = None

def preload_data():
    global _CSV_CACHE, _RASTER_CACHE
    try:
        print("DEBUG: Preloading CSV...")
        resp = requests.get(CSV_URL, timeout=30)
        df = pd.read_csv(io.BytesIO(resp.content))
        df['value'] = pd.to_numeric(df['value'], errors='coerce')
        df = df.dropna(subset=['value'])
        _CSV_CACHE = df.to_dict(orient="records")
        print(f"DEBUG: CSV Cached ({len(df)} rows)")
        print("DEBUG: Preloading Raster...")
        r_resp = requests.get(TIFF_URL, timeout=120)
        r_resp.raise_for_status()
        _RASTER_CACHE = r_resp.content
        print(f"DEBUG: Raster Cached ({len(_RASTER_CACHE) / 1024 / 1024:.2f} MB)", flush=True)

    except Exception as e:
        print(f"ERROR in preload: {e}")

def get_csv_data(limit: int = 10000):
    global _CSV_CACHE
    if _CSV_CACHE:
        return _CSV_CACHE
    return []

def get_csv_summary():
    """Returns a string summary for the AI."""
    global _CSV_CACHE
    if _CSV_CACHE:
        df = pd.DataFrame(_CSV_CACHE)
        return df.describe().to_string()
    return "Data unavailable."

def get_raster_image():
    """Converts cached TIFF bytes to PNG for the browser."""
    global _RASTER_CACHE
    try:
        content = _RASTER_CACHE
        if not content:
            print("DEBUG: Cache miss for raster, downloading now...")
            resp = requests.get(TIFF_URL, timeout=60)
            resp.raise_for_status()
            content = resp.content
            _RASTER_CACHE = content

        print("DEBUG: Opening Image...", flush=True)
        Image.MAX_IMAGE_PIXELS = None

        img = Image.open(io.BytesIO(content))
        w, h = img.size
        print(f"DEBUG: Original Size: {w}x{h}", flush=True)

        # We want the max dimension to be around 1000px.
        # If image is 50,000px tall, we need to reduce by factor of 50.
        target_size = 1000
        max_dim = max(w, h)
        factor = max_dim // target_size
        
        if factor > 1:
            print(f"DEBUG: Image is big. Reducing by factor of {factor}...", flush=True)
            # .reduce() is memory-safe because it skips pixels during read
            img = img.reduce(factor)
        
        print(f"DEBUG: New Preview Size: {img.size}", flush=True)

        # Convert to Numpy for normalization
        arr = np.array(img)
        arr = np.nan_to_num(arr, nan=0.0)
        # Normalize to 0-255
        min_val, max_val = arr.min(), arr.max()
        if max_val - min_val == 0:
            arr_norm = np.zeros_like(arr, dtype='uint8')
        else:
            arr_norm = ((arr - min_val) * (255.0 / (max_val - min_val))).astype('uint8')
        
        # Save as PNG
        out_img = Image.fromarray(arr_norm)
        if out_img.mode != 'L':
            out_img = out_img.convert('L')

        buf = io.BytesIO()
        out_img.save(buf, format="PNG")
        print("DEBUG: Success! Sending Full-Map Preview.", flush=True)
        return buf.getvalue()
            
    except Exception as e:
        print(f"ERROR in get_raster_image: {e}")
        # red square on error
        img = Image.new('RGB', (100, 100), color='red')
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        return buf.getvalue()

def get_raster_stats():
    """Returns raster stats for AI context."""
    global _RASTER_CACHE
    try:
        if not _RASTER_CACHE:
            return "Raster not loaded."
            
        Image.MAX_IMAGE_PIXELS = None
        img = Image.open(io.BytesIO(_RASTER_CACHE))
        
        w, h = img.size
        target_size = 1000
        max_dim = max(w, h)
        factor = max_dim // target_size
        
        if factor > 1:
            img = img.reduce(factor)
            
        arr = np.array(img)
        
        # Calculate stats (ignoring NaNs if any)
        # We use nanmin/nanmax to avoid getting "nan" as a result
        return {
            "min": float(np.nanmin(arr)),
            "max": float(np.nanmax(arr)),
            "mean": float(np.nanmean(arr)),
            "approx_resolution": f"{img.size[0]}x{img.size[1]}"
        }
    except:
        return "Raster stats unavailable."