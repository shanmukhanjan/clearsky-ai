"""
ClearSky AI — Data Preprocessor / Cleaner

Handles cleaning, normalization, and feature engineering for incoming API data
before passing to the XGBoost predictor.
"""

import pandas as pd
import numpy as np
from datetime import datetime, timezone


# Expected raw feature columns from API
RAW_COLS = [
    "latitude", "longitude",
    "pm25", "pm10", "co", "no2", "so2", "o3",
    "temperature", "humidity", "wind_speed", "wind_direction",
    "pressure", "precipitation", "uv_index",
]

# Safe ranges for outlier capping
SAFE_RANGES = {
    "latitude": (-90, 90), "longitude": (-180, 180),
    "pm25": (0, 1000), "pm10": (0, 1000), "co": (0, 50000),
    "no2": (0, 1000), "so2": (0, 1500), "o3": (0, 600),
    "temperature": (-50, 60), "humidity": (0, 100),
    "wind_speed": (0, 100), "wind_direction": (0, 360),
    "pressure": (800, 1100), "precipitation": (0, 500),
    "uv_index": (0, 15),
}

# Default imputation values (global median approximations)
DEFAULTS = {
    "latitude": 0, "longitude": 0,
    "pm25": 25, "pm10": 40, "co": 500, "no2": 20, "so2": 10, "o3": 40,
    "temperature": 25, "humidity": 55, "wind_speed": 8,
    "wind_direction": 180, "pressure": 1013, "precipitation": 0, "uv_index": 3,
}


def clean_data(raw_data: dict) -> pd.DataFrame:
    """
    Cleans raw API data:
    1. Ensures all expected columns exist
    2. Fills missing values with safe defaults
    3. Caps outliers to safe ranges
    4. Adds time features (hour, weekday, month, season)
    5. Adds engineered risk flags and advanced meteorological derived features
    """
    df = pd.DataFrame([raw_data])

    # Ensure expected columns exist
    for col in RAW_COLS:
        if col not in df.columns:
            df[col] = DEFAULTS.get(col, 0.0)

    # Convert to numeric, coerce errors
    for col in RAW_COLS:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Impute missing with defaults
    for col in RAW_COLS:
        df[col] = df[col].fillna(DEFAULTS.get(col, 0.0))

    # Cap outliers
    for col, (lo, hi) in SAFE_RANGES.items():
        if col in df.columns:
            df[col] = df[col].clip(lo, hi)

    # Add time features
    now = datetime.now(timezone.utc)
    df["hour"] = now.hour
    df["weekday"] = now.weekday()
    df["month"] = now.month
    df["season"] = _get_season(now.month)

    # Engineered features (matching trainer expectations)
    # Since we only get point-in-time data here, we approximate rolling features
    df["pm25_rolling_6h"] = df["pm25"] * 0.95 + 1.0
    df["pm25_rolling_24h"] = df["pm25"] * 0.90 + 2.0
    df["temp_rolling_6h"] = df["temperature"]
    
    # Flags and Thresholds
    df["low_wind_flag"] = (df["wind_speed"] < 5).astype(int)
    df["high_humidity_flag"] = (df["humidity"] > 70).astype(int)
    
    # Smog risk formula: High PM2.5 + Low Wind + High Humidity
    df["smog_risk_flag"] = (
        (df["pm25"] > 60) & (df["wind_speed"] < 4) & (df["humidity"] > 65)
    ).astype(int)

    return df


def _get_season(month: int) -> int:
    """0=Winter, 1=Spring, 2=Summer, 3=Autumn"""
    if month in (12, 1, 2): return 0
    if month in (3, 4, 5): return 1
    if month in (6, 7, 8): return 2
    return 3
