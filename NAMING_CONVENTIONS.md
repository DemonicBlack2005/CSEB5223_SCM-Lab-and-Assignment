# Activity 3 (a): Naming Conventions – Dictionary

### 1. General Identifier Case Rules

| Element | Format Style | Rule & Casing Pattern | Example |
| :--- | :--- | :--- | :--- |
| Classes / Interfaces | PascalCase | Concrete nouns representing primary domain entities. | Customer, Staff, Product, Order |
| Methods / Functions | camelCase | Verbs or verb-object phrases defining operations and behaviors. | browseProduct(), viewOrderStatus(), updateProduct() |
| Attributes / Variables | camelCase | Descriptive nouns or compound identifiers specifying state. | customerID, stockQuantity, totalAmount |
| Constants / Enums | UPPER_SNAKE_CASE | Immutable state definitions and enumerations. | ORDER_STATUS_PENDING, ORDER_STATUS_DELIVERED |
| Database Tables | snake_case (Plural) | Plural nouns representing persistent relational tables. | customers, staffs, products, orders |
| Database Columns | snake_case (Singular) | Lowercase identifiers; primary and foreign keys suffixed with _id. | customer_id, product_id, stock_quantity |
| Source Files | PascalCase | Filenames mirror the class name they encapsulate. | Customer.js, Product.js, Order.js |

---

### 2. Domain Entities & Attributes Dictionary

| Entity | Attribute Name (Code) | Database Column | Data Type | Description |
| :--- | :--- | :--- | :--- | :--- |
| Customer | customerID | customer_id | String | Unique primary identifier for a customer account. |
| Customer | name | name | String | Full name of the customer. |
| Customer | email | email | String | Registered customer email address. |
| Customer | phone | phone | String | Contact phone number for delivery coordination. |
| Staff | staffID | staff_id | String | Unique primary identifier for staff. |
| Staff | name | name | String | Full name of the staff member. |
| Staff | email | email | String | Official mart personnel email address. |
| Staff | role | role | String | Access role assigned to the staff member. |
| Product | productID | product_id | String | Unique inventory SKU / product identifier. |
| Product | name | name | String | Commercial name of the listed product. |
| Product | price | price | Decimal | Unit selling price of the product. |
| Product | stockQuantity | stock_quantity | Integer | Current units available in local mart inventory. |
| Order | orderID | order_id | String | Unique invoice / order tracking code. |
| Order | customerID | customer_id | String | Foreign key referencing Customer.customerID. |
| Order | totalAmount | total_amount | Decimal | Final calculated financial cost of the order. |
| Order | status | status | OrderStatus | Current delivery/processing status of the order. |

---

### 3. Method & Function Dictionary

| Method Signature | Class Origin | Access | Return Type | Description |
| :--- | :--- | :--- | :--- | :--- |
| register() | Customer | public (+) | void | Creates and validates a new customer account. |
| login() | Customer, Staff | public (+) | void | Authenticates user credentials and initiates session. |
| browseProduct() | Customer | public (+) | void | Queries and displays active products to the customer. |
| viewProductDetails() | Customer | public (+) | void | Displays granular specifications, stock, and price for a single product. |
| placeOrder() | Customer | public (+) | void | Converts selected items into a pending customer order. |
| viewOrderStatus() | Customer | public (+) | void | Fetches the current fulfillment state of customer orders. |
| manageProduct() | Staff | public (+) | void | Coordinates CRUD operations over the product inventory. |
| viewOrder() | Staff | public (+) | void | Retrieves orders across the mart for processing. |
| updateOrderStatus() | Staff, Order | public (+) | void | Updates order lifecycle status. |
| getDetails() | Product | public (+) | void | Returns internal product properties for viewing. |
| updateProduct() | Product | public (+) | void | Modifies existing product price, name, or stock quantity. |
| CreateOrder() | Order | public (+) | void | Instantiates and persists a new order record. |
| getOrderStatus() | Order | public (+) | OrderStatus | Queries the current enum value of the order status. |

---

### 4. Prohibited Terminology & Synonyms Rule

To prevent inconsistencies across team development, adhere to the approved domain vocabulary:

* Use `Customer`, not `User`, `Buyer`, or `Client`.
* Use `Staff`, not `Admin`, `Merchant`, `Employee`, or `Seller`.
* Use `Product`, not `Item`, `Good`, or `Merchandise`.
* Use `stockQuantity`, not `qty`, `count`, `stock`, or `amount`.
* Use `totalAmount`, not `total`, `price`, `cost`, or `bill`.
