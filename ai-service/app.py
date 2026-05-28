from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
from model.predictor import AQIPredictor
from preprocessing.cleaner import clean_data
from fastapi.middleware.cors import CORSMiddleware
import traceback
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ClearSky AI Service", version="2.0.0")

# Enable CORS
origins = [
    os.getenv("FRONTEND_URL", "http://localhost:3002"),
    os.getenv("BACKEND_URL", "http://localhost:5001"),
    "http://localhost:3002",
    "http://localhost:5001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
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
        "model": "xgboost" if predictor.model_loaded else "heuristic",
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "model_loaded": predictor.model_loaded,
        "model_type": "xgboost" if predictor.model_loaded else "heuristic",
        "features_count": len(predictor.features),
    }


@app.post("/predict")
def predict_aqi(request: PredictionRequest):
    try:
        # Preprocess features
        cleaned_df = clean_data(request.features)
        features_dict = cleaned_df.iloc[0].to_dict()

        prediction = predictor.predict(request.currentAQI, features_dict)
        return prediction
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/retrain")
def retrain_model():
    """Trigger model retraining (for daily retraining pipeline)."""
    try:
        from model.trainer import run_training
        success = run_training()
        if success:
            # Reload models
            predictor._load_models()
            return {"status": "success", "message": "Model retrained and reloaded"}
        else:
            return {"status": "failed", "message": "Training failed — check data"}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
