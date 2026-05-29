from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from model.predictor import AQIPredictor
from preprocessing.cleaner import clean_data
from fastapi.middleware.cors import CORSMiddleware
import traceback
import os
import json
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ClearSky AI Service", version="2.0.0")

# Enable CORS
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3002"),
    os.getenv("BACKEND_URL", "http://localhost:5001"),
    "http://localhost:3002",
    "http://localhost:5001",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = AQIPredictor()

class PredictionRequest(BaseModel):
    currentAQI: int
    features: dict

@app.get("/")
def read_root():
    return {
        "status": "active",
        "service": "ClearSky AI Prediction",
        "version": "2.0.0",
        "model": "Ensemble ML" if predictor.model_loaded else "Heuristic",
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": predictor.model_loaded,
        "model_type": "Ensemble ML" if predictor.model_loaded else "Heuristic",
        "features_count": len(predictor.features),
    }

@app.post("/predict")
def predict_aqi(request: PredictionRequest):
    try:
        cleaned_df = clean_data(request.features)
        features_dict = cleaned_df.iloc[0].to_dict()

        prediction = predictor.predict(request.currentAQI, features_dict)
        return prediction
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain")
def explain_prediction(request: PredictionRequest):
    try:
        cleaned_df = clean_data(request.features)
        features_dict = cleaned_df.iloc[0].to_dict()

        explanation = predictor.explain(features_dict)
        return explanation
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/metrics")
def get_metrics():
    try:
        meta_path = os.path.join(os.path.dirname(__file__), "model", "model_meta.json")
        if os.path.exists(meta_path):
            with open(meta_path, "r") as f:
                return json.load(f)
        else:
            return {"error": "No metrics available. Train models first."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/retrain")
def retrain_model():
    """Trigger model retraining via Optuna."""
    try:
        from model.train_global_model import run_global_training
        success = run_global_training()
        if success:
            predictor._load_models()
            return {"status": "success", "message": "Model retrained and reloaded via Optuna!"}
        else:
            return {"status": "failed", "message": "Training failed — check data"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
