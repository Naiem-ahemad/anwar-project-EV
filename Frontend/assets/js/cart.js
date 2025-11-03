document.addEventListener("DOMContentLoaded", function () {
  const navbar = document.getElementById("navbar");
  const hamburger = document.getElementById("hamburger");
  const menu = document.getElementById("menu");
  const navContentRight = document.querySelector(".nav-content-right");
  const cartCounts = document.querySelectorAll(".cart-count");
  const toastContainer = document.getElementById("toastContainer");
  const faqItems = document.querySelectorAll(".faq-item");
  const cartItems = document.getElementById("cartItems");
  const cartSummary = document.getElementById("cartSummary");
  const subtotal = document.getElementById("subtotal");
  const total = document.getElementById("total");
  const emptyCartBtn = document.getElementById("emptyCart");
  const checkoutBtn = document.getElementById("checkout");

  let cart = [];

  init();

  async function init() {
    await fetchCartFromAPI();

    setupNavbar();
    loadCartItems();
    updateCartCount();

    emptyCartBtn.addEventListener("click", emptyCart);
    checkoutBtn.addEventListener("click", handleCheckout);
    window.addEventListener("storage", handleStorageChange);
  }

  // ------------------ API FUNCTIONS ------------------
  async function fetchCartFromAPI() {
    try {
      const token = localStorage.getItem("gridcycleToken");
      const res = await fetch("https://api.anwarhusen.dpdns.org/api/cart", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        // Each item should now include `id` from DB
        cart = data.cart || [];
      } else {
        console.error("Failed to fetch cart:", res.status);
        cart = [];
      }
    } catch (err) {
      console.error("Error fetching cart:", err);
      cart = [];
    }
  }

  async function emptyCart() {
    if (!confirm("Are you sure you want to empty your cart?")) return;

    const token = localStorage.getItem("gridcycleToken");
    if (!token) {
      alert("You are not logged in!");
      return;
    }

    try {
      const res = await fetch("https://api.anwarhusen.dpdns.org/api/cart", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to empty cart");
      }

      const data = await res.json();
      console.log(data.message); // optional debug log

      // Clear local cart and update UI
      cart = [];
      loadCartItems();
      updateCartCount();
    } catch (err) {
      console.error("Error emptying cart:", err);
      alert("Error emptying cart: " + err.message);
    }
  }

  // ------------------ UI FUNCTIONS ------------------
  function setupNavbar() {
    if (!navbar) return; // no navbar → skip

    window.addEventListener("scroll", () => {
      navbar.classList.toggle("scrolled", window.scrollY > 10);
    });

    // ✅ Run only if mobile menu exists
    if (hamburger && menu && navContentRight) {
      hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("active");
        menu.classList.toggle("active");
        navContentRight.classList.toggle("active");
        document.body.style.overflow = menu.classList.contains("active")
          ? "hidden"
          : "";
      });

      document.querySelectorAll("#menu li a").forEach((link) => {
        link.addEventListener("click", () => {
          hamburger.classList.remove("active");
          menu.classList.remove("active");
          navContentRight.classList.remove("active");
          document.body.style.overflow = "";
        });
      });
    }
  }
  function handleStorageChange(e) {
    if (e.key === "cart") {
      cart = JSON.parse(e.newValue) || [];
      loadCartItems();
      updateCartCount();
    }
  }

  function loadCartItems() {
    if (!cart || cart.length === 0) {
      cartItems.innerHTML = `
        <div class="empty-cart">
          <i class="fas fa-shopping-cart"></i>
          <h3>Your Cart is Empty</h3>
          <p>Explore our eco-friendly bikes and book your ride today!</p>
          <a href="booking.html" class="btn btn-primary">Book a Ride Now</a>
        </div>`;
      cartSummary.style.display = "none";
      return;
    }

    const productImages = {
      "Gridcycle Pro": "assets/img/products/product-1.png",
      "Gridcycle Lite": "assets/img/products/product-2.png",
      "Gridcycle Tour": "assets/img/products/product-3.png",
    };

    let calculatedSubtotal = 0;
    const itemsHTML = cart
      .map((item, index) => {
        calculatedSubtotal += item.price;
        const date = new Date(item.date);
        const formattedDate = date.toLocaleDateString("en-GB", {
          weekday: "short",
          month: "short",
          day: "numeric",
        });
        return `
        <div class="cart-item" data-index="${index}">
          <div class="cart-item-details">
            <div class="cart-item-image">
              <img src="${
                productImages[item.product] ||
                "assets/img/products/product-1.png"
              }" alt="${item.product}" />
            </div>
            <div class="cart-item-info">
              <h3>${item.product}</h3>
              <p>₹${item.price.toFixed(2)} per hour</p>
              <p class="cart-item-date">${formattedDate} at ${item.time}</p>
            </div>
          </div>
          <div class="cart-item-actions">
            <div class="cart-item-price">₹${item.price.toFixed(2)}</div>
            <button class="action-btn delete" data-index="${index}">
              <i class="fas fa-trash"></i> Remove
            </button>
          </div>
        </div>`;
      })
      .join("");

    cartItems.innerHTML = itemsHTML;
    cartSummary.style.display = "block";
    subtotal.textContent = `₹${calculatedSubtotal.toFixed(2)}`;
    total.textContent = `₹${(calculatedSubtotal + 2).toFixed(2)}`;

    updateCartCount();
    setupDeleteButtons();
  }

  function setupDeleteButtons() {
    document.querySelectorAll(".action-btn.delete").forEach((button) => {
      button.addEventListener("click", async () => {
        const index = parseInt(button.getAttribute("data-index"));
        await removeFromCart(index);
      });
    });
  }

  async function removeFromCart(index) {
    const token = localStorage.getItem("gridcycleToken");
    const item = cart[index];
    if (!item || !item.id) {
      console.error("Missing cart item ID");
      return;
    }

    try {
      const res = await fetch(
        `https://api.anwarhusen.dpdns.org/api/cart/${item.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        cart.splice(index, 1);
        loadCartItems();
        updateCartCount();
      } else {
        console.error("Failed to delete:", res.status);
      }
    } catch (err) {
      console.error("Error removing item:", err);
    }
  }

  function updateCartCount() {
    const count = cart.length;
    cartCounts.forEach((el) => (el.textContent = count));
  }

  async function handleCheckout() {
    if (cart.length === 0) {
      showToast("Your cart is empty.", "error");
      return;
    }

    const currentUser = JSON.parse(
      localStorage.getItem("gridcycleCurrentUser")
    );
    if (!currentUser) {
      showToast("Please log in to checkout.", "error");
      return;
    }

    showToast("Processing payment...", "info");
    token = localStorage.getItem("gridcycleToken")
    try {
      // Just for example: mark all items as paid
      for (const item of cart) {
        await fetch(`https://api.anwarhusen.dpdns.org/api/cart/checkout/${item.id}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      showToast("Payment successful!", "success");
    } catch (err) {
      console.error(err);
      showToast("Payment failed.", "error");
    }
  }

  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    const icons = { success: "✓", error: "✗", warning: "⚠", info: "ℹ" };
    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || ""}</span>
      <span class="toast-message">${message}</span>
      <span class="toast-close">×</span>`;
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", () => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    });
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
});
