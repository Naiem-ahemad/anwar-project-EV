document.addEventListener("DOMContentLoaded", function () {
  const loginTab = document.getElementById("loginTab");
  const signupTab = document.getElementById("signupTab");
  const loginContent = document.getElementById("loginContent");
  const signupContent = document.getElementById("signupContent");
  const authTitle = document.getElementById("authTitle");
  const authSubtitle = document.getElementById("authSubtitle");
  const authFooterText = document.getElementById("authFooterText");

  function showLogin() {
    loginTab.classList.add("active");
    signupTab.classList.remove("active");
    loginContent.classList.add("active");
    signupContent.classList.remove("active");
    authTitle.textContent = "Welcome Back";
    authSubtitle.textContent = "Login to access your account";
    authFooterText.innerHTML =
      'Don\'t have an account? <a href="#" id="toggleAuthLink">Sign up</a>';
    document.getElementById("loginErrorMessage").textContent = "";
  }

  function showSignup() {
    loginTab.classList.remove("active");
    signupTab.classList.add("active");
    loginContent.classList.remove("active");
    signupContent.classList.add("active");
    authTitle.textContent = "Create Account";
    authSubtitle.textContent = "Join our eco-friendly community";
    authFooterText.innerHTML =
      'Already have an account? <a href="#" id="toggleAuthLink">Login</a>';
    document.getElementById("signupErrorMessage").textContent = "";
  }

  loginTab.addEventListener("click", showLogin);
  signupTab.addEventListener("click", showSignup);

  document.addEventListener("click", function (e) {
    if (e.target && e.target.id === "toggleAuthLink") {
      e.preventDefault();
      if (loginTab.classList.contains("active")) showSignup();
      else showLogin();
    }
  });

  const loginForm = document.getElementById("loginForm");
  const loginErrorMessage = document.getElementById("loginErrorMessage");
  const signupForm = document.getElementById("signupForm");
  const signupErrorMessage = document.getElementById("signupErrorMessage");

  const API_BASE = "https://api.anwarhusen.dpdns.org/api";
  const googleLoginHandler = () => {
    const CLIENT_ID =
      "357602028501-k3dgq742e43iv5uvdkjltmjh97tvogir.apps.googleusercontent.com";
    const REDIRECT_URI = "https://api.anwarhusen.dpdns.org/api/oauth/callback";
    const SCOPE = "openid email profile";

    const handleMessage = (event) => {
      try {
        const data = event.data;
        if (!data || !data.token || !data.user)
          throw new Error("Invalid response from popup");

        const userData = {
          name: data.user.name,
          email: data.user.email,
          photo: data.user.photo || "assets/img/icons/user.png",
        };

        localStorage.setItem("gridcycleCurrentUser", JSON.stringify(userData));
        localStorage.setItem("gridcycleToken", data.token);

        if (typeof window.updateNavbarUser === "function")
          window.updateNavbarUser();
        window.location.href = "index.html";
      } catch (err) {
        console.error("Google login error:", err);
        alert("Google login failed: " + err.message);
      } finally {
        window.removeEventListener("message", handleMessage);
      }
    };

    window.addEventListener("message", handleMessage);

    const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${SCOPE}&prompt=select_account`;
    window.open(oauthUrl, "googleLogin", "width=500,height=600");
  };

  // Attach to both login & signup buttons
  const googleBtn = document.getElementById("googleCustomBtn");
  const signupBtn = document.getElementById("googleCustomBtns");

  if (googleBtn) googleBtn.addEventListener("click", googleLoginHandler);
  if (signupBtn) signupBtn.addEventListener("click", googleLoginHandler);
  
  // --- LOGIN ---
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      loginErrorMessage.textContent = "Please fill in all fields";
      return;
    }

    const loginBtn = loginForm.querySelector("button");
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';

    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Login failed");

      // Save user + token
      const userData = {
        name: data.name,
        email: data.email,
        photo: data.photo || "assets/img/icons/user.png",
      };
      localStorage.setItem("gridcycleCurrentUser", JSON.stringify(userData));
      if (data.token) localStorage.setItem("gridcycleToken", data.token);

      // Update navbar only if common.js loaded
      if (typeof window.updateNavbarUser === "function") {
        window.updateNavbarUser();
      }

      // Redirect after login
      window.location.href = "index.html";
    } catch (err) {
      loginErrorMessage.textContent = err.message;
    } finally {
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login';
    }
  });

  // --- SIGNUP ---
  signupForm.addEventListener("submit", async function (e) {
    e.preventDefault();
    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById(
      "signupConfirmPassword"
    ).value;

    if (!name || !email || !password || !confirmPassword) {
      signupErrorMessage.textContent = "Please fill in all fields";
      return;
    }
    if (password !== confirmPassword) {
      signupErrorMessage.textContent = "Passwords do not match";
      return;
    }

    const signupBtn = signupForm.querySelector("button");
    signupBtn.disabled = true;
    signupBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Creating Account...';

    try {
      const res = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || "Signup failed");

      const userData = {
        name: data.name,
        email: data.email,
        photo: data.photo || "assets/img/icons/user.png",
      };
      localStorage.setItem("gridcycleCurrentUser", JSON.stringify(userData));
      if (data.token) localStorage.setItem("gridcycleToken", data.token);

      if (typeof window.updateNavbarUser === "function") {
        window.updateNavbarUser();
      }

      window.location.href = "index.html";
    } catch (err) {
      signupErrorMessage.textContent = err.message;
    } finally {
      signupBtn.disabled = false;
      signupBtn.innerHTML = '<i class="fas fa-user-plus"></i> Create Account';
    }
  });
});

window.addEventListener("load", function () {
  const API_BASE = "https://api.anwarhusen.dpdns.org/api";

  // --- JWT Parser ---
  function parseJwt(token) {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  }
});
