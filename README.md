<p align="center">
  <img src="https://img.shields.io/badge/Python-3.8+-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/Flask-2.0+-000000?style=for-the-badge&logo=flask&logoColor=white" alt="Flask">
  <img src="https://img.shields.io/badge/scikit--learn-1.0+-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white" alt="scikit-learn">
  <img src="https://img.shields.io/badge/Chart.js-4.4-FF6384?style=for-the-badge&logo=chart.js&logoColor=white" alt="Chart.js">
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="License">
</p>

<h1 align="center">📈 Sales Forecasting System</h1>
<p align="center">
  <strong>AI-powered demand prediction & business intelligence dashboard</strong><br>
  <em>Built with Python, Flask, scikit-learn, and Chart.js</em>
</p>

---

## 🔍 About

A modular **Sales/Demand Forecasting System** that uses historical business data (Superstore dataset) to predict future sales and present results through an interactive, business-friendly dashboard.

The system helps businesses:
- 📦 **Plan inventory** based on predicted demand
- 💰 **Manage cash flow** with revenue projections
- 👥 **Prepare staffing** for peak seasons
- 📉 **Avoid overstocking** or losses through trend analysis

---

## 🏗️ Architecture

The project follows a **modular architecture** with separate frontend and backend directories:

```
FUTURE_ML_01/
├── backend/                    # Python ML Pipeline + REST API
│   ├── app.py                  # Flask API server (4 endpoints)
│   ├── data_preprocessing.py   # Data cleaning & feature engineering
│   ├── model.py                # Linear Regression model & forecasting
│   ├── requirements.txt        # Python dependencies
│   └── model_artifacts/        # Serialized model (auto-generated)
│
├── frontend/                   # Interactive Dashboard (SPA)
│   ├── index.html              # Multi-page dashboard layout
│   ├── styles.css              # Premium dark-mode stylesheet
│   └── app.js                  # Chart.js visualizations & page router
│
├── Sample - Superstore.csv     # Dataset (9,994 transactions)
├── vercel.json                 # Vercel deployment config
└── README.md
```

---

## ✨ Features

### 📊 Dashboard (5 Pages)

| Page | Description |
|------|-------------|
| **Overview** | 6 KPI cards (Sales, Profit, Orders, AOV, Margin, Items) + YoY Growth chart |
| **Forecast** | Historical vs. 12-month predicted sales line chart + detail table |
| **Breakdown** | Category, Region, Segment doughnuts + Top Sub-Categories bar chart |
| **Seasonality** | Monthly patterns with holiday highlighting + yearly comparison lines |
| **Model** | Linear Regression metrics (MAE, RMSE, MAPE, R²) + Actual vs Predicted plot |

### 🤖 ML Pipeline

- **Data Preprocessing**: Date parsing, aggregation, duplicate removal
- **Feature Engineering**: Lag features, rolling means, cyclical month encoding, holiday flags
- **Model**: Linear Regression with time-ordered 80/20 train/test split
- **Forecasting**: Iterative 12-month ahead predictions with lag propagation

### 🎨 Design

- Premium **dark mode** with glassmorphism effects
- **Micro-animations** (KPI counter animation, page transitions, hover effects)
- **Fully responsive** (desktop, tablet, mobile)
- **Google Fonts** (Inter) for modern typography

---

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- pip

### Installation

```bash
# Clone the repository
git clone https://github.com/Ayon-coder/FUTURE_ML_01.git
cd FUTURE_ML_01

# Install backend dependencies
cd backend
pip install -r requirements.txt
```

### Running Locally

```bash
# Terminal 1 — Start the backend API
cd backend
python app.py
# → API running at http://127.0.0.1:5000

# Terminal 2 — Serve the frontend
cd frontend
python -m http.server 8080
# → Dashboard at http://127.0.0.1:8080
```

Open **http://127.0.0.1:8080** in your browser.

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/forecast` | Historical + 12-month predicted sales |
| `GET` | `/api/metrics` | Model evaluation metrics (MAE, RMSE, MAPE, R²) |
| `GET` | `/api/insights` | KPIs, category/region/segment breakdowns, seasonality |

---

## 📁 Dataset

**Sample - Superstore.csv** — a widely used retail dataset containing:

- **9,994 transactions** across 4 years (2014–2017)
- **21 columns**: Order Date, Sales, Profit, Quantity, Category, Region, Segment, etc.
- **3 Categories**: Furniture, Office Supplies, Technology
- **4 Regions**: Central, East, South, West
- **3 Segments**: Consumer, Corporate, Home Office

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python, Flask, Flask-CORS |
| **ML** | scikit-learn (Linear Regression) |
| **Data** | pandas, NumPy |
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) |
| **Charts** | Chart.js 4.4 |
| **Fonts** | Google Fonts (Inter) |

---

## 📄 License

This project is licensed under the MIT License.
