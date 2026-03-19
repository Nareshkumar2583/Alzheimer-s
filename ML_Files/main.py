from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
import pandas as pd

# 👉 import your existing functions
from model import predict   # (rename your file to model.py)

app = FastAPI()

# Request schema
class GameInput(BaseModel):
    AGE: int
    APOE4: int
    accuracy: float
    mistakes: int
    max_mistakes: int
    time_taken: float
    max_time: int
    learning_score: float
    max_learning: int

# Root route
@app.get("/")
def home():
    return {"message": "Alzheimer Prediction API running 🚀"}

# Prediction route
@app.post("/predict")
def get_prediction(data: GameInput):
    result = predict(data.dict())
    return result