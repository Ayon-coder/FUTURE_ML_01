"""
Model Training & Forecasting Module
====================================
Uses Linear Regression for straightforward, interpretable sales forecasting.
"""

import os
import numpy as np
import pandas as pd
import joblib
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), 'model_artifacts')
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

FEATURE_COLS = [
    'Year', 'Month', 'Quarter', 'TimeIndex',
    'MonthSin', 'MonthCos',
    'IsHolidaySeason', 'IsQ1', 'IsQ4',
    'Sales_Lag1', 'Sales_Lag2', 'Sales_Lag3',
    'Sales_RollingMean3', 'Sales_RollingMean6',
    'Discount'
]

TARGET_COL = 'Sales'


def _mape(y_true, y_pred):
    """Mean Absolute Percentage Error."""
    y_true, y_pred = np.array(y_true), np.array(y_pred)
    nonzero = y_true != 0
    if nonzero.sum() == 0:
        return 0.0
    return float(np.mean(np.abs((y_true[nonzero] - y_pred[nonzero]) / y_true[nonzero])) * 100)


def train_and_evaluate(df_featured):
    """
    Train a Linear Regression model and evaluate it.
    Returns: model, metrics_dict
    """
    X = df_featured[FEATURE_COLS].values
    y = df_featured[TARGET_COL].values

    # Time-ordered split (80/20)
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]

    model = LinearRegression()
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    mae = float(mean_absolute_error(y_test, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
    r2 = float(r2_score(y_test, y_pred))
    mape = _mape(y_test, y_pred)

    # Save model
    joblib.dump(model, os.path.join(ARTIFACTS_DIR, 'model.pkl'))
    joblib.dump(FEATURE_COLS, os.path.join(ARTIFACTS_DIR, 'feature_cols.pkl'))

    metrics = {
        'model_name': 'Linear Regression',
        'mae': round(mae, 2),
        'rmse': round(rmse, 2),
        'r2': round(r2, 4),
        'mape': round(mape, 2),
        'predictions': y_pred.tolist(),
        'actual': y_test.tolist(),
        'test_size': len(y_test),
        'train_size': len(y_train)
    }

    return model, metrics


def generate_forecast(model, df_featured, months_ahead=12):
    """
    Generate future monthly sales forecasts using iterative prediction.
    """
    last_row = df_featured.iloc[-1].copy()
    forecasts = []
    recent_sales = list(df_featured['Sales'].tail(6).values)

    current_date = pd.Timestamp(df_featured['YearMonth'].iloc[-1]) + pd.DateOffset(months=1)

    for i in range(months_ahead):
        new_row = {}
        new_row['Year'] = current_date.year
        new_row['Month'] = current_date.month
        new_row['Quarter'] = (current_date.month - 1) // 3 + 1
        new_row['TimeIndex'] = last_row['TimeIndex'] + 1 + i
        new_row['MonthSin'] = np.sin(2 * np.pi * current_date.month / 12)
        new_row['MonthCos'] = np.cos(2 * np.pi * current_date.month / 12)
        new_row['IsHolidaySeason'] = 1 if current_date.month in [11, 12] else 0
        new_row['IsQ1'] = 1 if new_row['Quarter'] == 1 else 0
        new_row['IsQ4'] = 1 if new_row['Quarter'] == 4 else 0
        new_row['Sales_Lag1'] = recent_sales[-1] if len(recent_sales) >= 1 else 0
        new_row['Sales_Lag2'] = recent_sales[-2] if len(recent_sales) >= 2 else 0
        new_row['Sales_Lag3'] = recent_sales[-3] if len(recent_sales) >= 3 else 0
        new_row['Sales_RollingMean3'] = np.mean(recent_sales[-3:]) if len(recent_sales) >= 3 else np.mean(recent_sales)
        new_row['Sales_RollingMean6'] = np.mean(recent_sales[-6:]) if len(recent_sales) >= 6 else np.mean(recent_sales)
        new_row['Discount'] = float(df_featured['Discount'].mean())

        X_new = np.array([[new_row[col] for col in FEATURE_COLS]])
        pred = float(model.predict(X_new)[0])
        pred = max(pred, 0)

        forecasts.append({
            'date': current_date.strftime('%Y-%m-%d'),
            'predicted_sales': round(pred, 2)
        })

        recent_sales.append(pred)
        current_date += pd.DateOffset(months=1)

    return forecasts


def get_historical_data(df_featured):
    """Return historical monthly sales for charting."""
    historical = []
    for _, row in df_featured.iterrows():
        historical.append({
            'date': pd.Timestamp(row['YearMonth']).strftime('%Y-%m-%d'),
            'sales': round(float(row['Sales']), 2)
        })
    return historical
