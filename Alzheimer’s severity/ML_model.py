# ==============================
# Alzheimer Prediction Pipeline
# ==============================

import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

# ==============================
# 1. Load Dataset
# ==============================

df = pd.read_csv("output_train_target.csv")

print("Dataset Shape:", df.shape)
print("\nColumns:")
print(df.columns)

print("\nFirst 5 Rows:")
print(df.head())

# ==============================
# 2. Remove Unnecessary Columns
# ==============================

df = df.drop(columns=["Date", "PTID_Key"], errors="ignore")

# ==============================
# 3. Handle Missing Values
# ==============================

print("\nMissing Values:")
print(df.isnull().sum())

# Fill numeric missing values if any
df["MMSE"] = df["MMSE"].fillna(df["MMSE"].median())
df["ADAS13"] = df["ADAS13"].fillna(df["ADAS13"].median())
df["Ventricles_Norm"] = df["Ventricles_Norm"].fillna(df["Ventricles_Norm"].median())

# ==============================
# 4. Convert Diagnosis Columns
# ==============================

def encode_diagnosis(row):
    if row["CN_Diag"] == 1:
        return 0  # Cognitively Normal
    elif row["MCI_Diag"] == 1:
        return 1  # Mild Cognitive Impairment
    elif row["AD_Diag"] == 1:
        return 2  # Alzheimer's
    else:
        return None

df["Diagnosis"] = df.apply(encode_diagnosis, axis=1)

# Remove rows where diagnosis is missing
df = df.dropna(subset=["Diagnosis"])

df["Diagnosis"] = df["Diagnosis"].astype(int)

# Drop old label columns
df = df.drop(columns=["CN_Diag", "MCI_Diag", "AD_Diag"])

print("\nProcessed Dataset:")
print(df.head())

# ==============================
# 5. Feature Selection
# ==============================

features = ["MMSE", "ADAS13", "Ventricles_Norm"]

X = df[features]
y = df["Diagnosis"]

# ==============================
# 6. Normalize Features
# ==============================

scaler = StandardScaler()

X_scaled = scaler.fit_transform(X)

# ==============================
# 7. Train/Test Split
# ==============================

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("\nTraining Size:", X_train.shape)
print("Testing Size:", X_test.shape)

# ==============================
# 8. Train ML Model
# ==============================

model = XGBClassifier(
    n_estimators=500,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="multi:softmax",
    num_class=3,
    eval_metric="mlogloss",
    random_state=42
)


model.fit(X_train, y_train)

# ==============================
# 9. Evaluate Model
# ==============================

y_pred = model.predict(X_test)

print("\nModel Accuracy:", accuracy_score(y_test, y_pred))

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

print("\nConfusion Matrix:")
print(confusion_matrix(y_test, y_pred))

# ==============================
# 10. Feature Importance
# ==============================

importance = model.feature_importances_

feature_importance = pd.DataFrame({
    "Feature": features,
    "Importance": importance
}).sort_values(by="Importance", ascending=False)

print("\nFeature Importance:")
print(feature_importance)

# ==============================
# 11. Predict New Patient
# ==============================

# Example patient
# (MMSE, ADAS13, Ventricles_Norm)

sample = [[23, 15, 0.021]]

sample_scaled = scaler.transform(sample)

prediction = model.predict(sample_scaled)

labels = {
    0: "Cognitively Normal",
    1: "Mild Cognitive Impairment",
    2: "Alzheimer's Disease"
}

print("\nPrediction Result:", labels[prediction[0]])