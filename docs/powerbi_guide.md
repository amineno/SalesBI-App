# Power BI Dashboard Design Guide

This document outlines the professional implementation of the Sales BI Dashboard in Power BI.

## 1. Data Connection
- **Source**: MySQL / PostgreSQL
- **Mode**: Import (for faster performance and Time Intelligence features)
- **Tables**: `sales_fact`, `dim_customers`, `dim_products`, `dim_date`

## 2. Modeling (Star Schema)
Ensure the following relationships are active:
- `dim_date[date_key]` 1 -> * `sales_fact[date_key]`
- `dim_customers[customer_id]` 1 -> * `sales_fact[customer_id]`
- `dim_products[product_id]` 1 -> * `sales_fact[product_id]`

## 3. Essential DAX Measures
Create a "Measures" table and add:

```dax
-- Total Revenue
Total Sales = SUM(sales_fact[total_amount])

-- Total Units
Total Quantity = SUM(sales_fact[quantity])

-- Profitability
Total Profit = SUM(sales_fact[profit])
Profit Margin % = DIVIDE([Total Profit], [Total Sales], 0)

-- Time Intelligence
Sales LY = CALCULATE([Total Sales], SAMEPERIODLASTYEAR(dim_date[full_date]))
YoY Growth % = DIVIDE([Total Sales] - [Sales LY], [Sales LY], 0)

-- Moving Average (30 days)
Sales 30D Avg = 
AVERAGEX(
    DATESINPERIOD(dim_date[full_date], LASTDATE(dim_date[full_date]), -30, DAY),
    [Total Sales]
)
```

## 4. Visual Layout (Enterprise Style)

### Page 1: Executive Summary
- **Top Row**: 4 KPI Cards (Sales, Profit, Orders, Margin) with Sparklines.
- **Middle Left**: "Sales Trend vs LY" (Area Chart) showing seasonal growth.
- **Middle Right**: "Top 5 Products by Profit" (Stacked Bar Chart).
- **Bottom**: "Geographic Sales Map" and "Customer Segment distribution".

### Page 2: Product Deep-Dive
- **Filter**: Category Slicer, Date Slicer.
- **Main Table**: Matrix with Drill-down (Category > Sub-Category > Product).
- **Visual**: "Price Volatility vs Quantity" (Scatter Chart).

## 5. UI/UX Tips
- Use a **Dark Theme** to match the React Dashboard.
- Use **Tooltips** for detailed product specifications.
- Set up **Bookmarks** for "MTD", "QTD", and "YTD" views.
- Configure **Drill-through** from Executive summary to Customer details.
