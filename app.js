/* =========================================================
   GGL QMS CONTROL CENTER
   FINAL FRONTEND SCRIPT
   API + AUTH + RBAC + DASHBOARD + CRUD + FILES + REPORTS
   ========================================================= */

const API_URL =
  "https://script.google.com/macros/s/AKfycbwnmtkqrVmggRbZnJserN_y5DwB4BPQ96oeCyoqbvXGBevmdGpqCh3TkVSDE8g6-2Kyrw/exec";


/* =========================================================
   GLOBAL STATE
   ========================================================= */

let currentUser = null;
let sessionToken = null;
let currentModule = null;
let currentRecordId = null;

const STORAGE_TOKEN = "GGL_QMS_TOKEN";
const STORAGE_USER = "GGL_QMS_USER";


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  restoreSession();
  initializeUI();
});


function initializeUI() {
  setupLoginForm();
  setupForgotPassword();
  setupNavigation();
  setupLogout();

  const loginPage = document.getElementById("loginPage");
  const appPage = document.getElementById("appPage");

  if (sessionToken && currentUser) {
    showApp();
    loadDashboard();
  } else {
    if (loginPage) loginPage.style.display = "";
    if (appPage) appPage.style.display = "none";
  }
}


/* =========================================================
   SESSION
   ========================================================= */

function restoreSession() {
  try {
    sessionToken = localStorage.getItem(STORAGE_TOKEN);
    const savedUser = localStorage.getItem(STORAGE_USER);

    if (savedUser) {
      currentUser = JSON.parse(savedUser);
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
   API CORE
   ========================================================= */

async function apiRequest(action, data = {}) {

  const payload = {
    action: action,
    ...data
  };

  if (sessionToken) {
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
    } catch (parseError) {
      console.error("JSON PARSE ERROR:", parseError);

      return {
        success: false,
        error: "INVALID_API_RESPONSE",
        raw: raw
      };
    }

    console.log("QMS API RESPONSE:", result);

    if (
      result &&
      (
        result.error === "SESSION_EXPIRED" ||
        result.error === "INVALID_SESSION" ||
        result.error === "UNAUTHORIZED"
      )
    ) {
      handleSessionExpired();
      return result;
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

  form.addEventListener("submit", async function (event) {

    event.preventDefault();

    const usernameElement =
      document.getElementById("username");

    const passwordElement =
      document.getElementById("password");

    const username =
      usernameElement
        ? usernameElement.value.trim()
        : "";

    const password =
      passwordElement
        ? passwordElement.value
        : "";

    if (!username || !password) {
      showMessage(
        "Please enter username and password.",
        "error"
      );
      return;
    }

    setLoginLoading(true);

    const result = await apiRequest("LOGIN", {
      username: username,
      password: password
    });

    console.log("LOGIN RESULT:", result);

    setLoginLoading(false);

    if (!result || !result.success) {

      showMessage(
        getFriendlyError(result),
        "error"
      );

      return;
    }

    if (!result.token || !result.user) {

      showMessage(
        "Login response is incomplete.",
        "error"
      );

      return;
    }

    saveSession(
      result.token,
      result.user
    );

    showApp();

    loadDashboard();

    showMessage(
      "Login successful.",
      "success"
    );
  });
}


function setLoginLoading(loading) {

  const button =
    document.querySelector(
      "#loginForm button[type='submit']"
    );

  if (!button) return;

  if (loading) {
    button.disabled = true;
    button.dataset.originalText =
      button.textContent;
    button.textContent = "Signing in...";
  } else {
    button.disabled = false;
    button.textContent =
      button.dataset.originalText || "Login";
  }
}


/* =========================================================
   LOGOUT
   ========================================================= */

function setupLogout() {

  const elements = document.querySelectorAll(
    "#logoutBtn, [data-action='logout']"
  );

  elements.forEach(function (element) {

    element.addEventListener(
      "click",
      logout
    );

  });
}


async function logout() {

  try {
    if (sessionToken) {
      await apiRequest("LOGOUT");
    }
  } catch (error) {
    console.warn("LOGOUT API ERROR:", error);
  }

  clearSession();

  currentModule = null;
  currentRecordId = null;

  showLogin();
}


function handleSessionExpired() {

  clearSession();

  showLogin();

  showMessage(
    "Your session has expired. Please login again.",
    "error"
  );
}


/* =========================================================
   PAGE SWITCHING
   ========================================================= */

function showApp() {

  const loginPage =
    document.getElementById("loginPage");

  const appPage =
    document.getElementById("appPage");

  if (loginPage) {
    loginPage.style.display = "none";
  }

  if (appPage) {
    appPage.style.display = "";
  }

  updateUserInterface();
}


function showLogin() {

  const loginPage =
    document.getElementById("loginPage");

  const appPage =
    document.getElementById("appPage");

  if (loginPage) {
    loginPage.style.display = "";
  }

  if (appPage) {
    appPage.style.display = "none";
  }
}


function updateUserInterface() {

  if (!currentUser) return;

  const nameElements =
    document.querySelectorAll(
      "[data-user-name], #userName, #profileName"
    );

  nameElements.forEach(function (element) {
    element.textContent =
      currentUser.name ||
      currentUser.username ||
      "User";
  });


  const roleElements =
    document.querySelectorAll(
      "[data-user-role], #userRole, #profileRole"
    );

  roleElements.forEach(function (element) {
    element.textContent =
      currentUser.role || "USER";
  });


  const departmentElements =
    document.querySelectorAll(
      "[data-user-department]"
    );

  departmentElements.forEach(function (element) {
    element.textContent =
      currentUser.department || "";
  });


  applyRBAC();
}


/* =========================================================
   RBAC
   ========================================================= */

function isAdmin() {

  return (
    currentUser &&
    String(currentUser.role || "")
      .trim()
      .toUpperCase() === "ADMIN"
  );
}


function hasRole(roles) {

  if (!currentUser) return false;

  const role =
    String(currentUser.role || "")
      .trim()
      .toUpperCase();

  return roles
    .map(function (r) {
      return String(r).toUpperCase();
    })
    .includes(role);
}


function applyRBAC() {

  document
    .querySelectorAll("[data-admin-only]")
    .forEach(function (element) {

      element.style.display =
        isAdmin() ? "" : "none";

    });


  document
    .querySelectorAll("[data-user-only]")
    .forEach(function (element) {

      element.style.display =
        !isAdmin() ? "" : "none";

    });
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

  document
    .querySelectorAll("[data-module]")
    .forEach(function (element) {

      element.addEventListener(
        "click",
        function () {

          const module =
            element.dataset.module;

          openModule(module);

        }
      );

    });
}


async function openModule(module) {

  currentModule = module;

  console.log(
    "OPEN MODULE:",
    module
  );

  if (module === "dashboard") {
    await loadDashboard();
    return;
  }

  if (module === "users") {

    if (!isAdmin()) {
      showMessage(
        "Administrator access required.",
        "error"
      );
      return;
    }

    await loadUsers();
    return;
  }

  await loadModule(module);
}


/* =========================================================
   DASHBOARD
   ========================================================= */

async function loadDashboard() {

  const result =
    await apiRequest("DASHBOARD");

  if (!result || !result.success) {

    showMessage(
      getFriendlyError(result),
      "error"
    );

    return;
  }

  renderDashboard(result);
}


function renderDashboard(data) {

  console.log(
    "DASHBOARD DATA:",
    data
  );

  const stats =
    data.stats ||
    data.data ||
    data;

  setValue(
    "statCapa",
    stats.capa ??
    stats.capaCount ??
    stats.totalCAPA ??
    0
  );

  setValue(
    "statComplaints",
    stats.complaints ??
    stats.complaintCount ??
    0
  );

  setValue(
    "statCompliance",
    stats.compliance ??
    stats.complianceCount ??
    0
  );

  setValue(
    "statAudits",
    stats.audits ??
    stats.auditCount ??
    0
  );

  setValue(
    "statActions",
    stats.actions ??
    stats.actionCount ??
    0
  );

  setValue(
    "statDocuments",
    stats.documents ??
    stats.documentCount ??
    0
  );

  setValue(
    "statEvidence",
    stats.evidence ??
    stats.evidenceCount ??
    0
  );

  setValue(
    "statOverdue",
    stats.overdue ??
    stats.overdueCount ??
    0
  );

  renderGenericDashboard(data);
}


function renderGenericDashboard(data) {

  const container =
    document.getElementById(
      "dashboardContent"
    );

  if (!container) return;

  const items =
    data.overdue ||
    data.recent ||
    data.items;

  if (!Array.isArray(items)) return;

  if (!items.length) {

    container.innerHTML =
      "<p>No dashboard records available.</p>";

    return;
  }

  container.innerHTML =
    items
      .slice(0, 10)
      .map(function (item) {

        return `
          <div class="qms-dashboard-item">
            <strong>${escapeHtml(
              item.id ||
              item.ID ||
              item["Record ID"] ||
              ""
            )}</strong>

            <span>${escapeHtml(
              item.status ||
              item.Status ||
              ""
            )}</span>
          </div>
        `;

      })
      .join("");
}


/* =========================================================
   MODULE LIST
   ========================================================= */

const MODULE_MAP = {

  capa: "CAPA",
  complaints: "COMPLAINTS",
  compliance: "COMPLIANCE",
  audits: "AUDITS",
  actions: "ACTIONS",
  documents: "DOCUMENTS",
  evidence: "EVIDENCE",

  CAPA: "CAPA",
  COMPLAINTS: "COMPLAINTS",
  COMPLIANCE: "COMPLIANCE",
  AUDITS: "AUDITS",
  ACTIONS: "ACTIONS",
  DOCUMENTS: "DOCUMENTS",
  EVIDENCE: "EVIDENCE"
};


async function loadModule(module) {

  const backendModule =
    MODULE_MAP[module] ||
    String(module).toUpperCase();

  const result =
    await apiRequest("LIST", {
      module: backendModule
    });

  if (!result || !result.success) {

    showMessage(
      getFriendlyError(result),
      "error"
    );

    return;
  }

  renderModuleList(
    backendModule,
    result
  );
}


function renderModuleList(module, result) {

  const container =
    document.getElementById(
      "moduleContent"
    ) ||
    document.getElementById(
      "content"
    );

  if (!container) {
    console.log(
      "MODULE RESULT:",
      module,
      result
    );
    return;
  }

  const rows =
    result.rows ||
    result.data ||
    result.records ||
    [];

  if (!Array.isArray(rows) || !rows.length) {

    container.innerHTML = `
      <div class="qms-empty-state">
        <h3>No records found</h3>
        <p>${escapeHtml(module)}</p>
      </div>
    `;

    return;
  }

  const headers =
    Object.keys(rows[0]);

  let html = `
    <div class="qms-table-wrapper">
      <table class="qms-table">
        <thead>
          <tr>
  `;

  headers.forEach(function (header) {

    html += `
      <th>${escapeHtml(header)}</th>
    `;

  });

  html += `
          </tr>
        </thead>
        <tbody>
  `;

  rows.forEach(function (row) {

    html += "<tr>";

    headers.forEach(function (header) {

      const value =
        row[header] ?? "";

      html += `
        <td>
          ${formatCell(value)}
        </td>
      `;

    });

    html += "</tr>";

  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}


/* =========================================================
   GET SINGLE RECORD
   ========================================================= */

async function getRecord(module, recordId) {

  const result =
    await apiRequest("GET", {
      module:
        MODULE_MAP[module] ||
        module,
      id: recordId
    });

  if (!result || !result.success) {

    showMessage(
      getFriendlyError(result),
      "error"
    );

    return null;
  }

  currentModule = module;
  currentRecordId = recordId;

  return result;
}


/* =========================================================
   CREATE
   ========================================================= */

async function createRecord(module, data) {

  const result =
    await apiRequest("CREATE", {
      module:
        MODULE_MAP[module] ||
        module,
      data: data
    });

  if (!result || !result.success) {

    showMessage(
      getFriendlyError(result),
      "error"
    );

    return null;
  }

  showMessage(
    "Record created successfully.",
    "success"
  );

  return result;
}


/* =========================================================
   UPDATE
   ========================================================= */

async function updateRecord(
  module,
  recordId,
  data
) {

  const result =
    await apiRequest("UPDATE", {
      module:
        MODULE_MAP[module] ||
        module,
      id: recordId,
      data: data
    });

  if (!result || !result.success) {

    showMessage(
      getFriendlyError(result),
      "error"
    );

    return null;
  }

  showMessage(
    "Record updated successfully.",
    "success"
  );

  return result;
}


/* =========================================================
   DELETE
   ========================================================= */

async function deleteRecord(
  module,
  recordId
) {

  if (!isAdmin()) {

    showMessage(
      "Administrator access required.",
      "error"
    );

    return null;
  }

  if (
    !window.confirm(
      "Delete this record? This action cannot be undone."
    )
  ) {
    return null;
  }

  const result =
    await apiRequest("DELETE", {
      module:
        MODULE_MAP[module] ||
        module,
      id: recordId
    });

  if (!result || !result.success) {

    showMessage(
      getFriendlyError(result),
      "error"
    );

    return null;
  }

  showMessage(
    "Record deleted successfully.",
    "success"
  );

  return result;
}


/* =========================================================
   USERS
   ========================================================= */

async function loadUsers() {

  if (!isAdmin()) {

    showMessage(
      "Administrator access required.",
      "error"
    );

    return;
  }

  const result =
    await apiRequest("ADMIN_USERS");

  if (!result || !result.success) {

    showMessage(
      getFriendlyError(result),
      "error"
    );

    return;
  }

  renderUsers(result);
}


function renderUsers(result) {

  const container =
    document.getElementById(
      "usersContent"
    ) ||
    document.getElementById(
      "moduleContent"
    );

  if (!container) {
    console.log(
      "USERS:",
      result
    );
    return;
  }

  const users =
    result.users ||
    result.data ||
    result.rows ||
    [];

  if (!users.length) {

    container.innerHTML =
      "<p>No users found.</p>";

    return;
  }

  const headers =
    Object.keys(users[0]);

  let html = `
    <div class="qms-table-wrapper">
      <table class="qms-table">
        <thead>
          <tr>
  `;

  headers.forEach(function (header) {

    html += `
      <th>${escapeHtml(header)}</th>
    `;

  });

  html += `
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
  `;

  users.forEach(function (user) {

    html += "<tr>";

    headers.forEach(function (header) {

      html += `
        <td>
          ${formatCell(user[header])}
        </td>
      `;

    });

    const userId =
      user["User ID"] ||
      user.userId ||
      "";

    html += `
      <td>
        <button
          type="button"
          onclick="editUser('${escapeJs(userId)}')">
          Edit
        </button>
      </td>
    `;

    html += "</tr>";

  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}


async function createUser(data) {

  if (!isAdmin()) {
    showMessage(
      "Administrator access required.",
      "error"
    );
    return;
  }

  const result =
    await apiRequest("CREATE_USER", {
      data: data
    });

  if (!result || !result.success) {

    showMessage(
      getFriendlyError(result),
      "error"
    );

    return;
  }

  showMessage(
    "User created successfully.",
    "success"
  );

  await loadUsers();
}


async function updateUser(userId, data) {

  if (!isAdmin()) {
    showMessage(
      "Administrator access required.",
      "error"
    );
    return;
  }

  const result =
    await apiRequest("UPDATE_USER", {
      userId: userId,
      data: data
    });

  if (!result || !result.success) {

    showMessage(
      getFriendlyError(result),
      "error"
    );

    return;
  }

  showMessage(
    "User updated successfully.",
    "success"
  );

  await loadUsers();
}


async function deleteUser(userId) {

  if (!isAdmin()) {
    showMessage(
      "Administrator access required.",
      "error"
    );
    return;
  }

  if (
    !confirm(
      "Disable/delete this user?"
    )
  ) {
    return;
  }

  const result =
    await apiRequest("DELETE_USER", {
      userId: userId
    });

  if (!result || !result.success) {

    showMessage(
      getFriendlyError(result),
      "error"
    );

    return;
  }

  showMessage(
    "User action completed.",
    "success"
  );

  await loadUsers();
}


/* =========================================================
   FORGOT PASSWORD
   ========================================================= */

function setupForgotPassword() {

  const forgotButton =
    document.getElementById(
      "forgotPasswordBtn"
    );

  if (forgotButton) {

    forgotButton.addEventListener(
      "click",
      function (event) {

        event.preventDefault();

        openForgotPassword();

      }
    );
  }


  const requestForm =
    document.getElementById(
      "forgotPasswordForm"
    );

  if (requestForm) {

    requestForm.addEventListener(
      "submit",
      async function (event) {

        event.preventDefault();

        const username =
          document.getElementById(
            "forgotUsername"
          )?.value.trim();

        if (!username) {
          showMessage(
            "Enter your username.",
            "error"
          );
          return;
        }

        const result =
          await apiRequest(
            "FORGOT_PASSWORD",
            {
              username: username
            }
          );

        if (!result || !result.success) {

          showMessage(
            getFriendlyError(result),
            "error"
          );

          return;
        }

        showMessage(
          "Password reset request processed.",
          "success"
        );

      }
    );
  }


  const resetForm =
    document.getElementById(
      "resetPasswordForm"
    );

  if (resetForm) {

    resetForm.addEventListener(
      "submit",
      async function (event) {

        event.preventDefault();

        const username =
          document.getElementById(
            "resetUsername"
          )?.value.trim();

        const resetCode =
          document.getElementById(
            "resetCode"
          )?.value.trim();

        const newPassword =
          document.getElementById(
            "newPassword"
          )?.value;

        if (
          !username ||
          !resetCode ||
          !newPassword
        ) {

          showMessage(
            "Complete all reset fields.",
            "error"
          );

          return;
        }

        const result =
          await apiRequest(
            "RESET_PASSWORD",
            {
              username: username,
              resetCode: resetCode,
              newPassword: newPassword
            }
          );

        if (!result || !result.success) {

          showMessage(
            getFriendlyError(result),
            "error"
          );

          return;
        }

        showMessage(
          "Password reset successfully.",
          "success"
        );

      }
    );
  }
}


function openForgotPassword() {

  const modal =
    document.getElementById(
      "forgotPasswordModal"
    );

  if (modal) {
    modal.style.display = "";
  }
}


function closeForgotPassword() {

  const modal =
    document.getElementById(
      "forgotPasswordModal"
    );

  if (modal) {
    modal.style.display = "none";
  }
}


/* =========================================================
   FILE UPLOAD
   ========================================================= */

async function uploadFile(
  module,
  recordId,
  file,
  description = ""
) {

  if (!file) {

    showMessage(
      "Please select a file.",
      "error"
    );

    return null;
  }

  const base64 =
    await fileToBase64(file);

  const result =
    await apiRequest("UPLOAD", {
      module:
        MODULE_MAP[module] ||
        module,

      recordId: recordId,

      fileName: file.name,

      mimeType:
        file.type ||
        "application/octet-stream",

      base64: base64,

      description: description
    });

  if (!result || !result.success) {

    showMessage(
      getFriendlyError(result),
      "error"
    );

    return null;
  }

  showMessage(
    "File uploaded successfully.",
    "success"
  );

  return result;
}


function fileToBase64(file) {

  return new Promise(
    function (resolve, reject) {

      const reader =
        new FileReader();

      reader.onload = function () {

        const result =
          String(reader.result || "");

        const commaIndex =
          result.indexOf(",");

        resolve(
          commaIndex >= 0
            ? result.substring(
                commaIndex + 1
              )
            : result
        );
      };

      reader.onerror = reject;

      reader.readAsDataURL(file);
    }
  );
}


/* =========================================================
   FILE ACCESS
   ========================================================= */

async function getFile(fileId) {

  const result =
    await apiRequest(
      "GET_FILE",
      {
        fileId: fileId
      }
    );

  if (!result || !result.success) {

    showMessage(
      getFriendlyError(result),
      "error"
    );

    return null;
  }

  if (result.url) {
    window.open(
      result.url,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return result;
}


/* =========================================================
   REPORTS
   ========================================================= */

async function generateReport(
  reportId,
  options = {}
) {

  const result =
    await apiRequest("REPORT", {
      reportId: reportId,
      options: options
    });

  if (!result || !result.success) {

    showMessage(
      getFriendlyError(result),
      "error"
    );

    return null;
  }

  renderReport(result);

  return result;
}


function renderReport(result) {

  console.log(
    "REPORT RESULT:",
    result
  );

  const container =
    document.getElementById(
      "reportContent"
    );

  if (!container) return;

  const rows =
    result.rows ||
    result.data ||
    result.records ||
    [];

  if (!Array.isArray(rows)) {

    container.innerHTML =
      `<pre>${escapeHtml(
        JSON.stringify(
          result,
          null,
          2
        )
      )}</pre>`;

    return;
  }

  if (!rows.length) {

    container.innerHTML =
      "<p>No report data available.</p>";

    return;
  }

  const headers =
    Object.keys(rows[0]);

  let html = `
    <div class="qms-table-wrapper">
      <table class="qms-table">
        <thead>
          <tr>
  `;

  headers.forEach(function (header) {

    html += `
      <th>${escapeHtml(header)}</th>
    `;

  });

  html += `
          </tr>
        </thead>
        <tbody>
  `;

  rows.forEach(function (row) {

    html += "<tr>";

    headers.forEach(function (header) {

      html += `
        <td>${formatCell(
          row[header]
        )}</td>
      `;

    });

    html += "</tr>";

  });

  html += `
        </tbody>
      </table>
    </div>
  `;

  container.innerHTML = html;
}


/* =========================================================
   AUDIT LOG
   ========================================================= */

async function loadAuditLog() {

  if (!isAdmin()) {

    showMessage(
      "Administrator access required.",
      "error"
    );

    return;
  }

  const result =
    await apiRequest(
      "LIST",
      {
        module: "AUDIT_LOG"
      }
    );

  if (!result || !result.success) {

    showMessage(
      getFriendlyError(result),
      "error"
    );

    return;
  }

  renderModuleList(
    "AUDIT_LOG",
    result
  );
}


/* =========================================================
   LOOKUPS
   ========================================================= */

async function loadLookups(type = "") {

  const result =
    await apiRequest(
      "LOOKUPS",
      {
        type: type
      }
    );

  if (!result || !result.success) {

    console.warn(
      "LOOKUPS ERROR:",
      result
    );

    return [];
  }

  return (
    result.lookups ||
    result.data ||
    result.rows ||
    []
  );
}


/* =========================================================
   SYSTEM INFO
   ========================================================= */

async function getSystemInfo() {

  const result =
    await apiRequest(
      "SYSTEM_INFO"
    );

  console.log(
    "SYSTEM INFO:",
    result
  );

  return result;
}


/* =========================================================
   UI HELPERS
   ========================================================= */

function setValue(id, value) {

  const element =
    document.getElementById(id);

  if (element) {
    element.textContent =
      value === null ||
      value === undefined
        ? ""
        : value;
  }
}


function showMessage(
  message,
  type = "info"
) {

  console.log(
    `[${type}]`,
    message
  );

  let container =
    document.getElementById(
      "toastContainer"
    );

  if (!container) {

    container =
      document.createElement("div");

    container.id =
      "toastContainer";

    document.body.appendChild(
      container
    );
  }

  const toast =
    document.createElement("div");

  toast.className =
    `qms-toast qms-toast-${type}`;

  toast.textContent =
    message;

  container.appendChild(
    toast
  );

  setTimeout(
    function () {

      toast.remove();

    },
    5000
  );
}


function getFriendlyError(result) {

  if (!result) {
    return "No response received from QMS API.";
  }

  switch (
    String(
      result.error || ""
    ).toUpperCase()
  ) {

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

    case "USERNAME_AND_PASSWORD_REQUIRED":
      return "Username and password are required.";

    case "NETWORK_ERROR":
      return "Unable to connect to the QMS API.";

    case "INVALID_API_RESPONSE":
      return "The QMS API returned an invalid response.";

    default:
      return (
        result.message ||
        result.error ||
        "An unexpected error occurred."
      );
  }
}


/* =========================================================
   FORM UTILITIES
   ========================================================= */

function formToObject(form) {

  const data = {};

  if (!form) return data;

  const formData =
    new FormData(form);

  formData.forEach(
    function (value, key) {

      data[key] =
        value;

    }
  );

  return data;
}


function clearForm(form) {

  if (!form) return;

  if (
    typeof form.reset ===
    "function"
  ) {
    form.reset();
  }
}


/* =========================================================
   HTML SAFETY
   ========================================================= */

function escapeHtml(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


function escapeJs(value) {

  return String(
    value ?? ""
  )
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'")
    .replaceAll('"', '\\"')
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\r");
}


function formatCell(value) {

  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value === "object"
  ) {

    return escapeHtml(
      JSON.stringify(value)
    );

  }

  const stringValue =
    String(value);

  if (
    stringValue.startsWith(
      "http://"
    ) ||
    stringValue.startsWith(
      "https://"
    )
  ) {

    return `
      <a
        href="${escapeHtml(
          stringValue
        )}"
        target="_blank"
        rel="noopener noreferrer">
        Open
      </a>
    `;

  }

  return escapeHtml(
    stringValue
  );
}


/* =========================================================
   GLOBAL FUNCTIONS
   ========================================================= */

window.openModule =
  openModule;

window.logout =
  logout;

window.closeForgotPassword =
  closeForgotPassword;

window.createRecord =
  createRecord;

window.updateRecord =
  updateRecord;

window.deleteRecord =
  deleteRecord;

window.getRecord =
  getRecord;

window.uploadFile =
  uploadFile;

window.getFile =
  getFile;

window.generateReport =
  generateReport;

window.loadUsers =
  loadUsers;

window.createUser =
  createUser;

window.updateUser =
  updateUser;

window.deleteUser =
  deleteUser;

window.editUser =
  function (userId) {

    console.log(
      "EDIT USER:",
      userId
    );

    showMessage(
      "User editor can now be connected to the user form.",
      "info"
    );

  };

window.loadAuditLog =
  loadAuditLog;

window.loadLookups =
  loadLookups;

window.getSystemInfo =
  getSystemInfo;


/* =========================================================
   DEBUG
   ========================================================= */

window.QMS_DEBUG =
  {
    api: API_URL,

    getUser: function () {
      return currentUser;
    },

    getToken: function () {
      return sessionToken;
    },

    testAPI: async function () {
      return await apiRequest(
        "SYSTEM_INFO"
      );
    },

    dashboard: async function () {
      return await apiRequest(
        "DASHBOARD"
      );
    },

    logout: logout
  };


console.log(
  "GGL QMS CONTROL CENTER JS LOADED"
);
console.log(
  "API:",
  API_URL
);
