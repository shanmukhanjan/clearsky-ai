"""
ClearSky AI — Global XGBoost Trainer

Trains single, global XGBoost regression models for 24h, 48h, and 72h AQI forecasting.
Learns from latitude, longitude, and worldwide data patterns.
"""

import os
import json
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score

DATA_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_DIR = os.path.dirname(__file__)

# The expected features, now including latitude and longitude
FEATURES = [
    "latitude", "longitude",
    "pm25", "pm10", "no2", "so2", "o3", "co",
    "temperature", "humidity", "wind_speed", "wind_direction",
    "pressure", "precipitation", "uv_index",
    "hour", "weekday", "month", "season",
    "pm25_rolling_6h", "pm25_rolling_24h", "temp_rolling_6h",
    "low_wind_flag", "high_humidity_flag", "smog_risk_flag"
]

def load_and_preprocess() -> pd.DataFrame:
    data_path = os.path.join(DATA_DIR, "data", "global_training_data.json")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Missing data file: {data_path}. Run global_dataset_builder.py first.")

    with open(data_path, "r") as f:
        raw = json.load(f)
    
    df = pd.DataFrame(raw["records"])

    # Coerce all columns to numeric (fixes object-type columns like uv_index)
    for col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # Sort by coordinates then timestamp so rolling operations work correctly
    df = df.sort_values(by=["latitude", "longitude", "timestamp"])

    # Basic imputation
    df = df.ffill().bfill().fillna(0)

    # Feature engineering (grouped by location to avoid mixing rolling averages across cities)
    gb = df.groupby(["latitude", "longitude"])
    df["pm25_rolling_6h"] = gb["pm25"].transform(lambda x: x.rolling(window=6, min_periods=1).mean())
    df["pm25_rolling_24h"] = gb["pm25"].transform(lambda x: x.rolling(window=24, min_periods=1).mean())
    df["temp_rolling_6h"] = gb["temperature"].transform(lambda x: x.rolling(window=6, min_periods=1).mean())
    
    # Risk flags
    df["low_wind_flag"] = (df["wind_speed"] < 5).astype(int)
    df["high_humidity_flag"] = (df["humidity"] > 70).astype(int)
    df["smog_risk_flag"] = ((df["pm25"] > 50) & (df["wind_speed"] < 5) & (df["humidity"] > 60)).astype(int)
    
    # Target variables (Future AQI)
    df["target_24h"] = gb["pm25"].shift(-24)
    df["target_48h"] = gb["pm25"].shift(-48)
    df["target_72h"] = gb["pm25"].shift(-72)

    # Drop rows with NaN targets at the end
    df = df.dropna(subset=["target_24h", "target_48h", "target_72h"])
    return df

def train_model(X, y, horizon_name):
    print(f"\nTraining Global XGBoost Model for {horizon_name}...")
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    model = xgb.XGBRegressor(
        n_estimators=300,        # More estimators for global data
        learning_rate=0.05,
        max_depth=6,             # Deeper trees to capture geographical interactions
        subsample=0.8,
        colsample_bytree=0.8,
        objective="reg:squarederror",
        random_state=42,
        early_stopping_rounds=20
    )

    model.fit(
        X_train, y_train,
        eval_set=[(X_test, y_test)],
        verbose=False
    )

    preds = model.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    r2 = r2_score(y_test, preds)

    print(f"{horizon_name} Model trained. MAE: {mae:.2f}, R2: {r2:.2f}")

    # Save
    out_path = os.path.join(MODEL_DIR, f"global_xgb_{horizon_name}.json")
    model.save_model(out_path)
    print(f"   Saved to {out_path}")
    return True

def run_global_training():
    try:
        df = load_and_preprocess()
        X = df[FEATURES]
        
        y_24h = df["target_24h"]
        y_48h = df["target_48h"]
        y_72h = df["target_72h"]

        train_model(X, y_24h, "24h")
        train_model(X, y_48h, "48h")
        train_model(X, y_72h, "72h")

        return True
    except Exception as e:
        print(f"Training failed: {e}")
        return False

if __name__ == "__main__":
    run_global_training()
