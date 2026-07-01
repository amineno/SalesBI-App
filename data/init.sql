-- Database Schema for SaaS Sales BI Project
-- Star Schema Design

CREATE DATABASE IF NOT EXISTS sales_bi;
USE sales_bi;

-- Dimension: Customers
CREATE TABLE dim_customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    country VARCHAR(100),
    city VARCHAR(100),
    segment ENUM('New', 'Regular', 'VIP') DEFAULT 'Regular',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dimension: Products
CREATE TABLE dim_products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    sub_category VARCHAR(100),
    unit_price DECIMAL(10, 2) NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    sku VARCHAR(50) UNIQUE
);

-- Dimension: Date (Time Intelligence)
CREATE TABLE dim_date (
    date_key INT PRIMARY KEY, -- Format: YYYYMMDD
    full_date DATE NOT NULL,
    day_name VARCHAR(20),
    day_of_week INT,
    month_name VARCHAR(20),
    month_number INT,
    quarter INT,
    year INT,
    is_weekend BOOLEAN
);

-- Fact Table: Sales
CREATE TABLE sales_fact (
    sale_id INT AUTO_INCREMENT PRIMARY KEY,
    date_key INT,
    customer_id INT,
    product_id INT,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2),
    total_amount DECIMAL(15, 2),
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    net_amount DECIMAL(15, 2),
    profit DECIMAL(15, 2),
    
    FOREIGN KEY (date_key) REFERENCES dim_date(date_key),
    FOREIGN KEY (customer_id) REFERENCES dim_customers(customer_id),
    FOREIGN KEY (product_id) REFERENCES dim_products(product_id)
);

-- Views for easier reporting
CREATE VIEW vw_sales_summary AS
SELECT 
    f.sale_id,
    d.full_date,
    c.customer_name,
    c.segment,
    p.product_name,
    p.category,
    f.quantity,
    f.total_amount,
    f.profit
FROM sales_fact f
JOIN dim_date d ON f.date_key = d.date_key
JOIN dim_customers c ON f.customer_id = c.customer_id
JOIN dim_products p ON f.product_id = p.product_id;
