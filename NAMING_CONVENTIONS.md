[NAMING_CONVENTIONS .md](https://github.com/user-attachments/files/32528886/NAMING_CONVENTIONS.md)
# OLMS Coding Standards — Naming Conventions | dictionary

This is the reference for how we name things and how big a function is allowed to get in OLMS. Check it before you commit.

---

## Naming Conventions

| Element | Convention | Example | Why |
|---|---|---|---|
| Classes / Components | `PascalCase` | `ProductController`, `OrderService` | A class is a "thing" (noun) — capitalizing every word makes it stand out from functions and variables at a glance. |
| Functions / Methods | `camelCase`, verb-first | `getOrderById()`, `updateOrderStatus()` | Verb-first names tell you what the function *does* before you even open it. |
| Variables | `camelCase` | `cartTotal`, `productList` | Consistent with function naming, keeps the codebase visually uniform. |
| Booleans | `camelCase` with `is`/`has`/`can` prefix | `isAvailable`, `hasStock` | Removes ambiguity — you know it's a true/false flag just by reading it. |
| Database tables | `snake_case`, plural | `products`, `order_items` | SQL standard — avoids case-sensitivity issues across DB engines. |
| Database columns | `snake_case` | `product_name`, `created_at` | Same reason — matches SQL convention. |
| Foreign keys | `<table>_id` | `merchant_id`, `customer_id` | Instantly clear which table it points to. |

---

## Scope

Applies to all layers of OLMS (Customer Portal, Merchant Dashboard, Admin Hub) and is checked at code review before merging into `dev`.
