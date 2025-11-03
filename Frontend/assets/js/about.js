document.addEventListener("DOMContentLoaded", function () {
  const cartButtons = document.querySelectorAll(".cart-btn");
  const footer = document.querySelector(".footer");
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  updateCartCountFromAPI();

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

  cartButtons.forEach((button) => {
    button.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = "cart.html";
    });
  });

  const animateElements = () => {
    const elements = document.querySelectorAll(
      ".hero-section, .feature-item, .testimonials-section, .cta-card, .footer"
    );
    const windowHeight = window.innerHeight;
    elements.forEach((element) => {
      const elementPosition = element.getBoundingClientRect().top;
      if (elementPosition < windowHeight) {
        element.classList.add("animated");
      }
    });

    if (footer) {
      footer.classList.add("animated");
      footer.style.display = "block";
      footer.style.opacity = "1";
      footer.style.transform = "none";
      footer.style.visibility = "visible";
      footer.style.position = "relative";
      footer.style.zIndex = "1";
    }
  };

  animateElements();
  window.addEventListener("scroll", animateElements);

  if (footer) {
    footer.classList.add("animated");
    footer.style.display = "block";
    footer.style.opacity = "1";
    footer.style.transform = "none";
    footer.style.visibility = "visible";
    footer.style.position = "relative";
    footer.style.zIndex = "1";
  }
});
