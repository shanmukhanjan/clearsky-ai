"""
ClearSky AI - Global AQI Predictor

Loads the pre-trained global XGBoost models and provides inference
based on real-time features including latitude and longitude.
"""

import os
import numpy as np
import xgboost as xgb
import pandas as pd

MODEL_DIR = os.path.dirname(__file__)

class AQIPredictor:
    def __init__(self):
        self.model_24h = None
        self.model_48h = None
        self.model_72h = None
        self.model_loaded = False
        
        # Must match trainer features exactly
        self.features = [
            "latitude", "longitude",
            "pm25", "pm10", "no2", "so2", "o3", "co",
            "temperature", "humidity", "wind_speed", "wind_direction",
            "pressure", "precipitation", "uv_index",
            "hour", "weekday", "month", "season",
            "pm25_rolling_6h", "pm25_rolling_24h", "temp_rolling_6h",
            "low_wind_flag", "high_humidity_flag", "smog_risk_flag"
        ]
        
        self._load_models()

    def _load_models(self):
        try:
            m24 = os.path.join(MODEL_DIR, "global_xgb_24h.json")
            m48 = os.path.join(MODEL_DIR, "global_xgb_48h.json")
            m72 = os.path.join(MODEL_DIR, "global_xgb_72h.json")

            if os.path.exists(m24) and os.path.exists(m48) and os.path.exists(m72):
                self.model_24h = xgb.Booster()
                self.model_24h.load_model(m24)
                
                self.model_48h = xgb.Booster()
                self.model_48h.load_model(m48)
                
                self.model_72h = xgb.Booster()
                self.model_72h.load_model(m72)
                
                self.model_loaded = True
                print("OK: Global XGBoost models loaded successfully.")
            else:
                print("WARN: Global XGBoost models not found. Will use heuristic fallback.")
                self.model_loaded = False
        except Exception as e:
            print(f"ERR: Error loading global models: {e}")
            self.model_loaded = False

    def predict(self, current_aqi: float, features_dict: dict) -> dict:
        """
        Returns AQI prediction.
        features_dict must contain all keys in self.features.
        """
        if self.model_loaded:
            # XGBoost prediction
            df = pd.DataFrame([features_dict])
            df = df[self.features]
            dmatrix = xgb.DMatrix(df)
            
            pred_24 = float(self.model_24h.predict(dmatrix)[0])
            pred_48 = float(self.model_48h.predict(dmatrix)[0])
            pred_72 = float(self.model_72h.predict(dmatrix)[0])

            next24 = self._pm25_to_aqi(pred_24)
            next48 = self._pm25_to_aqi(pred_48)
            next72 = self._pm25_to_aqi(pred_72)

            # Safety Validation: Avoid NaN, negatives, or extreme spikes
            def safe_val(v, fallback):
                if v is None or np.isnan(v) or v < 0: 
                    return fallback
                # Prevent unrealistic spikes (e.g., jumping from 50 to 500 in 24h)
                max_allowed = fallback * 2.5 + 50
                min_allowed = fallback * 0.3
                v = max(min_allowed, min(max_allowed, v))
                return max(0, min(500, int(v)))

            next24 = safe_val(next24, current_aqi)
            next48 = safe_val(next48, next24)
            next72 = safe_val(next72, next48)

            trend = "Rising" if next24 > current_aqi * 1.05 else "Improving" if next24 < current_aqi * 0.95 else "Stable"
            
            # Confidence Categorization based on data completeness and weather extremes
            confidence = "High"
            wind = features_dict.get("wind_speed", 10)
            if features_dict.get("temperature", 20) == 0 or wind == 0:
                confidence = "Medium"
            if wind > 30 or current_aqi > 300:
                confidence = "Low"

            return {
                "next6Hours": int(current_aqi + (next24 - current_aqi) * 0.25),
                "next12Hours": int(current_aqi + (next24 - current_aqi) * 0.5),
                "next24Hours": next24,
                "next48Hours": next48,
                "next72Hours": next72,
                "trend": trend,
                "confidence": confidence,
                "model": "Global XGBoost"
            }
        else:
            # Heuristic fallback (Physics-based)
            pm25 = features_dict.get("pm25", current_aqi)
            if pm25 is None or np.isnan(pm25):
                pm25 = current_aqi
                
            wind = features_dict.get("wind_speed", 10)
            if wind is None or np.isnan(wind):
                wind = 10
            
            factor = 1.0
            if wind < 2: factor *= 1.1
            elif wind > 15: factor *= 0.9
            
            next24 = max(0, min(500, int(pm25 * factor)))
            trend = "Rising" if next24 > pm25 else "Improving"
            
            return {
                "next6Hours": current_aqi,
                "next12Hours": current_aqi,
                "next24Hours": next24,
                "next48Hours": max(0, int(next24 * 0.95)),
                "next72Hours": max(0, int(next24 * 0.9)),
                "trend": trend,
                "confidence": "Low",
                "model": "Heuristic Fallback"
            }

    def _pm25_to_aqi(self, pm25: float) -> float:
        """Rough EPA PM2.5 to AQI conversion"""
        if pm25 is None or np.isnan(pm25) or pm25 < 0:
            return 0
        if pm25 <= 12.0: return (50/12.0) * pm25
        elif pm25 <= 35.4: return ((100-51)/(35.4-12.1)) * (pm25-12.1) + 51
        elif pm25 <= 55.4: return ((150-101)/(55.4-35.5)) * (pm25-35.5) + 101
        elif pm25 <= 150.4: return ((200-151)/(150.4-55.5)) * (pm25-55.5) + 151
        elif pm25 <= 250.4: return ((300-201)/(250.4-150.5)) * (pm25-150.5) + 201
        elif pm25 <= 350.4: return ((400-301)/(350.4-250.5)) * (pm25-250.5) + 301
        else: return ((500-401)/(500.4-350.5)) * (pm25-350.5) + 401
