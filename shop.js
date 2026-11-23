(() => {
    const CART_KEY = "lunaGlowCart";
    const money = (amount) => `KSh ${Number(amount || 0).toLocaleString("en-KE")}`;

    const readCart = () => {
        try {
            const value = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
            return Array.isArray(value) ? value.filter((item) => item && item.id && Number(item.price) > 0 && Number(item.quantity) > 0) : [];
        } catch {
            return [];
        }
    };

    const saveCart = (cart) => {
        try {
            localStorage.setItem(CART_KEY, JSON.stringify(cart));
        } catch {
            // The rest of the page remains usable if browser storage is unavailable.
        }
        renderCart();
    };

    const renderCart = () => {
        const cart = readCart();
        const count = cart.reduce((total, item) => total + item.quantity, 0);
        document.querySelectorAll(".cart-count").forEach((badge) => {
            badge.textContent = String(count);
            badge.setAttribute("aria-label", `${count} items in cart`);
        });

        const cartItems = document.querySelector("#cart-items");
        if (!cartItems) return;

        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="cart-empty-message">Your cart is empty. Browse the collection and add something you love.</p>';
        } else {
            cartItems.innerHTML = cart.map((item) => `
                <article class="cart-line-item">
                    <img src="${escapeAttribute(item.image)}" alt="">
                    <div class="cart-line-info"><strong>${escapeText(item.name)}</strong><span>${money(item.price)} each</span></div>
                    <div class="quantity-control" aria-label="Quantity for ${escapeAttribute(item.name)}">
                        <button type="button" data-cart-change="-1" data-cart-id="${escapeAttribute(item.id)}" aria-label="Decrease quantity">−</button>
                        <span>${item.quantity}</span>
                        <button type="button" data-cart-change="1" data-cart-id="${escapeAttribute(item.id)}" aria-label="Increase quantity">+</button>
                    </div>
                    <strong class="cart-line-total">${money(item.price * item.quantity)}</strong>
                    <button class="remove-cart-item" type="button" data-cart-remove="${escapeAttribute(item.id)}">Remove</button>
                </article>`).join("");
        }

        const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
        const delivery = subtotal > 0 ? 250 : 0;
        const total = subtotal + delivery;
        const values = {
            "[data-cart-subtotal]": money(subtotal),
            "[data-cart-discount]": money(0),
            "[data-cart-delivery]": delivery ? money(delivery) : "Calculated at checkout",
            "[data-cart-total]": money(total)
        };
        Object.entries(values).forEach(([selector, value]) => {
            const element = document.querySelector(selector);
            if (element) element.textContent = value;
        });
    };

    document.querySelectorAll('a[href="#product-details"]').forEach((link) => {
        link.setAttribute("href", "products.html");
    });

    const escapeText = (value) => String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
    const escapeAttribute = escapeText;

    document.addEventListener("click", (event) => {
        const addButton = event.target.closest(".add-to-cart, .product-actions button");
        if (addButton) {
            const card = addButton.closest("[data-product-card]") || addButton.closest(".product-card");
            if (!card) return;
            const title = card.dataset.name || card.querySelector("h3")?.textContent.trim() || "Beauty product";
            const rawPrice = card.dataset.price || [...card.querySelectorAll(".product-meta span:first-child")].map((node) => node.textContent).join(" ");
            const prices = String(rawPrice).match(/[\d,]+/g) || [];
            const price = Number(prices.at(-1)?.replaceAll(",", "") || 0);
            const image = card.dataset.image || card.querySelector(".product-image img")?.getAttribute("src") || "";
            const id = card.dataset.productId || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
            if (!price) return;
            const cart = readCart();
            const existing = cart.find((item) => item.id === id);
            if (existing) existing.quantity += 1;
            else cart.push({ id, name: title, price, image, quantity: 1 });
            saveCart(cart);
            const feedback = document.querySelector("[data-cart-feedback]");
            if (feedback) feedback.textContent = `${title} added to your cart.`;
            addButton.textContent = "Added";
            window.setTimeout(() => { addButton.textContent = "Add to Cart"; }, 1100);
            return;
        }

        const removeButton = event.target.closest("[data-cart-remove]");
        if (removeButton) {
            saveCart(readCart().filter((item) => item.id !== removeButton.dataset.cartRemove));
            return;
        }

        const quantityButton = event.target.closest("[data-cart-change]");
        if (quantityButton) {
            const cart = readCart();
            const item = cart.find((entry) => entry.id === quantityButton.dataset.cartId);
            if (item) {
                item.quantity += Number(quantityButton.dataset.cartChange);
                saveCart(cart.filter((entry) => entry.quantity > 0));
            }
        }
    });

    const menuToggle = document.querySelector(".menu-toggle");
    const navLinks = document.querySelector(".nav-links");
    const closeMenu = () => {
        if (!menuToggle || !navLinks) return;
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Open navigation menu");
        menuToggle.textContent = "☰";
        navLinks.classList.remove("is-open");
    };

    if (menuToggle && navLinks) {
        menuToggle.addEventListener("click", () => {
            const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
            menuToggle.setAttribute("aria-expanded", String(!isOpen));
            menuToggle.setAttribute("aria-label", isOpen ? "Open navigation menu" : "Close navigation menu");
            menuToggle.textContent = isOpen ? "☰" : "×";
            navLinks.classList.toggle("is-open", !isOpen);
        });

        navLinks.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") closeMenu();
        });
        window.addEventListener("resize", () => {
            if (window.innerWidth > 800) closeMenu();
        });
    }

    const productSearch = document.querySelector("#product-search");
    const productCards = [...document.querySelectorAll("[data-product-card]")];
    if (productSearch && productCards.length) {
        const params = new URLSearchParams(window.location.search);
        productSearch.value = params.get("q") || "";
        let activeFilter = "all";
        const updateProducts = () => {
            const query = productSearch.value.trim().toLowerCase();
            let shown = 0;
            productCards.forEach((card) => {
                const matchesFilter = activeFilter === "all" || card.dataset.category === activeFilter;
                const matchesQuery = !query || `${card.dataset.name} ${card.dataset.category} ${card.textContent}`.toLowerCase().includes(query);
                card.hidden = !(matchesFilter && matchesQuery);
                if (!card.hidden) shown += 1;
            });
            const status = document.querySelector("[data-search-status]");
            if (status) status.textContent = shown ? `Showing ${shown} product${shown === 1 ? "" : "s"}.` : "No products match that search. Try another term or category.";
        };
        productSearch.addEventListener("input", updateProducts);
        document.querySelectorAll("[data-filter]").forEach((button) => {
            button.addEventListener("click", () => {
                activeFilter = button.dataset.filter;
                document.querySelectorAll("[data-filter]").forEach((filterButton) => filterButton.classList.toggle("is-active", filterButton === button));
                updateProducts();
            });
        });
        updateProducts();
    }

    const reviewForm = document.querySelector("[data-review-form]");
    if (reviewForm) {
        reviewForm.addEventListener("submit", (event) => {
            event.preventDefault();
            const status = reviewForm.querySelector("[data-review-status]");
            if (status) status.textContent = "Thank you for sharing your experience. In this demo, your review has not been sent to a server.";
            reviewForm.reset();
        });
    }

    renderCart();
})();
