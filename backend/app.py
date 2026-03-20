"""
Flask API — Sales Forecasting Backend
======================================
Serves forecast data, model metrics, and business insights
as JSON endpoints for the frontend dashboard.
"""

from flask import Flask, jsonify
from flask_cors import CORS

from data_preprocessing import (
    load_raw_data, clean_data, aggregate_monthly, add_time_features,
    get_kpi_data, get_category_breakdown, get_region_breakdown,
    get_segment_breakdown, get_seasonality_data, get_yoy_growth,
    get_subcategory_breakdown
)
from model import train_and_evaluate, generate_forecast, get_historical_data

app = Flask(__name__)
CORS(app)

# ──────────────────────────────────────────────
#  Load data & train on startup
# ──────────────────────────────────────────────
print("[INFO] Loading and preprocessing data...")
raw_df = load_raw_data()
clean_df = clean_data(raw_df)
monthly_df = aggregate_monthly(clean_df)
featured_df = add_time_features(monthly_df)

print("[INFO] Training Linear Regression model...")
model, model_metrics = train_and_evaluate(featured_df)

print("[INFO] Generating 12-month forecast...")
forecast_data = generate_forecast(model, featured_df, months_ahead=12)
historical_data = get_historical_data(featured_df)

print("[INFO] Computing insights...")
kpi_data = get_kpi_data(clean_df)
category_data = get_category_breakdown(clean_df)
region_data = get_region_breakdown(clean_df)
segment_data = get_segment_breakdown(clean_df)
seasonality_data = get_seasonality_data(clean_df)
yoy_data = get_yoy_growth(clean_df)
subcategory_data = get_subcategory_breakdown(clean_df)

print("[INFO] Backend ready!")


# ──────────────────────────────────────────────
#  API Routes
# ──────────────────────────────────────────────

@app.route('/api/forecast', methods=['GET'])
def api_forecast():
    try:
        return jsonify({
            'status': 'success',
            'historical': historical_data,
            'forecast': forecast_data
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/metrics', methods=['GET'])
def api_metrics():
    try:
        return jsonify({
            'status': 'success',
            'metrics': model_metrics
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/insights', methods=['GET'])
def api_insights():
    try:
        return jsonify({
            'status': 'success',
            'kpis': kpi_data,
            'categories': category_data,
            'regions': region_data,
            'segments': segment_data,
            'seasonality': seasonality_data,
            'yoy_growth': yoy_data,
            'subcategories': subcategory_data
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    app.run(debug=False, port=5000)
