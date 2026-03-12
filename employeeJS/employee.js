/*
 * employee.js – Hoved-controller for medarbejderportalen (employee.html)
 *
 * Denne fil styrer to ting:
 *   1. Login-flowet: sender credentials til backend og skifter mellem login-skærm og dashboard
 *   2. Navigation i dashboardet: skifter indhold i .content-divven mellem de to sektioner
 *
 * Afhængigheder (indlæses i employee.html før denne fil):
 *   - equipmentOverview.js  → eksponerer createLayout() og loadActivities()
 *   - activityManagement.js → eksponerer showActivityManagement()
 *
 */

const apiBaseUrl = "http://localhost:8080";

/*
 * Login-handler
 * Lytter på submit-eventet fra #loginForm i employee.html.
 * Sender email + password som JSON til POST /auth/login.
 *   - 200 OK        → skjuler #loginScreen, viser #dashboard
 *   - 401           → viser fejlbesked til brugeren
 *   - Netværksfejl  → viser "Kunne ikke oprette forbindelse" fejlbesked
 */
document.getElementById("loginForm").addEventListener("submit", async function (e) {
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
            errorEl.classList.remove("hidden");
        }
    } catch (error) {
        console.error("Login fejlede:", error);
        errorEl.textContent = "Kunne ikke oprette forbindelse til serveren";
        errorEl.classList.remove("hidden");
    }
});

/*
 * showEquipment(e)
 * Kaldt fra onclick på "Udstyr"-linket i nav (employee.html).
 * Markerer "Udstyr" som aktiv i nav og gengiver udstyrsoversigten.
 *   → createLayout()    defineret i equipmentOverview.js – bygger tabel-HTML i .content
 *   → loadActivities()  defineret i equipmentOverview.js – henter aktiviteter fra backend
 *                        og fylder dropdown, som derefter auto-loader udstyr
 */
function showEquipment(e) {
    e.preventDefault();
    setActiveNav("nav-udstyr");
    createLayout();
    loadActivities();
}

/*
 * showActivities(e)
 * Kaldt fra onclick på "Aktiviteter"-linket i nav (employee.html).
 * Markerer "Aktiviteter" som aktiv i nav og viser aktivitetsstyringssiden.
 *   → showActivityManagement()  defineret i activityManagement.js – overskriver .content
 *                                med placeholder-visningen (funktion ikke implementeret endnu)
 */
function showActivities(e) {
    e.preventDefault();
    setActiveNav("nav-aktiviteter");
    showActivityManagement();
}

/*
 * logout(e)
 * Kaldt fra onclick på "Log ud"-linket i nav (employee.html).
 * Skjuler dashboardet, viser login-skærmen igen og nulstiller loginformularen.
 */
function logout(e) {
    e.preventDefault();
    document.getElementById("dashboard").classList.add("hidden");
    document.getElementById("loginScreen").classList.remove("hidden");
    document.getElementById("loginForm").reset();
}

/*
 * setActiveNav(activeId)
 * Hjælpefunktion kaldt af showEquipment() og showActivities().
 * Fjerner .nav-active fra alle nav-links og sætter den på det valgte element,
 * så den aktive sektion er visuelt markeret i nav-baren.
 */
function setActiveNav(activeId) {
    document.querySelectorAll(".nav-list .nav-item a").forEach(a => {
        a.classList.remove("nav-active");
    });
    const el = document.getElementById(activeId);
    if (el) el.classList.add("nav-active");
}