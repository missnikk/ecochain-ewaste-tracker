const CATEGORIES = [
  { category: 1, code: "ITEW",  name: "IT and telecommunication equipment", count: 27,
    items: ["Laptop", "Desktop computer", "Mobile phone", "Tablet", "Printer", "Router"] },
  { category: 2, code: "CEEW",  name: "Consumer electrical and electronics, and photovoltaic panels", count: 19,
    items: ["Television", "Digital camera", "Music system", "Solar panel"] },
  { category: 3, code: "LSEEW", name: "Large and small electrical and electronic equipment", count: 34,
    items: ["Refrigerator", "Washing machine", "Microwave oven", "Air conditioner"] },
  { category: 4, code: "EETW",  name: "Electrical and electronic tools", count: 8,
    items: ["Electric drill", "Electric saw"] },
  { category: 5, code: "TLSEW", name: "Toys, leisure and sports equipment", count: 6,
    items: ["Electronic toy", "Video game console"] },
  { category: 6, code: "MDW",   name: "Medical devices", count: 10,
    items: ["Blood pressure monitor", "Digital thermometer"] },
  { category: 7, code: "LIW",   name: "Laboratory instruments", count: 2,
    items: ["Gas analyser"] },
];

function seedCatalog(db) {
  const has = db.prepare("SELECT COUNT(*) AS n FROM catalog").get().n;
  if (has > 0) return;
  const insCat = db.prepare("INSERT INTO catalog (category, code, name, official_item_count) VALUES (?, ?, ?, ?)");
  const insItem = db.prepare("INSERT INTO catalog_items (category, name) VALUES (?, ?)");
  db.transaction(() => {
    for (const c of CATEGORIES) {
      insCat.run(c.category, c.code, c.name, c.count);
      for (const it of c.items) insItem.run(c.category, it);
    }
  })();
}

module.exports = { CATEGORIES, seedCatalog };
