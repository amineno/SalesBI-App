-- Add image support to products
ALTER TABLE products
ADD COLUMN image_url VARCHAR(255) NULL;
