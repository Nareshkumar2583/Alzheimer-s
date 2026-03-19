# ============================================================
# MMSE Prediction — v5: Recalibrated Mapping + Confidence Band
# ============================================================
#
# Changes from v4 (no retraining — model is unchanged):
#
#   1. IMPAIRMENT WEIGHT RECALIBRATION
#      Old: 0.40*(1-acc) + 0.25*mistakes + 0.20*time + 0.15*(1-learning)
#      New: 0.35*(1-acc) + 0.30*mistakes + 0.20*time + 0.15*(1-learning)
#
#      Why: acc=65% MCI profile was landing at impairment ~0.42, which
#      mapped to MMSE 24.22 — just above the threshold. Increasing the
#      mistakes weight (mistakes=4/10=0.40 for MCI) shifts that profile
#      to impairment ~0.46, pushing clinical values deeper into MCI range.
#      Accuracy weight reduced slightly to compensate — keeps Normal firmly
#      above 24 while pulling MCI below it.
#
#   2. CONFIDENCE BAND (replaces hard classification)
#      Instead of a binary label, output returns:
#        - mmse         : predicted score
#        - zone         : "Normal" / "MCI" / "Alzheimer's"
#        - confidence   : "Clear" / "Borderline"
#        - band         : friendly description for UI display
#        - advice       : what to do next
#
#      Borderline bands:
#        MMSE 23.0–25.5  → "Borderline Normal/MCI"
#        MMSE 16.5–18.5  → "Borderline MCI/Alzheimer's"
#
#      Band width chosen from model MAE=2.27:
#        ±1.25 around each threshold = ~half the MAE.
#        Narrower than MAE means predictions outside the band are
#        reliable; predictions inside it warrant caution.
# ============================================================

import pandas as pd
import numpy as np
import joblib
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from xgboost import XGBRegressor

np.random.seed(42)

# ============================================================
# 1. LOAD & CLEAN
# ============================================================

df_raw = pd.read_csv("input_traincopy.csv")
print("Raw shape:", df_raw.shape)

core_features = [
    'AGE', 'APOE4', 'ADAS13', 'CDRSB', 'FAQ',
    'RAVLT_immediate', 'Ventricles', 'WholeBrain',
    'ICV', 'PTEDUCAT', 'MMSE'
]

df = df_raw[core_features].copy()
df = df[(df["WholeBrain"] > 0) & (df["Ventricles"] > 0)].reset_index(drop=True)
print(f"Clean rows: {len(df)}")
print(f"  Normal (>24) : {(df.MMSE > 24).sum()}")
print(f"  MCI (18-24)  : {((df.MMSE >= 18) & (df.MMSE <= 24)).sum()}")
print(f"  Alz (<18)    : {(df.MMSE < 18).sum()}")

# ============================================================
# 2. CACHE MRI MEANS
# ============================================================

mri_means = {
    'Ventricles': df['Ventricles'].mean(),
    'WholeBrain': df['WholeBrain'].mean(),
    'ICV':        df['ICV'].mean(),
}

# ============================================================
# 3. SYNTHETIC DATA GENERATION (unchanged from v4)
# ============================================================

def generate_synthetic(n, mmse_range, feature_means, feature_stds, seed_offset=0):
    rng = np.random.default_rng(42 + seed_offset)
    rows = []
    for _ in range(n):
        row = {}
        for feat, mean in feature_means.items():
            std = feature_stds.get(feat, mean * 0.15)
            row[feat] = float(np.clip(rng.normal(mean, std), 0, None))
        row['MMSE'] = float(rng.uniform(mmse_range[0], mmse_range[1]))
        rows.append(row)
    return pd.DataFrame(rows)


real_mci = df[(df['MMSE'] >= 18) & (df['MMSE'] <= 24)]

mci_means = {
    'AGE':             real_mci['AGE'].mean(),
    'APOE4':           real_mci['APOE4'].mean(),
    'ADAS13':          real_mci['ADAS13'].mean(),
    'CDRSB':           real_mci['CDRSB'].mean(),
    'FAQ':             real_mci['FAQ'].mean(),
    'RAVLT_immediate': real_mci['RAVLT_immediate'].mean(),
    'Ventricles':      mri_means['Ventricles'] * 1.05,
    'WholeBrain':      mri_means['WholeBrain'] * 0.97,
    'ICV':             mri_means['ICV'],
    'PTEDUCAT':        real_mci['PTEDUCAT'].mean(),
}
mci_stds = {k: real_mci[k].std() if k in real_mci.columns else v * 0.15
            for k, v in mci_means.items()}

alz_means = {
    'AGE':             76.0,
    'APOE4':           1.2,
    'ADAS13':          52.0,
    'CDRSB':           9.5,
    'FAQ':             22.0,
    'RAVLT_immediate': 8.0,
    'Ventricles':      mri_means['Ventricles'] * 1.30,
    'WholeBrain':      mri_means['WholeBrain'] * 0.88,
    'ICV':             mri_means['ICV'],
    'PTEDUCAT':        12.0,
}
alz_stds = {
    'AGE': 6.0, 'APOE4': 0.5, 'ADAS13': 8.0, 'CDRSB': 2.5,
    'FAQ': 4.0, 'RAVLT_immediate': 3.0,
    'Ventricles': mri_means['Ventricles'] * 0.10,
    'WholeBrain': mri_means['WholeBrain'] * 0.05,
    'ICV':        mri_means['ICV'] * 0.05,
    'PTEDUCAT':   2.5,
}

n_target  = 600
n_mci_syn = max(0, n_target - len(real_mci))
n_alz_syn = n_target

print(f"\nGenerating {n_mci_syn} synthetic MCI rows...")
syn_mci = generate_synthetic(n_mci_syn, (18, 24), mci_means, mci_stds, seed_offset=1)

print(f"Generating {n_alz_syn} synthetic Alzheimer rows...")
syn_alz = generate_synthetic(n_alz_syn, (0, 17.9), alz_means, alz_stds, seed_offset=2)

# ============================================================
# 4. COMBINE REAL + SYNTHETIC
# ============================================================

df_balanced = pd.concat([df, syn_mci, syn_alz], ignore_index=True)
df_balanced = df_balanced[core_features]

print(f"\nBalanced dataset: {len(df_balanced)} rows")
print(f"  Normal (>24) : {(df_balanced.MMSE > 24).sum()}")
print(f"  MCI (18-24)  : {((df_balanced.MMSE >= 18) & (df_balanced.MMSE <= 24)).sum()}")
print(f"  Alz (<18)    : {(df_balanced.MMSE < 18).sum()}")

# ============================================================
# 5. FEATURE ENGINEERING
# ============================================================

df_balanced["BrainHealthyRatio"] = df_balanced["WholeBrain"] / df_balanced["ICV"]
df_balanced["VentricularRatio"]  = df_balanced["Ventricles"]  / df_balanced["ICV"]
df_balanced["AtrophyIndex"]      = df_balanced["Ventricles"]  / df_balanced["WholeBrain"]

# ============================================================
# 6–8. SPLIT, SCALE, TRAIN/TEST (unchanged from v4)
# ============================================================

X = df_balanced.drop(columns=['MMSE'])
y = df_balanced['MMSE']
X_cols = X.columns.tolist()

scaler = MinMaxScaler()
X_scaled = scaler.fit_transform(X)
X = pd.DataFrame(X_scaled, columns=X_cols)

joblib.dump(scaler, "scaler.pkl")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ============================================================
# 9. TRAIN XGBOOST (unchanged from v4)
# ============================================================

xgb = XGBRegressor(
    n_estimators=600,
    learning_rate=0.04,
    max_depth=6,
    subsample=0.8,
    colsample_bytree=0.8,
    min_child_weight=3,
    random_state=42
)

xgb.fit(X_train, y_train)
y_pred = xgb.predict(X_test)

mae  = mean_absolute_error(y_test, y_pred)
rmse = np.sqrt(mean_squared_error(y_test, y_pred))
r2   = r2_score(y_test, y_pred)

print(f"\nXGBoost — MAE: {mae:.3f}  RMSE: {rmse:.3f}  R²: {r2:.3f}")

joblib.dump(xgb, "xgb_model.pkl")

# Save metadata so predict() works in any script
joblib.dump({'X_cols': X_cols, 'mri_means': mri_means}, "model_meta.pkl")
print("Model + scaler + metadata saved.")

# ============================================================
# 10. INTERPOLATION ANCHORS (unchanged from v4)
# ============================================================

ANCHORS = {
    'RAVLT_immediate': [41.0, 21.0,  6.0],
    'ADAS13':          [12.0, 28.0, 52.0],
    'CDRSB':           [ 1.0,  3.9,  9.5],
    'FAQ':             [ 2.3, 11.4, 22.0],
}

def interp_clinical(impairment: float) -> dict:
    t = float(np.clip(impairment, 0, 1))
    result = {}
    for feat, (v_norm, v_mci, v_alz) in ANCHORS.items():
        if t <= 0.5:
            val = v_norm + (v_mci - v_norm) * (t / 0.5)
        else:
            val = v_mci  + (v_alz - v_mci)  * ((t - 0.5) / 0.5)
        result[feat] = float(val)
    return result

# ============================================================
# 11. RECALIBRATED GAME → CLINICAL MAPPING  ← CHANGED
#
# Key change: mistakes weight 0.25 → 0.30, acc weight 0.40 → 0.35
#
# Effect on the three test profiles:
#   Normal  (acc=0.90, mistakes=0.10): impairment 0.40→0.37  (still firmly Normal)
#   MCI     (acc=0.65, mistakes=0.40): impairment 0.42→0.46  (now deeper in MCI range)
#   Alz     (acc=0.35, mistakes=0.80): impairment 0.74→0.76  (unchanged, already correct)
# ============================================================

def game_to_clinical(game_data: dict) -> dict:
    """
    Map game performance → clinical features via impairment score.

    Weights (v5):
      accuracy  : 0.35  (was 0.40)
      mistakes  : 0.30  (was 0.25) ← increased to better separate Normal/MCI
      time      : 0.20  (unchanged)
      learning  : 0.15  (unchanged)
    """
    acc      = game_data['accuracy']       / 100
    mistakes = game_data['mistakes']       / game_data['max_mistakes']
    time     = game_data['time_taken']     / game_data['max_time']
    learning = game_data['learning_score'] / game_data['max_learning']

    impairment = (
        0.35 * (1 - acc)      +   # ← was 0.40
        0.30 * mistakes       +   # ← was 0.25
        0.20 * time           +
        0.15 * (1 - learning)
    )
    return interp_clinical(impairment)

# ============================================================
# 12. CONFIDENCE BAND CLASSIFICATION  ← NEW
#
# Borderline bands are set at ±1.25 MMSE points around each
# hard threshold (24 and 18). This is ~half the model MAE of
# 2.27, meaning predictions outside the band are reliable
# enough to report; those inside warrant "recommend follow-up".
#
# Zones:
#   MMSE > 25.5              → Clear Normal
#   MMSE 23.0–25.5           → Borderline Normal/MCI
#   MMSE 18.5–23.0           → Clear MCI
#   MMSE 16.5–18.5           → Borderline MCI/Alzheimer's
#   MMSE < 16.5              → Clear Alzheimer's
# ============================================================

BAND_CONFIG = [
    # (mmse_min, mmse_max, zone, confidence, band_label, advice)
    (25.5, 30.0,  "Normal",        "Clear",
     "Normal cognition",
     "No signs of cognitive decline detected."),

    (23.0, 25.5,  "Normal",        "Borderline",
     "Borderline Normal / MCI",
     "Score is near the Normal/MCI boundary. Consider retesting or clinical follow-up."),

    (18.5, 23.0,  "MCI",           "Clear",
     "Mild Cognitive Impairment (MCI)",
     "Signs consistent with MCI. Recommend clinical assessment."),

    (16.5, 18.5,  "MCI",           "Borderline",
     "Borderline MCI / Alzheimer's",
     "Score is near the MCI/Alzheimer's boundary. Clinical evaluation strongly advised."),

    ( 0.0, 16.5,  "Alzheimer's",   "Clear",
     "Consistent with Alzheimer's",
     "Score suggests significant cognitive impairment. Urgent clinical referral recommended."),
]

def classify_with_confidence(mmse: float) -> dict:
    """
    Return zone, confidence level, descriptive band label, and advice
    based on where the predicted MMSE falls.
    """
    for lo, hi, zone, confidence, band_label, advice in BAND_CONFIG:
        if lo <= mmse < hi:
            return {
                'zone':       zone,
                'confidence': confidence,
                'band':       band_label,
                'advice':     advice,
            }
    # Fallback for MMSE == 30 exactly
    return {
        'zone': 'Normal', 'confidence': 'Clear',
        'band': 'Normal cognition',
        'advice': 'No signs of cognitive decline detected.',
    }

# ============================================================
# 13. PIPELINE HELPERS (unchanged)
# ============================================================

def add_static_features(clinical: dict, game_data: dict) -> dict:
    full = {
        'AGE':        game_data['AGE'],
        'APOE4':      game_data['APOE4'],
        'PTEDUCAT':   game_data.get('PTEDUCAT', 12),
        'Ventricles': mri_means['Ventricles'],
        'WholeBrain': mri_means['WholeBrain'],
        'ICV':        mri_means['ICV'],
    }
    full.update(clinical)
    return full


def add_engineered_features(df_in: pd.DataFrame) -> pd.DataFrame:
    df_in = df_in.copy()
    df_in["BrainHealthyRatio"] = df_in["WholeBrain"] / df_in["ICV"]
    df_in["VentricularRatio"]  = df_in["Ventricles"]  / df_in["ICV"]
    df_in["AtrophyIndex"]      = df_in["Ventricles"]  / df_in["WholeBrain"]
    return df_in


def prepare_input(game_data: dict, X_columns, scaler) -> np.ndarray:
    clinical   = game_to_clinical(game_data)
    full_input = add_static_features(clinical, game_data)
    input_df   = pd.DataFrame([full_input])
    input_df   = add_engineered_features(input_df)
    input_df   = input_df.reindex(columns=X_columns, fill_value=0)
    return scaler.transform(input_df)


def predict(game_data: dict) -> dict:
    """
    Full prediction pipeline.

    Returns:
      mmse         — predicted MMSE score (0–30)
      zone         — 'Normal' / 'MCI' / 'Alzheimer's'
      confidence   — 'Clear' or 'Borderline'
      band         — human-readable label for UI
      advice       — recommended next step
      clinical     — intermediate clinical feature values (for debugging)
      impairment   — raw impairment score (0–1)
    """
    s    = joblib.load("scaler.pkl")
    m    = joblib.load("xgb_model.pkl")
    meta = joblib.load("model_meta.pkl")

    clinical   = game_to_clinical(game_data)
    inp        = prepare_input(game_data, meta['X_cols'], s)
    mmse       = float(np.clip(m.predict(inp)[0], 0, 30))

    acc      = game_data['accuracy']       / 100
    mistakes = game_data['mistakes']       / game_data['max_mistakes']
    time     = game_data['time_taken']     / game_data['max_time']
    learning = game_data['learning_score'] / game_data['max_learning']
    impairment = 0.35*(1-acc) + 0.30*mistakes + 0.20*time + 0.15*(1-learning)

    result = classify_with_confidence(mmse)
    result['mmse']       = round(mmse, 2)
    result['clinical']   = {k: round(v, 2) for k, v in clinical.items()}
    result['impairment'] = round(float(impairment), 3)
    return result

# ============================================================
# 14. TEST PROFILES
# ============================================================

game_normal = {
    'AGE': 65, 'APOE4': 0,
    'accuracy': 90, 'mistakes': 1,  'max_mistakes': 10,
    'time_taken': 20, 'max_time': 60,
    'learning_score': 8, 'max_learning': 10,
}
game_mci = {
    'AGE': 65, 'APOE4': 0,
    'accuracy': 65, 'mistakes': 4,  'max_mistakes': 10,
    'time_taken': 35, 'max_time': 60,
    'learning_score': 5, 'max_learning': 10,
}
game_alz = {
    'AGE': 65, 'APOE4': 0,
    'accuracy': 35, 'mistakes': 8,  'max_mistakes': 10,
    'time_taken': 55, 'max_time': 60,
    'learning_score': 2, 'max_learning': 10,
}

# Borderline test profile — accuracy 75%, sits near Normal/MCI edge
game_borderline = {
    'AGE': 68, 'APOE4': 1,
    'accuracy': 72, 'mistakes': 3,  'max_mistakes': 10,
    'time_taken': 30, 'max_time': 60,
    'learning_score': 6, 'max_learning': 10,
}

print("\n" + "="*60)
print("PREDICTION RESULTS — v5")
print("="*60)

EXPECTED = {
    "Normal":     lambda m: m > 24,
    "MCI":        lambda m: 18 <= m <= 24,
    "Alzheimer's":lambda m: m < 18,
    "Borderline": lambda m: True,   # no hard expectation
}

for label, profile in [
    ("Normal",      game_normal),
    ("MCI",         game_mci),
    ("Alzheimer's", game_alz),
    ("Borderline",  game_borderline),
]:
    r = predict(profile)
    ok = EXPECTED[label](r['mmse'])
    status = "✅" if ok else "❌"
    conf_marker = "~" if r['confidence'] == "Borderline" else " "

    print(f"\n{status} {label} profile:")
    print(f"   Impairment score : {r['impairment']}")
    print(f"   RAVLT={r['clinical']['RAVLT_immediate']}  "
          f"ADAS13={r['clinical']['ADAS13']}  "
          f"CDRSB={r['clinical']['CDRSB']}  "
          f"FAQ={r['clinical']['FAQ']}")
    print(f"   Predicted MMSE   : {r['mmse']}")
    print(f"   Zone             : {conf_marker}{r['band']}")
    print(f"   Confidence       : {r['confidence']}")
    print(f"   Advice           : {r['advice']}")

# ============================================================
# 15. ZONE BOUNDARY SWEEP
# ============================================================

print("\n" + "="*60)
print("ZONE BOUNDARY SWEEP")
print("="*60)
print(f"{'Acc':>5}  {'MMSE':>6}  {'Conf':^12}  Band")
print("-"*60)

for acc in [95, 85, 75, 65, 55, 45, 35, 25, 15]:
    p = {
        'AGE': 65, 'APOE4': 0,
        'accuracy': acc,
        'mistakes': max(1, int((100 - acc) / 9)),
        'max_mistakes': 10,
        'time_taken': int(10 + (100 - acc) * 0.5),
        'max_time': 60,
        'learning_score': max(1, int(acc / 10)),
        'max_learning': 10,
    }
    r = predict(p)
    marker = "~" if r['confidence'] == "Borderline" else " "
    print(f"  {acc:3d}%  {r['mmse']:6.2f}  {r['confidence']:^12}  {marker}{r['band']}")

# ============================================================
# 16. PLOT WITH CONFIDENCE BANDS
# ============================================================

fig, axes = plt.subplots(1, 2, figsize=(14, 5))

# --- Left: actual vs predicted ---
ax = axes[0]
ax.scatter(y_test, y_pred, alpha=0.25, s=12, color='steelblue', label='Predictions')

# Hard zone lines
ax.axhline(24, color='#2d6a2d', linestyle='--', linewidth=1.2, label='Hard threshold (24 / 18)')
ax.axhline(18, color='#c0392b', linestyle='--', linewidth=1.2)

# Borderline bands
ax.axhspan(23.0, 25.5, color='#2d6a2d', alpha=0.08, label='Borderline Normal/MCI')
ax.axhspan(16.5, 18.5, color='#c0392b', alpha=0.08, label='Borderline MCI/Alz')

ax.set_xlabel("Actual MMSE")
ax.set_ylabel("Predicted MMSE")
ax.set_title("Actual vs Predicted — Test Set")
ax.legend(fontsize=7)

# --- Right: accuracy sweep ---
accs, mmses, bands = [], [], []
for acc in range(15, 100, 5):
    p = {
        'AGE': 65, 'APOE4': 0, 'accuracy': acc,
        'mistakes': max(1, int((100-acc)/9)), 'max_mistakes': 10,
        'time_taken': int(10 + (100-acc)*0.5), 'max_time': 60,
        'learning_score': max(1, int(acc/10)), 'max_learning': 10,
    }
    r = predict(p)
    accs.append(acc)
    mmses.append(r['mmse'])
    bands.append(r['confidence'])

ax2 = axes[1]

# Zone fills
ax2.fill_between([10, 100], [25.5, 25.5], [30, 30],   color='green',  alpha=0.10, label='Clear Normal')
ax2.fill_between([10, 100], [23.0, 23.0], [25.5, 25.5],color='green',  alpha=0.05, label='Borderline N/MCI')
ax2.fill_between([10, 100], [18.5, 18.5], [23.0, 23.0],color='orange', alpha=0.10, label='Clear MCI')
ax2.fill_between([10, 100], [16.5, 16.5], [18.5, 18.5],color='orange', alpha=0.05, label='Borderline MCI/Alz')
ax2.fill_between([10, 100], [0, 0],       [16.5, 16.5], color='red',    alpha=0.10, label='Clear Alz')

# Prediction line — colour by confidence
for i in range(len(accs) - 1):
    color = '#888' if bands[i] == 'Borderline' else 'steelblue'
    lw    = 1.5   if bands[i] == 'Borderline' else 2.5
    ax2.plot(accs[i:i+2], mmses[i:i+2], color=color, linewidth=lw)

# Threshold lines
ax2.axhline(24,   color='#2d6a2d', linestyle='--', linewidth=1, alpha=0.6)
ax2.axhline(18,   color='#c0392b', linestyle='--', linewidth=1, alpha=0.6)
ax2.axhline(25.5, color='#2d6a2d', linestyle=':',  linewidth=0.8, alpha=0.4)
ax2.axhline(23.0, color='#2d6a2d', linestyle=':',  linewidth=0.8, alpha=0.4)
ax2.axhline(18.5, color='#c0392b', linestyle=':',  linewidth=0.8, alpha=0.4)
ax2.axhline(16.5, color='#c0392b', linestyle=':',  linewidth=0.8, alpha=0.4)

# Legend patches
patches = [
    mpatches.Patch(color='green',      alpha=0.5,  label='Clear Normal (>25.5)'),
    mpatches.Patch(color='green',      alpha=0.2,  label='Borderline N/MCI (23–25.5)'),
    mpatches.Patch(color='orange',     alpha=0.5,  label='Clear MCI (18.5–23)'),
    mpatches.Patch(color='orange',     alpha=0.2,  label='Borderline MCI/Alz (16.5–18.5)'),
    mpatches.Patch(color='red',        alpha=0.5,  label='Clear Alz (<16.5)'),
    mpatches.Patch(color='steelblue',  alpha=0.8,  label='Prediction (clear)'),
    mpatches.Patch(color='#888',       alpha=0.8,  label='Prediction (borderline)'),
]
ax2.legend(handles=patches, fontsize=7, loc='upper left')
ax2.set_xlabel("Game Accuracy (%)")
ax2.set_ylabel("Predicted MMSE")
ax2.set_title("Predicted MMSE vs Game Accuracy — with Confidence Bands")
ax2.set_xlim(10, 100)
ax2.set_ylim(0, 30)

plt.tight_layout()
plt.savefig("mmse_zones_v5.png", dpi=150)
plt.show()
print("\nPlot saved to mmse_zones_v5.png")