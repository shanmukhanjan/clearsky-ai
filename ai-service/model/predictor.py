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
        
        # CPCB India NAQI Breakpoints
        self.breakpoints = {
            "pm25": [(0,30,0,50), (30.1,60,51,100), (60.1,90,101,200), (90.1,120,201,300), (120.1,250,301,400), (250.1,500,401,500)],
            "pm10": [(0,50,0,50), (51,100,51,100), (101,250,101,200), (251,350,201,300), (351,430,301,400), (430.1,600,401,500)],
            "no2": [(0,40,0,50), (41,80,51,100), (81,180,101,200), (181,280,201,300), (281,400,301,400), (400.1,800,401,500)],
            "so2": [(0,40,0,50), (41,80,51,100), (81,380,101,200), (381,800,201,300), (801,1600,301,400), (1600.1,3200,401,500)],
            "co": [(0,1,0,50), (1.1,2,51,100), (2.1,10,101,200), (10.1,17,201,300), (17.1,34,301,400), (34.1,68,401,500)],
            "o3": [(0,50,0,50), (51,100,51,100), (101,168,101,200), (169,208,201,300), (209,748,301,400), (748.1,1500,401,500)],
            "nh3": [(0,200,0,50), (201,400,51,100), (401,800,101,200), (801,1200,201,300), (1201,1800,301,400), (1800.1,3600,401,500)]
        }

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
        for f in self.features:
            if f not in features_dict:
                features_dict[f] = 0.0

        if self.model_loaded:
            df = pd.DataFrame([features_dict])
            df = df[self.features]
            dmatrix = xgb.DMatrix(df)
            
            # 1. Predict PM2.5 Concentrations
            pm25_24 = float(self.model_24h.predict(dmatrix)[0])
            pm25_48 = float(self.model_48h.predict(dmatrix)[0])
            pm25_72 = float(self.model_72h.predict(dmatrix)[0])
        else:
            pm25_base = features_dict.get("pm25", current_aqi)
            wind = features_dict.get("wind_speed", 10)
            factor = 1.15 if wind < 2 else (0.85 if wind > 15 else 1.0)
            pm25_24 = pm25_base * factor
            pm25_48 = (pm25_24 + pm25_base) / 2
            pm25_72 = pm25_48 * 0.95

        # 2. Derive other pollutant concentrations based on PM2.5 and meteorological factors
        # In a full enterprise system, each pollutant would have its own XGBoost model.
        # Here we use historical ratios combined with current weather context.
        def derive_pollutants(pm25_pred):
            pm10_pred = pm25_pred * 2.1  # PM10 is usually ~2x PM2.5 in dusty regions
            no2_pred = pm25_pred * 0.6
            so2_pred = pm25_pred * 0.2
            co_pred = pm25_pred * 0.05 # CO is measured in mg/m3
            o3_pred = features_dict.get("o3", 30) # Ozone correlates more with sunlight (UV) than PM2.5
            if features_dict.get("uv_index", 0) > 5:
                o3_pred *= 1.2
            nh3_pred = pm25_pred * 0.1
            return {
                "pm25": pm25_pred, "pm10": pm10_pred, "no2": no2_pred,
                "so2": so2_pred, "co": co_pred, "o3": o3_pred, "nh3": nh3_pred
            }

        concs_24 = derive_pollutants(pm25_24)
        concs_48 = derive_pollutants(pm25_48)
        concs_72 = derive_pollutants(pm25_72)

        # 3. Compute exact CPCB NAQI for each timeframe
        next24 = self._compute_final_aqi(concs_24)
        next48 = self._compute_final_aqi(concs_48)
        next72 = self._compute_final_aqi(concs_72)

        # Safety Validation to avoid unrealistic jumps
        def safe_val(v, fallback):
            if v is None or np.isnan(v) or v < 0: return fallback
            max_allowed = fallback + 150
            min_allowed = max(0, fallback - 150)
            return max(0, min(500, int(max(min_allowed, min(max_allowed, v)))))

        next24 = safe_val(next24, current_aqi)
        next48 = safe_val(next48, next24)
        next72 = safe_val(next72, next48)

        trend = "Rising" if next24 > current_aqi * 1.05 else "Improving" if next24 < current_aqi * 0.95 else "Stable"
        
        confidence = "High"
        wind = features_dict.get("wind_speed", 10)
        if not self.model_loaded or wind == 0:
            confidence = "Medium"
        if wind > 30 or current_aqi > 400:
            confidence = "Low"

        return {
            "next6Hours": int(current_aqi + (next24 - current_aqi) * 0.25),
            "next12Hours": int(current_aqi + (next24 - current_aqi) * 0.5),
            "next24Hours": next24,
            "next48Hours": next48,
            "next72Hours": next72,
            "trend": trend,
            "confidence": confidence,
            "model": "Global XGBoost (Multi-Pollutant NAQI)" if self.model_loaded else "Heuristic Fallback (NAQI)"
        }

    def _compute_final_aqi(self, concentrations: dict) -> int:
        """Calculates final AQI as the max of all pollutant sub-indices according to CPCB formula."""
        indices = []
        for pol, val in concentrations.items():
            if val is None or np.isnan(val) or val < 0: continue
            bp_list = self.breakpoints.get(pol, [])
            sub_index = 0
            for (blo, bhi, ilo, ihi) in bp_list:
                if blo <= val <= bhi:
                    sub_index = ((ihi - ilo) / (bhi - blo)) * (val - blo) + ilo
                    break
                elif val > bp_list[-1][1]:
                    # Exceeds max breakpoint
                    sub_index = ((bp_list[-1][3] - bp_list[-1][2]) / (bp_list[-1][1] - bp_list[-1][0])) * (val - bp_list[-1][0]) + bp_list[-1][2]
            indices.append(sub_index)
        
        if not indices: return 0
        return int(max(indices))
