"use strict";

/* =====================================================
   GGL QMS CONTROL CENTER — PHASE 1 FRONTEND
   Authentication + Session + RBAC + Foundation UI
   ===================================================== */

const API_URL =
  "https://script.google.com/macros/s/AKfycbwnmtkqrVmggRbZnJserN_y5DwB4BPQ96oeCyoqbvXGBevmdGpqCh3TkVSDE8g6-2Kyrw/exec";

const STORAGE_TOKEN = "GGL_QMS_TOKEN";
const STORAGE_USER = "GGL_QMS_USER";
const STORAGE_PERMISSIONS = "GGL_QMS_PERMISSIONS";

const App = {
  token: null,
  user: null,
  permissions: [],
  currentPage: "dashboard",
  initialized: false
};

const DOM = {
  loginPage: document.getElementById("loginPage"),
  application: document.getElementById("application"),
  loginForm: document.getElementById("loginForm"),
  username: document.getElementById("username"),
  password: document.getElementById("password"),
  loginButton: document.getElementById("loginButton"),
  loginButtonText: document.getElementById("loginButtonText"),
  loginLoader: document.getElementById("loginLoader"),
  loginError: document.getElementById("loginError"),
  togglePassword: document.getElementById("togglePassword"),
  logoutButton: document.getElementById("logoutButton"),
  navigation: document.getElementById("navigation"),
  userName: document.getElementById("userName"),
  userRole: document.getElementById("userRole"),
  sidebarUserName: document.getElementById("sidebarUserName"),
  sidebarUserRole: document.getElementById("sidebarUserRole"),
  pageTitle: document.getElementById("pageTitle"),
  pageContent: document.getElementById("pageContent"),
  mobileMenu: document.getElementById("mobileMenu"),
  sidebar: document.getElementById("sidebar")
};

const NAV_ITEMS = [
  {page:"dashboard", label:"Dashboard", icon:"⌂", permission:"DASHBOARD.VIEW"},
  {section:"QMS CONTROL"},
  {page:"documents", label:"Documents", icon:"□", permission:"DOCUMENT.VIEW"},
  {page:"requirements", label:"Requirements", icon:"≡", permission:"COMPLIANCE.VIEW"},
  {page:"compliance", label:"Compliance", icon:"✓", permission:"COMPLIANCE.VIEW"},
  {section:"QUALITY"},
  {page:"quality-events", label:"Quality Events", icon:"◇", permission:"QUALITY_EVENT.VIEW"},
  {page:"complaints", label:"Complaints", icon:"!", permission:"COMPLAINT.VIEW"},
  {page:"capa", label:"CAPA", icon:"◈", permission:"CAPA.VIEW"},
  {section:"AUDIT"},
  {page:"audits", label:"Audits", icon:"◎", permission:"AUDIT.VIEW"},
  {page:"actions", label:"Actions", icon:"→", permission:"ACTION.VIEW"},
  {section:"RECORDS"},
  {page:"evidence", label:"Evidence", icon:"▣", permission:"EVIDENCE.VIEW"},
  {page:"training", label:"Training", icon:"T", permission:"TRAINING.VIEW"},
  {section:"GOVERNANCE"},
  {page:"approvals", label:"Approvals", icon:"✓", permission:"APPROVAL.VIEW"},
  {page:"reports", label:"Reports", icon:"▤", permission:"REPORT.VIEW"},
  {section:"ADMINISTRATION"},
  {page:"users", label:"Users", icon:"♙", permission:"USER.VIEW"},
  {page:"auditlog", label:"Audit Log", icon:"≡", permission:"AUDIT_LOG.VIEW"}
];

document.addEventListener("DOMContentLoaded", init);

async function init() {
  bindEvents();
  restoreSession();
}

function bindEvents() {
  DOM.loginForm?.addEventListener("submit", handleLogin);

  DOM.togglePassword?.addEventListener("click", () => {
    const isPassword = DOM.password.type === "password";
    DOM.password.type = isPassword ? "text" : "password";
    DOM.togglePassword.textContent = isPassword ? "Hide" : "Show";
  });

  DOM.logoutButton?.addEventListener("click", handleLogout);

  DOM.mobileMenu?.addEventListener("click", () => {
    DOM.sidebar.classList.toggle("mobile-open");
  });
}

async function handleLogin(event) {
  event.preventDefault();
  clearLoginError();

  const username = DOM.username.value.trim();
  const password = DOM.password.value;

  if (!username) return showLoginError("Please enter your username.");
  if (!password) return showLoginError("Please enter your password.");

  setLoginLoading(true);

  try {
    const response = await apiRequest({
      action: "LOGIN",
      username,
      password
    });

    if (!response.success) {
      showLoginError(getReadableError(response.error));
      return;
    }

    App.token = response.token;
    App.user = response.user;
    App.permissions = Array.isArray(response.permissions)
      ? response.permissions
      : [];

    saveSession();
    showApplication();
    await loadDashboard();
  } catch (error) {
    console.error("LOGIN ERROR", error);
    showLoginError("Unable to connect to the QMS server.");
  } finally {
    setLoginLoading(false);
  }
}

async function handleLogout() {
  try {
    if (App.token) {
      await apiRequest({
        action: "LOGOUT",
        token: App.token
      });
    }
  } catch (error) {
    console.warn("Logout API error", error);
  }

  clearSession();
  showLogin();
}

function saveSession() {
  localStorage.setItem(STORAGE_TOKEN, App.token || "");
  localStorage.setItem(STORAGE_USER, JSON.stringify(App.user || {}));
  localStorage.setItem(STORAGE_PERMISSIONS, JSON.stringify(App.permissions || []));
}

function restoreSession() {
  const token = localStorage.getItem(STORAGE_TOKEN);
  const user = localStorage.getItem(STORAGE_USER);
  const permissions = localStorage.getItem(STORAGE_PERMISSIONS);

  if (!token || !user) {
    showLogin();
    return;
  }

  try {
    App.token = token;
    App.user = JSON.parse(user);
    App.permissions = permissions ? JSON.parse(permissions) : [];
    verifySession();
  } catch (error) {
    console.error(error);
    clearSession();
    showLogin();
  }
}

async function verifySession() {
  try {
    const response = await apiRequest({
      action: "ME",
      token: App.token
    });

    if (!response.success || !response.user) {
      clearSession();
      showLogin();
      return;
    }

    App.user = response.user;

    const permissionResponse = await apiRequest({
      action: "PERMISSIONS",
      token: App.token
    });

    if (permissionResponse.success) {
      App.permissions = permissionResponse.permissions || [];
    }

    saveSession();
    showApplication();
    await loadDashboard();
  } catch (error) {
    console.error("SESSION VERIFY ERROR", error);
    clearSession();
    showLogin();
  }
}

async function apiRequest(payload) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload || {})
  });

  if (!response.ok) {
    throw new Error("HTTP_" + response.status);
  }

  const data = await response.json();

  if (
    data &&
    (data.error === "SESSION_EXPIRED" || data.error === "AUTH_REQUIRED")
  ) {
    clearSession();
    showLogin();
    showLoginError("Your session has expired. Please sign in again.");
  }

  return data;
}

function showApplication() {
  DOM.loginPage.classList.add("hidden");
  DOM.application.classList.remove("hidden");
  updateUserInterface();
  renderNavigation();
}

function showLogin() {
  DOM.application.classList.add("hidden");
  DOM.loginPage.classList.remove("hidden");
  DOM.username.value = "";
  DOM.password.value = "";
  clearLoginError();
}

function updateUserInterface() {
  if (!App.user) return;

  const name = App.user.name || App.user.username || "User";
  const role = App.user.role || "USER";

  DOM.userName.textContent = name;
  DOM.userRole.textContent = role;
  DOM.sidebarUserName.textContent = name;
  DOM.sidebarUserRole.textContent = role;
}

function renderNavigation() {
  DOM.navigation.innerHTML = "";

  NAV_ITEMS.forEach(item => {
    if (item.section) {
      const section = document.createElement("div");
      section.className = "nav-section";
      section.textContent = item.section;
      DOM.navigation.appendChild(section);
      return;
    }

    if (!hasPermission(item.permission)) return;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "nav-item";
    button.dataset.page = item.page;
    button.innerHTML =
      `<span class="nav-icon">${escapeHtml(item.icon)}</span>` +
      `<span>${escapeHtml(item.label)}</span>`;

    button.addEventListener("click", () => navigate(item.page));
    DOM.navigation.appendChild(button);
  });
}

function hasPermission(permission) {
  if (!permission) return true;
  if (App.permissions.includes("*")) return true;
  return App.permissions.includes(permission);
}

function navigate(page) {
  if (page !== "dashboard") {
    const item = NAV_ITEMS.find(x => x.page === page);
    if (item?.permission && !hasPermission(item.permission)) {
      showAccessDenied();
      return;
    }
  }

  App.currentPage = page;

  document.querySelectorAll(".nav-item").forEach(button => {
    button.classList.toggle("active", button.dataset.page === page);
  });

  const labels = {
    dashboard:"Dashboard",
    documents:"Documents",
    requirements:"Requirements",
    compliance:"Compliance",
    "quality-events":"Quality Events",
    complaints:"Complaints",
    capa:"CAPA",
    audits:"Audits",
    actions:"Actions",
    evidence:"Evidence",
    training:"Training",
    approvals:"Approvals",
    reports:"Reports",
    users:"Users",
    auditlog:"Audit Log"
  };

  DOM.pageTitle.textContent = labels[page] || "QMS";

  DOM.sidebar.classList.remove("mobile-open");

  switch (page) {
    case "dashboard": loadDashboard(); break;
    case "documents": loadDocuments(); break;
    case "users": loadUsers(); break;
    case "auditlog": loadAuditLog(); break;
    default: renderFoundationPlaceholder(page, labels[page] || "QMS Module");
  }
}

async function loadDashboard() {
  renderLoading("Loading QMS foundation...");

  try {
    const response = await apiRequest({
      action: "SYSTEM_STATUS",
      token: App.token
    });

    if (!response.success) {
      handleApiError(response);
      return;
    }

    renderDashboard(response);
  } catch (error) {
    console.error(error);
    renderError("Unable to load the QMS foundation status.");
  }
}

function renderDashboard(status) {
  const role = App.user?.role || "USER";
  const permissionCount =
    App.permissions.includes("*") ? "ALL" : App.permissions.length;

  DOM.pageContent.innerHTML = `
    <div class="page-header">
      <div>
        <h1>QMS Foundation</h1>
        <p>Phase 1 — authentication, RBAC, system control and audit foundation.</p>
      </div>
      <span class="status-badge">SYSTEM ONLINE</span>
    </div>

    <div class="stat-grid">
      <div class="stat-card"><span>System Version</span><strong>2.0.0</strong></div>
      <div class="stat-card"><span>Role</span><strong>${escapeHtml(role)}</strong></div>
      <div class="stat-card"><span>Permissions</span><strong>${escapeHtml(permissionCount)}</strong></div>
      <div class="stat-card"><span>Session</span><strong>ACTIVE</strong></div>
    </div>

    <div class="content-grid">
      <div class="panel">
        <div class="panel-header">
          <div>
            <div class="panel-title">Foundation Status</div>
            <div class="panel-subtitle">Core services established in Phase 1.</div>
          </div>
        </div>
        <div class="panel-body">
          <div class="info-list">
            <div class="info-row"><span>QMS System</span><strong>${escapeHtml(status.system || "GGL QMS CONTROL CENTER")}</strong></div>
            <div class="info-row"><span>Backend Version</span><strong>${escapeHtml(status.version || "2.0.0-PHASE-1")}</strong></div>
            <div class="info-row"><span>Database</span><strong>${escapeHtml(status.database || "Connected")}</strong></div>
            <div class="info-row"><span>Database ID</span><strong>${escapeHtml(status.databaseId || "Configured")}</strong></div>
            <div class="info-row"><span>Authenticated User</span><strong>${escapeHtml(status.userId || App.user?.userId || "")}</strong></div>
            <div class="info-row"><span>Session Expires</span><strong>${formatDateTime(status.sessionExpires)}</strong></div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <div>
            <div class="panel-title">Phase 1 Controls</div>
            <div class="panel-subtitle">Available foundation functions.</div>
          </div>
        </div>
        <div class="panel-body">
          <div class="module-grid">
            ${foundationCard("Authentication","Universal username/password login.")}
            ${foundationCard("Sessions","Server-side session validation.")}
            ${foundationCard("RBAC","Role and permission enforcement.")}
            ${foundationCard("Audit Log","System activity recording.")}
            ${foundationCard("ID Control","Controlled permanent record IDs.")}
            ${foundationCard("Configuration","Central QMS system settings.")}
          </div>
        </div>
      </div>
    </div>
  `;
}

function foundationCard(title, text) {
  return `<div class="module-card"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span></div>`;
}


/* =========================================================
   PHASE 2 — DOCUMENT CONTROL
   ========================================================= */

let documentMasterData = {
  documentTypes: [
    "POLICY", "SOP", "WORK_INSTRUCTION", "FORM",
    "TEMPLATE", "MANUAL", "GUIDELINE", "RECORD",
    "EXTERNAL_DOCUMENT"
  ],
  categories: [
    "QUALITY", "COMPLIANCE", "OPERATIONS", "SAFETY",
    "SECURITY", "HR", "IT", "TRAINING", "CUSTOMER", "SUPPLIER"
  ],
  statuses: [
    "DRAFT", "UNDER_REVIEW", "APPROVED",
    "EFFECTIVE", "OBSOLETE", "ARCHIVED"
  ],
  classifications: ["INTERNAL", "CONFIDENTIAL", "RESTRICTED"],
  reviewFrequencies: ["ANNUAL", "BIENNIAL", "TRIENNIAL", "AS_REQUIRED"]
};

async function loadDocuments() {
  renderLoading("Loading document control...");

  try {
    const master = await apiRequest({
      action: "DOCUMENT_MASTER",
      token: App.token
    });

    if (master?.success) {
      documentMasterData = master;
    }

    const response = await apiRequest({
      action: "LIST",
      module: "DOCUMENTS",
      token: App.token
    });

    if (!response.success) {
      handleApiError(response);
      return;
    }

    renderDocuments(response.records || []);
  } catch (error) {
    console.error(error);
    renderError("Unable to load Document Control.");
  }
}

function selectOptions(values, selected = "") {
  return (values || []).map(function(value) {
    const safe = escapeHtml(value);
    return `<option value="${safe}" ${String(value) === String(selected) ? "selected" : ""}>${safe}</option>`;
  }).join("");
}

function renderDocuments(records) {

  const active = records.filter(r =>
    !["OBSOLETE", "ARCHIVED"].includes(
      String(r["Status"] || "").toUpperCase()
    )
  ).length;

  const effective = records.filter(r =>
    String(r["Status"] || "").toUpperCase() === "EFFECTIVE"
  ).length;

  const reviewDue = records.filter(r => {
    const date = new Date(r["Review Date"]);
    return !isNaN(date.getTime()) && date < new Date();
  }).length;

  DOM.pageContent.innerHTML = `
    <div class="page-header">
      <div>
        <h1>Document Control</h1>
        <p>Controlled register for QMS documents, revisions, ownership and review dates.</p>
      </div>
      ${hasPermission("DOCUMENT.CREATE") || App.permissions.includes("*")
        ? `<button class="primary-button" id="newDocumentBtn">+ New Document</button>`
        : ""}
    </div>

    <div class="stat-grid">
      <div class="stat-card"><span>Total Documents</span><strong>${records.length}</strong></div>
      <div class="stat-card"><span>Active Documents</span><strong>${active}</strong></div>
      <div class="stat-card"><span>Effective</span><strong>${effective}</strong></div>
      <div class="stat-card"><span>Review Due</span><strong>${reviewDue}</strong></div>
    </div>

    <div class="panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">Controlled Document Register</div>
          <div class="panel-subtitle">Document ID, revision, version, status and ownership.</div>
        </div>
        <input id="documentSearch" class="table-search" placeholder="Search documents...">
      </div>

      <div class="table-wrap">
        <table class="qms-table">
          <thead>
            <tr>
              <th>Document ID</th>
              <th>Document Name</th>
              <th>Type</th>
              <th>Category</th>
              <th>Revision</th>
              <th>Version</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Review Date</th>
              <th>File</th>
            </tr>
          </thead>
          <tbody id="documentTableBody">
            ${renderDocumentRows(records)}
          </tbody>
        </table>
      </div>
    </div>
  `;

  document.getElementById("newDocumentBtn")?.addEventListener(
    "click",
    () => openDocumentModal()
  );

  document.getElementById("documentSearch")?.addEventListener(
    "input",
    function() {
      const term = this.value.toLowerCase();
      const filtered = records.filter(r =>
        Object.values(r).some(v =>
          String(v ?? "").toLowerCase().includes(term)
        )
      );
      document.getElementById("documentTableBody").innerHTML =
        renderDocumentRows(filtered);
    }
  );
}

function renderDocumentRows(records) {
  if (!records.length) {
    return `<tr><td colspan="10" class="table-empty">No controlled documents found.</td></tr>`;
  }

  return records.map(function(r) {
    const url = String(r["Drive URL"] || "").trim();
    const status = String(r["Status"] || "DRAFT").toUpperCase();

    return `
      <tr>
        <td><strong>${escapeHtml(r["Document ID"] || "")}</strong></td>
        <td>${escapeHtml(r["Document Name"] || "")}</td>
        <td>${escapeHtml(r["Document Type"] || "")}</td>
        <td>${escapeHtml(r["Category"] || "")}</td>
        <td>${escapeHtml(r["Revision"] || "")}</td>
        <td>${escapeHtml(r["Version"] || "")}</td>
        <td><span class="status-badge">${escapeHtml(status)}</span></td>
        <td>${escapeHtml(r["Owner"] || "")}</td>
        <td>${formatDateTime(r["Review Date"])}</td>
        <td>${url ? `<a class="table-link" href="${escapeHtml(url)}" target="_blank" rel="noopener">Open</a>` : "—"}</td>
      </tr>
    `;
  }).join("");
}

function openDocumentModal() {

  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.id = "documentModal";

  modal.innerHTML = `
    <div class="modal-card qms-document-modal">
      <div class="modal-header">
        <div>
          <h2>Register Controlled Document</h2>
          <p>Phase 2 Document Control register entry.</p>
        </div>
        <button class="modal-close" id="closeDocumentModal">×</button>
      </div>

      <form id="documentForm" class="document-form">

        <div class="form-grid-2">
          <label>
            Document Name *
            <input name="Document Name" required>
          </label>

          <label>
            Document Type *
            <select name="Document Type" required>
              <option value="">Select</option>
              ${selectOptions(documentMasterData.documentTypes)}
            </select>
          </label>

          <label>
            Category *
            <select name="Category" required>
              <option value="">Select</option>
              ${selectOptions(documentMasterData.categories)}
            </select>
          </label>

          <label>
            Revision
            <input name="Revision" value="00">
          </label>

          <label>
            Version
            <input name="Version" value="1.0">
          </label>

          <label>
            Status
            <select name="Status">
              ${selectOptions(documentMasterData.statuses, "DRAFT")}
            </select>
          </label>

          <label>
            Effective Date
            <input name="Effective Date" type="date">
          </label>

          <label>
            Review Date
            <input name="Review Date" type="date">
          </label>

          <label>
            Owner
            <input name="Owner">
          </label>

          <label>
            Department
            <input name="Department">
          </label>

          <label>
            Classification
            <select name="Classification">
              ${selectOptions(documentMasterData.classifications, "INTERNAL")}
            </select>
          </label>

          <label>
            Related Module
            <input name="Related Module" placeholder="CAPA / COMPLAINTS / AUDITS...">
          </label>

          <label class="full-width">
            Related Record ID
            <input name="Related Record ID">
          </label>

          <label class="full-width">
            Description
            <textarea name="Description" rows="4"></textarea>
          </label>

          <label class="full-width">
            Drive File ID
            <input name="Drive File ID" placeholder="Optional — populate after file upload">
          </label>

          <label class="full-width">
            Drive URL
            <input name="Drive URL" type="url" placeholder="Optional">
          </label>

        </div>

        <div class="modal-actions">
          <button type="button" class="secondary-button" id="cancelDocumentBtn">Cancel</button>
          <button type="submit" class="primary-button" id="saveDocumentBtn">Register Document</button>
        </div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  document.getElementById("closeDocumentModal").onclick = closeDocumentModal;
  document.getElementById("cancelDocumentBtn").onclick = closeDocumentModal;

  document.getElementById("documentForm").addEventListener(
    "submit",
    saveDocument
  );
}

function closeDocumentModal() {
  document.getElementById("documentModal")?.remove();
}

async function saveDocument(event) {

  event.preventDefault();

  const form = event.currentTarget;
  const record = {};

  new FormData(form).forEach(function(value, key) {
    record[key] = value;
  });

  const button = document.getElementById("saveDocumentBtn");
  button.disabled = true;
  button.textContent = "Registering...";

  try {

    const response = await apiRequest({
      action: "CREATE",
      module: "DOCUMENTS",
      record: record,
      token: App.token
    });

    if (!response.success) {
      handleApiError(response);
      return;
    }

    closeDocumentModal();
    showToast(
      `Document ${response.recordId || ""} registered successfully.`,
      "success"
    );

    loadDocuments();

  } catch (error) {

    console.error(error);
    showToast("Unable to register document.", "error");

  } finally {

    button.disabled = false;
    button.textContent = "Register Document";

  }
}

function renderFoundationPlaceholder(page, title) {
  DOM.pageContent.innerHTML = `
    <div class="page-header">
      <div>
        <h1>${escapeHtml(title)}</h1>
        <p>This module is reserved for the corresponding QMS implementation phase.</p>
      </div>
    </div>
    <div class="panel">
      <div class="empty">
        <strong>${escapeHtml(title)} is not active in Phase 1</strong>
        <span>The Phase 1 foundation is intentionally being stabilized before operational modules are added.</span>
      </div>
    </div>
  `;
}

async function loadUsers() {
  if (!hasPermission("USER.VIEW")) {
    showAccessDenied();
    return;
  }

  renderLoading("Loading users...");

  try {
    const response = await apiRequest({
      action: "LIST_USERS",
      token: App.token
    });

    if (!response.success) {
      handleApiError(response);
      return;
    }

    renderUsers(response.users || []);
  } catch (error) {
    console.error(error);
    renderError("Unable to load users.");
  }
}

function renderUsers(users) {
  const rows = users.map(user => `
    <tr>
      <td>${escapeHtml(user.userId || "")}</td>
      <td>${escapeHtml(user.username || "")}</td>
      <td>${escapeHtml(user.name || "")}</td>
      <td>${escapeHtml(user.role || "")}</td>
      <td>${statusBadge(user.status)}</td>
      <td>${escapeHtml(user.department || "")}</td>
      <td>${escapeHtml(user.lastLogin ? formatDateTime(user.lastLogin) : "Never")}</td>
    </tr>
  `).join("");

  DOM.pageContent.innerHTML = `
    <div class="toolbar">
      <div>
        <div class="page-header" style="margin:0">
          <div>
            <h1 style="font-size:25px">User Administration</h1>
            <p>Phase 1 identity and access control.</p>
          </div>
        </div>
      </div>
      ${hasPermission("USER.CREATE") ? `<button class="btn btn-primary" onclick="openUserModal()">+ Add User</button>` : ""}
    </div>

    <div class="panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">Authorized Users</div>
          <div class="panel-subtitle">${users.length} user(s) in the QMS identity register.</div>
        </div>
      </div>
      <div class="panel-body">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>User ID</th><th>Username</th><th>Name</th><th>Role</th><th>Status</th><th>Department</th><th>Last Login</th></tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="7"><div class="empty"><strong>No users found</strong><span>The user register is empty.</span></div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function openUserModal() {
  if (!hasPermission("USER.CREATE")) {
    showAccessDenied();
    return;
  }

  const modal = document.createElement("div");
  modal.id = "userModal";
  modal.className = "modal show";
  modal.innerHTML = `
    <div class="modal-card">
      <div class="modal-head">
        <h3>Create QMS User</h3>
        <button class="modal-close" type="button" onclick="closeUserModal()">×</button>
      </div>
      <form id="userForm">
        <div class="modal-body">
          <div class="form-grid">
            <div class="field"><label>Username</label><input id="newUsername" required></div>
            <div class="field"><label>Name</label><input id="newName" required></div>
            <div class="field"><label>Password</label><input id="newPassword" type="password" minlength="8" required></div>
            <div class="field"><label>Role</label>
              <select id="newRole">
                <option>USER</option><option>QUALITY</option><option>AUDITOR</option><option>MANAGER</option><option>ADMIN</option>
              </select>
            </div>
            <div class="field"><label>Department</label><input id="newDepartment"></div>
            <div class="field"><label>Designation</label><input id="newDesignation"></div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-secondary" type="button" onclick="closeUserModal()">Cancel</button>
          <button class="btn btn-primary" type="submit">Create User</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById("userForm").addEventListener("submit", createUser);
}

function closeUserModal() {
  document.getElementById("userModal")?.remove();
}

async function createUser(event) {
  event.preventDefault();

  const payload = {
    action: "CREATE_USER",
    token: App.token,
    username: document.getElementById("newUsername").value.trim(),
    name: document.getElementById("newName").value.trim(),
    password: document.getElementById("newPassword").value,
    role: document.getElementById("newRole").value,
    department: document.getElementById("newDepartment").value.trim(),
    designation: document.getElementById("newDesignation").value.trim()
  };

  try {
    const response = await apiRequest(payload);

    if (!response.success) {
      showToast(getReadableError(response.error), "error");
      return;
    }

    closeUserModal();
    showToast("User created successfully.", "success");
    await loadUsers();
  } catch (error) {
    console.error(error);
    showToast("Unable to create user.", "error");
  }
}

async function loadAuditLog() {
  if (!hasPermission("AUDIT_LOG.VIEW")) {
    showAccessDenied();
    return;
  }

  renderLoading("Loading audit log...");

  try {
    const response = await apiRequest({
      action: "AUDIT_LOG",
      token: App.token
    });

    if (!response.success) {
      handleApiError(response);
      return;
    }

    renderAuditLog(response.records || []);
  } catch (error) {
    console.error(error);
    renderError("Unable to load audit log.");
  }
}

function renderAuditLog(records) {
  const rows = records.map(row => `
    <tr>
      <td>${escapeHtml(row["Log ID"] || "")}</td>
      <td>${formatDateTime(row["Timestamp"])}</td>
      <td>${escapeHtml(row.Username || "")}</td>
      <td>${escapeHtml(row.Action || "")}</td>
      <td>${escapeHtml(row.Module || "")}</td>
      <td>${escapeHtml(row["Record ID"] || "")}</td>
      <td>${statusBadge(row.Result)}</td>
      <td>${escapeHtml(row.Details || "")}</td>
    </tr>
  `).join("");

  DOM.pageContent.innerHTML = `
    <div class="toolbar">
      <div>
        <div class="page-header" style="margin:0">
          <div>
            <h1 style="font-size:25px">Audit Log</h1>
            <p>System activity recorded by the QMS foundation.</p>
          </div>
        </div>
      </div>
      <button class="btn btn-secondary" onclick="loadAuditLog()">Refresh</button>
    </div>

    <div class="panel">
      <div class="panel-body">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>Log ID</th><th>Timestamp</th><th>User</th><th>Action</th><th>Module</th><th>Record</th><th>Result</th><th>Details</th></tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="8"><div class="empty"><strong>No audit activity</strong><span>No records have been returned.</span></div></td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function statusBadge(value) {
  const v = String(value || "").toUpperCase();
  let cls = "badge-info";
  if (v === "ACTIVE" || v === "SUCCESS") cls = "badge-success";
  if (v === "INACTIVE" || v === "FAILED") cls = "badge-danger";
  if (v === "PENDING") cls = "badge-warning";
  return `<span class="badge ${cls}">${escapeHtml(v || "—")}</span>`;
}

function renderLoading(text) {
  DOM.pageContent.innerHTML = `
    <div class="panel">
      <div class="empty"><strong>${escapeHtml(text)}</strong><span>Please wait.</span></div>
    </div>
  `;
}

function renderError(text) {
  DOM.pageContent.innerHTML = `
    <div class="panel">
      <div class="empty"><strong>Something went wrong</strong><span>${escapeHtml(text)}</span></div>
    </div>
  `;
}

function showAccessDenied() {
  DOM.pageContent.innerHTML = `
    <div class="panel">
      <div class="empty">
        <strong>Access Denied</strong>
        <span>Your account does not have permission to access this section.</span>
      </div>
    </div>
  `;
}

function handleApiError(response) {
  if (!response) {
    showToast("No response from QMS API.", "error");
    return;
  }

  if (response.error === "SESSION_EXPIRED" || response.error === "AUTH_REQUIRED") {
    clearSession();
    showLogin();
    showLoginError("Your session has expired. Please sign in again.");
    return;
  }

  showToast(getReadableError(response.error), "error");
}

function getReadableError(error) {
  const map = {
    INVALID_CREDENTIALS:"Invalid username or password.",
    USER_INACTIVE:"This user account is inactive.",
    USER_NOT_FOUND:"User account was not found.",
    SESSION_EXPIRED:"Your session has expired.",
    AUTH_REQUIRED:"Authentication is required.",
    ACCESS_DENIED:"You do not have permission for this action.",
    USERNAME_ALREADY_EXISTS:"That username already exists.",
    USERNAME_REQUIRED:"Username is required.",
    PASSWORD_REQUIRED:"Password is required.",
    PASSWORD_TOO_SHORT:"Password must contain at least 8 characters.",
    NAME_REQUIRED:"Name is required.",
    INVALID_ROLE:"The selected role is invalid.",
    DATABASE_NOT_INITIALIZED:"The QMS database is not initialized.",
    SHEET_NOT_FOUND:"A required QMS database sheet is missing."
  };
  return map[error] || error || "An unexpected error occurred.";
}

function setLoginLoading(loading) {
  DOM.loginButton.disabled = loading;
  DOM.loginButtonText.classList.toggle("hidden", loading);
  DOM.loginLoader.classList.toggle("hidden", !loading);
}

function showLoginError(message) {
  DOM.loginError.textContent = message;
}

function clearLoginError() {
  DOM.loginError.textContent = "";
}

function clearSession() {
  App.token = null;
  App.user = null;
  App.permissions = [];
  localStorage.removeItem(STORAGE_TOKEN);
  localStorage.removeItem(STORAGE_USER);
  localStorage.removeItem(STORAGE_PERMISSIONS);
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.textContent = message;
  DOMToastContainer().appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

function DOMToastContainer() {
  return document.getElementById("toastContainer");
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-IN", {
    day:"2-digit", month:"short", year:"numeric",
    hour:"2-digit", minute:"2-digit"
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g,"&amp;")
    .replace(/</g,"&lt;")
    .replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;")
    .replace(/'/g,"&#039;");
}

window.QMS = {
  App,
  navigate,
  apiRequest,
  logout: handleLogout,
  loadUsers,
  loadAuditLog
};

window.loadDocuments = loadDocuments;
window.openDocumentModal = openDocumentModal;
window.closeDocumentModal = closeDocumentModal;
