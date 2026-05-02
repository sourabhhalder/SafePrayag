import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb
import joblib
import os
from typing import Optional
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"
DATA_PATH = BASE_DIR / "data" / "crime_data_latlong.csv"
MODEL_PATH = MODEL_DIR / "xgboost_model.pkl"
LE_TIME_PATH = MODEL_DIR / "le_time.pkl"
LE_AGE_PATH = MODEL_DIR / "le_age.pkl"
LE_GENDER_PATH = MODEL_DIR / "le_gender.pkl"

_model = None
_le_time = None
_le_age = None
_le_gender = None


def load_models():
    global _model, _le_time, _le_age, _le_gender
    if MODEL_PATH.exists():
        try:
            _model = joblib.load(MODEL_PATH)
            _le_time = joblib.load(LE_TIME_PATH)
            _le_age = joblib.load(LE_AGE_PATH)
            _le_gender = joblib.load(LE_GENDER_PATH)
            print("[SafePrayag] XGBoost model loaded successfully.")
        except Exception as e:
            print(f"[SafePrayag] Model load error: {e}")
            _model = None
    else:
        print("[SafePrayag] No model found — training fresh model...")
        train_and_save_model()


def train_and_save_model(df: Optional[pd.DataFrame] = None):
    global _model, _le_time, _le_age, _le_gender
    print("[SafePrayag] Starting XGBoost training...")

    if df is None:
        if DATA_PATH.exists():
            df = pd.read_csv(DATA_PATH)
            print(f"[SafePrayag] Loaded {len(df)} records from CSV.")
        else:
            print("[SafePrayag] No CSV found — generating synthetic Prayagraj data...")
            np.random.seed(42)
            n = 800
            # Prayagraj-specific synthetic data
            prayagraj_areas = [
                (25.4358, 81.8463),  # Civil Lines
                (25.4484, 81.8322),  # George Town
                (25.3921, 81.8929),  # Naini
                (25.5011, 81.8601),  # Phaphamau
                (25.4551, 81.8398),  # Kotwali
                (25.3003, 81.7290),  # Holagarh
                (25.4609, 81.8200),  # Tagore Town
                (25.4731, 81.8712),  # Kareli
            ]
            lats, lons = [], []
            for i in range(n):
                center = prayagraj_areas[i % len(prayagraj_areas)]
                lats.append(center[0] + np.random.normal(0, 0.02))
                lons.append(center[1] + np.random.normal(0, 0.02))

            df = pd.DataFrame({
                "latitude": lats,
                "longitude": lons,
                "time_of_day": np.random.choice(
                    ["Morning", "Afternoon", "Evening", "Night", "Late Night"],
                    n, p=[0.2, 0.2, 0.25, 0.2, 0.15]
                ),
                "age_group": np.random.choice(["Child", "Teen", "Adult", "Senior"], n, p=[0.1, 0.2, 0.6, 0.1]),
                "gender": np.random.choice(["Male", "Female", "Other"], n, p=[0.4, 0.55, 0.05]),
                "severity": np.random.choice([1, 2, 3, 4, 5], n, p=[0.3, 0.25, 0.2, 0.15, 0.1]),
            })

    required = ["latitude", "longitude", "time_of_day", "age_group", "gender", "severity"]
    for col in required:
        if col not in df.columns:
            print(f"[SafePrayag] Missing column: {col}, skipping training.")
            return

    df = df.dropna(subset=required).reset_index(drop=True)

    le_time = LabelEncoder()
    le_age = LabelEncoder()
    le_gender = LabelEncoder()

    df["time_encoded"] = le_time.fit_transform(df["time_of_day"].astype(str))
    df["age_encoded"] = le_age.fit_transform(df["age_group"].astype(str))
    df["gender_encoded"] = le_gender.fit_transform(df["gender"].astype(str))

    X = df[["latitude", "longitude", "time_encoded", "age_encoded", "gender_encoded"]]
    y = df["severity"].astype(float)

    model = xgb.XGBRegressor(
        objective="reg:squarederror",
        n_estimators=250,
        learning_rate=0.05,
        max_depth=6,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=3,
        gamma=0.1,
        random_state=42,
        tree_method="hist",
    )
    model.fit(X, y)

    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    joblib.dump(le_time, LE_TIME_PATH)
    joblib.dump(le_age, LE_AGE_PATH)
    joblib.dump(le_gender, LE_GENDER_PATH)

    _model = model
    _le_time = le_time
    _le_age = le_age
    _le_gender = le_gender

    print(f"[SafePrayag] Model trained on {len(df)} records. Saved to /models.")


def get_model_prediction(lat: float, lon: float, time_of_day: str, age_group: str, gender: str) -> float:
    global _model, _le_time, _le_age, _le_gender
    if _model is None:
        load_models()
    if _model is None:
        return 50.0

    try:
        t_enc = (
            int(_le_time.transform([time_of_day])[0])
            if time_of_day in _le_time.classes_
            else 0
        )
        a_enc = (
            int(_le_age.transform([age_group])[0])
            if age_group in _le_age.classes_
            else 0
        )
        g_enc = (
            int(_le_gender.transform([gender])[0])
            if gender in _le_gender.classes_
            else 0
        )

        features = pd.DataFrame(
            [[lat, lon, t_enc, a_enc, g_enc]],
            columns=["latitude", "longitude", "time_encoded", "age_encoded", "gender_encoded"],
        )
        raw_pred = float(_model.predict(features)[0])
        score = min(max(round((raw_pred / 5.0) * 100, 2), 0), 100)
        return score
    except Exception as e:
        print(f"[SafePrayag] Prediction error: {e}")
        return 50.0


def get_feature_importance() -> list:
    global _model
    if _model is None:
        load_models()
    if _model is None:
        return []
    features = ["Latitude", "Longitude", "Time of Day", "Age Group", "Gender"]
    importance = _model.feature_importances_.tolist()
    return [{"feature": f, "importance": round(i * 100, 2)} for f, i in zip(features, importance)]


# Load on module import
load_models()
