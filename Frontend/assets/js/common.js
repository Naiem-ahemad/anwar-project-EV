document.addEventListener("DOMContentLoaded", () => {
  initNavbarUser();
});

function initNavbarUser() {
  const loginBtnMobile = document.getElementById("loginButton");
  const loginBtnDesktop = document.getElementById("loginButtonDesktop");

  function updateButtons() {
    const user = JSON.parse(localStorage.getItem("gridcycleCurrentUser"));
    console.log("Current User:", user);

    const buttons = [loginBtnMobile, loginBtnDesktop];

    // Rebuild each button cleanly
    buttons.forEach((btn) => {
      if (!btn || !btn.parentNode) return;
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
    });

    const freshButtons = [
      document.getElementById("loginButton"),
      document.getElementById("loginButtonDesktop"),
    ];

    freshButtons.forEach((btn) => {
      if (!btn) return;

      if (user) {
        const firstName = user.name ? user.name.split(" ")[0] : "";
        btn.innerHTML = `
          <img src="${user.photo || "assets/img/icons/user.png"}" 
               alt="Profile" class="btn-icon profile-icon circular"/>
          ${firstName ? `<span>${firstName}</span>` : ""}
        `;
        btn.classList.add("logged-in");

        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleUserDropdown(btn);
        });
      } else {
        btn.innerHTML = `
          <img src="assets/img/icons/user.png" alt="Login" class="btn-icon"/>
          <span>Login</span>
        `;
        btn.classList.remove("logged-in");

        btn.addEventListener("click", (e) => {
          e.preventDefault();
          // Ensure dropdown never flashes
          const dropdown = document.querySelector(".user-dropdown");
          if (dropdown) dropdown.remove();

          const loginModal = document.getElementById("loginModal");
          if (loginModal) loginModal.style.display = "block";
          else window.location.href = "/login";
        });
      }
    });
  }

  function toggleUserDropdown(button) {
    // Remove old dropdown if any
    document.querySelectorAll(".user-dropdown").forEach((d) => d.remove());

    const dropdown = document.createElement("div");
    dropdown.className = "user-dropdown";
    dropdown.innerHTML = `
      <div class="user-dropdown-item" id="logoutBtn">Logout</div>
    `;
    document.body.appendChild(dropdown);

    const rect = button.getBoundingClientRect();
    dropdown.style.position = "absolute";
    dropdown.style.top = `${rect.bottom + window.scrollY + 5}px`;
    dropdown.style.left = `${rect.left + window.scrollX}px`;
    dropdown.style.minWidth = `${rect.width}px`;

    dropdown.querySelector("#logoutBtn").addEventListener("click", () => {
      // Clear user state
      localStorage.removeItem("gridcycleCurrentUser");
      localStorage.removeItem("gridcycleToken");
      dropdown.remove();

      // Instant reset of UI before DOM refresh
      document.querySelectorAll("#loginButton, #loginButtonDesktop").forEach((btn) => {
        if (btn) {
          btn.innerHTML = `
            <img src="assets/img/icons/user.png" alt="Login" class="btn-icon"/>
            <span>Login</span>
          `;
          btn.classList.remove("logged-in");
        }
      });

      // Force immediate UI refresh
      setTimeout(() => updateButtons(), 10);
    });

    // Close dropdown when clicking elsewhere
    setTimeout(() => {
      document.addEventListener(
        "click",
        (e) => {
          if (!dropdown.contains(e.target) && e.target !== button)
            dropdown.remove();
        },
        { once: true }
      );
    }, 50);
  }

  updateButtons();
  window.updateNavbarUser = updateButtons;
}
