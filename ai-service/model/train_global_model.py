import os
import json
import pandas as pd
import numpy as np
import xgboost as xgb
import lightgbm as lgb
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, explained_variance_score
import optuna
import joblib

DATA_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_DIR = os.path.dirname(__file__)

FEATURES = [
    "latitude", "longitude",
    "pm25", "pm10", "co", "no2", "so2", "o3",
    "temperature", "humidity", "wind_speed", "wind_direction",
    "pressure", "precipitation", "uv_index",
    "hour", "weekday", "month", "season", "is_weekend",
    "hour_sin", "hour_cos", "lat_lon_interaction",
    "pm25_rolling_6h", "pm25_rolling_12h", "pm25_rolling_24h", "pm25_std_24h",
    "aqi_momentum", "aqi_rate_of_change",
    "temp_rolling_6h", "temp_trend", "humidity_trend",
    "wind_trend", "pressure_trend",
    "low_wind_flag", "high_humidity_flag", "smog_risk_flag"
]

def mape(y_true, y_pred):
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    non_zero = y_true != 0
    if not np.any(non_zero): return 0.0
    return np.mean(np.abs((y_true[non_zero] - y_pred[non_zero]) / y_true[non_zero])) * 100

def load_and_preprocess() -> pd.DataFrame:
    data_path = os.path.join(DATA_DIR, "data", "global_training_data.json")
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Missing data file: {data_path}. Run global_dataset_builder.py first.")

    with open(data_path, "r") as f:
        raw = json.load(f)
    
    df = pd.DataFrame(raw["records"])

    for col in df.columns:
        if col not in ["city", "country", "timestamp"]:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    
    # Sort chronologically per location
    df = df.sort_values(by=["latitude", "longitude", "timestamp"])
    df = df.ffill().bfill().fillna(0)

    # Base features
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df["hour"] = df["timestamp"].dt.hour
    df["weekday"] = df["timestamp"].dt.weekday
    df["month"] = df["timestamp"].dt.month
    df["season"] = df["month"].apply(lambda m: 0 if m in (12,1,2) else 1 if m in (3,4,5) else 2 if m in (6,7,8) else 3)
    df["is_weekend"] = (df["weekday"] >= 5).astype(int)
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24.0)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24.0)
    df["lat_lon_interaction"] = df["latitude"] * df["longitude"]

    # Rolling and trend features
    gb = df.groupby(["latitude", "longitude"])
    
    # PM2.5 trends
    df["pm25_rolling_6h"] = gb["pm25"].transform(lambda x: x.rolling(6, min_periods=1).mean())
    df["pm25_rolling_12h"] = gb["pm25"].transform(lambda x: x.rolling(12, min_periods=1).mean())
    df["pm25_rolling_24h"] = gb["pm25"].transform(lambda x: x.rolling(24, min_periods=1).mean())
    df["pm25_std_24h"] = gb["pm25"].transform(lambda x: x.rolling(24, min_periods=1).std().fillna(0))
    df["aqi_momentum"] = gb["pm25"].diff(periods=6).fillna(0)
    df["aqi_rate_of_change"] = (gb["pm25"].diff(periods=24) / 24.0).fillna(0)

    # Weather trends
    df["temp_rolling_6h"] = gb["temperature"].transform(lambda x: x.rolling(6, min_periods=1).mean())
    df["temp_trend"] = gb["temperature"].diff(periods=6).fillna(0)
    df["humidity_trend"] = gb["humidity"].diff(periods=6).fillna(0)
    df["wind_trend"] = gb["wind_speed"].diff(periods=6).fillna(0)
    df["pressure_trend"] = gb["pressure"].diff(periods=6).fillna(0)

    # Risk flags
    df["low_wind_flag"] = (df["wind_speed"] < 5).astype(int)
    df["high_humidity_flag"] = (df["humidity"] > 70).astype(int)
    df["smog_risk_flag"] = ((df["pm25"] > 50) & (df["wind_speed"] < 5) & (df["humidity"] > 60)).astype(int)

    # Targets
    df["target_24h"] = gb["pm25"].shift(-24)
    df["target_48h"] = gb["pm25"].shift(-48)
    df["target_72h"] = gb["pm25"].shift(-72)

    df = df.dropna(subset=["target_24h", "target_48h", "target_72h"])
    
    # Ensure all features exist
    for f in FEATURES:
        if f not in df.columns:
            df[f] = 0
            
    return df

def optimize_hyperparameters(X, y):
    """Use Optuna with TimeSeriesSplit to find best model and params."""
    print("Running Optuna Optimization...")
    tscv = TimeSeriesSplit(n_splits=3)

    def objective(trial):
        model_type = trial.suggest_categorical("model_type", ["lightgbm", "xgboost", "rf"])
        
        if model_type == "lightgbm":
            params = {
                "n_estimators": trial.suggest_int("n_estimators", 100, 500),
                "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.2, log=True),
                "max_depth": trial.suggest_int("max_depth", 4, 10),
                "num_leaves": trial.suggest_int("num_leaves", 20, 100),
                "subsample": trial.suggest_float("subsample", 0.6, 1.0),
                "colsample_bytree": trial.suggest_float("colsample_bytree", 0.6, 1.0),
                "random_state": 42,
                "verbose": -1
            }
            model = lgb.LGBMRegressor(**params)
        elif model_type == "xgboost":
            params = {
                "n_estimators": trial.suggest_int("n_estimators", 100, 500),
                "learning_rate": trial.suggest_float("learning_rate", 0.01, 0.2, log=True),
                "max_depth": trial.suggest_int("max_depth", 4, 10),
                "subsample": trial.suggest_float("subsample", 0.6, 1.0),
                "colsample_bytree": trial.suggest_float("colsample_bytree", 0.6, 1.0),
                "random_state": 42
            }
            model = xgb.XGBRegressor(**params)
        else:
            params = {
                "n_estimators": trial.suggest_int("n_estimators", 50, 200),
                "max_depth": trial.suggest_int("max_depth", 5, 15),
                "min_samples_split": trial.suggest_int("min_samples_split", 2, 10),
                "random_state": 42,
                "n_jobs": -1
            }
            model = RandomForestRegressor(**params)

        rmses = []
        for train_idx, val_idx in tscv.split(X):
            X_tr, X_va = X.iloc[train_idx], X.iloc[val_idx]
            y_tr, y_va = y.iloc[train_idx], y.iloc[val_idx]
            
            model.fit(np.asarray(X_tr), np.asarray(y_tr))
            preds = model.predict(np.asarray(X_va))
            rmse = np.sqrt(mean_squared_error(y_va, preds))
            rmses.append(rmse)
            
        return np.mean(rmses)

    study = optuna.create_study(direction="minimize")
    # Reduced trials for speed in this run, normally 50+
    study.optimize(objective, n_trials=10)
    
    print("Best Trial:", study.best_trial.params)
    return study.best_trial.params

def train_and_evaluate(X, y, horizon, best_params):
    print(f"\nTraining Final Point Model for {horizon}...")
    
    tscv = TimeSeriesSplit(n_splits=5)
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

    model_type = best_params.pop("model_type")
    
    if model_type == "lightgbm":
        model = lgb.LGBMRegressor(**best_params, random_state=42, verbose=-1)
    elif model_type == "xgboost":
        model = xgb.XGBRegressor(**best_params, random_state=42)
    else:
        model = RandomForestRegressor(**best_params, random_state=42, n_jobs=-1)

    model.fit(np.asarray(X_train), np.asarray(y_train))
    preds = model.predict(np.asarray(X_test))
    
    # Calculate Metrics
    mae = mean_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    mape_val = mape(y_test, preds)
    r2 = r2_score(y_test, preds)
    evs = explained_variance_score(y_test, preds)
    
    print(f"Metrics {horizon} - MAE: {mae:.2f} | RMSE: {rmse:.2f} | MAPE: {mape_val:.2f}% | R2: {r2:.3f} | EVS: {evs:.3f}")

    # Quantile Regression for Confidence Bounds
    # We use LightGBM for quantiles because it natively supports it efficiently.
    print(f"Training Quantile Bounds for {horizon}...")
    lgb_params = {k: v for k, v in best_params.items() if k in ["n_estimators", "learning_rate", "max_depth", "num_leaves"]}
    
    q_lower = lgb.LGBMRegressor(objective='quantile', alpha=0.1, **lgb_params, random_state=42, verbose=-1)
    q_lower.fit(np.asarray(X_train), np.asarray(y_train))
    
    q_upper = lgb.LGBMRegressor(objective='quantile', alpha=0.9, **lgb_params, random_state=42, verbose=-1)
    q_upper.fit(np.asarray(X_train), np.asarray(y_train))

    # Save Models
    joblib.dump(model, os.path.join(MODEL_DIR, f"model_{horizon}.pkl"))
    joblib.dump(q_lower, os.path.join(MODEL_DIR, f"model_{horizon}_lower.pkl"))
    joblib.dump(q_upper, os.path.join(MODEL_DIR, f"model_{horizon}_upper.pkl"))
    
    return {
        "mae": mae, "rmse": rmse, "mape": mape_val, "r2": r2, "evs": evs, "model_type": model_type
    }

def run_global_training():
    try:
        df = load_and_preprocess()
        X = df[FEATURES]
        
        metrics_report = {}

        for horizon, target_col in [("24h", "target_24h"), ("48h", "target_48h"), ("72h", "target_72h")]:
            y = df[target_col]
            
            # For speed, we optimize hyperparams on 24h and reuse for 48/72, or optimize per horizon.
            # We'll optimize per horizon for maximum accuracy.
            best_params = optimize_hyperparameters(X, y)
            metrics = train_and_evaluate(X, y, horizon, best_params)
            metrics_report[horizon] = metrics

        # Save metadata
        meta = {
            "features": FEATURES,
            "trained_at": pd.Timestamp.now().isoformat(),
            "samples": len(X),
            "metrics": metrics_report
        }
        with open(os.path.join(MODEL_DIR, "model_meta.json"), "w") as f:
            json.dump(meta, f, indent=2)

        print("\nSuccessfully trained all point and quantile models!")
        return True
    except Exception as e:
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    run_global_training()
