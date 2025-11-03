document.addEventListener("DOMContentLoaded", function () {
  const hamburger = document.getElementById("hamburger");
  const menu = document.getElementById("menu");
  const navContentRight = document.querySelector(".nav-content-right");
  const faqItems = document.querySelectorAll(".faq-item");
  const contactForm = document.getElementById("contactForm");
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  const toastContainer = document.getElementById("toastContainer");

  function updateCartCount(count = null) {
    if (count === null) {
      // Sum qty of all items
      count = cart.reduce((total, item) => total + (item.qty || 1), 0);
    }
    const counterMobile = document.getElementById("cartCount");
    const counterDesktop = document.getElementById("cartCountDesktop");
    if (counterMobile) counterMobile.textContent = count;
    if (counterDesktop) counterDesktop.textContent = count;
  }

  async function updateCartCountFromAPI() {
    const token = localStorage.getItem("gridcycleToken");
    if (!token) return;

    try {
      const res = await fetch("https://api.anwarhusen.dpdns.org/api/cart", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        console.error("Failed to fetch cart data:", res.status);
        return;
      }

      const data = await res.json();

      cart = Array.isArray(data.cart) ? data.cart : [];
      localStorage.setItem("cart", JSON.stringify(cart));

      // Update both counters
      updateCartCount();
    } catch (err) {
      console.error("Error updating cart count:", err);
    }
  }

  updateCartCountFromAPI();
  // Hamburger toggle
  if (hamburger && menu && navContentRight) {
    hamburger.addEventListener("click", function () {
      this.classList.toggle("active");
      menu.classList.toggle("active");
      navContentRight.classList.toggle("active");
      this.setAttribute("aria-expanded", this.classList.contains("active"));
      document.body.style.overflow = menu.classList.contains("active")
        ? "hidden"
        : "";
    });

    document.addEventListener("click", function (e) {
      if (
        !e.target.closest(".nav-content-right") &&
        !e.target.closest("#hamburger")
      ) {
        hamburger.classList.remove("active");
        menu.classList.remove("active");
        navContentRight.classList.remove("active");
        hamburger.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      }
    });

    menu.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  // FAQ toggle
  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    if (!question) return;

    question.addEventListener("click", () => {
      const isExpanded = question.getAttribute("aria-expanded") === "true";
      faqItems.forEach((otherItem) => {
        const otherQ = otherItem.querySelector(".faq-question");
        otherQ.setAttribute("aria-expanded", "false");
        otherItem.classList.remove("active");
      });
      if (!isExpanded) {
        question.setAttribute("aria-expanded", "true");
        item.classList.add("active");
      }
    });

    question.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        question.click();
      }
    });
  });

  // Contact form
  if (contactForm) {
    contactForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      showToast("Sending....", "success");
      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const subject = document.getElementById("subject").value;
      const message = document.getElementById("message").value.trim();
      
      if (name && email && subject && message) {
        try {
          const res = await fetch("https://api.anwarhusen.dpdns.org/api/contact", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, subject, message }),
          });

          const data = await res.json();
          if (res.ok) {
            showToast(data.message || "Message sent successfully!", "success");
            contactForm.reset();
          } else {
            showToast(data.message || "Failed to send message.", "error");
          }
        } catch (err) {
          console.error(err);
          showToast("Network error. Try again.", "error");
        }
      } else {
        showToast("Please fill in all fields.", "error");
      }
    });
  }

  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    let icon = "";
    switch (type) {
      case "success":
        icon = "✓";
        break;
      case "error":
        icon = "✗";
        break;
      case "warning":
        icon = "⚠";
        break;
      case "info":
        icon = "ℹ";
        break;
    }
    toast.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-message">${message}</span>
      <span class="toast-close">×</span>
    `;
    const closeBtn = toast.querySelector(".toast-close");
    closeBtn.addEventListener("click", function () {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    });
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add("show"), 10);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  }
});
