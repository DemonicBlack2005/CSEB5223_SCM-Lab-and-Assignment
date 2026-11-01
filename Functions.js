// ============================================================================
// OLMS | FUNCTIONS | Presentation layer (UI controllers)
// Every screen and button handler for Customer and Staff. Must load last: it starts the app.
// Sections: UiHelpers, AuthController, CustomerController, StaffProductController, StaffOrderController, App
// ============================================================================


// ----- UiHelpers -----------------------------------------------------------

// ============================================================================
// UI HELPERS — shared by every controller (< 30 lines per function rule)
// ============================================================================

function byId(id) {
    return document.getElementById(id);
}

function showMessage(elementId, type, text) {
    const box = byId(elementId);
    box.className = `message-box msg-${type}`;
    box.textContent = text;
}

function clearMessage(elementId) {
    const box = byId(elementId);
    box.className = "message-box";
    box.textContent = "";
}

function formatMoney(value) {
    return `$${Number(value).toFixed(2)}`;
}

function formatDate(date) {
    return date.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function describeItems(order) {
    return order.getItems().map(item => `${item.name} × ${item.quantity}`).join(", ");
}

function makeButton(label, className, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.onclick = onClick;
    return button;
}

function makeStatusBadge(status) {
    const badge = document.createElement("span");
    badge.className = `badge badge-${status.toLowerCase()}`;
    badge.textContent = status;
    return badge;
}

// Builds a table safely: text cells use textContent, DOM nodes are appended as-is
function renderTable(container, headers, rows, emptyText) {
    const table = document.createElement("table");
    const headRow = table.createTHead().insertRow();
    headers.forEach(text => {
        const th = document.createElement("th");
        th.textContent = text;
        headRow.appendChild(th);
    });
    const body = table.createTBody();
    if (rows.length === 0) {
        const cell = body.insertRow().insertCell();
        cell.colSpan = headers.length;
        cell.className = "empty-cell";
        cell.textContent = emptyText;
    }
    rows.forEach(values => {
        const row = body.insertRow();
        values.forEach(value => appendCell(row, value));
    });
    container.replaceChildren(wrapScrollable(table));
}

function appendCell(row, value) {
    const cell = row.insertCell();
    const parts = Array.isArray(value) ? value : [value];
    parts.forEach(part => cell.append(part instanceof Node ? part : String(part)));
}

function wrapScrollable(table) {
    const wrapper = document.createElement("div");
    wrapper.className = "table-scroll";
    wrapper.appendChild(table);
    return wrapper;
}

function showView(viewId) {
    ["authView", "customerView", "staffView"].forEach(id => {
        byId(id).classList.toggle("hidden", id !== viewId);
    });
}


// ----- AuthController ------------------------------------------------------

// ============================================================================
// AUTH CONTROLLER — Use Case: Register / Login (Customer & Staff)
// ============================================================================

function handleLogin(event) {
    event.preventDefault();
    try {
        app.authService.login(byId("login_role").value, byId("login_email").value, byId("login_password").value);
        byId("loginForm").reset();
        clearMessage("loginFeedback");
        enterSession();
    } catch (err) {
        showMessage("loginFeedback", "error", err.message);
    }
}

// UML: Customer.register()
function handleRegister(event) {
    event.preventDefault();
    try {
        app.authService.registerCustomer(
            byId("register_name").value,
            byId("register_email").value,
            byId("register_phone").value,
            byId("register_password").value
        );
        byId("registerForm").reset();
        clearMessage("registerFeedback");
        enterSession();
    } catch (err) {
        showMessage("registerFeedback", "error", err.message);
    }
}

function handleLogout() {
    app.authService.logout();
    enterSession();
}

// Routes the active session to its role's view
function enterSession() {
    const session = app.authService.getSession();
    byId("sessionInfo").classList.toggle("hidden", !session);
    if (!session) {
        showView("authView");
        return;
    }
    byId("sessionName").textContent = session.user.name;
    byId("sessionRole").textContent = session.role === "staff" ? `Staff · ${session.user.role}` : "Customer";
    if (session.role === "staff") {
        showView("staffView");
        initStaffView();
    } else {
        showView("customerView");
        initCustomerView();
    }
}


// ----- CustomerController --------------------------------------------------

// ============================================================================
// CUSTOMER CONTROLLER — Browse, View Details, Cart, Place Order, Order Status
// ============================================================================

let catalogueQuery = "";

function currentCustomer() {
    return app.authService.getSession().user;
}

function initCustomerView() {
    catalogueQuery = "";
    byId("browse_query").value = "";
    clearMessage("browseFeedback");
    clearMessage("cartFeedback");
    byId("productDetailsDisplay").textContent = 'Select "Details" on a product to view it here.';
    renderCatalogue();
    renderCart();
    renderCustomerOrders();
}

// UML: Customer.browseProduct()
function handleBrowseProducts(event) {
    event.preventDefault();
    catalogueQuery = byId("browse_query").value.trim();
    const count = renderCatalogue();
    if (!catalogueQuery) clearMessage("browseFeedback");
    else if (count === 0) showMessage("browseFeedback", "error", `No product matching "${catalogueQuery}".`);
    else showMessage("browseFeedback", "info", `Found ${count} matching product(s).`);
}

function handleShowAllProducts() {
    byId("browse_query").value = "";
    catalogueQuery = "";
    clearMessage("browseFeedback");
    renderCatalogue();
}

function renderCatalogue() {
    const products = currentCustomer().browseProduct(app.productRepo, catalogueQuery);
    const rows = products.map(p => [
        p.name,
        formatMoney(p.price),
        p.stockQuantity > 0 ? p.stockQuantity : "Out of stock",
        buildCatalogueActions(p)
    ]);
    renderTable(byId("catalogueDisplay"), ["Product", "Price", "Stock", "Action"], rows, "No products available.");
    return products.length;
}

function buildCatalogueActions(product) {
    const outOfStock = product.stockQuantity === 0;
    const quantity = document.createElement("input");
    Object.assign(quantity, { type: "number", min: "1", max: String(product.stockQuantity), value: "1", className: "qty-input", disabled: outOfStock });
    quantity.setAttribute("aria-label", `Quantity of ${product.name}`);
    const details = makeButton("Details", "btn-action btn-secondary", () => handleViewProductDetails(product.productID));
    const add = makeButton("Add", "btn-action", () => handleAddToCart(product.productID, quantity.value));
    add.disabled = outOfStock;
    return [details, quantity, add];
}

// UML: Customer.viewProductDetails()
function handleViewProductDetails(productID) {
    try {
        const details = currentCustomer().viewProductDetails(app.productRepo, productID);
        const list = document.createElement("dl");
        list.className = "details-list";
        [
            ["Product ID", details.productID],
            ["Name", details.name],
            ["Price", formatMoney(details.price)],
            ["Stock Quantity", details.stockQuantity],
            ["Availability", details.stockQuantity > 0 ? "In stock" : "Out of stock"]
        ].forEach(([term, value]) => {
            list.append(Object.assign(document.createElement("dt"), { textContent: term }));
            list.append(Object.assign(document.createElement("dd"), { textContent: String(value) }));
        });
        byId("productDetailsDisplay").replaceChildren(list);
    } catch (err) {
        showMessage("browseFeedback", "error", err.message);
        renderCatalogue();
    }
}

function handleAddToCart(productID, quantity) {
    try {
        const product = app.productRepo.findById(productID);
        if (!product) throw new Error(`Product ${productID} is no longer available.`);
        currentCustomer().addToCart(product, quantity);
        showMessage("cartFeedback", "success", `Added ${quantity} × ${product.name} to cart.`);
        renderCart();
    } catch (err) {
        showMessage("cartFeedback", "error", err.message);
    }
}

function handleRemoveFromCart(productID) {
    currentCustomer().removeFromCart(productID);
    clearMessage("cartFeedback");
    renderCart();
}

function renderCart() {
    const lines = currentCustomer().getCart();
    let totalCents = 0;
    const rows = lines.map(({ productID, quantity }) => {
        const product = app.productRepo.findById(productID);
        const subtotalCents = product ? Math.round(product.price * 100) * quantity : 0;
        totalCents += subtotalCents;
        return [
            product ? product.name : `${productID} (no longer available)`,
            quantity,
            formatMoney(subtotalCents / 100),
            makeButton("Remove", "btn-action btn-danger", () => handleRemoveFromCart(productID))
        ];
    });
    renderTable(byId("cartDisplay"), ["Product", "Qty", "Subtotal", ""], rows, "Your cart is empty.");
    byId("cartTotal").textContent = `Total: ${formatMoney(totalCents / 100)}`;
    byId("placeOrderBtn").disabled = lines.length === 0;
}

// UML: Customer.placeOrder() -> OrderService -> Order.createOrder()
function handlePlaceOrder() {
    try {
        const order = currentCustomer().placeOrder(app.orderService);
        showMessage("cartFeedback", "success",
            `Order ${order.orderID} placed. Total: ${formatMoney(order.totalAmount)}. Status: ${order.getOrderStatus()}.`);
    } catch (err) {
        showMessage("cartFeedback", "error", err.message);
    }
    renderCart();
    renderCatalogue();
    renderCustomerOrders();
}

// UML: Customer.viewOrderStatus()
function renderCustomerOrders() {
    const orders = currentCustomer().viewOrderStatus(app.orderRepo).reverse();
    const rows = orders.map(o => [
        o.orderID,
        formatDate(o.createdAt),
        describeItems(o),
        formatMoney(o.totalAmount),
        makeStatusBadge(o.getOrderStatus())
    ]);
    renderTable(byId("customerOrdersDisplay"), ["Order ID", "Placed", "Products", "Total", "Status"], rows,
        "You have not placed any orders yet.");
}


// ----- StaffProductController ----------------------------------------------

// ============================================================================
// STAFF PRODUCT CONTROLLER — Lab 3 & 4 Product CRUD, now via Staff.manageProduct()
// ============================================================================

let lastStaffSearch = "";

function currentStaff() {
    return app.authService.getSession().user;
}

function initStaffView() {
    closeEditWorkspace();
    byId("createProductForm").reset();
    byId("search_query").value = "";
    lastStaffSearch = "";
    byId("searchResultsDisplay").replaceChildren();
    clearMessage("createFeedback");
    clearMessage("searchFeedback");
    renderInventoryTable();
    initOrderManagement();
}

function readProductForm(prefix) {
    return {
        productID: byId(`${prefix}_productID`).value,
        name: byId(`${prefix}_name`).value,
        price: byId(`${prefix}_price`).value,
        stockQuantity: byId(`${prefix}_stockQuantity`).value
    };
}

// Keeps the inventory table and any open search results in sync after a change
function refreshProductViews() {
    renderInventoryTable();
    if (lastStaffSearch) renderSearchResults(lastStaffSearch);
}

// Activity 5: Data Display Function Construction
function renderInventoryTable() {
    const rows = app.productRepo.getAll().map(p => [
        p.productID,
        p.name,
        formatMoney(p.price),
        p.stockQuantity,
        [
            makeButton("Edit", "btn-action", () => openEditWorkspace(p.productID)),
            makeButton("Delete", "btn-action btn-danger", () => confirmDirectDelete(p.productID))
        ]
    ]);
    renderTable(byId("inventoryDisplay"), ["Product ID", "Product Name", "Price", "Stock Quantity", "Operations"], rows,
        "No products found in system.");
}

// Activity 1: Create Function Construction
function handleCreateProduct(event) {
    event.preventDefault();
    try {
        const product = currentStaff().manageProduct(app.productRepo, "create", readProductForm("create"));
        showMessage("createFeedback", "success", `Product [${product.productID}] "${product.name}" created successfully.`);
        byId("createProductForm").reset();
        refreshProductViews();
    } catch (err) {
        showMessage("createFeedback", "error", err.message);
    }
}

// Activity 2: Search Function Construction
function handleSearchProduct(event) {
    event.preventDefault();
    lastStaffSearch = byId("search_query").value.trim();
    if (!lastStaffSearch) {
        byId("searchResultsDisplay").replaceChildren();
        showMessage("searchFeedback", "error", "Please enter a Product ID or name to search.");
        return;
    }
    renderSearchResults(lastStaffSearch);
}

function renderSearchResults(query) {
    const matches = app.productRepo.findAny(query);
    const container = byId("searchResultsDisplay");
    if (matches.length === 0) {
        container.replaceChildren();
        showMessage("searchFeedback", "error", `Not found: No product matching "${query}".`);
        return;
    }
    showMessage("searchFeedback", "info", `Search successful: Found ${matches.length} matching product(s).`);
    const rows = matches.map(p => [
        p.productID, p.name, formatMoney(p.price), p.stockQuantity,
        makeButton("Select", "btn-action", () => openEditWorkspace(p.productID))
    ]);
    renderTable(container, ["ID", "Name", "Price", "Stock", "Action"], rows, "");
}

// Activity 3: Edit Function Construction
function openEditWorkspace(productID) {
    const product = app.productRepo.findById(productID);
    if (!product) {
        showMessage("searchFeedback", "error", `Product ${productID} no longer exists.`);
        refreshProductViews();
        return false;
    }
    byId("edit_productID").value = product.productID;
    byId("edit_name").value = product.name;
    byId("edit_price").value = product.price.toFixed(2);
    byId("edit_stockQuantity").value = product.stockQuantity;
    byId("editTitle").textContent = `3 & 4. Edit / Delete Product ${product.productID}`;
    showMessage("editFeedback", "info", `Loaded product ${product.productID} for editing.`);
    byId("editDeleteSection").classList.remove("hidden");
    byId("editDeleteSection").scrollIntoView({ behavior: "smooth" });
    return true;
}

function handleSaveEdit(event) {
    event.preventDefault();
    try {
        const product = currentStaff().manageProduct(app.productRepo, "update", readProductForm("edit"));
        byId("edit_price").value = product.price.toFixed(2);
        showMessage("editFeedback", "success", `Product ${product.productID} updated successfully. Validation verified.`);
        refreshProductViews();
    } catch (err) {
        showMessage("editFeedback", "error", err.message);
    }
}

// Activity 4: Delete Function Construction — returns true only if deleted
function handleDeletePrompt() {
    const product = app.productRepo.findById(byId("edit_productID").value);
    if (!product) return false;
    const confirmed = confirm(
        `Confirm Deletion?\n\n` +
        `Product ID: ${product.productID}\n` +
        `Name: ${product.name}\n` +
        `Price: ${formatMoney(product.price)}\n` +
        `Stock: ${product.stockQuantity}\n\n` +
        `Are you sure you want to delete this record?`
    );
    if (!confirmed) return false;
    currentStaff().manageProduct(app.productRepo, "delete", { productID: product.productID });
    closeEditWorkspace();
    refreshProductViews();
    alert(`Product ${product.productID} has been permanently deleted.`);
    return true;
}

function confirmDirectDelete(productID) {
    if (!openEditWorkspace(productID)) return;
    if (!handleDeletePrompt()) closeEditWorkspace();
}

function closeEditWorkspace() {
    byId("editDeleteSection").classList.add("hidden");
    byId("editForm").reset();
    clearMessage("editFeedback");
}


// ----- StaffOrderController ------------------------------------------------

// ============================================================================
// STAFF ORDER CONTROLLER — Use Cases: View Order, Update Order Status
// ============================================================================

function initOrderManagement() {
    byId("order_status_filter").value = "";
    clearMessage("orderFeedback");
    renderOrderManagement();
}

// UML: Staff.viewOrder()
function renderOrderManagement() {
    const orders = currentStaff().viewOrder(app.orderRepo, byId("order_status_filter").value).reverse();
    const rows = orders.map(o => [
        o.orderID,
        describeCustomer(o.customerID),
        describeItems(o),
        formatMoney(o.totalAmount),
        makeStatusBadge(o.getOrderStatus()),
        buildStatusControls(o)
    ]);
    renderTable(byId("orderManagementDisplay"), ["Order ID", "Customer", "Products", "Total", "Status", "Update Status"],
        rows, "No orders found.");
}

function describeCustomer(customerID) {
    const customer = app.customerRepo.findById(customerID);
    return customer ? `${customer.name} (${customerID})` : customerID;
}

function buildStatusControls(order) {
    const nextStatuses = order.getNextStatuses();
    if (nextStatuses.length === 0) return "Final";
    const select = document.createElement("select");
    select.className = "status-select";
    select.setAttribute("aria-label", `New status for ${order.orderID}`);
    nextStatuses.forEach(status => select.add(new Option(status, status)));
    const button = makeButton("Update", "btn-action", () => handleUpdateOrderStatus(order.orderID, select.value));
    return [select, button];
}

// UML: Staff.updateOrderStatus() -> OrderService -> Order.updateStatus()
function handleUpdateOrderStatus(orderID, newStatus) {
    try {
        const order = currentStaff().updateOrderStatus(app.orderService, orderID, newStatus);
        const note = newStatus === OrderStatus.CANCELLED ? " Stock has been returned to inventory." : "";
        showMessage("orderFeedback", "success", `Order ${order.orderID} is now ${order.getOrderStatus()}.${note}`);
        renderInventoryTable();
    } catch (err) {
        showMessage("orderFeedback", "error", err.message);
    }
    renderOrderManagement();
}


// ----- App -----------------------------------------------------------------

// ============================================================================
// APP — composition root: one shared OLMS instance for every module
// ============================================================================

const app = createSystem();

// Initialize display on load
enterSession();
