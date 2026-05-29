"""
ClearSky AI - Global AQI Predictor & Explainer
Loads the pre-trained point and quantile models to provide inference,
confidence intervals, and SHAP-based explainability.
"""

import os
import numpy as np
import pandas as pd
import joblib
import shap

MODEL_DIR = os.path.dirname(__file__)

class AQIPredictor:
    def __init__(self):
        self.models = {}
        self.quantiles = {}
        self.explainer = None
        self.model_loaded = False
        
        # Load meta to get features list
        meta_path = os.path.join(MODEL_DIR, "model_meta.json")
        if os.path.exists(meta_path):
            import json
            with open(meta_path, "r") as f:
                self.meta = json.load(f)
            self.features = self.meta.get("features", [])
        else:
            self.features = []

        self._load_models()

    def _load_models(self):
        try:
            for h in ["24h", "48h", "72h"]:
                m_path = os.path.join(MODEL_DIR, f"model_{h}.pkl")
                l_path = os.path.join(MODEL_DIR, f"model_{h}_lower.pkl")
                u_path = os.path.join(MODEL_DIR, f"model_{h}_upper.pkl")

                if os.path.exists(m_path):
                    self.models[h] = joblib.load(m_path)
                    
                    if os.path.exists(l_path) and os.path.exists(u_path):
                        self.quantiles[h] = {
                            "lower": joblib.load(l_path),
                            "upper": joblib.load(u_path)
                        }

            if "24h" in self.models:
                self.model_loaded = True
                
                # Setup SHAP explainer for 24h model
                model_24 = self.models["24h"]
                try:
                    # Try TreeExplainer for XGBoost/LightGBM/RF
                    self.explainer = shap.TreeExplainer(model_24)
                except:
                    self.explainer = None
                    
                print("OK: Point and Quantile models loaded successfully.")
            else:
                print("WARN: Models not found. Using heuristic fallback.")
                self.model_loaded = False
        except Exception as e:
            print(f"ERR: Error loading models: {e}")
            import traceback
            traceback.print_exc()
            self.model_loaded = False

    def predict(self, current_aqi: float, features_dict: dict) -> dict:
        if self.model_loaded:
            df = pd.DataFrame([features_dict])
            
            # Ensure features match EXACTLY
            for f in self.features:
                if f not in df.columns:
                    df[f] = 0.0
            df = df[self.features]

            res = {}
            for h in ["24h", "48h", "72h"]:
                if h in self.models:
                    # The models predict PM2.5, we need to convert to AQI
                    pm25_pred = float(self.models[h].predict(df)[0])
                    res[h] = self._pm25_to_aqi(pm25_pred)
                    
                    if h in self.quantiles:
                        p_lower = float(self.quantiles[h]["lower"].predict(df)[0])
                        p_upper = float(self.quantiles[h]["upper"].predict(df)[0])
                        res[f"{h}_lower"] = self._pm25_to_aqi(p_lower)
                        res[f"{h}_upper"] = self._pm25_to_aqi(p_upper)
                    else:
                        res[f"{h}_lower"] = max(0, res[h] * 0.8)
                        res[f"{h}_upper"] = res[h] * 1.2
                else:
                    res[h] = current_aqi
                    res[f"{h}_lower"] = current_aqi
                    res[f"{h}_upper"] = current_aqi

            # Calculate mathematically derived confidence score for 24h
            # Narrower interval = higher confidence
            aqi_24 = res["24h"]
            width = res["24h_upper"] - res["24h_lower"]
            
            if aqi_24 <= 0:
                conf = 100
            else:
                # 0 width = 100%. Width = 100% of value = 0% confidence
                ratio = width / max(1, aqi_24)
                conf = max(0, min(100, int((1.0 - ratio) * 100)))
                
            trend = "Rising" if aqi_24 > current_aqi * 1.05 else "Improving" if aqi_24 < current_aqi * 0.95 else "Stable"

            return {
                "next6Hours": int(current_aqi + (aqi_24 - current_aqi) * 0.25),
                "next12Hours": int(current_aqi + (aqi_24 - current_aqi) * 0.5),
                "next24Hours": aqi_24,
                "next48Hours": res["48h"],
                "next72Hours": res["72h"],
                "bounds24h": [res["24h_lower"], res["24h_upper"]],
                "bounds48h": [res["48h_lower"], res["48h_upper"]],
                "bounds72h": [res["72h_lower"], res["72h_upper"]],
                "trend": trend,
                "confidenceScore": conf,
                "model": "Ensemble ML (Optuna Tuned)"
            }
        else:
            return self._heuristic_fallback(current_aqi, features_dict)
            
    def explain(self, features_dict: dict) -> dict:
        """Returns SHAP feature importances for a single prediction."""
        if not self.model_loaded or self.explainer is None:
            return {"error": "Explainer not available. Train models first."}
            
        df = pd.DataFrame([features_dict])
        for f in self.features:
            if f not in df.columns: df[f] = 0.0
        df = df[self.features]
        
        shap_values = self.explainer.shap_values(df)
        
        # If it's a list (multiclass or similar), take the first class
        if isinstance(shap_values, list):
            shap_values = shap_values[0]
            
        contributions = dict(zip(self.features, shap_values[0]))
        # Sort by absolute magnitude
        sorted_contributions = sorted(contributions.items(), key=lambda x: abs(x[1]), reverse=True)
        
        return {
            "top_features": [
                {"feature": k, "impact": float(v)} for k, v in sorted_contributions[:10]
            ],
            "base_value": float(self.explainer.expected_value[0] if isinstance(self.explainer.expected_value, (list, np.ndarray)) else self.explainer.expected_value)
        }

    def _heuristic_fallback(self, current_aqi, features_dict):
        pm25 = features_dict.get("pm25", current_aqi)
        if pm25 is None or np.isnan(pm25): pm25 = current_aqi
        wind = features_dict.get("wind_speed", 10)
        factor = 1.1 if wind < 2 else 0.9 if wind > 15 else 1.0
        n24 = max(0, min(500, int(pm25 * factor)))
        return {
            "next6Hours": current_aqi, "next12Hours": current_aqi,
            "next24Hours": n24, "next48Hours": max(0, int(n24 * 0.95)),
            "next72Hours": max(0, int(n24 * 0.9)),
            "bounds24h": [max(0, int(n24 * 0.8)), int(n24 * 1.2)],
            "bounds48h": [max(0, int(n24 * 0.7)), int(n24 * 1.3)],
            "bounds72h": [max(0, int(n24 * 0.6)), int(n24 * 1.4)],
            "trend": "Rising" if n24 > pm25 else "Improving",
            "confidenceScore": 30,
            "model": "Heuristic Fallback"
        }

    def _pm25_to_aqi(self, pm25: float) -> int:
        if pm25 is None or np.isnan(pm25) or pm25 < 0: return 0
        if pm25 <= 12.0: return int((50/12.0) * pm25)
        elif pm25 <= 35.4: return int(((100-51)/(35.4-12.1)) * (pm25-12.1) + 51)
        elif pm25 <= 55.4: return int(((150-101)/(55.4-35.5)) * (pm25-35.5) + 101)
        elif pm25 <= 150.4: return int(((200-151)/(150.4-55.5)) * (pm25-55.5) + 151)
        elif pm25 <= 250.4: return int(((300-201)/(250.4-150.5)) * (pm25-150.5) + 201)
        elif pm25 <= 350.4: return int(((400-301)/(350.4-250.5)) * (pm25-250.5) + 301)
        else: return int(((500-401)/(500.4-350.5)) * (pm25-350.5) + 401)
