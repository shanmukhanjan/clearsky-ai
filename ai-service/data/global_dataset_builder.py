"""
ClearSky AI — Global Data Collector & Builder

Fetches historical air pollution and weather data for a diverse set of global cities.
Builds a unified global training dataset for the XGBoost model.

Sources:
  - OpenWeather Air Pollution History API (pollutants)
  - Open-Meteo Historical Weather API (weather features)

Usage:
  python data/global_dataset_builder.py --days 180
"""

import os
import json
import time
import argparse
import requests
from datetime import datetime, timedelta, timezone

DATA_DIR = os.path.dirname(__file__)
OPENWEATHER_KEY = os.environ.get("OPENWEATHER_API_KEY")

# Diverse global cities (various climates, pollution levels, latitudes)
GLOBAL_CITIES = [
    {"name": "Delhi", "lat": 28.6139, "lon": 77.2090},
    {"name": "Beijing", "lat": 39.9042, "lon": 116.4074},
    {"name": "London", "lat": 51.5074, "lon": -0.1278},
    {"name": "Los Angeles", "lat": 34.0522, "lon": -118.2437},
    {"name": "Sydney", "lat": -33.8688, "lon": 151.2093},
    {"name": "Nairobi", "lat": -1.2921, "lon": 36.8219},
    {"name": "Reykjavik", "lat": 64.1466, "lon": -21.9426},
    {"name": "Tokyo", "lat": 35.6762, "lon": 139.6503},
    {"name": "Sao Paulo", "lat": -23.5505, "lon": -46.6333},
    {"name": "Cairo", "lat": 30.0444, "lon": 31.2357},
    {"name": "Moscow", "lat": 55.7558, "lon": 37.6173},
    {"name": "Mumbai", "lat": 19.0760, "lon": 72.8777},
]

# ── Fetching Data ────────────────────────────────────────────────
def fetch_pollution_history(lat: float, lon: float, start_ts: int, end_ts: int) -> list:
    """Fetch hourly pollution data from OpenWeather History API."""
    url = "http://api.openweathermap.org/data/2.5/air_pollution/history"
    params = {"lat": lat, "lon": lon, "start": start_ts, "end": end_ts, "appid": OPENWEATHER_KEY}
    try:
        r = requests.get(url, params=params, timeout=30)
        r.raise_for_status()
        data = r.json()
        records = []
        for entry in data.get("list", []):
            comp = entry.get("components", {})
            records.append({
                "timestamp": entry["dt"],
                "pm25": comp.get("pm2_5"),
                "pm10": comp.get("pm10"),
                "no2": comp.get("no2"),
                "so2": comp.get("so2"),
                "o3": comp.get("o3"),
                "co": comp.get("co"),
            })
        return records
    except Exception as e:
        print(f"       ⚠ Pollution fetch failed: {e}")
        return []

def fetch_weather_history(lat: float, lon: float, start_date: str, end_date: str) -> list:
    """Fetch hourly weather from Open-Meteo Historical API."""
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": lat, "longitude": lon,
        "start_date": start_date, "end_date": end_date,
        "hourly": "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure,precipitation,uv_index",
        "timezone": "UTC",
    }
    try:
        r = requests.get(url, params=params, timeout=60)
        r.raise_for_status()
        data = r.json().get("hourly", {})
        times = data.get("time", [])
        records = []
        for i, t in enumerate(times):
            dt = datetime.fromisoformat(t).replace(tzinfo=timezone.utc)
            records.append({
                "timestamp": int(dt.timestamp()),
                "temperature": data.get("temperature_2m", [None])[i] if i < len(data.get("temperature_2m", [])) else None,
                "humidity": data.get("relative_humidity_2m", [None])[i] if i < len(data.get("relative_humidity_2m", [])) else None,
                "wind_speed": data.get("wind_speed_10m", [None])[i] if i < len(data.get("wind_speed_10m", [])) else None,
                "wind_direction": data.get("wind_direction_10m", [None])[i] if i < len(data.get("wind_direction_10m", [])) else None,
                "pressure": data.get("surface_pressure", [None])[i] if i < len(data.get("surface_pressure", [])) else None,
                "precipitation": data.get("precipitation", [None])[i] if i < len(data.get("precipitation", [])) else None,
                "uv_index": data.get("uv_index", [None])[i] if i < len(data.get("uv_index", [])) else None,
            })
        return records
    except Exception as e:
        print(f"       ⚠ Weather fetch failed: {e}")
        return []

def get_season(month: int, lat: float) -> int:
    """0=Winter, 1=Spring, 2=Summer, 3=Autumn (adjusts for hemisphere)"""
    is_northern = lat >= 0
    if month in (12, 1, 2): return 0 if is_northern else 2
    if month in (3, 4, 5): return 1 if is_northern else 3
    if month in (6, 7, 8): return 2 if is_northern else 0
    return 3 if is_northern else 1

def merge_datasets(pollution: list, weather: list, lat: float, lon: float) -> list:
    """Merge pollution and weather by nearest hour, add geo/time features."""
    weather_map = {w["timestamp"]: w for w in weather}
    merged = []
    for p in pollution:
        ts = p["timestamp"]
        hour_ts = (ts // 3600) * 3600
        w = weather_map.get(hour_ts, {})
        dt = datetime.fromtimestamp(ts, tz=timezone.utc)
        record = {
            **p,
            "latitude": lat,
            "longitude": lon,
            "temperature": w.get("temperature"),
            "humidity": w.get("humidity"),
            "wind_speed": w.get("wind_speed"),
            "wind_direction": w.get("wind_direction"),
            "pressure": w.get("pressure"),
            "precipitation": w.get("precipitation"),
            "uv_index": w.get("uv_index"),
            "hour": dt.hour,
            "weekday": dt.weekday(),
            "month": dt.month,
            "season": get_season(dt.month, lat),
        }
        merged.append(record)
    return merged

def build_global_dataset(days: int = 180):
    end = datetime.now(timezone.utc)
    start = end - timedelta(days=days)
    start_ts = int(start.timestamp())
    end_ts = int(end.timestamp())
    start_str = start.strftime("%Y-%m-%d")
    end_str = end.strftime("%Y-%m-%d")

    all_records = []

    print(f"Building global dataset from {len(GLOBAL_CITIES)} cities ({days} days)...")
    for city in GLOBAL_CITIES:
        print(f"\nCollecting data for {city['name']} ({city['lat']}, {city['lon']})...")
        
        # Pollution
        pollution = []
        chunk_start = start_ts
        while chunk_start < end_ts:
            chunk_end = min(chunk_start + 30 * 86400, end_ts)
            chunk = fetch_pollution_history(city['lat'], city['lon'], chunk_start, chunk_end)
            pollution.extend(chunk)
            chunk_start = chunk_end
            time.sleep(1) # Rate limit
            
        print(f"       -> {len(pollution)} pollution records")

        # Weather
        weather = fetch_weather_history(city['lat'], city['lon'], start_str, end_str)
        print(f"       -> {len(weather)} weather records")

        # Merge
        merged = merge_datasets(pollution, weather, city['lat'], city['lon'])
        print(f"       -> {len(merged)} merged records")
        all_records.extend(merged)

    out_path = os.path.join(DATA_DIR, "global_training_data.json")
    with open(out_path, "w") as f:
        json.dump({"collected_at": datetime.now(timezone.utc).isoformat(), "records": all_records}, f)
    print(f"\nSaved global dataset to {out_path} ({len(all_records)} total records)")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Collect global AQI training data")
    parser.add_argument("--days", type=int, default=180, help="Days of history")
    args = parser.parse_args()
    build_global_dataset(args.days)
