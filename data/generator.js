/**
 * Sales BI Data Generator
 * Generates realistic SQL Insert statements for the sales_bi database.
 * Includes seasonality, customer segments, and product trends.
 */

const fs = require('fs');
const path = require('path');

const NUM_CUSTOMERS = 200;
const NUM_PRODUCTS = 50;
const NUM_SALES = 5000;
const START_DATE = new Date('2023-01-01');
const END_DATE = new Date('2024-12-31');

const countries = ['USA', 'France', 'UK', 'Germany', 'Canada', 'Japan', 'Brazil', 'Australia'];
const cities = {
    'USA': ['New York', 'LA', 'Chicago'],
    'France': ['Paris', 'Lyon', 'Marseille'],
    'UK': ['London', 'Manchester'],
    'Germany': ['Berlin', 'Munich'],
    'Canada': ['Toronto', 'Vancouver'],
    'Japan': ['Tokyo', 'Osaka'],
    'Brazil': ['Sao Paulo', 'Rio'],
    'Australia': ['Sydney', 'Melbourne']
};

const categories = {
    'Electronics': ['Laptops', 'Tablets', 'Smartphones', 'Monitors'],
    'Furniture': ['Chairs', 'Desks', 'Sofas', 'Tables'],
    'Office Supplies': ['Paper', 'Pens', 'Storage', 'Staplers'],
    'Software': ['Cloud Hosting', 'Security', 'CRM', 'BI Tools']
};

const segments = ['New', 'Regular', 'VIP'];

// Helper to get random item
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomRange = (min, max) => Math.random() * (max - min) + min;

function generateDimDate() {
    let sql = '-- Populating dim_date\n';
    let current = new Date(START_DATE);
    while (current <= END_DATE) {
        const date_key = current.toISOString().slice(0, 10).replace(/-/g, '');
        const full_date = current.toISOString().slice(0, 10);
        const day_name = current.toLocaleDateString('en-US', { weekday: 'long' });
        const day_of_week = current.getDay();
        const month_name = current.toLocaleDateString('en-US', { month: 'long' });
        const month_number = current.getMonth() + 1;
        const quarter = Math.ceil(month_number / 3);
        const year = current.getFullYear();
        const is_weekend = (day_of_week === 0 || day_of_week === 6) ? 1 : 0;

        sql += `INSERT INTO dim_date (date_key, full_date, day_name, day_of_week, month_name, month_number, quarter, year, is_weekend) VALUES (${date_key}, '${full_date}', '${day_name}', ${day_of_week}, '${month_name}', ${month_number}, ${quarter}, ${year}, ${is_weekend});\n`;
        current.setDate(current.getDate() + 1);
    }
    return sql;
}

function generateDimCustomers() {
    let sql = '-- Populating dim_customers\n';
    const firstNames = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana', 'Edward', 'Fiona', 'George', 'Hannah'];
    const lastNames = ['Smith', 'Doe', 'Johnson', 'Brown', 'Taylor', 'Miller', 'Wilson', 'Anderson', 'Thomas', 'Jackson'];
    
    for (let i = 1; i <= NUM_CUSTOMERS; i++) {
        const firstName = randomItem(firstNames);
        const lastName = randomItem(lastNames);
        const name = `${firstName} ${lastName}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
        const country = randomItem(countries);
        const city = randomItem(cities[country]);
        const segment = randomItem(segments);
        sql += `INSERT INTO dim_customers (customer_name, email, country, city, segment) VALUES ('${name}', '${email}', '${country}', '${city}', '${segment}');\n`;
    }
    return sql;
}

function generateDimProducts() {
    let sql = '-- Populating dim_products\n';
    const cats = Object.keys(categories);
    for (let i = 1; i <= NUM_PRODUCTS; i++) {
        const category = randomItem(cats);
        const subCategory = randomItem(categories[category]);
        const name = `${subCategory} ${i}`;
        const unitPrice = parseFloat(randomRange(20, 1500).toFixed(2));
        const cost = parseFloat((unitPrice * randomRange(0.4, 0.7)).toFixed(2));
        const sku = `SKU-${category.slice(0, 3).toUpperCase()}-${i.toString().padStart(4, '0')}`;
        sql += `INSERT INTO dim_products (product_name, category, sub_category, unit_price, cost, sku) VALUES ('${name}', '${category}', '${subCategory}', ${unitPrice}, ${cost}, '${sku}');\n`;
    }
    return sql;
}

function generateSalesFact() {
    let sql = '-- Populating sales_fact\n';
    const products = []; // We'll mock price to calculate total_amount correctly
    // In a real script we'd query the DB or store them. Here we'll just use randoms but consistent for the logic.
    
    for (let i = 0; i < NUM_SALES; i++) {
        // Random date within range
        const randomDate = new Date(START_DATE.getTime() + Math.random() * (END_DATE.getTime() - START_DATE.getTime()));
        const date_key = randomDate.toISOString().slice(0, 10).replace(/-/g, '');
        
        const customer_id = Math.floor(Math.random() * NUM_CUSTOMERS) + 1;
        const product_id = Math.floor(Math.random() * NUM_PRODUCTS) + 1;
        
        // Realistic seasonality: boost Nov/Dec
        let qtyMultiplier = 1;
        if (randomDate.getMonth() >= 10) qtyMultiplier = 1.5; // Holiday boost
        if (randomDate.getDay() === 0 || randomDate.getDay() === 6) qtyMultiplier *= 1.2; // Weekend boost

        const quantity = Math.max(1, Math.floor(randomRange(1, 10) * qtyMultiplier));
        const unitPrice = randomRange(50, 1000); // Mocked
        const total_amount = parseFloat((quantity * unitPrice).toFixed(2));
        const discount = Math.random() > 0.8 ? parseFloat((total_amount * 0.1).toFixed(2)) : 0;
        const net_amount = total_amount - discount;
        const profit = parseFloat((net_amount * 0.3).toFixed(2)); // Assuming 30% margin for simplicity in generation

        sql += `INSERT INTO sales_fact (date_key, customer_id, product_id, quantity, unit_price, total_amount, discount_amount, net_amount, profit) VALUES (${date_key}, ${customer_id}, ${product_id}, ${quantity}, ${unitPrice.toFixed(2)}, ${total_amount}, ${discount}, ${net_amount}, ${profit});\n`;
    }
    return sql;
}

const finalSql = `
${generateDimDate()}
${generateDimCustomers()}
${generateDimProducts()}
${generateSalesFact()}
`;

fs.writeFileSync(path.join(__dirname, 'seed.sql'), finalSql);
console.log('Data generation complete! seed.sql created.');
