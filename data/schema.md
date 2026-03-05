# Data Schema - Superstore Dashboard

## Raw file
- Path: `data/raw/superstore_raw.csv`
- Source: public Sample Superstore CSV
- Rows: 9,994

## Clean file
- Path: `data/superstore_clean.csv`
- Produced by: `scripts/prepare_superstore.py`

## Columns
- `row_id` (string): row identifier from source.
- `order_id` (string): order business key.
- `order_date` (date ISO): normalized order date (`YYYY-MM-DD`).
- `ship_date` (date ISO): normalized ship date (`YYYY-MM-DD`).
- `year` (int): year extracted from order date.
- `month` (int): month extracted from order date.
- `year_month` (string): monthly bucket (`YYYY-MM`).
- `ship_mode` (string): shipping mode.
- `customer_id` (string): customer id.
- `customer_name` (string): customer name.
- `segment` (string): segment dimension.
- `country` (string): country.
- `city` (string): city.
- `state` (string): state.
- `postal_code` (string): postal code.
- `region` (string): region dimension.
- `product_id` (string): product id.
- `category` (string): top product category.
- `sub_category` (string): product sub-category.
- `product_name` (string): product label.
- `sales` (float): line sales amount.
- `quantity` (int): ordered quantity.
- `discount` (float): discount ratio (0 to 1).
- `profit` (float): line profit amount.
- `profit_margin` (float): `profit / sales` (0 if sales = 0).
- `is_profitable` (int): `1` if profit > 0 else `0`.

## Data quality rules
- Invalid rows (date/number parse errors) are dropped.
- Numeric fields are normalized to explicit decimal precision in the output CSV.
- Margin calculation is protected against divide-by-zero.
