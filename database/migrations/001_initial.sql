-- QALA TWIN AI schema v1. Generated from backend/app/db.py.
BEGIN;

CREATE TABLE IF NOT EXISTS businesses (
	id VARCHAR(36) NOT NULL,
	owner_id VARCHAR(100) NOT NULL,
	name VARCHAR(120) NOT NULL,
	city VARCHAR(120) NOT NULL,
	is_demo BOOLEAN NOT NULL,
	PRIMARY KEY (id)
)

;
CREATE INDEX IF NOT EXISTS ix_businesses_owner_id ON businesses (owner_id);

CREATE TABLE IF NOT EXISTS expenses (
	id VARCHAR(36) NOT NULL,
	business_id VARCHAR(36) NOT NULL,
	category VARCHAR(60) NOT NULL,
	amount NUMERIC(16, 2) NOT NULL,
	occurred_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(business_id) REFERENCES businesses (id)
)

;
CREATE INDEX IF NOT EXISTS ix_expenses_business_id ON expenses (business_id);

CREATE TABLE IF NOT EXISTS products (
	id VARCHAR(36) NOT NULL,
	business_id VARCHAR(36) NOT NULL,
	sku VARCHAR(80) NOT NULL,
	name VARCHAR(160) NOT NULL,
	name_kk VARCHAR(160) NOT NULL,
	category VARCHAR(60) NOT NULL,
	cost_price NUMERIC(16, 2) NOT NULL,
	selling_price NUMERIC(16, 2) NOT NULL,
	stock_quantity INTEGER NOT NULL,
	reorder_point INTEGER NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(business_id) REFERENCES businesses (id)
)

;
CREATE INDEX IF NOT EXISTS ix_products_business_id ON products (business_id);

CREATE TABLE IF NOT EXISTS records (
	id VARCHAR(36) NOT NULL,
	business_id VARCHAR(36) NOT NULL,
	kind VARCHAR(40) NOT NULL,
	data JSON NOT NULL,
	created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(business_id) REFERENCES businesses (id)
)

;
CREATE INDEX IF NOT EXISTS ix_records_kind ON records (kind);
CREATE INDEX IF NOT EXISTS ix_records_business_id ON records (business_id);

CREATE TABLE IF NOT EXISTS sales (
	id VARCHAR(36) NOT NULL,
	business_id VARCHAR(36) NOT NULL,
	product_id VARCHAR(36) NOT NULL,
	quantity INTEGER NOT NULL,
	unit_price NUMERIC(16, 2) NOT NULL,
	unit_cost NUMERIC(16, 2) NOT NULL,
	sold_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
	PRIMARY KEY (id),
	FOREIGN KEY(business_id) REFERENCES businesses (id),
	FOREIGN KEY(product_id) REFERENCES products (id)
)

;
CREATE INDEX IF NOT EXISTS ix_sales_sold_at ON sales (sold_at);
CREATE INDEX IF NOT EXISTS ix_sales_product_id ON sales (product_id);
CREATE INDEX IF NOT EXISTS ix_sales_business_id ON sales (business_id);
CREATE INDEX IF NOT EXISTS ix_sales_business_time ON sales (business_id, sold_at);
COMMIT;
