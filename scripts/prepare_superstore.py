#!/usr/bin/env python3
"""Prepare Sample Superstore dataset for dashboard usage."""

from __future__ import annotations

import csv
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RAW_PATH = ROOT / "data" / "raw" / "superstore_raw.csv"
OUT_PATH = ROOT / "data" / "superstore_clean.csv"

KEEP_COLUMNS = [
    "Row ID",
    "Order ID",
    "Order Date",
    "Ship Date",
    "Ship Mode",
    "Customer ID",
    "Customer Name",
    "Segment",
    "Country",
    "City",
    "State",
    "Postal Code",
    "Region",
    "Product ID",
    "Category",
    "Sub-Category",
    "Product Name",
    "Sales",
    "Quantity",
    "Discount",
    "Profit",
]



def parse_us_date(value: str) -> datetime:
    return datetime.strptime(value.strip(), "%m/%d/%Y")



def as_float(value: str) -> float:
    return float(value.strip()) if value and value.strip() else 0.0



def as_int(value: str) -> int:
    return int(float(value.strip())) if value and value.strip() else 0



def main() -> None:
    if not RAW_PATH.exists():
        raise SystemExit(f"Missing input file: {RAW_PATH}")

    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)

    total_rows = 0
    dropped_rows = 0

    with RAW_PATH.open("r", encoding="utf-8", newline="") as src, OUT_PATH.open(
        "w", encoding="utf-8", newline=""
    ) as dst:
        reader = csv.DictReader(src)
        writer = csv.DictWriter(
            dst,
            fieldnames=[
                "row_id",
                "order_id",
                "order_date",
                "ship_date",
                "year",
                "month",
                "year_month",
                "ship_mode",
                "customer_id",
                "customer_name",
                "segment",
                "country",
                "city",
                "state",
                "postal_code",
                "region",
                "product_id",
                "category",
                "sub_category",
                "product_name",
                "sales",
                "quantity",
                "discount",
                "profit",
                "profit_margin",
                "is_profitable",
            ],
        )
        writer.writeheader()

        for raw in reader:
            total_rows += 1

            if not all(col in raw for col in KEEP_COLUMNS):
                dropped_rows += 1
                continue

            try:
                order_date = parse_us_date(raw["Order Date"])
                ship_date = parse_us_date(raw["Ship Date"])
                sales = as_float(raw["Sales"])
                quantity = as_int(raw["Quantity"])
                discount = as_float(raw["Discount"])
                profit = as_float(raw["Profit"])
            except Exception:
                dropped_rows += 1
                continue

            profit_margin = (profit / sales) if sales else 0.0

            writer.writerow(
                {
                    "row_id": raw["Row ID"].strip(),
                    "order_id": raw["Order ID"].strip(),
                    "order_date": order_date.date().isoformat(),
                    "ship_date": ship_date.date().isoformat(),
                    "year": order_date.year,
                    "month": order_date.month,
                    "year_month": order_date.strftime("%Y-%m"),
                    "ship_mode": raw["Ship Mode"].strip(),
                    "customer_id": raw["Customer ID"].strip(),
                    "customer_name": raw["Customer Name"].strip(),
                    "segment": raw["Segment"].strip(),
                    "country": raw["Country"].strip(),
                    "city": raw["City"].strip(),
                    "state": raw["State"].strip(),
                    "postal_code": raw["Postal Code"].strip(),
                    "region": raw["Region"].strip(),
                    "product_id": raw["Product ID"].strip(),
                    "category": raw["Category"].strip(),
                    "sub_category": raw["Sub-Category"].strip(),
                    "product_name": raw["Product Name"].strip(),
                    "sales": f"{sales:.4f}",
                    "quantity": quantity,
                    "discount": f"{discount:.4f}",
                    "profit": f"{profit:.4f}",
                    "profit_margin": f"{profit_margin:.6f}",
                    "is_profitable": 1 if profit > 0 else 0,
                }
            )

    kept_rows = total_rows - dropped_rows
    print(f"Prepared {kept_rows} rows ({dropped_rows} dropped) -> {OUT_PATH}")


if __name__ == "__main__":
    main()
