"""
ClearSky AI — Historical Data Collector

Fetches historical air pollution and weather data for XGBoost training.
Sources:
  - OpenWeather Air Pollution History API (pollutants)
  - Open-Meteo Historical Weather API (weather features)

Usage:
  python data/collector.py --city "Hyderabad" --days 365
"""

import os
import json
import time
import argparse
import requests
from datetime import datetime, timedelta, timezone

DATA_DIR = os.path.join(os.path.dirname(__file__))
OPENWEATHER_KEY = os.environ.get("OPENWEATHER_API_KEY")
# ── Geocoding ──────────────────────────────────────────────────────
def geocode_city(city_name: str) -> dict:
    """Resolve city name to lat/lon via Nominatim."""
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": city_name, "format": "json", "limit": 1}
    headers = {"User-Agent": "ClearSkyAI/1.0"}
    r = requests.get(url, params=params, headers=headers, timeout=10)
    r.raise_for_status()
    results = r.json()
    if not results:
        raise ValueError(f"City not found: {city_name}")
    return {"lat": float(results[0]["lat"]), "lon": float(results[0]["lon"]),
            "name": results[0].get("display_name", city_name)}


# ── OpenWeather Historical Pollution ──────────────────────────────
def fetch_pollution_history(lat: float, lon: float, start_ts: int, end_ts: int) -> list:
    """Fetch hourly pollution data from OpenWeather History API."""
    url = "http://api.openweathermap.org/data/2.5/air_pollution/history"
    params = {"lat": lat, "lon": lon, "start": start_ts, "end": end_ts,
              "appid": OPENWEATHER_KEY}
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


# ── Open-Meteo Historical Weather ────────────────────────────────
def fetch_weather_history(lat: float, lon: float, start_date: str, end_date: str) -> list:
    """Fetch hourly weather from Open-Meteo Historical API (free, no key)."""
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": lat, "longitude": lon,
        "start_date": start_date, "end_date": end_date,
        "hourly": "temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,surface_pressure,precipitation,uv_index",
        "timezone": "UTC",
    }
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


# ── Merge & Save ─────────────────────────────────────────────────
def merge_datasets(pollution: list, weather: list) -> list:
    """Merge pollution and weather by nearest hour timestamp."""
    weather_map = {w["timestamp"]: w for w in weather}
    merged = []
    for p in pollution:
        ts = p["timestamp"]
        # Round to nearest hour
        hour_ts = (ts // 3600) * 3600
        w = weather_map.get(hour_ts, {})
        dt = datetime.fromtimestamp(ts, tz=timezone.utc)
        record = {
            **p,
            "temperature": w.get("temperature"),
            "humidity": w.get("humidity"),
            "wind_speed": w.get("wind_speed"),
            "wind_direction": w.get("wind_direction"),
            "pressure": w.get("pressure"),
            "precipitation": w.get("precipitation"),
            "uv_index": w.get("uv_index"),
            # Time features
            "hour": dt.hour,
            "weekday": dt.weekday(),
            "month": dt.month,
            "season": get_season(dt.month),
        }
        merged.append(record)
    return merged


def get_season(month: int) -> int:
    """0=Winter, 1=Spring, 2=Summer, 3=Autumn"""
    if month in (12, 1, 2): return 0
    if month in (3, 4, 5): return 1
    if month in (6, 7, 8): return 2
    return 3


def collect(city: str, days: int = 365):
    """Main collection pipeline."""
    print(f"[1/4] Geocoding '{city}'...")
    geo = geocode_city(city)
    lat, lon = geo["lat"], geo["lon"]
    print(f"       → {geo['name']} ({lat:.4f}, {lon:.4f})")

    end = datetime.now(timezone.utc)
    start = end - timedelta(days=days)
    start_ts = int(start.timestamp())
    end_ts = int(end.timestamp())

    # OpenWeather limits history to ~1 year; fetch in 30-day chunks
    print(f"[2/4] Fetching pollution history ({days} days)...")
    pollution = []
    chunk_start = start_ts
    while chunk_start < end_ts:
        chunk_end = min(chunk_start + 30 * 86400, end_ts)
        try:
            chunk = fetch_pollution_history(lat, lon, chunk_start, chunk_end)
            pollution.extend(chunk)
            print(f"       → fetched {len(chunk)} records")
        except Exception as e:
            print(f"       ⚠ chunk failed: {e}")
        chunk_start = chunk_end
        time.sleep(1)  # Rate limit courtesy

    print(f"[3/4] Fetching weather history...")
    start_str = start.strftime("%Y-%m-%d")
    end_str = end.strftime("%Y-%m-%d")
    weather = fetch_weather_history(lat, lon, start_str, end_str)
    print(f"       → {len(weather)} weather records")

    print(f"[4/4] Merging datasets...")
    merged = merge_datasets(pollution, weather)
    print(f"       → {len(merged)} merged records")

    # Save
    out_path = os.path.join(DATA_DIR, "training_data.json")
    with open(out_path, "w") as f:
        json.dump({"city": city, "lat": lat, "lon": lon,
                    "collected_at": datetime.now(timezone.utc).isoformat(),
                    "records": merged}, f)
    print(f"✅ Saved to {out_path} ({len(merged)} records)")
    return out_path


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Collect historical AQI training data")
    parser.add_argument("--city", default="Hyderabad", help="City name")
    parser.add_argument("--days", type=int, default=365, help="Days of history")
    args = parser.parse_args()
    collect(args.city, args.days)
