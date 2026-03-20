"""
Data Preprocessing Module
=========================
Handles loading, cleaning, feature engineering, and aggregation
of the Superstore sales dataset for forecasting.
"""

import pandas as pd
import numpy as np
import os

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'Sample - Superstore.csv')


def load_raw_data(path=DATA_PATH):
    """Load raw CSV with encoding handling."""
    df = pd.read_csv(path, encoding='latin1')
    return df


def clean_data(df):
    """Parse dates, drop duplicates, handle missing values."""
    df = df.copy()
    df['Order Date'] = pd.to_datetime(df['Order Date'], format='mixed', dayfirst=False)
    df['Ship Date'] = pd.to_datetime(df['Ship Date'], format='mixed', dayfirst=False)
    df.drop_duplicates(inplace=True)
    df.dropna(subset=['Sales', 'Order Date'], inplace=True)
    df.sort_values('Order Date', inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df


def aggregate_monthly(df):
    """Aggregate sales to monthly level."""
    df = df.copy()
    df['Year'] = df['Order Date'].dt.year
    df['Month'] = df['Order Date'].dt.month
    df['YearMonth'] = df['Order Date'].dt.to_period('M')

    monthly = df.groupby('YearMonth').agg(
        Sales=('Sales', 'sum'),
        Quantity=('Quantity', 'sum'),
        Profit=('Profit', 'sum'),
        Orders=('Order ID', 'nunique'),
        Discount=('Discount', 'mean')
    ).reset_index()

    monthly['YearMonth'] = monthly['YearMonth'].dt.to_timestamp()
    monthly.sort_values('YearMonth', inplace=True)
    monthly.reset_index(drop=True, inplace=True)
    return monthly


def add_time_features(df, date_col='YearMonth'):
    """Create time-based features for modeling."""
    df = df.copy()
    df['Year'] = df[date_col].dt.year
    df['Month'] = df[date_col].dt.month
    df['Quarter'] = df[date_col].dt.quarter
    df['DayOfYear'] = df[date_col].dt.dayofyear
    df['WeekOfYear'] = df[date_col].dt.isocalendar().week.astype(int)

    # Seasonality flags
    df['IsHolidaySeason'] = df['Month'].isin([11, 12]).astype(int)
    df['IsQ1'] = (df['Quarter'] == 1).astype(int)
    df['IsQ4'] = (df['Quarter'] == 4).astype(int)

    # Cyclical encoding for month
    df['MonthSin'] = np.sin(2 * np.pi * df['Month'] / 12)
    df['MonthCos'] = np.cos(2 * np.pi * df['Month'] / 12)

    # Time index (months from start)
    df['TimeIndex'] = np.arange(len(df))

    # Lag features
    df['Sales_Lag1'] = df['Sales'].shift(1)
    df['Sales_Lag2'] = df['Sales'].shift(2)
    df['Sales_Lag3'] = df['Sales'].shift(3)
    df['Sales_RollingMean3'] = df['Sales'].rolling(window=3).mean()
    df['Sales_RollingMean6'] = df['Sales'].rolling(window=6).mean()

    df.dropna(inplace=True)
    df.reset_index(drop=True, inplace=True)
    return df


def get_kpi_data(df):
    """Compute high-level KPI metrics from raw data."""
    total_sales = float(df['Sales'].sum())
    total_profit = float(df['Profit'].sum())
    total_orders = int(df['Order ID'].nunique())
    avg_order_value = total_sales / total_orders if total_orders > 0 else 0
    total_quantity = int(df['Quantity'].sum())
    avg_discount = float(df['Discount'].mean())
    profit_margin = (total_profit / total_sales * 100) if total_sales > 0 else 0

    return {
        'total_sales': round(total_sales, 2),
        'total_profit': round(total_profit, 2),
        'total_orders': total_orders,
        'avg_order_value': round(avg_order_value, 2),
        'total_quantity': total_quantity,
        'avg_discount': round(avg_discount, 4),
        'profit_margin': round(profit_margin, 2)
    }


def get_category_breakdown(df):
    """Sales breakdown by Category."""
    cat = df.groupby('Category').agg(
        Sales=('Sales', 'sum'),
        Profit=('Profit', 'sum'),
        Orders=('Order ID', 'nunique')
    ).reset_index()
    return cat.to_dict(orient='records')


def get_region_breakdown(df):
    """Sales breakdown by Region."""
    reg = df.groupby('Region').agg(
        Sales=('Sales', 'sum'),
        Profit=('Profit', 'sum'),
        Orders=('Order ID', 'nunique')
    ).reset_index()
    return reg.to_dict(orient='records')


def get_segment_breakdown(df):
    """Sales breakdown by Segment."""
    seg = df.groupby('Segment').agg(
        Sales=('Sales', 'sum'),
        Profit=('Profit', 'sum'),
        Orders=('Order ID', 'nunique')
    ).reset_index()
    return seg.to_dict(orient='records')


def get_seasonality_data(df):
    """Monthly average sales across all years (heatmap data)."""
    df = df.copy()
    df['Year'] = df['Order Date'].dt.year
    df['Month'] = df['Order Date'].dt.month
    pivot = df.groupby(['Year', 'Month'])['Sales'].sum().reset_index()
    monthly_avg = df.groupby('Month')['Sales'].sum().reset_index()
    monthly_avg.columns = ['Month', 'AvgSales']

    return {
        'monthly_avg': monthly_avg.to_dict(orient='records'),
        'yearly_monthly': pivot.to_dict(orient='records')
    }


def get_yoy_growth(df):
    """Year-over-year sales growth."""
    df = df.copy()
    df['Year'] = df['Order Date'].dt.year
    yearly = df.groupby('Year')['Sales'].sum().reset_index()
    yearly['Growth'] = yearly['Sales'].pct_change() * 100
    yearly['Growth'] = yearly['Growth'].fillna(0).round(2)
    return yearly.to_dict(orient='records')


def get_subcategory_breakdown(df):
    """Top sub-categories by sales."""
    sub = df.groupby('Sub-Category').agg(
        Sales=('Sales', 'sum'),
        Profit=('Profit', 'sum')
    ).reset_index()
    sub = sub.sort_values('Sales', ascending=False)
    return sub.to_dict(orient='records')
