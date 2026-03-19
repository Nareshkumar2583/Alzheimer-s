import numpy as np
import pandas as pd
import joblib

# ==============================
# LOAD SAVED FILES
# ==============================
scaler = joblib.load("scaler.pkl")
model = joblib.load("xgb_model.pkl")
meta = joblib.load("model_meta.pkl")

mri_means = meta['mri_means']

# ==============================
# CLINICAL ANCHORS
# ==============================
ANCHORS = {
    'RAVLT_immediate': [41.0, 21.0,  6.0],
    'ADAS13':          [12.0, 28.0, 52.0],
    'CDRSB':           [ 1.0,  3.9,  9.5],
    'FAQ':             [ 2.3, 11.4, 22.0],
}

def interp_clinical(impairment: float):
    t = np.clip(impairment, 0, 1)
    result = {}
    for feat, (v_norm, v_mci, v_alz) in ANCHORS.items():
        if t <= 0.5:
            val = v_norm + (v_mci - v_norm) * (t / 0.5)
        else:
            val = v_mci + (v_alz - v_mci) * ((t - 0.5) / 0.5)
        result[feat] = float(val)
    return result

# ==============================
# GAME → CLINICAL
# ==============================
def game_to_clinical(game_data):
    acc      = game_data['accuracy'] / 100
    mistakes = game_data['mistakes'] / game_data['max_mistakes']
    time     = game_data['time_taken'] / game_data['max_time']
    learning = game_data['learning_score'] / game_data['max_learning']

    impairment = (
        0.35*(1-acc) +
        0.30*mistakes +
        0.20*time +
        0.15*(1-learning)
    )

    return interp_clinical(impairment), impairment

# ==============================
# FEATURE BUILDING
# ==============================
def prepare_input(game_data):
    clinical, impairment = game_to_clinical(game_data)

    full = {
        'AGE': game_data['AGE'],
        'APOE4': game_data['APOE4'],
        'PTEDUCAT': game_data.get('PTEDUCAT', 12),
        'Ventricles': mri_means['Ventricles'],
        'WholeBrain': mri_means['WholeBrain'],
        'ICV': mri_means['ICV'],
    }

    full.update(clinical)

    df = pd.DataFrame([full])

    # engineered features
    df["BrainHealthyRatio"] = df["WholeBrain"] / df["ICV"]
    df["VentricularRatio"]  = df["Ventricles"] / df["ICV"]
    df["AtrophyIndex"]      = df["Ventricles"] / df["WholeBrain"]

    df = df.reindex(columns=meta['X_cols'], fill_value=0)

    X = scaler.transform(df)

    return X, clinical, impairment

# ==============================
# CLASSIFICATION
# ==============================
def classify(mmse):
    if mmse > 25.5:
        return "Normal", "Clear", "Normal cognition"
    elif 23 <= mmse <= 25.5:
        return "Normal", "Borderline", "Borderline Normal / MCI"
    elif 18.5 <= mmse < 23:
        return "MCI", "Clear", "Mild Cognitive Impairment"
    elif 16.5 <= mmse < 18.5:
        return "MCI", "Borderline", "Borderline MCI / Alzheimer's"
    else:
        return "Alzheimer's", "Clear", "Consistent with Alzheimer's"

# ==============================
# MAIN PREDICT
# ==============================
def predict(game_data):

    X, clinical, impairment = prepare_input(game_data)

    mmse = float(np.clip(model.predict(X)[0], 0, 30))

    zone, confidence, band = classify(mmse)

    return {
        "mmse": round(mmse, 2),
        "zone": zone,
        "confidence": confidence,
        "band": band,
        "impairment": round(float(impairment), 3)
    }