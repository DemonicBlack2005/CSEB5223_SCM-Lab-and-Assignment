// ============================================================================
// OLMS | REPOSITORIES | Data layer (in-memory storage)
// Stores and looks up Products, Customers, Staff and Orders. Depends on Classes.js.
// Sections: ProductRepository, CustomerRepository, StaffRepository, OrderRepository
// ============================================================================


// ----- ProductRepository ---------------------------------------------------

/**
 * ProductRepository (CRUD Service)
 * Enforces function length <= 30 lines rule
 */
class ProductRepository {
    #storage = [];

    getAll() {
        return [...this.#storage];
    }

    findById(productID) {
        const id = String(productID ?? "").trim().toUpperCase();
        return this.#storage.find(p => p.productID === id) || null;
    }

    // Matches ID or name; an empty query returns every product
    findAny(query) {
        const q = String(query ?? "").trim().toLowerCase();
        if (!q) return this.getAll();
        return this.#storage.filter(p =>
            p.productID.toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q)
        );
    }

    create(product) {
        if (this.findById(product.productID)) {
            throw new Error(`Product ID ${product.productID} already exists in database.`);
        }
        this.#storage.push(product);
        return product;
    }

    update(productID, name, price, stockQuantity) {
        const product = this.findById(productID);
        if (!product) return null;
        product.updateProduct(name, price, stockQuantity);
        return product;
    }

    delete(productID) {
        const product = this.findById(productID);
        if (!product) return false;
        this.#storage.splice(this.#storage.indexOf(product), 1);
        return true;
    }
}


// ----- CustomerRepository --------------------------------------------------

/**
 * CustomerRepository — stores Customer accounts (email is unique)
 */
class CustomerRepository {
    #storage = [];

    nextId() {
        return `C${String(this.#storage.length + 1).padStart(3, "0")}`;
    }

    save(customer) {
        if (this.findByEmail(customer.email)) {
            throw new Error(`An account with email ${customer.email} already exists.`);
        }
        this.#storage.push(customer);
        return customer;
    }

    findByEmail(email) {
        const query = String(email ?? "").trim().toLowerCase();
        return this.#storage.find(c => c.email === query) || null;
    }

    findById(customerID) {
        return this.#storage.find(c => c.customerID === customerID) || null;
    }

    getAll() {
        return [...this.#storage];
    }
}


// ----- StaffRepository -----------------------------------------------------

/**
 * StaffRepository — stores mart Staff accounts (email is unique)
 */
class StaffRepository {
    #storage = [];

    save(staff) {
        if (this.findByEmail(staff.email)) {
            throw new Error(`A staff account with email ${staff.email} already exists.`);
        }
        this.#storage.push(staff);
        return staff;
    }

    findByEmail(email) {
        const query = String(email ?? "").trim().toLowerCase();
        return this.#storage.find(s => s.email === query) || null;
    }

    getAll() {
        return [...this.#storage];
    }
}


// ----- OrderRepository -----------------------------------------------------

/**
 * OrderRepository — stores placed Orders
 */
class OrderRepository {
    #storage = [];

    nextId() {
        return `ORD${String(this.#storage.length + 1).padStart(4, "0")}`;
    }

    save(order) {
        if (this.findById(order.orderID)) throw new Error(`Order ${order.orderID} already exists.`);
        this.#storage.push(order);
        return order;
    }

    findById(orderID) {
        const id = String(orderID ?? "").trim().toUpperCase();
        return this.#storage.find(o => o.orderID === id) || null;
    }

    findByCustomer(customerID) {
        return this.#storage.filter(o => o.customerID === customerID);
    }

    getAll() {
        return [...this.#storage];
    }
}
