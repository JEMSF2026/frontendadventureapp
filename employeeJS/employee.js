/**
 * employee.js – Indgangspunkt for medarbejderportalen (employee.html)
 *
 * Ansvarsområder:
 *   1. Login-flow: send legitimationsoplysninger → vis/skjul login-skærm vs. dashboard
 *   2. Dashboard-navigation: skift mellem Udstyr og Aktivitetsstyring
 *
 * Al øvrig funktionalitet importeres fra equipmentOverview.js og activityManagement.js.
 */
import { apiBaseUrl } from "./config.js";
import { createLayout, loadActivities } from "./equipmentOverview.js";
import { showActivityManagement } from "./activityManagement.js";

// --- Login ---

document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const errorEl = document.getElementById("loginError");

    try {
        const response = await fetch(`${apiBaseUrl}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (response.ok) {
            errorEl.classList.add("hidden");
            document.getElementById("loginScreen").classList.add("hidden");
            document.getElementById("dashboard").classList.remove("hidden");
        } else {
            // 401 Unauthorized — vis den statiske fejlbesked der allerede er i HTML'en
            errorEl.classList.remove("hidden");
        }
    } catch (err) {
        console.error("Login fejlede:", err);
        errorEl.textContent = "Kunne ikke oprette forbindelse til serveren";
        errorEl.classList.remove("hidden");
    }
});

// --- Dashboard-navigation ---

/** Aktiverer udstyrsoversigten og markerer nav-linket som aktivt. */
function showEquipment(e) {
    e.preventDefault();
    setActiveNav("nav-udstyr");
    createLayout();
    loadActivities();
}

/** Aktiverer aktivitetsstyringen og markerer nav-linket som aktivt. */
function showActivities(e) {
    e.preventDefault();
    setActiveNav("nav-aktiviteter");
    showActivityManagement();
}

/** Logger medarbejderen ud: skjuler dashboard og viser login-skærmen igen. */
function logout(e) {
    e.preventDefault();
    document.getElementById("dashboard").classList.add("hidden");
    document.getElementById("loginScreen").classList.remove("hidden");
    document.getElementById("loginForm").reset();
}

/** Flytter .nav-active-klassen til det angivne nav-link-id. */
function setActiveNav(activeId) {
    document.querySelectorAll(".nav-list .nav-item a").forEach(a => a.classList.remove("nav-active"));
    document.getElementById(activeId)?.classList.add("nav-active");
}

// Tilknyt nav-lyttere (erstatter de inline onclick-attributter fra employee.html)
document.getElementById("nav-udstyr").addEventListener("click", showEquipment);
document.getElementById("nav-aktiviteter").addEventListener("click", showActivities);
document.getElementById("nav-logout").addEventListener("click", logout);

// Vis udstyrsoversigten som standardvisning ved sideindlæsning
createLayout();
loadActivities();
