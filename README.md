# OLMS — Integrated System

Integrates the four UML classes (**Customer, Staff, Product, Order**) into one working web app.
The Lab 3 & 4 Product CRUD module (`OLMS Website_debugged.html`) is now the Staff "Manage Product" area.

## How to run

- **App:** open `index.html` in a browser (no build step, no server needed).
- **Tests:** open `tests/IntegrationTests.html`. The page should show `18 / 18 tests passed`.

Data is held in memory, so refreshing the page resets to the demo data.

### Demo accounts (test data only)

| Role | Email | Password |
| :--- | :--- | :--- |
| Customer | customer@olms.test | customer123 |
| Staff (Manager) | staff@olms.test | staff123 |

New customers can also self-register on the login screen.

## Structure (layered MVC/Service, one file per layer)

```
OLMS/
├── index.html                  UI for both roles (loads the 4 scripts in order)
├── README.md
├── css/
│   └── styles.css
├── js/
│   ├── Classes.js              OrderStatus, Validator, Product, Customer, Staff, Order
│   ├── Repositories.js         ProductRepository, CustomerRepository, StaffRepository, OrderRepository
│   ├── Services.js             OrderService, AuthService, createSystem() + demo data
│   └── Functions.js            UI helpers and controllers for every screen; starts the app
└── tests/
    ├── IntegrationTests.html   Open to run the tests
    └── IntegrationTests.js
```

Each file is split into labelled sections (`// ----- Product -----`) so every class or controller is easy to find.
Load order matters: Classes → Repositories → Services → Functions.

## UML method → code

| UML method | Where | Used by |
| :--- | :--- | :--- |
| Customer.register() | `Customer.register()` | Register form |
| Customer / Staff.login() | `login(password)` via `AuthService.login()` | Login form |
| Customer.browseProduct() | `Customer.browseProduct()` | Browse Products |
| Customer.viewProductDetails() | `Customer.viewProductDetails()` → `Product.getDetails()` | Details button |
| Customer.placeOrder() | `Customer.placeOrder()` → `OrderService.placeOrder()` → `Order.createOrder()` | Place Order |
| Customer.viewOrderStatus() | `Customer.viewOrderStatus()` | My Orders |
| Staff.manageProduct() | `Staff.manageProduct(repo, "create" / "update" / "delete")` | Sections 1–5 |
| Staff.viewOrder() | `Staff.viewOrder()` | Customer Orders |
| Staff.updateOrderStatus() | `Staff.updateOrderStatus()` → `Order.updateStatus()` | Update button |
| Product.updateProduct() | `Product.updateProduct()` | Save Changes |
| Order.getOrderStatus() | `Order.getOrderStatus()` | Status badges |

## Integration rules

- **Placing an order is all-or-nothing.** Every cart line is checked against stock before any stock is reduced.
- **Orders keep the price paid.** Each order stores the unit price at the moment it was placed.
- **Order statuses only move forward:** Pending → Processing → Shipped → Delivered. An order can be cancelled only before it ships, and cancelling returns its stock.
- **Deleted products:** a deleted product cannot be ordered; customers are told to remove it from their cart.

## Additions beyond the UML diagram

- A **cart** on Customer (`addToCart`, `removeFromCart`, `getCart`, `clearCart`), which `placeOrder()` needs.
- A private **password** field on Customer and Staff, because `login()` has to verify something. Passwords are stored in plain text; this is acceptable for an in-memory demo but not for production.
- **Cancelled** status and `Order.getNextStatuses()`.
- **Product ID format** `P` followed by 3 or more digits, and prices limited to 2 decimal places.
