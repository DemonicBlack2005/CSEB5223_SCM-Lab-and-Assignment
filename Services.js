// ============================================================================
// OLMS | SERVICES | Use cases that span several classes
// OrderService (place order, update status), AuthService (register/login) and createSystem(). Depends on Classes.js and Repositories.js.
// Sections: OrderService, AuthService, SystemFactory
// ============================================================================


// ----- OrderService --------------------------------------------------------

/**
 * OrderService — integrates Customer, Product and Order
 * placeOrder() is all-or-nothing: every line is validated before any stock is reduced.
 */
class OrderService {
    #productRepo;
    #orderRepo;

    constructor(productRepo, orderRepo) {
        this.#productRepo = productRepo;
        this.#orderRepo = orderRepo;
    }

    placeOrder(customer) {
        const cart = customer.getCart();
        if (cart.length === 0) throw new Error("Your cart is empty. Add a product before placing an order.");

        const lines = cart.map(line => this.#resolveLine(line));
        const order = Order.createOrder(this.#orderRepo.nextId(), customer.customerID, lines);

        lines.forEach(({ product, quantity }) => product.reduceStock(quantity));
        this.#orderRepo.save(order);
        customer.clearCart();
        return order;
    }

    updateOrderStatus(orderID, newStatus) {
        const order = this.#orderRepo.findById(orderID);
        if (!order) throw new Error(`Order ${orderID} not found.`);
        order.updateStatus(newStatus);
        if (newStatus === OrderStatus.CANCELLED) this.#restock(order);
        return order;
    }

    #resolveLine({ productID, quantity }) {
        const product = this.#productRepo.findById(productID);
        if (!product) throw new Error(`Product ${productID} is no longer available. Remove it from your cart.`);
        if (quantity > product.stockQuantity) {
            throw new Error(`Only ${product.stockQuantity} unit(s) of "${product.name}" left. Please update your cart.`);
        }
        return { product, quantity };
    }

    // Cancelled orders return their quantities to inventory (skips deleted products)
    #restock(order) {
        order.getItems().forEach(item => {
            const product = this.#productRepo.findById(item.productID);
            if (product) product.restoreStock(item.quantity);
        });
    }
}


// ----- AuthService ---------------------------------------------------------

/**
 * AuthService — Register / Login use case and the active session
 */
class AuthService {
    #customerRepo;
    #staffRepo;
    #session = null;

    constructor(customerRepo, staffRepo) {
        this.#customerRepo = customerRepo;
        this.#staffRepo = staffRepo;
    }

    registerCustomer(name, email, phone, password) {
        const customer = Customer.register(this.#customerRepo, name, email, phone, password);
        this.#session = { role: "customer", user: customer };
        return customer;
    }

    login(role, email, password) {
        if (role !== "customer" && role !== "staff") throw new Error("Please choose Customer or Staff.");
        const repo = role === "staff" ? this.#staffRepo : this.#customerRepo;
        const user = repo.findByEmail(email);
        if (!user || !user.login(password)) throw new Error("Invalid email or password.");
        this.#session = { role, user };
        return user;
    }

    logout() {
        this.#session = null;
    }

    getSession() {
        return this.#session;
    }
}


// ----- SystemFactory -------------------------------------------------------

/**
 * createSystem() — wires every repository and service into one OLMS instance.
 * Used by the web app (js/ui/App.js) and by the integration tests.
 */
function createSystem() {
    const productRepo = new ProductRepository();
    const customerRepo = new CustomerRepository();
    const staffRepo = new StaffRepository();
    const orderRepo = new OrderRepository();
    const orderService = new OrderService(productRepo, orderRepo);
    const authService = new AuthService(customerRepo, staffRepo);

    seedDemoData(productRepo, customerRepo, staffRepo);
    return { productRepo, customerRepo, staffRepo, orderRepo, orderService, authService };
}

// Demo data only — credentials are documented in OLMS/README.md
function seedDemoData(productRepo, customerRepo, staffRepo) {
    [
        ["P001", "Fresh Farm Milk 1L", 3.50, 25],
        ["P002", "Whole Wheat Bread", 2.80, 18],
        ["P003", "Organic Brown Eggs (10s)", 4.20, 30],
        ["P004", "Green Gala Apples (1kg)", 5.90, 12]
    ].forEach(args => productRepo.create(new Product(...args)));

    staffRepo.save(new Staff("S001", "Mart Manager", "staff@olms.test", "Manager", "staff123"));
    customerRepo.save(new Customer(customerRepo.nextId(), "Demo Customer", "customer@olms.test", "012-3456789", "customer123"));
}
