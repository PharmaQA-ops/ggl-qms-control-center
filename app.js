/* =========================================================
   GGL QMS CONTROL CENTER
   FINAL FRONTEND SCRIPT
   LOGIN + SESSION + RBAC + DASHBOARD + MODULES + CRUD
   FILES + REPORTS + AUDIT LOG
   ========================================================= */

const API_URL =
  "https://script.google.com/macros/s/AKfycbwnmtkqrVmggRbZnJserN_y5DwB4BPQ96oeCyoqbvXGBevmdGpqCh3TkVSDE8g6-2Kyrw/exec";

let currentUser = null;
let sessionToken = null;
let currentModule = "dashboard";
let currentRecordId = null;

const STORAGE_TOKEN = "GGL_QMS_TOKEN";
const STORAGE_USER = "GGL_QMS_USER";

const MODULE_MAP = {
  dashboard: "DASHBOARD",
  capa: "CAPA",
  complaints: "COMPLAINTS",
  compliance: "COMPLIANCE",
  audits: "AUDITS",
  actions: "ACTIONS",
  documents: "DOCUMENTS",
  evidence: "EVIDENCE",
  reports: "REPORTS",
  users: "USERS",
  auditlog: "AUDIT_LOG"
};

const PAGE_TITLES = {
  dashboard: "Dashboard",
  capa: "CAPA Management",
  complaints: "Complaints",
  compliance: "Compliance",
  audits: "Audits",
  actions: "Actions",
  documents: "Documents",
  evidence: "Evidence",
  reports: "Reports",
  users: "User Administration",
  auditlog: "Audit Log"
};

/* =========================================================
   INIT
   ========================================================= */

document.addEventListener("DOMContentLoaded", init);

function init() {
  restoreSession();
  setupLoginForm();
  setupForgotPassword();
  setupNavigation();
  setupLogout();
  setupPasswordToggle();
  setupMobileMenu();

  if (sessionToken && currentUser) {
    showApp();
    loadDashboard();
  } else {
    showLogin();
  }

  console.log("GGL QMS CONTROL CENTER JS LOADED");
  console.log("API:", API_URL);
}

/* =========================================================
   SESSION
   ========================================================= */

function restoreSession() {
  try {
    const token = localStorage.getItem(STORAGE_TOKEN);
    const user = localStorage.getItem(STORAGE_USER);

    if (token && user) {
      const parsed = JSON.parse(user);

      if (parsed && parsed.userId && parsed.username) {
        sessionToken = token;
        currentUser = parsed;
      } else {
        clearSession();
      }
    }
  } catch (error) {
    console.error("SESSION RESTORE ERROR:", error);
    clearSession();
  }
}

function saveSession(token, user) {
  sessionToken = token;
  currentUser = user;

  localStorage.setItem(STORAGE_TOKEN, token);
  localStorage.setItem(STORAGE_USER, JSON.stringify(user));
}

function clearSession() {
  sessionToken = null;
  currentUser = null;
  localStorage.removeItem(STORAGE_TOKEN);
  localStorage.removeItem(STORAGE_USER);
}

/* =========================================================
   API
   ========================================================= */

async function apiRequest(action, data = {}) {
  const payload = {
    action,
    ...data
  };

  if (sessionToken && action !== "LOGIN") {
    payload.token = sessionToken;
  }

  console.log("QMS API REQUEST:", payload);

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    const raw = await response.text();

    console.log("QMS API HTTP STATUS:", response.status);
    console.log("QMS API RAW RESPONSE:", raw);

    let result;

    try {
      result = JSON.parse(raw);
    } catch (error) {
      console.error("JSON PARSE ERROR:", error);
      return {
        success: false,
        error: "INVALID_API_RESPONSE",
        raw
      };
    }

    console.log("QMS API RESPONSE:", result);

    if (
      result &&
      ["SESSION_EXPIRED", "INVALID_SESSION", "UNAUTHORIZED"]
        .includes(String(result.error || "").toUpperCase())
    ) {
      handleSessionExpired();
    }

    return result;
  } catch (error) {
    console.error("QMS API NETWORK ERROR:", error);

    return {
      success: false,
      error: "NETWORK_ERROR",
      message: error.message
    };
  }
}

/* =========================================================
   LOGIN
   ========================================================= */

function setupLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const username = document.getElementById("username")?.value.trim() || "";
    const password = document.getElementById("password")?.value || "";

    clearLoginError();

    if (!username || !password) {
      showLoginError("Please enter username and password.");
      return;
    }

    setLoginLoading(true);

    try {
      const result = await apiRequest("LOGIN", {
        username,
        password
      });

      console.log("LOGIN RESULT:", result);

      if (!result || !result.success) {
        showLoginError(getFriendlyError(result));
        return;
      }

      if (!result.token || !result.user) {
        showLoginError("Login response is incomplete.");
        return;
      }

      saveSession(result.token, result.user);

      document.getElementById("password").value = "";

      showApp();
      await loadDashboard();

      showMessage("Login successful.", "success");
    } finally {
      setLoginLoading(false);
    }
  });
}

function setLoginLoading(loading) {
  const button = document.getElementById("loginButton");
  const text = document.getElementById("loginButtonText");
  const loader = document.getElementById("loginLoader");

  if (button) button.disabled = loading;
  if (text) text.textContent = loading ? "Signing in..." : "Sign In";
  if (loader) loader.classList.toggle("hidden", !loading);
}

function showLoginError(message) {
  const el = document.getElementById("loginError");
  if (el) el.textContent = message || "";
}

function clearLoginError() {
  showLoginError("");
}

/* =========================================================
   PASSWORD TOGGLE
   ========================================================= */

function setupPasswordToggle() {
  const button = document.getElementById("togglePassword");
  const input = document.getElementById("password");

  if (!button || !input) return;

  button.addEventListener("click", () => {
    const visible = input.type === "text";
    input.type = visible ? "password" : "text";
    button.textContent = visible ? "Show" : "Hide";
  });
}

/* =========================================================
   APP / LOGIN VIEW
   ========================================================= */

function showApp() {
  const login = document.getElementById("loginPage");
  const application = document.getElementById("application");

  if (login) login.style.display = "none";

  if (application) {
    application.classList.remove("hidden");
    application.style.display = "";
  }

  updateUserInterface();
}

function showLogin() {
  const login = document.getElementById("loginPage");
  const application = document.getElementById("application");

  if (application) {
    application.classList.add("hidden");
    application.style.display = "none";
  }

  if (login) {
    login.style.display = "";
  }
}

function updateUserInterface() {
  if (!currentUser) return;

  setText("userName", currentUser.name || currentUser.username || "User");
  setText("userRole", currentUser.role || "USER");

  const adminNavigation = document.getElementById("adminNavigation");

  if (adminNavigation) {
    adminNavigation.classList.toggle("hidden", !isAdmin());
    adminNavigation.style.display = isAdmin() ? "" : "none";
  }

  applyRBAC();
}

function applyRBAC() {
  document.querySelectorAll("[data-admin-only]").forEach(element => {
    element.style.display = isAdmin() ? "" : "none";
  });

  document.querySelectorAll("[data-user-only]").forEach(element => {
    element.style.display = !isAdmin() ? "" : "none";
  });
}

/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogout() {
  const button = document.getElementById("logoutButton");

  if (button) {
    button.addEventListener("click", logout);
  }

  document.querySelectorAll("[data-action='logout']").forEach(element => {
    element.addEventListener("click", logout);
  });
}

async function logout() {
  try {
    if (sessionToken) {
      await apiRequest("LOGOUT");
    }
  } catch (error) {
    console.warn("LOGOUT ERROR:", error);
  }

  clearSession();
  currentModule = "dashboard";
  currentRecordId = null;
  showLogin();
}

/* =========================================================
   SESSION EXPIRED
   ========================================================= */

function handleSessionExpired() {
  clearSession();
  showLogin();
  showMessage("Your session has expired. Please login again.", "error");
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {
  document.querySelectorAll(".nav-item[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      const page = button.dataset.page;
      openModule(page);
    });
  });
}

async function openModule(page) {
  if (!currentUser) {
    showLogin();
    return;
  }

  if (page === "users" && !isAdmin()) {
    showMessage("Administrator access required.", "error");
    return;
  }

  if (page === "auditlog" && !isAdmin()) {
    showMessage("Administrator access required.", "error");
    return;
  }

  currentModule = page;

  document.querySelectorAll(".nav-item[data-page]").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  setText("pageTitle", PAGE_TITLES[page] || page);

  closeMobileMenu();

  if (page === "dashboard") {
    await loadDashboard();
  } else if (page === "reports") {
    await loadReportsPage();
  } else if (page === "users") {
    await loadUsers();
  } else if (page === "auditlog") {
    await loadAuditLog();
  } else {
    await loadModule(page);
  }
}

/* =========================================================
   DASHBOARD
   ========================================================= */

async function loadDashboard() {
  const container = getPageContent();

  if (!container) return;

  container.innerHTML = `
    <div class="qms-loading">
      <div class="loader"></div>
      <p>Loading QMS dashboard...</p>
    </div>
  `;

  const result = await apiRequest("DASHBOARD");

  console.log("DASHBOARD RESULT:", result);

  if (!result || !result.success) {
    container.innerHTML = `
      <div class="qms-empty-state">
        <h3>Dashboard unavailable</h3>
        <p>${escapeHtml(getFriendlyError(result))}</p>
        <button type="button" onclick="loadDashboard()">Retry</button>
      </div>
    `;
    return;
  }

  renderDashboard(result);
}

function renderDashboard(data) {
  const container = getPageContent();
  if (!container) return;

  const stats = data.stats || {};

  container.innerHTML = `
    <div class="qms-page-header">
      <div>
        <h1>QMS Control Center</h1>
        <p>Quality management, CAPA, compliance, complaints and audit control.</p>
      </div>
      <div class="qms-status-badge">SYSTEM ONLINE</div>
    </div>

    <div class="qms-stat-grid">
      ${statCard("CAPA", stats.capa, "capa")}
      ${statCard("Complaints", stats.complaints, "complaints")}
      ${statCard("Compliance", stats.compliance, "compliance")}
      ${statCard("Audits", stats.audits, "audits")}
      ${statCard("Actions", stats.actions, "actions")}
      ${statCard("Documents", stats.documents, "documents")}
      ${statCard("Evidence", stats.evidence, "evidence")}
      ${statCard("Overdue", stats.overdue, "overdue")}
    </div>

    <div class="qms-dashboard-grid">
      <div class="qms-panel">
        <div class="qms-panel-header">
          <div>
            <h3>QMS Modules</h3>
            <p>Open a module to view and manage records.</p>
          </div>
        </div>

        <div class="qms-module-grid">
          ${moduleCard("CAPA", "capa", "Corrective and preventive actions")}
          ${moduleCard("Complaints", "complaints", "Customer complaints and investigations")}
          ${moduleCard("Compliance", "compliance", "Requirements and compliance status")}
          ${moduleCard("Audits", "audits", "Audit findings and closure")}
          ${moduleCard("Actions", "actions", "Corrective and follow-up actions")}
          ${moduleCard("Documents", "documents", "Controlled QMS documents")}
          ${moduleCard("Evidence", "evidence", "Objective evidence and records")}
          ${moduleCard("Reports", "reports", "Audit-ready management reports")}
        </div>
      </div>

      <div class="qms-panel">
        <div class="qms-panel-header">
          <div>
            <h3>System Information</h3>
            <p>Current session and system state.</p>
          </div>
        </div>

        <div class="qms-info-list">
          <div><span>User</span><strong>${escapeHtml(currentUser?.name || currentUser?.username || "")}</strong></div>
          <div><span>Role</span><strong>${escapeHtml(currentUser?.role || "")}</strong></div>
          <div><span>Department</span><strong>${escapeHtml(currentUser?.department || "")}</strong></div>
          <div><span>Status</span><strong>ACTIVE</strong></div>
        </div>
      </div>
    </div>
  `;
}

function statCard(label, value, page) {
  return `
    <button type="button" class="qms-stat-card" onclick="openModule('${page}')">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value ?? 0)}</strong>
    </button>
  `;
}

function moduleCard(label, page, description) {
  return `
    <button type="button" class="qms-module-card" onclick="openModule('${page}')">
      <strong>${escapeHtml(label)}</strong>
      <span>${escapeHtml(description)}</span>
    </button>
  `;
}

/* =========================================================
   MODULES
   ========================================================= */

async function loadModule(page) {
  const container = getPageContent();
  if (!container) return;

  const backendModule = MODULE_MAP[page] || String(page).toUpperCase();

  container.innerHTML = `
    <div class="qms-loading">
      <div class="loader"></div>
      <p>Loading ${escapeHtml(PAGE_TITLES[page] || page)}...</p>
    </div>
  `;

  const result = await apiRequest("LIST", {
    module: backendModule
  });

  console.log("MODULE RESULT:", backendModule, result);

  if (!result || !result.success) {
    container.innerHTML = `
      <div class="qms-empty-state">
        <h3>Unable to load module</h3>
        <p>${escapeHtml(getFriendlyError(result))}</p>
        <button type="button" onclick="openModule('${escapeJs(page)}')">Retry</button>
      </div>
    `;
    return;
  }

  renderModuleList(backendModule, result);
}

function renderModuleList(module, result) {
  const container = getPageContent();
  if (!container) return;

  const rows =
    result.rows ||
    result.data ||
    result.records ||
    [];

  const normalizedRows = Array.isArray(rows)
    ? rows
    : [];

  container.innerHTML = `
    <div class="qms-page-header">
      <div>
        <h1>${escapeHtml(PAGE_TITLES[currentModule] || module)}</h1>
        <p>${normalizedRows.length} record(s) available.</p>
      </div>
      <div>
        <button type="button" class="qms-primary-button"
          onclick="showMessage('Record creation form can be connected here.', 'info')">
          + New Record
        </button>
      </div>
    </div>

    ${
      normalizedRows.length
        ? buildTable(normalizedRows)
        : `
          <div class="qms-empty-state">
            <h3>No records found</h3>
            <p>This module currently contains no records.</p>
          </div>
        `
    }
  `;
}

/* =========================================================
   USERS
   ========================================================= */

async function loadUsers() {
  if (!isAdmin()) {
    showMessage("Administrator access required.", "error");
    return;
  }

  const container = getPageContent();
  if (!container) return;

  container.innerHTML = `
    <div class="qms-loading">
      <div class="loader"></div>
      <p>Loading users...</p>
    </div>
  `;

  const result = await apiRequest("ADMIN_USERS");

  if (!result || !result.success) {
    container.innerHTML = `
      <div class="qms-empty-state">
        <h3>Unable to load users</h3>
        <p>${escapeHtml(getFriendlyError(result))}</p>
      </div>
    `;
    return;
  }

  renderUsers(result);
}

function renderUsers(result) {
  const container = getPageContent();
  if (!container) return;

  const users =
    result.users ||
    result.data ||
    result.rows ||
    [];

  const safeUsers = Array.isArray(users) ? users : [];

  container.innerHTML = `
    <div class="qms-page-header">
      <div>
        <h1>User Administration</h1>
        <p>Manage QMS users, roles and access status.</p>
      </div>
      <button type="button" class="qms-primary-button"
        onclick="showMessage('Use createUser(data) to create a user through the API.', 'info')">
        + Add User
      </button>
    </div>

    ${
      safeUsers.length
        ? buildTable(safeUsers, true)
        : `<div class="qms-empty-state"><h3>No users found</h3></div>`
    }
  `;
}

/* =========================================================
   AUDIT LOG
   ========================================================= */

async function loadAuditLog() {
  if (!isAdmin()) {
    showMessage("Administrator access required.", "error");
    return;
  }

  const container = getPageContent();
  if (!container) return;

  container.innerHTML = `
    <div class="qms-loading">
      <div class="loader"></div>
      <p>Loading audit log...</p>
    </div>
  `;

  const result = await apiRequest("LIST", {
    module: "AUDIT_LOG"
  });

  if (!result || !result.success) {
    container.innerHTML = `
      <div class="qms-empty-state">
        <h3>Unable to load audit log</h3>
        <p>${escapeHtml(getFriendlyError(result))}</p>
      </div>
    `;
    return;
  }

  renderModuleList("AUDIT_LOG", result);
}

/* =========================================================
   REPORTS
   ========================================================= */

async function loadReportsPage() {
  const container = getPageContent();
  if (!container) return;

  container.innerHTML = `
    <div class="qms-page-header">
      <div>
        <h1>Reports</h1>
        <p>Generate audit-ready QMS reports.</p>
      </div>
    </div>

    <div class="qms-report-grid">
      ${reportCard("CAPA Management Report", "CAPA Management Report")}
      ${reportCard("Complaint Report", "Complaint Report")}
      ${reportCard("Compliance Status Report", "Compliance Status Report")}
      ${reportCard("Audit Findings Report", "Audit Findings Report")}
      ${reportCard("Overdue Actions Report", "Overdue Actions Report")}
      ${reportCard("Evidence Index", "Evidence Index")}
    </div>

    <div id="reportContent" class="qms-report-content"></div>
  `;
}

function reportCard(label, reportId) {
  return `
    <button type="button" class="qms-module-card"
      onclick="generateReport('${escapeJs(reportId)}')">
      <strong>${escapeHtml(label)}</strong>
      <span>Generate report</span>
    </button>
  `;
}

async function generateReport(reportId, options = {}) {
  const result = await apiRequest("REPORT", {
    reportId,
    options
  });

  if (!result || !result.success) {
    showMessage(getFriendlyError(result), "error");
    return null;
  }

  renderReport(result);
  return result;
}

function renderReport(result) {
  const container = document.getElementById("reportContent");
  if (!container) return;

  const rows =
    result.rows ||
    result.data ||
    result.records ||
    [];

  if (!Array.isArray(rows) || !rows.length) {
    container.innerHTML = `
      <div class="qms-empty-state">
        <h3>No report data available</h3>
      </div>
    `;
    return;
  }

  container.innerHTML = buildTable(rows);
}

/* =========================================================
   CRUD
   ========================================================= */

async function getRecord(module, recordId) {
  const result = await apiRequest("GET", {
    module: MODULE_MAP[module] || String(module).toUpperCase(),
    id: recordId
  });

  if (!result || !result.success) {
    showMessage(getFriendlyError(result), "error");
    return null;
  }

  currentModule = module;
  currentRecordId = recordId;
  return result;
}

async function createRecord(module, data) {
  const result = await apiRequest("CREATE", {
    module: MODULE_MAP[module] || String(module).toUpperCase(),
    data
  });

  if (!result || !result.success) {
    showMessage(getFriendlyError(result), "error");
    return null;
  }

  showMessage("Record created successfully.", "success");
  return result;
}

async function updateRecord(module, recordId, data) {
  const result = await apiRequest("UPDATE", {
    module: MODULE_MAP[module] || String(module).toUpperCase(),
    id: recordId,
    data
  });

  if (!result || !result.success) {
    showMessage(getFriendlyError(result), "error");
    return null;
  }

  showMessage("Record updated successfully.", "success");
  return result;
}

async function deleteRecord(module, recordId) {
  if (!isAdmin()) {
    showMessage("Administrator access required.", "error");
    return null;
  }

  if (!confirm("Delete this record? This action cannot be undone.")) {
    return null;
  }

  const result = await apiRequest("DELETE", {
    module: MODULE_MAP[module] || String(module).toUpperCase(),
    id: recordId
  });

  if (!result || !result.success) {
    showMessage(getFriendlyError(result), "error");
    return null;
  }

  showMessage("Record deleted successfully.", "success");
  return result;
}

/* =========================================================
   USER CRUD
   ========================================================= */

async function createUser(data) {
  if (!isAdmin()) {
    showMessage("Administrator access required.", "error");
    return null;
  }

  const result = await apiRequest("CREATE_USER", { data });

  if (!result || !result.success) {
    showMessage(getFriendlyError(result), "error");
    return null;
  }

  showMessage("User created successfully.", "success");
  await loadUsers();
  return result;
}

async function updateUser(userId, data) {
  if (!isAdmin()) {
    showMessage("Administrator access required.", "error");
    return null;
  }

  const result = await apiRequest("UPDATE_USER", {
    userId,
    data
  });

  if (!result || !result.success) {
    showMessage(getFriendlyError(result), "error");
    return null;
  }

  showMessage("User updated successfully.", "success");
  await loadUsers();
  return result;
}

async function deleteUser(userId) {
  if (!isAdmin()) {
    showMessage("Administrator access required.", "error");
    return null;
  }

  if (!confirm("Disable/delete this user?")) return null;

  const result = await apiRequest("DELETE_USER", {
    userId
  });

  if (!result || !result.success) {
    showMessage(getFriendlyError(result), "error");
    return null;
  }

  showMessage("User action completed.", "success");
  await loadUsers();
  return result;
}

function editUser(userId) {
  showMessage(
    "User editor is ready to be connected to the user form.",
    "info"
  );
  console.log("EDIT USER:", userId);
}

/* =========================================================
   FORGOT PASSWORD
   ========================================================= */

function setupForgotPassword() {
  const forgotButton = document.getElementById("forgotPasswordBtn");
  const closeButton = document.getElementById("closeForgotPasswordBtn");
  const backButton = document.getElementById("backToResetUsernameBtn");

  const requestForm = document.getElementById("resetRequestForm");
  const resetForm = document.getElementById("resetPasswordForm");

  if (forgotButton) {
    forgotButton.addEventListener("click", event => {
      event.preventDefault();
      openForgotPassword();
    });
  }

  if (closeButton) {
    closeButton.addEventListener("click", closeForgotPassword);
  }

  if (backButton) {
    backButton.addEventListener("click", () => {
      setForgotStep(1);
    });
  }

  if (requestForm) {
    requestForm.addEventListener("submit", async event => {
      event.preventDefault();

      const username =
        document.getElementById("resetUsername")?.value.trim() || "";

      if (!username) {
        setResetMessage("Enter your username.", "error");
        return;
      }

      const result = await apiRequest("FORGOT_PASSWORD", {
        username
      });

      if (!result || !result.success) {
        setResetMessage(getFriendlyError(result), "error");
        return;
      }

      setResetMessage(
        result.message ||
          "If the account is eligible, password reset instructions have been processed.",
        "success"
      );

      setForgotStep(2);
    });
  }

  if (resetForm) {
    resetForm.addEventListener("submit", async event => {
      event.preventDefault();

      const username =
        document.getElementById("resetUsername")?.value.trim() || "";

      const resetCode =
        document.getElementById("resetCode")?.value.trim() || "";

      const newPassword =
        document.getElementById("newResetPassword")?.value || "";

      const confirmPassword =
        document.getElementById("confirmResetPassword")?.value || "";

      if (!username || !resetCode || !newPassword || !confirmPassword) {
        setResetMessage("Complete all reset fields.", "error");
        return;
      }

      if (newPassword !== confirmPassword) {
        setResetMessage("Passwords do not match.", "error");
        return;
      }

      const result = await apiRequest("RESET_PASSWORD", {
        username,
        resetCode,
        newPassword
      });

      if (!result || !result.success) {
        setResetMessage(getFriendlyError(result), "error");
        return;
      }

      setResetMessage(
        result.message || "Password reset successfully.",
        "success"
      );
    });
  }
}

function openForgotPassword() {
  const modal = document.getElementById("forgotPasswordModal");
  if (!modal) return;

  modal.style.display = "";
  modal.setAttribute("aria-hidden", "false");
  setForgotStep(1);
  setResetMessage("", "info");
}

function closeForgotPassword() {
  const modal = document.getElementById("forgotPasswordModal");
  if (!modal) return;

  modal.style.display = "none";
  modal.setAttribute("aria-hidden", "true");
}

function setForgotStep(step) {
  const step1 = document.getElementById("forgotStep1");
  const step2 = document.getElementById("forgotStep2");

  if (step1) step1.style.display = step === 1 ? "" : "none";
  if (step2) step2.style.display = step === 2 ? "" : "none";
}

function setResetMessage(message, type) {
  const element = document.getElementById("resetMessage");
  if (!element) return;

  element.textContent = message || "";
  element.dataset.type = type || "info";
}

/* =========================================================
   FILES
   ========================================================= */

async function uploadFile(module, recordId, file, description = "") {
  if (!file) {
    showMessage("Please select a file.", "error");
    return null;
  }

  const base64 = await fileToBase64(file);

  const result = await apiRequest("UPLOAD", {
    module: MODULE_MAP[module] || String(module).toUpperCase(),
    recordId,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    base64,
    description
  });

  if (!result || !result.success) {
    showMessage(getFriendlyError(result), "error");
    return null;
  }

  showMessage("File uploaded successfully.", "success");
  return result;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.substring(comma + 1) : result);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function getFile(fileId) {
  const result = await apiRequest("GET_FILE", {
    fileId
  });

  if (!result || !result.success) {
    showMessage(getFriendlyError(result), "error");
    return null;
  }

  if (result.url) {
    window.open(result.url, "_blank", "noopener,noreferrer");
  }

  return result;
}

/* =========================================================
   LOOKUPS / SYSTEM INFO
   ========================================================= */

async function loadLookups(type = "") {
  const result = await apiRequest("LOOKUPS", { type });

  if (!result || !result.success) {
    console.warn("LOOKUPS ERROR:", result);
    return [];
  }

  return result.lookups || result.data || result.rows || [];
}

async function getSystemInfo() {
  const result = await apiRequest("SYSTEM_INFO");
  console.log("SYSTEM INFO:", result);
  return result;
}

/* =========================================================
   MOBILE MENU
   ========================================================= */

function setupMobileMenu() {
  const button = document.getElementById("mobileMenu");
  const sidebar = document.getElementById("sidebar");

  if (!button || !sidebar) return;

  button.addEventListener("click", () => {
    sidebar.classList.toggle("mobile-open");
  });
}

function closeMobileMenu() {
  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.classList.remove("mobile-open");
}

/* =========================================================
   TABLE RENDERING
   ========================================================= */

function buildTable(rows, userTable = false) {
  if (!Array.isArray(rows) || !rows.length) return "";

  const headers = Object.keys(rows[0]);

  let html = `
    <div class="qms-table-wrapper">
      <table class="qms-table">
        <thead>
          <tr>
  `;

  headers.forEach(header => {
    html += `<th>${escapeHtml(header)}</th>`;
  });

  if (userTable) html += "<th>Actions</th>";

  html += `
          </tr>
        </thead>
        <tbody>
  `;

  rows.forEach(row => {
    html += "<tr>";

    headers.forEach(header => {
      html += `<td>${formatCell(row[header])}</td>`;
    });

    if (userTable) {
      const userId = row["User ID"] || row.userId || "";
      html += `
        <td>
          <button type="button"
            onclick="editUser('${escapeJs(userId)}')">
            Edit
          </button>
          <button type="button"
            onclick="deleteUser('${escapeJs(userId)}')">
            Disable
          </button>
        </td>
      `;
    }

    html += "</tr>";
  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  return html;
}

/* =========================================================
   HELPERS
   ========================================================= */

function getPageContent() {
  return document.getElementById("pageContent");
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value ?? "";
}

function isAdmin() {
  return !!(
    currentUser &&
    String(currentUser.role || "").trim().toUpperCase() === "ADMIN"
  );
}

function showMessage(message, type = "info") {
  console.log(`[${type}]`, message);

  let container = document.getElementById("toastContainer");

  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `qms-toast qms-toast-${type}`;
  toast.textContent = message || "";

  container.appendChild(toast);

  setTimeout(() => toast.remove(), 5000);
}

function getFriendlyError(result) {
  if (!result) return "No response received from QMS API.";

  switch (String(result.error || "").toUpperCase()) {
    case "INVALID_CREDENTIALS":
      return "Invalid username or password.";
    case "USER_INACTIVE":
      return "Your account is inactive. Contact the administrator.";
    case "SESSION_EXPIRED":
      return "Your session has expired. Please login again.";
    case "INVALID_SESSION":
      return "Invalid session. Please login again.";
    case "UNAUTHORIZED":
      return "You are not authorized for this action.";
    case "ADMIN_REQUIRED":
      return "Administrator access required.";
    case "NETWORK_ERROR":
      return "Unable to connect to the QMS API.";
    case "INVALID_API_RESPONSE":
      return "The QMS API returned an invalid response.";
    default:
      return result.message || result.error || "An unexpected error occurred.";
  }
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeJs(value) {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'")
    .replaceAll('"', '\\"')
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\r");
}

function formatCell(value) {
  if (value === null || value === undefined) return "";

  if (typeof value === "object") {
    return escapeHtml(JSON.stringify(value));
  }

  const text = String(value);

  if (/^https?:\/\//i.test(text)) {
    return `
      <a href="${escapeHtml(text)}"
         target="_blank"
         rel="noopener noreferrer">
        Open
      </a>
    `;
  }

  return escapeHtml(text);
}

/* =========================================================
   FORM UTILITIES
   ========================================================= */

function formToObject(form) {
  const data = {};
  if (!form) return data;

  new FormData(form).forEach((value, key) => {
    data[key] = value;
  });

  return data;
}

function clearForm(form) {
  if (form && typeof form.reset === "function") {
    form.reset();
  }
}

/* =========================================================
   DEBUG API
   ========================================================= */

window.QMS_DEBUG = {
  api: API_URL,

  getUser: () => currentUser,

  getToken: () => sessionToken,

  testAPI: () => apiRequest("SYSTEM_INFO"),

  dashboard: () => apiRequest("DASHBOARD"),

  clearSession: () => {
    clearSession();
    showLogin();
  },

  reloadDashboard: () => loadDashboard()
};

/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.openModule = openModule;
window.logout = logout;
window.closeForgotPassword = closeForgotPassword;
window.createRecord = createRecord;
window.updateRecord = updateRecord;
window.deleteRecord = deleteRecord;
window.getRecord = getRecord;
window.uploadFile = uploadFile;
window.getFile = getFile;
window.generateReport = generateReport;
window.loadUsers = loadUsers;
window.createUser = createUser;
window.updateUser = updateUser;
window.deleteUser = deleteUser;
window.editUser = editUser;
window.loadAuditLog = loadAuditLog;
window.loadLookups = loadLookups;
window.getSystemInfo = getSystemInfo;
window.loadDashboard = loadDashboard;
