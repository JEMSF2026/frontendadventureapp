/*
 * equipmentOverview.js – Udstyrsoversigt for medarbejderportalen
 *
 * Viser en tabel over udstyr filtreret på valgt aktivitet.
 * Indholdet renderes ind i .content-divven i employee.html.
 *
 * Funktioner eksponeret globalt (bruges af employee.js):
 *   - createLayout()    → bygger HTML-skelettet (dropdown + tabel) i .content
 *   - loadActivities()  → henter aktiviteter fra backend og fylder dropdown
 *
 * Internt kald-flow:
 *   DOMContentLoaded → createLayout() → loadActivities() → loadEquipment()
 *   Bruger skifter dropdown              → loadEquipment()
 *   Bruger klikker "Udstyr" i nav        → createLayout() + loadActivities() (via employee.js)
 */

const apiBaseUrl = "http://localhost:8080";

/*
 * Kører automatisk når siden er loadet.
 * Sætter udstyrsoversigten op som standard-visning i dashboardet.
 * Bemærk: .content eksisterer i DOM'en selv når #dashboard er skjult,
 * så denne kørsel sker korrekt i baggrunden mens login-skærmen vises.
 */
document.addEventListener("DOMContentLoaded", () => {
    createLayout();
    loadActivities();
});

/*
 * createLayout()
 * Skriver HTML-skelettet for udstyrsoversigten ind i .content.
 * Tilføjer en change-event listener på dropdown, så udstyr opdateres
 * automatisk når brugeren vælger en anden aktivitet.
 * Kaldes også af showEquipment() i employee.js ved nav-skift tilbage til "Udstyr".
 */
function createLayout() {
    const content = document.querySelector(".content");

    content.innerHTML = `
    <h1>Udstyrsoversigt</h1>

    <label for="activityDropdown">Vælg aktivitet:</label>
    <select id="activityDropdown"></select>

    <table id="equipmentTable">
        <thead>
        <tr>
            <th>Navn</th>
            <th>Status</th>
            <th>Beskrivelse</th>
        </tr>
        </thead>
        <tbody></tbody>
    </table>
        `;

    document
        .getElementById("activityDropdown")
        .addEventListener("change", loadEquipment);
}

/*
 * loadActivities()
 * Henter alle aktiviteter fra GET /activities og fylder dropdown-menuen.
 * Vælger automatisk den første aktivitet og kalder loadEquipment()
 * så tabellen ikke er tom ved første visning.
 * Kaldes også af showEquipment() i employee.js ved nav-skift tilbage til "Udstyr".
 */
async function loadActivities() {
    try {
        const response = await fetch(`${apiBaseUrl}/activities`);
        const activities = await response.json();

        const dropdown = document.getElementById("activityDropdown");

        activities.forEach(activity => {
            const option = document.createElement("option");
            option.value = activity.id;
            option.textContent = activity.name;
            dropdown.appendChild(option);
        });

        // Auto-loader første aktivitets udstyr så tabellen ikke er tom ved start
        if (activities.length > 0) {
            dropdown.value = activities[0].id;
            loadEquipment();
        }

    } catch (error) {
        console.error("Error loading activities:", error);
    }
}

/*
 * loadEquipment()
 * Henter udstyr for den valgte aktivitet fra GET /equipment/{activityId}
 * og bygger tabel-rækker i #equipmentTable.
 * Status-farver sættes via CSS-klasser:
 *   "Active"       → status-green  (grøn)
 *   "Reparation"   → status-yellow (gul/orange)
 *   "Out of Order" → status-red    (rød)
 * Kaldes automatisk ved dropdown-skift (event listener sat i createLayout)
 * og ved første load via loadActivities().
 */
async function loadEquipment() {
    const activityId = document.getElementById("activityDropdown").value;
    if (!activityId) return;

    try {
        const response = await fetch(`${apiBaseUrl}/equipment/${activityId}`);
        const equipmentList = await response.json();

        const tableBody = document.querySelector("#equipmentTable tbody");
        tableBody.innerHTML = "";

        equipmentList.forEach(eq => {

            const status = eq.equipmentState ? eq.equipmentState.name : "Ukendt";
            let statusClass = "";

            if (status === "Active") statusClass = "status-green";
            if (status === "Reparation") statusClass = "status-yellow";
            if (status === "Out of Order") statusClass = "status-red";

            const row = document.createElement("tr");

            row.innerHTML = `
        <td>${eq.name}</td>
        <td class="${statusClass}">${status}</td>
        <td>${eq.description ? eq.description : ""}</td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading equipment:", error);
    }
}