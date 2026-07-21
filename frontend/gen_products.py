import json, random, openpyxl, re

wb = openpyxl.load_workbook('/mnt/user-data/uploads/Myntra_styles.xlsx', read_only=True)
ws = wb.active
rows = ws.iter_rows(values_only=True)
header = next(rows)

SIZE_MAP = {
    "Topwear": ["S", "M", "L", "XL", "XXL"],
    "Bottomwear": ["28", "30", "32", "34", "36"],
    "Innerwear": ["S", "M", "L", "XL"],
    "Dress": ["XS", "S", "M", "L", "XL"],
    "Saree": ["Free Size"],
    "Loungewear and Nightwear": ["S", "M", "L", "XL"],
}
FOOTWEAR_SIZES = ["6", "7", "8", "9", "10", "11"]
FREE_SIZE = ["Free Size"]

BASE_PRICE = {
    "Apparel": (599, 2999),
    "Footwear": (999, 4999),
    "Accessories": (299, 2499),
    "Personal Care": (149, 1299),
    "Free Items": (99, 999),
    "Sporting Goods": (399, 2999),
    "Home": (249, 1999),
}

def brand_from_name(name: str) -> str:
    # Heuristic: brand is usually the leading word(s) before common
    # gender/fit tokens in the Myntra productDisplayName convention.
    tokens = name.split()
    stop = {"Men", "Women", "Boys", "Girls", "Unisex", "Kids"}
    brand_tokens = []
    for t in tokens:
        if t in stop:
            break
        brand_tokens.append(t)
        if len(brand_tokens) >= 2:
            break
    return " ".join(brand_tokens) if brand_tokens else tokens[0]

def sizes_for(mastercat, subcat, articletype):
    if mastercat == "Footwear":
        return FOOTWEAR_SIZES
    if subcat in SIZE_MAP:
        return SIZE_MAP[subcat]
    if mastercat == "Apparel":
        return ["S", "M", "L", "XL"]
    return FREE_SIZE

products = []
for r in rows:
    if r[0] is None:
        continue
    pid, gender, mastercat, subcat, articletype, color, season, year, usage, name = r
    pid = str(int(pid))
    rnd = random.Random(int(pid))  # deterministic per product

    lo, hi = BASE_PRICE.get(mastercat, (299, 1999))
    price = rnd.randrange(lo, hi, 50)

    brand = brand_from_name(name or "")
    category = (subcat or mastercat or "General").strip()
    subcategory = (articletype or "").strip()
    color_v = (color or "").strip()
    style = f"{(usage or 'Casual').strip()} {(season or '').strip()}".strip()

    tags = list({
        t.strip().lower()
        for t in [gender, mastercat, subcat, articletype, color, season, usage]
        if t
    })

    description = (
        f"{name}. A {(color or '').lower()} {(articletype or subcat or 'piece').lower()} "
        f"from {brand}, designed for {(usage or 'everyday').lower()} wear this "
        f"{(season or '').lower()} season."
    ).replace("  ", " ")

    discount = rnd.choice([0, 0, 0, 0.1, 0.15, 0.2, 0.25, 0.3, 0.4])
    rating = round(rnd.uniform(3.4, 5.0), 1)
    inventory = rnd.randint(0, 80)

    products.append({
        "id": pid,
        "name": name,
        "price": float(price),
        "brand": brand,
        "category": category,
        "subcategory": subcategory,
        "color": color_v,
        "style": style,
        "occasion": [(usage or "Casual").strip()],
        "tags": tags,
        "description": description,
        "sizes": sizes_for(mastercat, subcat, articletype),
        "image_url": f"/images/{pid}.jpg",
        "inventory": inventory,
        "discount": discount,
        "rating": rating,
    })

print("total products:", len(products))
with open("products.json", "w", encoding="utf-8") as f:
    json.dump(products, f, ensure_ascii=False, indent=2)
