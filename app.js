"use strict";

/* =====================================================
   GGL QMS CONTROL CENTER
   FRONTEND APPLICATION
   ===================================================== */


/* =====================================================
   API CONFIGURATION
   ===================================================== */

const API_URL =
    "https://script.google.com/macros/s/AKfycbwnmtkqrVmggRbZnJserN_y5DwB4BPQ96oeCyoqbvXGBevmdGpqCh3TkVSDE8g6-2Kyrw/exec";


/* =====================================================
   APPLICATION STATE
   ===================================================== */

const App = {

    token: null,

    user: null,

    currentPage: "dashboard",

    initialized: false

};


/* =====================================================
   DOM
   ===================================================== */

const DOM = {

    loginPage:
        document.getElementById("loginPage"),

    application:
        document.getElementById("application"),

    loginForm:
        document.getElementById("loginForm"),

    username:
        document.getElementById("username"),

    password:
        document.getElementById("password"),

    loginButton:
        document.getElementById("loginButton"),

    loginButtonText:
        document.getElementById("loginButtonText"),

    loginLoader:
        document.getElementById("loginLoader"),

    loginError:
        document.getElementById("loginError"),

    togglePassword:
        document.getElementById("togglePassword"),

    logoutButton:
        document.getElementById("logoutButton"),

    adminNavigation:
        document.getElementById("adminNavigation"),

    userName:
        document.getElementById("userName"),

    userRole:
        document.getElementById("userRole"),

    pageTitle:
        document.getElementById("pageTitle"),

    pageContent:
        document.getElementById("pageContent"),

    mobileMenu:
        document.getElementById("mobileMenu"),

    sidebar:
        document.getElementById("sidebar")

};


/* =====================================================
   INITIALIZATION
   ===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init() {

    bindEvents();

    restoreSession();

}


/* =====================================================
   EVENTS
   ===================================================== */

function bindEvents() {

    if (DOM.loginForm) {

        DOM.loginForm.addEventListener(
            "submit",
            handleLogin
        );

    }


    if (DOM.togglePassword) {

        DOM.togglePassword.addEventListener(
            "click",
            togglePassword
        );

    }


    if (DOM.logoutButton) {

        DOM.logoutButton.addEventListener(
            "click",
            handleLogout
        );

    }


    document
        .querySelectorAll(".nav-item")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const page =
                        button.dataset.page;

                    if (page) {

                        navigate(page);

                    }

                }
            );

        });


    if (DOM.mobileMenu) {

        DOM.mobileMenu.addEventListener(
            "click",
            () => {

                DOM.sidebar.classList.toggle(
                    "mobile-open"
                );

            }
        );

    }

}


/* =====================================================
   LOGIN
   ===================================================== */

async function handleLogin(event) {

    event.preventDefault();

    clearLoginError();

    const username =
        DOM.username.value.trim();

    const password =
        DOM.password.value;

    if (!username) {

        showLoginError(
            "Please enter your username."
        );

        return;

    }

    if (!password) {

        showLoginError(
            "Please enter your password."
        );

        return;

    }

    setLoginLoading(true);

    try {

        const response =
            await apiRequest({
                action: "LOGIN",
                username: username,
                password: password
            });

        if (!response.success) {

            showLoginError(
                getReadableError(
                    response.error
                )
            );

            return;

        }

        App.token =
            response.token;

        App.user =
            response.user;

        saveSession();

        showApplication();

        await loadDashboard();

    } catch (error) {

        console.error(error);

        showLoginError(
            "Unable to connect to the QMS server."
        );

    } finally {

        setLoginLoading(false);

    }

}


/* =====================================================
   LOGOUT
   ===================================================== */

async function handleLogout() {

    try {

        if (App.token) {

            await apiRequest({
                action: "LOGOUT",
                token: App.token
            });

        }

    } catch (error) {

        console.warn(
            "Logout API error:",
            error
        );

    }

    clearSession();

    showLogin();

}


/* =====================================================
   SESSION STORAGE
   ===================================================== */

function saveSession() {

    localStorage.setItem(
        "GGL_QMS_TOKEN",
        App.token
    );

    localStorage.setItem(
        "GGL_QMS_USER",
        JSON.stringify(
            App.user
        )
    );

}


function restoreSession() {

    const token =
        localStorage.getItem(
            "GGL_QMS_TOKEN"
        );

    const user =
        localStorage.getItem(
            "GGL_QMS_USER"
        );

    if (!token || !user) {

        showLogin();

        return;

    }

    try {

        App.token =
            token;

        App.user =
            JSON.parse(user);

        verifySession();

    } catch (error) {

        console.error(error);

        clearSession();

        showLogin();

    }

}


async function verifySession() {

    try {

        const response =
            await apiRequest({
                action: "ME",
                token: App.token
            });

        if (
            !response.success ||
            !response.user
        ) {

            clearSession();

            showLogin();

            return;

        }

        App.user =
            response.user;

        saveSession();

        showApplication();

        await loadDashboard();

    } catch (error) {

        console.error(error);

        clearSession();

        showLogin();

    }

}


/* =====================================================
   API REQUEST
   ===================================================== */

async function apiRequest(payload) {

    const response =
        await fetch(
            API_URL,
            {

                method: "POST",

                headers: {

                    "Content-Type":
                        "text/plain;charset=utf-8"

                },

                body:
                    JSON.stringify(
                        payload
                    )

            }
        );

    if (!response.ok) {

        throw new Error(
            "HTTP_" +
            response.status
        );

    }

    return await response.json();

}


/* =====================================================
   APPLICATION DISPLAY
   ===================================================== */

function showApplication() {

    DOM.loginPage.classList.add(
        "hidden"
    );

    DOM.application.classList.remove(
        "hidden"
    );

    updateUserInterface();

}


function showLogin() {

    DOM.application.classList.add(
        "hidden"
    );

    DOM.loginPage.classList.remove(
        "hidden"
    );

    DOM.username.value = "";

    DOM.password.value = "";

    clearLoginError();

}


function updateUserInterface() {

    if (!App.user)
        return;

    DOM.userName.textContent =
        App.user.name ||
        App.user.username ||
        "User";

    DOM.userRole.textContent =
        App.user.role ||
        "USER";


    /*
     * Admin-only navigation
     */

    const role =
        String(
            App.user.role || ""
        ).toUpperCase();

    if (
        role === "ADMIN"
    ) {

        DOM.adminNavigation
            .classList.remove(
                "hidden"
            );

    } else {

        DOM.adminNavigation
            .classList.add(
                "hidden"
            );

    }

}


/* =====================================================
   NAVIGATION
   ===================================================== */

async function navigate(page) {

    App.currentPage =
        page;

    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.page === page
            );

        });


    const titles = {

        dashboard:
            "Dashboard",

        capa:
            "CAPA",

        complaints:
            "Complaints",

        compliance:
            "Compliance",

        audits:
            "Audits",

        actions:
            "Actions",

        documents:
            "Documents",

        evidence:
            "Evidence",

        reports:
            "Reports",

        users:
            "Users",

        auditlog:
            "Audit Log"

    };


    DOM.pageTitle.textContent =
        titles[page] ||
        "QMS";


    /*
     * Close mobile sidebar
     */

    if (
        DOM.sidebar
    ) {

        DOM.sidebar.classList.remove(
            "mobile-open"
        );

    }


    switch (page) {

        case "dashboard":

            await loadDashboard();

            break;


        case "capa":

            renderModulePlaceholder(
                "CAPA",
                "CAPA management will be connected next."
            );

            break;


        case "complaints":

            renderModulePlaceholder(
                "Complaints",
                "Complaint management will be connected next."
            );

            break;


        case "compliance":

            renderModulePlaceholder(
                "Compliance",
                "Compliance register will be connected next."
            );

            break;


        case "audits":

            renderModulePlaceholder(
                "Audits",
                "Audit management will be connected next."
            );

            break;


        case "actions":

            renderModulePlaceholder(
                "Actions",
                "Action management will be connected next."
            );

            break;


        case "documents":

            renderModulePlaceholder(
                "Documents",
                "Document management will be connected next."
            );

            break;


        case "evidence":

            renderModulePlaceholder(
                "Evidence",
                "Evidence management will be connected next."
            );

            break;


        case "reports":

            renderModulePlaceholder(
                "Reports",
                "Report generator will be connected next."
            );

            break;


        case "users":

            if (
                hasRole(
                    ["ADMIN"]
                )
            ) {

                await loadUsers();

            } else {

                showAccessDenied();

            }

            break;


        case "auditlog":

            if (
                hasRole(
                    ["ADMIN"]
                )
            ) {

                loadAuditLog();

            } else {

                showAccessDenied();

            }

            break;


        default:

            await loadDashboard();

    }

}


/* =====================================================
   DASHBOARD
   ===================================================== */

async function loadDashboard() {

    DOM.pageContent.innerHTML = `

        <div class="empty-state">

            <div class="empty-state-title">
                Loading dashboard...
            </div>

        </div>

    `;

    try {

        const response =
            await apiRequest({

                action:
                    "DASHBOARD",

                token:
                    App.token

            });


        if (
            !response.success
        ) {

            handleApiError(
                response
            );

            return;

        }


        renderDashboard(
            response
        );


    } catch (error) {

        console.error(error);

        DOM.pageContent.innerHTML = `

            <div class="empty-state">

                <div class="empty-state-title">
                    Dashboard unavailable
                </div>

                <div class="empty-state-text">
                    Unable to retrieve QMS data.
                </div>

            </div>

        `;

    }

}


/* =====================================================
   DASHBOARD RENDER
   ===================================================== */

function renderDashboard(data) {

    const capaTotal =
        data.capa?.total || 0;

    const complaintTotal =
        data.complaints?.total || 0;

    const complianceTotal =
        data.compliance?.total || 0;

    const auditTotal =
        data.audits?.total || 0;

    const overdueCapa =
        data.overdueCapa || 0;

    const overdueActions =
        data.overdueActions || 0;


    DOM.pageContent.innerHTML = `

        <div class="toolbar">

            <div class="toolbar-left">

                <div>

                    <div class="panel-title">
                        QMS Overview
                    </div>

                    <div class="panel-subtitle">
                        Current quality and compliance position
                    </div>

                </div>

            </div>

            <div class="toolbar-right">

                <button
                    class="btn btn-primary"
                    onclick="navigate('capa')"
                >
                    + New CAPA
                </button>

            </div>

        </div>


        <div class="kpi-grid">

            ${kpiCard(
                "CAPA",
                capaTotal,
                "Total CAPA records"
            )}

            ${kpiCard(
                "COMPLAINTS",
                complaintTotal,
                "Total complaints"
            )}

            ${kpiCard(
                "COMPLIANCE",
                complianceTotal,
                "Compliance requirements"
            )}

            ${kpiCard(
                "AUDITS",
                auditTotal,
                "Audit records"
            )}

        </div>


        <div class="content-grid">

            <div class="panel">

                <div class="panel-header">

                    <div>

                        <div class="panel-title">
                            Attention Required
                        </div>

                        <div class="panel-subtitle">
                            Items requiring follow-up
                        </div>

                    </div>

                </div>


                <div class="panel-body">

                    <div class="kpi-grid">

                        ${smallKpi(
                            "Overdue CAPA",
                            overdueCapa
                        )}

                        ${smallKpi(
                            "Overdue Actions",
                            overdueActions
                        )}

                    </div>

                </div>

            </div>


            <div class="panel">

                <div class="panel-header">

                    <div>

                        <div class="panel-title">
                            System Status
                        </div>

                        <div class="panel-subtitle">
                            GGL QMS Control Center
                        </div>

                    </div>

                </div>


                <div class="panel-body">

                    <div class="system-status">

                        <div>
                            <strong>API</strong>
                            <span class="status status-closed">
                                ONLINE
                            </span>
                        </div>

                        <div>
                            <strong>Session</strong>
                            <span class="status status-closed">
                                ACTIVE
                            </span>
                        </div>

                        <div>
                            <strong>User</strong>
                            <span>
                                ${escapeHtml(
                                    App.user.name
                                )}
                            </span>
                        </div>

                    </div>

                </div>

            </div>

        </div>


        <div class="panel">

            <div class="panel-header">

                <div>

                    <div class="panel-title">
                        Quick Access
                    </div>

                    <div class="panel-subtitle">
                        QMS modules
                    </div>

                </div>

            </div>


            <div class="panel-body">

                <div class="quick-grid">

                    ${quickButton(
                        "CAPA",
                        "capa"
                    )}

                    ${quickButton(
                        "Complaints",
                        "complaints"
                    )}

                    ${quickButton(
                        "Compliance",
                        "compliance"
                    )}

                    ${quickButton(
                        "Audits",
                        "audits"
                    )}

                    ${quickButton(
                        "Documents",
                        "documents"
                    )}

                    ${quickButton(
                        "Reports",
                        "reports"
                    )}

                </div>

            </div>

        </div>

    `;

}


/* =====================================================
   KPI HELPERS
   ===================================================== */

function kpiCard(
    label,
    value,
    description
) {

    return `

        <div class="kpi-card">

            <div class="kpi-label">
                ${label}
            </div>

            <div class="kpi-value">
                ${value}
            </div>

            <div class="kpi-description">
                ${description}
            </div>

        </div>

    `;

}


function smallKpi(
    label,
    value
) {

    return `

        <div class="kpi-card">

            <div class="kpi-label">
                ${label}
            </div>

            <div class="kpi-value">
                ${value}
            </div>

        </div>

    `;

}


function quickButton(
    label,
    page
) {

    return `

        <button
            class="btn btn-secondary"
            onclick="navigate('${page}')"
        >

            ${escapeHtml(label)}

        </button>

    `;

}


/* =====================================================
   USERS
   ===================================================== */

async function loadUsers() {

    DOM.pageContent.innerHTML = `

        <div class="empty-state">

            <div class="empty-state-title">
                Loading users...
            </div>

        </div>

    `;


    try {

        const response =
            await apiRequest({

                action:
                    "LIST",

                module:
                    "USERS",

                token:
                    App.token

            });


        /*
         * USERS isn't a normal module in the current
         * module map, so load directly through the
         * dedicated function below.
         */

        await loadUsersDirect();

    } catch (error) {

        console.error(error);

        showAccessDenied();

    }

}


async function loadUsersDirect() {

    const response =
        await apiRequest({

            action:
                "ADMIN_USERS",

            token:
                App.token

        });


    if (
        !response.success
    ) {

        /*
         * This endpoint will be added to the backend
         * during the Admin module stage.
         */

        DOM.pageContent.innerHTML = `

            <div class="panel">

                <div class="panel-header">

                    <div>

                        <div class="panel-title">
                            User Administration
                        </div>

                        <div class="panel-subtitle">
                            Backend user management endpoint pending
                        </div>

                    </div>

                </div>

                <div class="panel-body">

                    User administration will be activated
                    in the next backend update.

                </div>

            </div>

        `;

        return;

    }

    renderUsers(
        response.users || []
    );

}


function renderUsers(users) {

    let rows = "";

    users.forEach(
        user => {

            rows += `

                <tr>

                    <td>
                        ${escapeHtml(
                            user["User ID"] ||
                            user.userId ||
                            ""
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            user.Username ||
                            user.username ||
                            ""
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            user.Name ||
                            user.name ||
                            ""
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            user.Role ||
                            user.role ||
                            ""
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            user.Status ||
                            user.status ||
                            ""
                        )}
                    </td>

                    <td>

                        <button
                            class="btn btn-secondary"
                            onclick="editUser('${escapeJs(
                                user["User ID"] ||
                                user.userId ||
                                ""
                            )}')"
                        >
                            Edit
                        </button>

                    </td>

                </tr>

            `;

        }
    );


    DOM.pageContent.innerHTML = `

        <div class="toolbar">

            <div>

                <div class="panel-title">
                    User Administration
                </div>

                <div class="panel-subtitle">
                    Manage authorized QMS users
                </div>

            </div>


            <button
                class="btn btn-primary"
                onclick="openAddUser()"
            >
                + Add User
            </button>

        </div>


        <div class="panel">

            <div class="table-container">

                <table class="data-table">

                    <thead>

                        <tr>

                            <th>User ID</th>
                            <th>Username</th>
                            <th>Name</th>
                            <th>Role</th>
                            <th>Status</th>
                            <th>Action</th>

                        </tr>

                    </thead>

                    <tbody>

                        ${
                            rows ||
                            `
                                <tr>
                                    <td colspan="6">
                                        No users found.
                                    </td>
                                </tr>
                            `
                        }

                    </tbody>

                </table>

            </div>

        </div>

    `;

}


/* =====================================================
   AUDIT LOG PLACEHOLDER
   ===================================================== */

function loadAuditLog() {

    DOM.pageContent.innerHTML = `

        <div class="panel">

            <div class="panel-header">

                <div>

                    <div class="panel-title">
                        Audit Log
                    </div>

                    <div class="panel-subtitle">
                        System activity history
                    </div>

                </div>

            </div>

            <div class="panel-body">

                Audit log interface will be connected
                after the core modules.

            </div>

        </div>

    `;

}


/* =====================================================
   PLACEHOLDER
   ===================================================== */

function renderModulePlaceholder(
    title,
    message
) {

    DOM.pageContent.innerHTML = `

        <div class="panel">

            <div class="panel-header">

                <div>

                    <div class="panel-title">
                        ${escapeHtml(title)}
                    </div>

                    <div class="panel-subtitle">
                        QMS Control Center
                    </div>

                </div>

            </div>

            <div class="panel-body">

                <div class="empty-state">

                    <div class="empty-state-title">
                        ${escapeHtml(title)}
                    </div>

                    <div class="empty-state-text">
                        ${escapeHtml(message)}
                    </div>

                </div>

            </div>

        </div>

    `;

}


/* =====================================================
   ACCESS CONTROL
   ===================================================== */

function hasRole(
    roles
) {

    if (!App.user)
        return false;

    const role =
        String(
            App.user.role || ""
        ).toUpperCase();

    return roles.includes(
        role
    );

}


function showAccessDenied() {

    DOM.pageContent.innerHTML = `

        <div class="panel">

            <div class="panel-body">

                <div class="empty-state">

                    <div class="empty-state-title">
                        Access Denied
                    </div>

                    <div class="empty-state-text">
                        Your account does not have permission
                        to access this section.
                    </div>

                </div>

            </div>

        </div>

    `;

}


/* =====================================================
   PASSWORD
   ===================================================== */

function togglePassword() {

    if (
        DOM.password.type ===
        "password"
    ) {

        DOM.password.type =
            "text";

        DOM.togglePassword.textContent =
            "Hide";

    } else {

        DOM.password.type =
            "password";

        DOM.togglePassword.textContent =
            "Show";

    }

}


/* =====================================================
   LOGIN UI
   ===================================================== */

function setLoginLoading(
    loading
) {

    DOM.loginButton.disabled =
        loading;

    if (loading) {

        DOM.loginButtonText.classList.add(
            "hidden"
        );

        DOM.loginLoader.classList.remove(
            "hidden"
        );

    } else {

        DOM.loginButtonText.classList.remove(
            "hidden"
        );

        DOM.loginLoader.classList.add(
            "hidden"
        );

    }

}


function showLoginError(
    message
) {

    DOM.loginError.textContent =
        message;

}


function clearLoginError() {

    DOM.loginError.textContent =
        "";

}


/* =====================================================
   SESSION
   ===================================================== */

function clearSession() {

    App.token = null;

    App.user = null;

    localStorage.removeItem(
        "GGL_QMS_TOKEN"
    );

    localStorage.removeItem(
        "GGL_QMS_USER"
    );

}


/* =====================================================
   API ERROR
   ===================================================== */

function handleApiError(
    response
) {

    if (
        response &&
        (
            response.error ===
            "SESSION_EXPIRED" ||
            response.error ===
            "AUTH_REQUIRED"
        )
    ) {

        clearSession();

        showLogin();

        showLoginError(
            "Your session has expired. Please sign in again."
        );

        return;

    }

    showToast(
        getReadableError(
            response?.error
        ),
        "error"
    );

}


function getReadableError(
    error
) {

    const errors = {

        INVALID_CREDENTIALS:
            "Invalid username or password.",

        USER_INACTIVE:
            "This user account is inactive.",

        USER_NOT_FOUND:
            "User account was not found.",

        SESSION_EXPIRED:
            "Your session has expired.",

        AUTH_REQUIRED:
            "Authentication is required.",

        ACCESS_DENIED:
            "You do not have permission for this action.",

        USERNAME_ALREADY_EXISTS:
            "That username already exists.",

        USERNAME_REQUIRED:
            "Username is required.",

        PASSWORD_REQUIRED:
            "Password is required.",

        NETWORK_ERROR:
            "Network connection failed."

    };

    return (
        errors[error] ||
        error ||
        "An unexpected error occurred."
    );

}


/* =====================================================
   TOAST
   ===================================================== */

function showToast(
    message,
    type = "success"
) {

    let container =
        document.querySelector(
            ".toast-container"
        );

    if (!container) {

        container =
            document.createElement(
                "div"
            );

        container.className =
            "toast-container";

        document.body.appendChild(
            container
        );

    }


    const toast =
        document.createElement(
            "div"
        );

    toast.className =
        "toast " + type;

    toast.textContent =
        message;

    container.appendChild(
        toast
    );


    setTimeout(
        () => {

            toast.remove();

        },
        3500
    );

}


/* =====================================================
   ESCAPING
   ===================================================== */

function escapeHtml(
    value
) {

    return String(
        value ??
        ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


function escapeJs(
    value
) {

    return String(
        value ??
        ""
    )
        .replace(
            /\\/g,
            "\\\\"
        )
        .replace(
            /'/g,
            "\\'"
        )
        .replace(
            /"/g,
            '\\"'
        );

}


/* =====================================================
   TEMP USER FUNCTIONS
   ===================================================== */

function openAddUser() {

    showToast(
        "User administration will be activated next.",
        "success"
    );

}


function editUser() {

    showToast(
        "User editing will be activated next.",
        "success"
    );

}


/* =====================================================
   DEBUG
   ===================================================== */

window.QMS = {

    App: App,

    navigate: navigate,

    apiRequest: apiRequest,

    logout: handleLogout

};
