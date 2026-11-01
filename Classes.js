// ============================================================================
// OLMS | CLASSES | Domain layer (UML entities)
// OrderStatus enum, Validator, and the four UML classes: Product, Customer, Staff, Order.
// Sections: OrderStatus, Validator, Product, Customer, Staff, Order
// ============================================================================


// ----- OrderStatus ---------------------------------------------------------

/**
 * OrderStatus Enumeration
 * Constants use UPPER_SNAKE_CASE keys per Naming Conventions 3(a)
 */
const OrderStatus = Object.freeze({
    PENDING: "Pending",
    PROCESSING: "Processing",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled"
});

// Allowed lifecycle: Pending -> Processing -> Shipped -> Delivered (cancel only before shipping)
const ORDER_STATUS_FLOW = Object.freeze({
    [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
    [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
    [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
    [OrderStatus.DELIVERED]: [],
    [OrderStatus.CANCELLED]: []
});


// ----- Validator -----------------------------------------------------------

/**
 * Validator — shared input rules for Customer and Staff entities
 */
const Validator = Object.freeze({
    requireText(value, label) {
        if (typeof value !== "string" || value.trim() === "") throw new Error(`${label} cannot be empty.`);
        return value.trim();
    },

    email(value) {
        const email = String(value ?? "").trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Please enter a valid email address.");
        return email;
    },

    phone(value) {
        const phone = String(value ?? "").trim();
        if (!/^\+?[0-9][0-9\s-]{6,18}$/.test(phone)) throw new Error("Phone must contain 7-19 digits (spaces and dashes allowed).");
        return phone;
    },

    password(value) {
        const password = String(value ?? "");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        return password;
    }
});


// ----- Product -------------------------------------------------------------

/**
 * Product Entity Class
 * Encapsulation: Strict private fields with explicit Getters & Setters
 * UML: getDetails(), updateProduct()
 */
class Product {
    #productID;
    #name;
    #price;
    #stockQuantity;

    constructor(productID, name, price, stockQuantity) {
        this.#productID = Product.#validateID(productID);
        this.name = name;
        this.price = price;
        this.stockQuantity = stockQuantity;
    }

    // --- Getters ---
    get productID() { return this.#productID; }
    get name() { return this.#name; }
    get price() { return this.#price; }
    get stockQuantity() { return this.#stockQuantity; }

    // --- Setters ---
    set name(value) {
        if (typeof value !== "string" || value.trim() === "") throw new Error("Product name cannot be empty.");
        this.#name = value.trim();
    }

    set price(value) {
        const parsed = Number(value);
        if (String(value).trim() === "" || !Number.isFinite(parsed) || parsed < 0) throw new Error("Price must be a non-negative decimal.");
        if (Math.abs(parsed * 100 - Math.round(parsed * 100)) > 1e-6) throw new Error("Price can have at most 2 decimal places.");
        this.#price = Math.round(parsed * 100) / 100;
    }

    set stockQuantity(value) {
        const parsed = Number(value);
        if (String(value).trim() === "" || !Number.isSafeInteger(parsed) || parsed < 0) throw new Error("stockQuantity must be a non-negative integer.");
        this.#stockQuantity = parsed;
    }

    // --- UML Methods ---
    getDetails() {
        return {
            productID: this.#productID,
            name: this.#name,
            price: this.#price,
            stockQuantity: this.#stockQuantity
        };
    }

    updateProduct(name, price, stockQuantity) {
        const validated = new Product(this.#productID, name, price, stockQuantity);
        this.#name = validated.name;
        this.#price = validated.price;
        this.#stockQuantity = validated.stockQuantity;
    }

    // --- Order integration: stock movements ---
    reduceStock(quantity) {
        const amount = Product.toQuantity(quantity);
        if (amount > this.#stockQuantity) {
            throw new Error(`Insufficient stock for "${this.#name}": only ${this.#stockQuantity} left.`);
        }
        this.#stockQuantity -= amount;
    }

    restoreStock(quantity) {
        this.#stockQuantity += Product.toQuantity(quantity);
    }

    static toQuantity(value) {
        const parsed = Number(value);
        if (String(value).trim() === "" || !Number.isSafeInteger(parsed) || parsed < 1) {
            throw new Error("Quantity must be a whole number of at least 1.");
        }
        return parsed;
    }

    static #validateID(productID) {
        const id = String(productID ?? "").trim().toUpperCase();
        if (!/^P\d{3,}$/.test(id)) throw new Error("Product ID must be 'P' followed by at least 3 digits (e.g., P005).");
        return id;
    }
}


// ----- Customer ------------------------------------------------------------

/**
 * Customer Entity Class
 * UML: register(), login(), browseProduct(), viewProductDetails(), placeOrder(), viewOrderStatus()
 */
class Customer {
    #customerID;
    #name;
    #email;
    #phone;
    #password;
    #cart = new Map(); // productID -> quantity

    constructor(customerID, name, email, phone, password) {
        this.#customerID = Validator.requireText(String(customerID ?? ""), "Customer ID");
        this.#name = Validator.requireText(name, "Customer name");
        this.#email = Validator.email(email);
        this.#phone = Validator.phone(phone);
        this.#password = Validator.password(password);
    }

    // --- Getters ---
    get customerID() { return this.#customerID; }
    get name() { return this.#name; }
    get email() { return this.#email; }
    get phone() { return this.#phone; }

    // UML: register() — creates, validates and stores a new customer account
    static register(customerRepo, name, email, phone, password) {
        const customer = new Customer(customerRepo.nextId(), name, email, phone, password);
        return customerRepo.save(customer);
    }

    // UML: login() — verifies this customer's login details
    login(password) {
        return this.#password === String(password ?? "");
    }

    // UML: browseProduct() — search and list products (empty query lists all)
    browseProduct(productRepo, query = "") {
        return productRepo.findAny(query);
    }

    // UML: viewProductDetails()
    viewProductDetails(productRepo, productID) {
        const product = productRepo.findById(productID);
        if (!product) throw new Error(`Product ${productID} is no longer available.`);
        return product.getDetails();
    }

    // --- Cart: products selected before placeOrder() ---
    addToCart(product, quantity) {
        const total = (this.#cart.get(product.productID) || 0) + Product.toQuantity(quantity);
        if (total > product.stockQuantity) {
            throw new Error(`Only ${product.stockQuantity} unit(s) of "${product.name}" in stock.`);
        }
        this.#cart.set(product.productID, total);
    }

    removeFromCart(productID) { this.#cart.delete(productID); }
    clearCart() { this.#cart.clear(); }

    getCart() {
        return [...this.#cart].map(([productID, quantity]) => ({ productID, quantity }));
    }

    // UML: placeOrder() — converts the cart into a pending Order
    placeOrder(orderService) {
        return orderService.placeOrder(this);
    }

    // UML: viewOrderStatus() — this customer's orders with their current status
    viewOrderStatus(orderRepo) {
        return orderRepo.findByCustomer(this.#customerID);
    }
}


// ----- Staff ---------------------------------------------------------------

/**
 * Staff Entity Class
 * UML: login(), manageProduct(), viewOrder(), updateOrderStatus()
 */
class Staff {
    #staffID;
    #name;
    #email;
    #role;
    #password;

    constructor(staffID, name, email, role, password) {
        this.#staffID = Validator.requireText(String(staffID ?? ""), "Staff ID");
        this.#name = Validator.requireText(name, "Staff name");
        this.#email = Validator.email(email);
        this.#role = Validator.requireText(role, "Staff role");
        this.#password = Validator.password(password);
    }

    // --- Getters ---
    get staffID() { return this.#staffID; }
    get name() { return this.#name; }
    get email() { return this.#email; }
    get role() { return this.#role; }

    // UML: login() — verifies staff credentials
    login(password) {
        return this.#password === String(password ?? "");
    }

    // UML: manageProduct() — coordinates create / update / delete on the product inventory
    manageProduct(productRepo, action, data = {}) {
        if (action === "create") {
            return productRepo.create(new Product(data.productID, data.name, data.price, data.stockQuantity));
        }
        if (action === "update") {
            const updated = productRepo.update(data.productID, data.name, data.price, data.stockQuantity);
            if (!updated) throw new Error(`Product ${data.productID} no longer exists.`);
            return updated;
        }
        if (action === "delete") {
            if (!productRepo.delete(data.productID)) throw new Error(`Product ${data.productID} no longer exists.`);
            return true;
        }
        throw new Error(`Unknown product action: ${action}`);
    }

    // UML: viewOrder() — all mart orders, optionally filtered by status
    viewOrder(orderRepo, status = "") {
        const orders = orderRepo.getAll();
        return status ? orders.filter(order => order.getOrderStatus() === status) : orders;
    }

    // UML: updateOrderStatus()
    updateOrderStatus(orderService, orderID, newStatus) {
        return orderService.updateOrderStatus(orderID, newStatus);
    }
}


// ----- Order ---------------------------------------------------------------

/**
 * Order Entity Class
 * UML: createOrder(), getOrderStatus(), updateStatus()
 * Association: Order "contains" Product (price snapshot taken when the order is placed)
 */
class Order {
    #orderID;
    #customerID;
    #items;
    #totalAmount;
    #status;
    #createdAt;

    constructor(orderID, customerID, items) {
        if (!Array.isArray(items) || items.length === 0) throw new Error("An order must contain at least one product.");
        this.#orderID = orderID;
        this.#customerID = customerID;
        this.#items = items.map(item => Object.freeze({ ...item }));
        this.#totalAmount = Order.#sumItems(this.#items);
        this.#status = OrderStatus.PENDING;
        this.#createdAt = new Date();
    }

    // UML: createOrder() — builds an order from { product, quantity } lines
    static createOrder(orderID, customerID, lines) {
        const items = lines.map(({ product, quantity }) => ({
            productID: product.productID,
            name: product.name,
            unitPrice: product.price,
            quantity
        }));
        return new Order(orderID, customerID, items);
    }

    // --- Getters ---
    get orderID() { return this.#orderID; }
    get customerID() { return this.#customerID; }
    get totalAmount() { return this.#totalAmount; }
    get createdAt() { return this.#createdAt; }
    getItems() { return [...this.#items]; }

    // UML: getOrderStatus()
    getOrderStatus() { return this.#status; }

    // UML: updateStatus() — only transitions allowed by ORDER_STATUS_FLOW
    updateStatus(newStatus) {
        if (!this.getNextStatuses().includes(newStatus)) {
            throw new Error(`Cannot change order ${this.#orderID} from ${this.#status} to ${newStatus}.`);
        }
        this.#status = newStatus;
    }

    getNextStatuses() {
        return [...(ORDER_STATUS_FLOW[this.#status] || [])];
    }

    // Sum in cents to avoid floating-point drift in totalAmount
    static #sumItems(items) {
        const cents = items.reduce((sum, item) => sum + Math.round(item.unitPrice * 100) * item.quantity, 0);
        return cents / 100;
    }
}
