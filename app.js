"use strict";

/* =====================================================
   GGL QMS CONTROL CENTER
   FRONTEND APPLICATION
   ===================================================== */


/* =====================================================
   API
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
        document.getElementById("sidebar"),

    forgotPasswordBtn:
        document.getElementById("forgotPasswordBtn"),

    forgotPasswordModal:
        document.getElementById("forgotPasswordModal"),

    forgotStep1:
        document.getElementById("forgotStep1"),

    forgotStep2:
        document.getElementById("forgotStep2"),

    resetUsername:
        document.getElementById("resetUsername"),

    resetCode:
        document.getElementById("resetCode"),

    newResetPassword:
        document.getElementById("newResetPassword"),

    confirmResetPassword:
        document.getElementById("confirmResetPassword"),

    sendResetCodeBtn:
        document.getElementById("sendResetCodeBtn"),

    resetPasswordBtn:
        document.getElementById("resetPasswordBtn"),

    resetMessage:
        document.getElementById("resetMessage")

};


/* =====================================================
   INITIALIZATION
   ===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    init
);


function init() {

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


    if (DOM.forgotPasswordBtn) {

        DOM.forgotPasswordBtn.addEventListener(
            "click",
            openForgotPassword
        );

    }


    if (DOM.sendResetCodeBtn) {

        DOM.sendResetCodeBtn.addEventListener(
            "click",
            sendResetCode
        );

    }


    if (DOM.resetPasswordBtn) {

        DOM.resetPasswordBtn.addEventListener(
            "click",
            resetPassword
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


    /* Close modal when clicking outside */

    if (DOM.forgotPasswordModal) {

        DOM.forgotPasswordModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    DOM.forgotPasswordModal
                ) {

                    closeForgotPassword();

                }

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
   FORGOT PASSWORD
   ===================================================== */

function openForgotPassword() {

    if (!DOM.forgotPasswordModal)
        return;

    DOM.forgotPasswordModal.classList.add(
        "show"
    );


    DOM.forgotStep1.style.display =
        "block";

    DOM.forgotStep2.style.display =
        "none";


    DOM.resetUsername.value =
        DOM.username.value.trim();


    DOM.resetCode.value = "";

    DOM.newResetPassword.value = "";

    DOM.confirmResetPassword.value = "";

    DOM.resetMessage.innerHTML = "";

}


function closeForgotPassword() {

    if (!DOM.forgotPasswordModal)
        return;

    DOM.forgotPasswordModal.classList.remove(
        "show"
    );

}


function backToResetUsername() {

    DOM.forgotStep1.style.display =
        "block";

    DOM.forgotStep2.style.display =
        "none";

    DOM.resetCode.value = "";

    DOM.newResetPassword.value = "";

    DOM.confirmResetPassword.value = "";

    DOM.resetMessage.innerHTML = "";

}


async function sendResetCode() {

    const username =
        DOM.resetUsername.value.trim();


    if (!username) {

        showResetMessage(
            "Please enter your username.",
            "error"
        );

        return;

    }


    DOM.sendResetCodeBtn.disabled =
        true;

    DOM.sendResetCodeBtn.textContent =
        "Sending...";


    try {

        const response =
            await apiRequest({

                action:
                    "FORGOT_PASSWORD",

                username:
                    username

            });


        if (!response.success) {

            showResetMessage(
                getReadableError(
                    response.error
                ),
                "error"
            );

            return;

        }


        DOM.forgotStep1.style.display =
            "none";

        DOM.forgotStep2.style.display =
            "block";


        showResetMessage(
            "A verification code has been sent to your registered email address.",
            "success"
        );


        DOM.resetCode.focus();


    } catch (error) {

        console.error(
            "Password reset request:",
            error
        );

        showResetMessage(
            "Unable to connect to the QMS server.",
            "error"
        );


    } finally {

        DOM.sendResetCodeBtn.disabled =
            false;

        DOM.sendResetCodeBtn.textContent =
            "Send Reset Code";

    }

}


async function resetPassword() {

    const username =
        DOM.resetUsername.value.trim();

    const code =
        DOM.resetCode.value.trim();

    const password =
        DOM.newResetPassword.value;

    const confirmPassword =
        DOM.confirmResetPassword.value;


    if (!username) {

        showResetMessage(
            "Username is required.",
            "error"
        );

        return;

    }


    if (!/^\d{6}$/.test(code)) {

        showResetMessage(
            "Enter the 6-digit verification code.",
            "error"
        );

        return;

    }


    if (!password) {

        showResetMessage(
            "Enter a new password.",
            "error"
        );

        return;

    }


    if (password.length < 8) {

        showResetMessage(
            "Password must contain at least 8 characters.",
            "error"
        );

        return;

    }


    if (password !== confirmPassword) {

        showResetMessage(
            "Passwords do not match.",
            "error"
        );

        return;

    }


    DOM.resetPasswordBtn.disabled =
        true;

    DOM.resetPasswordBtn.textContent =
        "Resetting...";


    try {

        const response =
            await apiRequest({

                action:
                    "RESET_PASSWORD",

                username:
                    username,

                code:
                    code,

                newPassword:
                    password

            });


        if (!response.success) {

            showResetMessage(
                getReadableError(
                    response.error
                ),
                "error"
            );

            return;

        }


        closeForgotPassword();


        DOM.username.value =
            username;

        DOM.password.value =
            "";


        showLoginError("");

        showToast(
            "Password reset successfully. Please sign in.",
            "success"
        );


        DOM.password.focus();


    } catch (error) {

        console.error(
            "Password reset:",
            error
        );

        showResetMessage(
            "Unable to connect to the QMS server.",
            "error"
        );


    } finally {

        DOM.resetPasswordBtn.disabled =
            false;

        DOM.resetPasswordBtn.textContent =
            "Reset Password";

    }

}


function showResetMessage(
    message,
    type
) {

    if (!DOM.resetMessage)
        return;


    const className =
        type === "error"
            ? "error-message"
            : "success-message";


    DOM.resetMessage.innerHTML =
        `<div class="${className}">
            ${escapeHtml(message)}
        </div>`;

}


/* =====================================================
   LOGOUT
   ===================================================== */

async function handleLogout() {

    try {

        if (App.token) {

            await apiRequest({

                action:
                    "LOGOUT",

                token:
                    App.token

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
   SESSION
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

                action:
                    "ME",

                token:
                    App.token

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
   API
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


    const role =
        String(
            App.user.role || ""
        ).toUpperCase();


    if (role === "ADMIN") {

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


    DOM.sidebar?.classList.remove(
        "mobile-open"
    );


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

            if (hasRole(["ADMIN"])) {

                await loadUsers();

            } else {

                showAccessDenied();

            }

            break;


        case "auditlog":

            if (hasRole(["ADMIN"])) {

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


        if (!response.success) {

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

            <div>

                <div class="panel-title">
                    QMS Overview
                </div>

                <div class="panel-subtitle">
                    Current quality and compliance position
                </div>

            </div>

            <button
                class="btn btn-primary"
                onclick="navigate('capa')"
            >
                + New CAPA
            </button>

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
                                    App.user?.name ||
                                    App.user?.username ||
                                    ""
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
                    "ADMIN_USERS",

                token:
                    App.token

            });


        if (!response.success) {

            handleApiError(
                response
            );

            return;

        }


        renderUsers(
            response.users || []
        );


    } catch (error) {

        console.error(error);

        showAccessDenied();

    }

}


function renderUsers(users) {

    let rows = "";


    users.forEach(user => {

        const id =
            user["User ID"] ||
            user.userId ||
            "";

        rows += `

            <tr>

                <td>
                    ${escapeHtml(id)}
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
                        onclick="editUser('${escapeJs(id)}')"
                    >
                        Edit
                    </button>

                </td>

            </tr>

        `;

    });


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
   AUDIT LOG
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

function hasRole(roles) {

    if (!App.user)
        return false;


    const role =
        String(
            App.user.role || ""
        ).toUpperCase();


    return roles.includes(role);

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

function setLoginLoading(loading) {

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


function showLoginError(message) {

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

function handleApiError(response) {

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


function getReadableError(error) {

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

        PASSWORD_TOO_SHORT:
            "Password must contain at least 8 characters.",

        RESET_CODE_INVALID:
            "The verification code is invalid.",

        RESET_CODE_EXPIRED:
            "The verification code has expired.",

        RESET_CODE_USED:
            "This verification code has already been used.",

        EMAIL_NOT_CONFIGURED:
            "No recovery email is configured for this account.",

        RESET_FAILED:
            "Password reset failed.",

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
   USER FUNCTIONS
   ===================================================== */

function openAddUser() {

    showToast(
        "User administration form will be connected next.",
        "success"
    );

}


function editUser() {

    showToast(
        "User editing will be connected next.",
        "success"
    );

}


/* =====================================================
   ESCAPING
   ===================================================== */

function escapeHtml(value) {

    return String(
        value ?? ""
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


function escapeJs(value) {

    return String(
        value ?? ""
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
   DEBUG
   ===================================================== */

window.QMS = {

    App:
        App,

    navigate:
        navigate,

    apiRequest:
        apiRequest,

    logout:
        handleLogout,

    forgotPassword:
        openForgotPassword

};
