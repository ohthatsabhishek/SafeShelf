# Categorized SafeShelf product dataset

The master catalog is `data/products.json`. Each product has a `category` field. Category-specific JSON files are in `data/products-by-category/`, and `data/category-summary.json` lists category counts and file paths.

The supplied dataset contains 112 products. The one item previously marked `Uncategorized` (Himalyan Facewash) is assigned to `Personal Care` based on its name. This is a classification inference, not a source-provided category.

Prices are illustrative estimates from the source dataset, not live prices. Images remain in `dataset_assets/`; product image paths are relative to the project root. MongoDB should generally use one `products` collection with a `category` field and an index, rather than one collection per category. Category-specific files are provided for review/import convenience.
