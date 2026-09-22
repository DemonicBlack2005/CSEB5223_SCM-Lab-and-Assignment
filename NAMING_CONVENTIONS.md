[NAMING_CONVENTIONS.md](https://github.com/user-attachments/files/32529829/NAMING_CONVENTIONS.md)
# OLMS Coding Standards — Naming Conventions

This document is the single reference for how we name things and how big a function is allowed to get. If you are writing code for OLMS, this is the dictionary.

---

## 📖 Naming Conventions

### 1. Classes → `PascalCase`

Every word starts with a capital letter, no underscores, no separators.

| Type | Rule | Example |
|---|---|---|
| Class names | `PascalCase` | `ProductController`, `OrderService`, `CartRepository` |
| React/Next.js components | `PascalCase` | `ProductCard.tsx`, `MerchantDashboard.tsx` |
| Interfaces / Types | `PascalCase`, no `I` prefix | `Product`, `OrderStatus`, `MerchantProfile` |

**Why:** A class or component represents a "thing" — a noun. PascalCase visually separates it from functions and variables at a glance, and its the convention Next.js/React and most OOP languages expect, so we're not fighting the framework.

---

### 2. Functions & Variables → `camelCase`

First word lowercase, every following word capitalized.

| Type | Rule | Example |
|---|---|---|
| Functions / methods | `camelCase`, verb-first | `getProductById()`, `calculateCartTotal()`, `updateOrderStatus()` |
| Variables | `camelCase`, descriptive noun | `productList`, `cartTotal`, `merchantId` |
| Booleans | `camelCase`, prefixed with `is`/`has`/`can` | `isAvailable`, `hasStock`, `canCheckout` |

**Why:** Verb-first function names read like actions (`getProductById` tells you exactly what it does before you open it). Boolean prefixes remove ambiguity — nobody has to guess if `available` is a flag or a list.

---

### 3. Database Entities → `snake_case`

All lowercase, words separated by underscores.

| Type | Rule | Example |
|---|---|---|
| Table names | `snake_case`, plural | `products`, `order_items`, `merchant_stores` |
| Column names | `snake_case` | `product_name`, `created_at`, `store_id` |
| Foreign keys | `<singular_table>_id` | `merchant_id`, `product_id`, `customer_id` |

**Why:** snake_case is the SQL/Postgres/MySQL standard — it avoids case-sensitivity issues across database engines and keeps queries readable without quoting identifiers.

## Scope

These rules apply across all layers of the OLMS MVC/Service architecture (Customer Portal, Merchant Dashboard, Admin Hub) and are enforced at code review before any `feature/*` branch merges into `dev`.
