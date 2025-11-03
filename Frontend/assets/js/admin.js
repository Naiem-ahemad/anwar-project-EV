const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const sessionData = { loginTime: null };

window.addEventListener("DOMContentLoaded", function () {
  checkSession();
  if (sessionData.loginTime) {
    startRealtimeUpdates();
  }
});

const ctx = document.getElementById("revenueChart").getContext("2d");

function calculateMonthlyRevenue(orders) {
  const monthly = Array(12).fill(0); // 12 months
  orders.forEach((o) => {
    const date = new Date(o.date);
    const month = date.getMonth(); // 0 = Jan
    const total = Number(o.price) * Number(o.qty);
    monthly[month] += total;
  });
  return monthly;
}

async function handleLogin(event) {
  event.preventDefault();
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const errorMessage = document.getElementById("errorMessage");

  try {
    const res = await fetch(
      "https://api.anwarhusen.dpdns.org/api/admin/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );

    const data = await res.json();
    console.log(data);
    if (res.ok && data.message === "Login successful") {
      errorMessage.style.display = "none";

      const userData = {
        name: data.user?.name || "Admin",
        email: data.user?.email || email,
        photo: "./assets/img/icons/user.png", // fixed photo for manual login
        source: "login",
      };
      localStorage.setItem("gridcycleCurrentUser", JSON.stringify(userData));

      const now = new Date().getTime();
      localStorage.setItem("loginTime", now);
      showDashboard();
      startRealtimeUpdates();
    } else {
      errorMessage.style.display = "block";
      errorMessage.textContent = data.message || "Invalid email or password";
    }
  } catch (err) {
    console.error("Login error:", err);
    errorMessage.style.display = "block";
    errorMessage.textContent = "Server error, try again later.";
  }
}

// admin.html script

const googleBtn = document.getElementById("googleCustomBtn");

googleBtn.addEventListener("click", () => {
  const errorMessage = document.getElementById("errorMessage");
  const CLIENT_ID =
    "357602028501-k3dgq742e43iv5uvdkjltmjh97tvogir.apps.googleusercontent.com";
  const REDIRECT_URI = "https://api.anwarhusen.dpdns.org/api/oauth/callback"; // your server endpoint
  const SCOPE = "openid email profile";

  // Listen for popup response
  const handleMessage = (event) => {
    try {
      const data = event.data;
      if (!data || !data.user || !data.user.email)
        throw new Error("Invalid popup response");

      // Only allow specific admin email
      const adminEmail = "naiemahemad888@gmail.com";  // <-- replace with your admin email
      const adminEmail2 = "anwarkamalmomin329@gmail.com"
      if (data.user.email === adminEmail2 || data.user.email === adminEmail) {
        const userData = {
          name: data.user.name,
          email: data.user.email,
          photo: data.user.photo,
          source: "google", // mark login source
        };
        localStorage.setItem("gridcycleCurrentUser", JSON.stringify(userData));
        const now = new Date().getTime();
        localStorage.setItem("loginTime", now);
        showDashboard();
        startRealtimeUpdates();
        updateDashboardUI();
        document.querySelector(".profile-avatar").src = userData.photo;
        errorMessage.style.display = "none";
      } else {
        errorMessage.style.display = "block";
        errorMessage.textContent =
          data.message || "Invaild Email Acess denied.";
      }
    } catch (err) {
      errorMessage.style.display = "block";
      errorMessage.textContent = err.message || "Invalid email or password";
    } finally {
      window.removeEventListener("message", handleMessage);
    }
  };

  window.addEventListener("message", handleMessage);

  // Open Google login popup
  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${SCOPE}&prompt=select_account`;
  window.open(oauthUrl, "googleLogin", "width=500,height=600");
});

function checkSession() {
  const loginTime = localStorage.getItem("loginTime");
  const currentTime = new Date().getTime();

  if (loginTime && currentTime - loginTime < SESSION_DURATION) {
    showDashboard();
    startRealtimeUpdates();
  } else {
    showLogin();
    localStorage.removeItem("loginTime");
  }
}

function showDashboard() {
  document.getElementById("loginPage").style.display = "none";
  document.getElementById("dashboardWrapper").style.display = "block";
}

function showLogin() {
  document.getElementById("loginPage").style.display = "flex";
  document.getElementById("dashboardWrapper").style.display = "none";
}

function logout() {
  sessionData.loginTime = null;
  localStorage.clear(); // remove all user and session data
  showLogin();
  document.getElementById("email").value = "";
  document.getElementById("password").value = "";
  location.reload(); // reload the page to reset UI completely
}

function showPage(pageId) {
  const pages = document.querySelectorAll(".page");
  const sidebarItems = document.querySelectorAll(".sidebar-item");

  pages.forEach((page) => page.classList.remove("active"));
  sidebarItems.forEach((item) => item.classList.remove("active"));

  document.getElementById(pageId).classList.add("active");
  event.target.classList.add("active");

  if (window.innerWidth <= 768) {
    document.getElementById("sidebar").classList.remove("active");
  }
}

function loadProfileAvatar() {
  const userData = JSON.parse(localStorage.getItem("gridcycleCurrentUser"));
  const avatar = document.querySelector(".profile-avatar");

  if (userData && avatar) {
    avatar.src = userData.photo || "./assets/img/icons/user.png";
  } else if (avatar) {
    avatar.src = "./assets/img/icons/user.png"; // default logo
  }
}

// Run after page load
window.addEventListener("DOMContentLoaded", loadProfileAvatar);

function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("active");
}

function searchTable(input, tableId) {
  const filter = input.value.toLowerCase();
  const table = document.getElementById(tableId);
  const rows = table.getElementsByTagName("tr");

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(filter) ? "" : "none";
  }
}

const chartConfig = {
  type: "line",
  options: {
    responsive: true,
    maintainAspectRatio: true,
    aspectRatio: 2.5,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, grid: { color: "#f1f5f9" } },
      x: { grid: { display: false } },
    },
  },
};

let revenueChart, revenueDetailChart;

const user = JSON.parse(localStorage.getItem("gridcycleCurrentUser"));
if (!user) {
  console.warn("No logged-in user. Skipping dashboard WS.");
} else {
  const ws = new WebSocket("wss://api.anwarhusen.dpdns.org"); // your WS endpoint

  ws.onopen = () => {
    console.log("WebSocket connected");
  };

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data); // this is your dashboard data
    updateDashboardUI(data); // call your existing update function
  };

  ws.onclose = () => console.log("WebSocket disconnected");
  ws.onerror = (err) => console.error("WebSocket error:", err);
}

function updateDashboardUI(data) {
  document.querySelector(
    "#dashboard .stats-grid .stat-card:nth-child(1) .stat-value"
  ).textContent = data.users.length;
  document.querySelector(
    "#dashboard .stats-grid .stat-card:nth-child(2) .stat-value"
  ).textContent = data.orders.length;

  const totalRevenue = data.orders.reduce((acc, o) => acc + o.price * o.qty, 0);
  document.querySelector(
    "#dashboard .stats-grid .stat-card:nth-child(3) .stat-value"
  ).textContent = `₹${totalRevenue}`;

  // --- Users Table ---
  const usersTable = document
    .getElementById("usersTable")
    .querySelector("tbody");
  usersTable.innerHTML = "";
  data.users.forEach((u) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${u.name}</td><td>${u.email}</td><td>${
      u.plan || "Basic"
    }</td>
                    <td><span class="status-badge status-active">Active</span></td>
                    <td>${u.createdAt}</td>`;
    usersTable.appendChild(tr);
  });

  // --- Orders Table ---
  const ordersTable = document
    .getElementById("ordersTable")
    .querySelector("tbody");
  ordersTable.innerHTML = "";
  data.orders.forEach((o) => {
    const status = o.status || "Pending";
    const total = Number(o.price) * Number(o.qty);
    const orderDate = new Date(o.date).toLocaleDateString();
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>#ORD-${o.id}</td>
                    <td>${o.userName}</td>
                    <td>₹${total}</td>
                    <td><span class="status-badge ${
                      status === "Pending" ? "status-pending" : "status-paid"
                    }">${status}</span></td>
                    <td>${orderDate}</td>`;
    ordersTable.appendChild(tr);
  });

  const recentOrdersTable = document.querySelector(
    "#dashboard .table-container table tbody"
  );
  recentOrdersTable.innerHTML = "";

  // Sort orders by date descending and take first 5
  const recentOrders = data.orders
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  recentOrders.forEach((o) => {
    const status = o.status || "Pending";
    const total = Number(o.price) * Number(o.qty);
    const orderDate = new Date(o.date).toLocaleDateString();

    const tr = document.createElement("tr");
    tr.innerHTML = `
    <td>#ORD-${o.id}</td>
    <td>${o.userName}</td>
    <td>₹${total}</td>
    <td><span class="status-badge ${
      status === "Pending" ? "status-pending" : "status-paid"
    }">${status}</span></td>
    <td>${orderDate}</td>
  `;
    recentOrdersTable.appendChild(tr);
  });

  // --- Revenue Chart ---
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const revenues = calculateMonthlyRevenue(data.orders);

  const filteredMonths = [];
  const filteredRevenues = [];
  months.forEach((m, i) => {
    if (revenues[i] > 0) {
      filteredMonths.push(m);
      filteredRevenues.push(revenues[i]);
    }
  });

  if (!revenueChart) {
    revenueChart = new Chart(ctx, {
      ...chartConfig,
      data: {
        labels: filteredMonths,
        datasets: [
          {
            label: "Revenue",
            data: filteredRevenues,
            borderColor: "#9EE6B8",
            backgroundColor: "rgba(158,230,184,0.1)",
            tension: 0.4,
            fill: true,
            borderWidth: 3,
          },
        ],
      },
    });
  } else {
    revenueChart.data.labels = filteredMonths;
    revenueChart.data.datasets[0].data = filteredRevenues;
    revenueChart.update();
  }
}

function startRealtimeUpdates() {
  const user = JSON.parse(localStorage.getItem("gridcycleCurrentUser"));
  if (!user) return;

  const ws = new WebSocket("wss://api.anwarhusen.dpdns.org"); // your WS endpoint

  ws.onopen = () => console.log("WebSocket connected");

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    updateDashboardUI(data); // update UI when server sends data
  };

  ws.onclose = () => console.log("WebSocket disconnected");
  ws.onerror = (err) => console.error("WebSocket error:", err);
}
