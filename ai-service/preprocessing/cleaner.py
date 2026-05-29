"""
ClearSky AI — Data Preprocessor / Cleaner
Handles cleaning, normalization, and feature engineering for incoming API data.
Uses Open-Meteo to fetch historical data for rolling averages and trends.
"""

import pandas as pd
import numpy as np
import requests
from datetime import datetime, timezone

# Expected raw feature columns from API
RAW_COLS = [
    "latitude", "longitude",
    "pm25", "pm10", "co", "no2", "so2", "o3",
    "temperature", "humidity", "wind_speed", "wind_direction",
    "pressure", "precipitation", "uv_index",
]

SAFE_RANGES = {
    "latitude": (-90, 90), "longitude": (-180, 180),
    "pm25": (0, 1000), "pm10": (0, 1000), "co": (0, 50000),
    "no2": (0, 1000), "so2": (0, 1500), "o3": (0, 600),
    "temperature": (-50, 60), "humidity": (0, 100),
    "wind_speed": (0, 100), "wind_direction": (0, 360),
    "pressure": (800, 1100), "precipitation": (0, 500),
    "uv_index": (0, 15),
}

DEFAULTS = {
    "latitude": 0, "longitude": 0,
    "pm25": 25, "pm10": 40, "co": 500, "no2": 20, "so2": 10, "o3": 40,
    "temperature": 25, "humidity": 55, "wind_speed": 8,
    "wind_direction": 180, "pressure": 1013, "precipitation": 0, "uv_index": 3,
}

def fetch_historical_trends(lat: float, lon: float) -> dict:
    """Fetch past 24h data from Open-Meteo for trend calculation."""
    try:
        url = "https://air-quality-api.open-meteo.com/v1/air-quality"
        params = {
            "latitude": lat,
            "longitude": lon,
            "hourly": "pm10,pm2_5",
            "past_days": 1,
            "forecast_days": 0
        }
        res = requests.get(url, params=params, timeout=5)
        if res.status_code == 200:
            data = res.json()["hourly"]
            pm25_hist = [x for x in data["pm2_5"] if x is not None]
            pm10_hist = [x for x in data["pm10"] if x is not None]
            
            # Weather history
            w_url = "https://api.open-meteo.com/v1/forecast"
            w_params = {
                "latitude": lat, "longitude": lon,
                "hourly": "temperature_2m,relative_humidity_2m,wind_speed_10m,surface_pressure",
                "past_days": 1, "forecast_days": 0
            }
            w_res = requests.get(w_url, params=w_params, timeout=5)
            w_data = w_res.json()["hourly"]
            temp_hist = [x for x in w_data["temperature_2m"] if x is not None]
            hum_hist = [x for x in w_data["relative_humidity_2m"] if x is not None]
            wind_hist = [x for x in w_data["wind_speed_10m"] if x is not None]
            pres_hist = [x for x in w_data["surface_pressure"] if x is not None]

            return {
                "pm25_hist": pm25_hist[-24:],
                "temp_hist": temp_hist[-24:],
                "hum_hist": hum_hist[-24:],
                "wind_hist": wind_hist[-24:],
                "pres_hist": pres_hist[-24:]
            }
    except Exception as e:
        print(f"Warn: Historical trend fetch failed: {e}")
    return {}

def clean_data(raw_data: dict) -> pd.DataFrame:
    df = pd.DataFrame([raw_data])

    for col in RAW_COLS:
        if col not in df.columns:
            df[col] = DEFAULTS.get(col, 0.0)
        df[col] = pd.to_numeric(df[col], errors="coerce")
        df[col] = df[col].fillna(DEFAULTS.get(col, 0.0))

    for col, (lo, hi) in SAFE_RANGES.items():
        if col in df.columns:
            df[col] = df[col].clip(lo, hi)

    # Base Time Features
    now = datetime.now(timezone.utc)
    df["hour"] = now.hour
    df["weekday"] = now.weekday()
    df["month"] = now.month
    df["season"] = _get_season(now.month)
    df["is_weekend"] = 1 if now.weekday() >= 5 else 0

    # Cyclical Time Encodings
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24.0)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24.0)

    # Spatial interactions
    df["lat_lon_interaction"] = df["latitude"] * df["longitude"]

    # Historical feature engineering
    lat, lon = df.iloc[0]["latitude"], df.iloc[0]["longitude"]
    hist = fetch_historical_trends(lat, lon)

    # PM2.5 features
    pm25_hist = hist.get("pm25_hist", [df.iloc[0]["pm25"]] * 24)
    df["pm25_rolling_6h"] = np.mean(pm25_hist[-6:])
    df["pm25_rolling_12h"] = np.mean(pm25_hist[-12:])
    df["pm25_rolling_24h"] = np.mean(pm25_hist)
    df["pm25_std_24h"] = np.std(pm25_hist)
    df["aqi_momentum"] = pm25_hist[-1] - pm25_hist[-6] if len(pm25_hist) >= 6 else 0
    df["aqi_rate_of_change"] = (pm25_hist[-1] - pm25_hist[-24]) / 24.0 if len(pm25_hist) >= 24 else 0

    # Weather trends
    temp_hist = hist.get("temp_hist", [df.iloc[0]["temperature"]] * 24)
    df["temp_rolling_6h"] = np.mean(temp_hist[-6:])
    df["temp_trend"] = temp_hist[-1] - temp_hist[-6] if len(temp_hist) >= 6 else 0

    hum_hist = hist.get("hum_hist", [df.iloc[0]["humidity"]] * 24)
    df["humidity_trend"] = hum_hist[-1] - hum_hist[-6] if len(hum_hist) >= 6 else 0

    wind_hist = hist.get("wind_hist", [df.iloc[0]["wind_speed"]] * 24)
    df["wind_trend"] = wind_hist[-1] - wind_hist[-6] if len(wind_hist) >= 6 else 0

    pres_hist = hist.get("pres_hist", [df.iloc[0]["pressure"]] * 24)
    df["pressure_trend"] = pres_hist[-1] - pres_hist[-6] if len(pres_hist) >= 6 else 0

    # Risk flags
    df["low_wind_flag"] = (df["wind_speed"] < 5).astype(int)
    df["high_humidity_flag"] = (df["humidity"] > 70).astype(int)
    df["smog_risk_flag"] = ((df["pm25"] > 50) & (df["wind_speed"] < 5) & (df["humidity"] > 60)).astype(int)

    return df

def _get_season(month: int) -> int:
    if month in (12, 1, 2): return 0
    if month in (3, 4, 5): return 1
    if month in (6, 7, 8): return 2
    return 3
