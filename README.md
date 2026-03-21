<<<<<<< HEAD
# Quantifying Neurocognitive Decline

## Overview
Quantifying Neurocognitive Decline is an AI-driven platform designed to stage the progression of Alzheimer’s Disease using digital biomarkers. Traditional clinical assessments often fail to detect subtle cognitive changes in the early stages.
This system integrates gamified spatial navigation tasks and linguistic analysis to capture behavioral signals that indicate neurocognitive decline. By analyzing high-frequency performance data such as path efficiency, decision latency, and semantic fluency, the platform generates a longitudinal **Severity Index** to assist clinicians in diagnosis and monitoring.
The project combines a **Spring Boot backend** with a **Python-based machine learning engine**, enabling predictive analysis and continuous monitoring of cognitive health.

---

## Problem Statement
Alzheimer’s Disease is typically diagnosed only after noticeable cognitive decline. Existing clinical tests are often:

- Infrequent  
- Subjective  
- Unable to capture subtle behavioral changes  

There is a need for **continuous, data-driven cognitive monitoring** that can detect early signs of neurodegeneration.

---

## Solution
This platform introduces a **digital biomarker framework** that uses interactive tasks and AI analysis to detect neurocognitive decline earlier than traditional assessments.

The system collects behavioral data from gamified cognitive tasks and processes it using machine learning models to generate a **Severity Index**, helping clinicians track disease progression over time.

---

## Key Features

### AI-Based Alzheimer’s Staging
Machine learning models analyze behavioral patterns to estimate the stage of cognitive decline.

### Gamified Cognitive Testing
Interactive spatial navigation tasks measure memory, attention, and decision-making ability.

### Digital Biomarker Extraction
Extracts cognitive performance metrics such as:
- Path efficiency
- Navigation errors
- Reaction time
- Semantic fluency

### Linguistic Analysis
Natural Language Processing identifies subtle changes in speech and language patterns.

### Severity Index Dashboard
Generates a longitudinal score that allows clinicians to track cognitive decline across sessions.

### Real-Time Data Processing
Processes high-frequency behavioral data for accurate analysis.

---

## Project Architecture

### 1. Frontend Layer
- Web or mobile interface
- Gamified navigation tasks
- Speech and text input collection

### 2. Backend Layer (Spring Boot)
- REST APIs
- User authentication
- Session management
- Data storage and retrieval

### 3. Data Processing Layer
- Preprocessing of behavioral data
- Feature extraction from navigation and linguistic data

### 4. Machine Learning Layer (Python)
- Cognitive decline prediction models
- Severity Index generation
- Pattern detection in patient behavior

### 5. Visualization Layer
- Dashboard for clinicians
- Patient progress tracking
- Longitudinal cognitive analysis

---

## Technology Stack

**Backend**
- Spring Boot
- Java
- REST APIs

**Machine Learning**
- Python
- Scikit-learn
- NumPy
- Pandas

**Frontend**
- React

**Database**
- MySQL / PostgreSQL

**Data Analysis**
- Natural Language Processing (NLP)
- Behavioral analytics

---

## How It Works

1. The patient performs interactive cognitive tasks through the application.
2. Behavioral and linguistic data are collected in real time.
3. The backend stores and processes the session data.
4. Machine learning models analyze cognitive patterns.
5. The system generates a **Severity Index** and visual reports for clinicians.

---

## Future Improvements

- Integration with wearable devices
- Voice-based cognitive analysis
- Mobile application for remote monitoring
- Deep learning models for improved prediction accuracy

---

## Impact

This project enables **earlier detection of Alzheimer’s Disease**, allowing clinicians to intervene sooner and personalize treatment strategies. By transforming passive monitoring into predictive diagnostics, the platform contributes to better long-term patient care.

---

## License

This project is released under the **MIT License**.
=======
# CogniGrid — Cognitive Assessment Game

A React + Vite frontend cognitive game that tests pattern recognition
and sends aggregated performance data to a Flask ML backend for MMSE
prediction and cognitive zone classification.

## Project Structure

```
cognigrid/
├── src/
│   ├── hooks/
│   │   └── useGameEngine.js     # All game logic + state machine
│   ├── components/
│   │   ├── Grid.jsx / .module.css      # The tap grid
│   │   ├── HUD.jsx / .module.css       # Live stats during play
│   │   ├── ResultCard.jsx / .module.css # Per-level result screen
│   │   └── FinalReport.jsx / .module.css # Final session report + ML result
│   ├── App.jsx / .module.css    # Screen router
│   ├── main.jsx
│   └── index.css                # Global design system
├── app.py                       # Flask backend
├── index.html
├── vite.config.js
└── package.json
```

## Setup

### 1. Frontend

```bash
cd cognigrid
npm install
npm run dev
# Opens at http://localhost:5173
```

### 2. Backend

Place these model files (from data_processing_v5.py) in the same folder as app.py:
- `scaler.pkl`
- `xgb_model.pkl`
- `model_meta.pkl`

Then:

```bash
pip install flask flask-cors
python app.py
# Runs at http://localhost:5000
```

The Vite dev server proxies `/api/*` → `http://localhost:5000` automatically.

## How it works

### Game flow
1. User selects 1–5 levels and enters their profile (age, education, APOE4)
2. Countdown → grid appears → cells light up one by one
3. Player taps each lit cell as fast as possible
4. After each level → level result card (accuracy, errors, time, learning)
5. After all levels → final report with aggregated stats

### Level progression
| Level | Grid | Targets | Lit duration | Speed |
|-------|------|---------|-------------|-------|
| 1 | 3×3 | 4  | 1200ms | Novice   |
| 2 | 4×4 | 6  | 1000ms | Standard |
| 3 | 4×4 | 8  | 800ms  | Advanced |
| 4 | 5×5 | 10 | 700ms  | Expert   |
| 5 | 5×5 | 12 | 550ms  | Elite    |

### Payload sent to backend
```json
{
  "AGE": 65,
  "APOE4": 0,
  "PTEDUCAT": 12,
  "accuracy": 72,
  "mistakes": 5,
  "max_mistakes": 18,
  "time_taken": 42,
  "max_time": 55,
  "learning_score": 8,
  "max_learning": 18,
  "levels_played": 3,
  "level_breakdown": [...]
}
```

All values are **aggregated across all levels** before sending.

### Backend response
```json
{
  "mmse": 22.4,
  "zone": "MCI",
  "confidence": "Clear",
  "band": "Mild Cognitive Impairment (MCI)",
  "advice": "Signs consistent with MCI. Recommend clinical assessment.",
  "impairment": 0.463,
  "clinical": {
    "RAVLT_immediate": 23.7,
    "ADAS13": 25.8,
    "CDRSB": 3.5,
    "FAQ": 10.2
  }
}
```
>>>>>>> 81cc09a (Frontend module)
