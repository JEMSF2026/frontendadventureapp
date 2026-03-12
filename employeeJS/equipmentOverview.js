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
    <div id="tableView">

        <h1>Udstyrsoversigt</h1>

        <label for="activityDropdown">Vælg aktivitet:</label>
        <select id="activityDropdown"></select>

        <button id="addEquipmentBtn">Tilføj udstyr</button>

        <table id="equipmentTable">
            <thead>
            <tr>
                <th>Navn</th>
                <th>Status</th>
                <th>Beskrivelse</th>
                <th>Administrér udstyr</th>
            </tr>
            </thead>
            <tbody></tbody>
        </table>

    </div>

    <div id="formView" class="form-container" style="display:none">

        <h2 id="formTitle">Tilføj nyt udstyr</h2> 

        <label>Navn</label>
        <input type="text" id="equipmentName">

        <label>Aktivitet</label>
        <select id="activitySelect"></select>

        <label>Status</label>
        <select id="stateSelect"></select>

        <label>Beskrivelse</label>
        <input type="text" id="equipmentDescription">

        <div class="button-group">
            <button id="saveEquipmentBtn">Gem</button>
            <button id="cancelBtn">Annuller</button>
        </div>

    </div>
    `;

    document.getElementById("activityDropdown").addEventListener("change", loadEquipment);
    document.getElementById("addEquipmentBtn").addEventListener("click", showForm);
    document.getElementById("saveEquipmentBtn").addEventListener("click", saveEquipment);
    document.getElementById("cancelBtn").addEventListener("click", showTable);
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
        dropdown.innerHTML = "";

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
        const response = await fetch(`${apiBaseUrl}/equipments/${activityId}`);
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
                <td>
                <button onclick="editEquipment(${eq.id})">Redigér</button>
                <button onclick="deleteEquipment(${eq.id})">Slet</button>
                </td>
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading equipment:", error);
    }
}

async function showForm() {
    await loadActivitiesForForm();
    await loadEquipmentStates();

    document.getElementById("equipmentName").value = "";
    document.getElementById("equipmentDescription").value = "";
    document.getElementById("cancelBtn").textContent = "Annuller";
    document.getElementById("saveEquipmentBtn").textContent = "Gem";
    document.getElementById("formTitle").textContent = "Tilføj nyt udstyr";
    document.getElementById("tableView").style.display = "none";
    document.getElementById("formView").style.display = "flex";
}


function showTable() {
    document.getElementById("formView").style.display = "none";
    document.getElementById("tableView").style.display = "block";
}

async function loadActivitiesForForm() {
    const response = await fetch(`${apiBaseUrl}/activities`);
    const activities = await response.json();

    const dropdown = document.getElementById("activitySelect");
    dropdown.innerHTML = "";

    activities.forEach(activity => {
        const option = document.createElement("option");
        option.value = activity.id;
        option.textContent = activity.name;
        dropdown.appendChild(option);
    });
}

async function loadEquipmentStates() {
    const response = await fetch(`${apiBaseUrl}/equipmentStates`);
    const states = await response.json();

    const dropdown = document.getElementById("stateSelect");
    dropdown.innerHTML = "";

    states.forEach(state => {
        const option = document.createElement("option");
        option.value = state.id;
        option.textContent = state.name;
        dropdown.appendChild(option);
    });
}

async function saveEquipment() {
    const name = document.getElementById("equipmentName").value;
    const description = document.getElementById("equipmentDescription").value;
    const activityId = document.getElementById("activitySelect").value;
    const stateId = document.getElementById("stateSelect").value;

    if (!name || !activityId || !stateId) {
        alert("Udfyld alle felter!");
        return;
    }

    const equipment = {
        name,
        description,
        activity: {id: parseInt(activityId)},
        equipmentState: {id: parseInt(stateId)}
    };

    try {
        const response = await fetch(`${apiBaseUrl}/equipment/save`, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(equipment)
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || "Fejl ved gem af udstyr");
        }

        alert("Udstyr gemt!");
        showTable();
        loadEquipment();

    } catch (error) {
        console.error("Error saving equipment:", error);
        alert("Kunne ikke gemme udstyr: " + error.message);
    }
}

async function deleteEquipment(equipmentId) {

    if (!confirm("Er du sikker på du vil slette udstyret?")) {
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/equipment/delete/${equipmentId}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text);
        }

        loadEquipment();

    } catch (error) {
        console.error("Error deleting equipment:", error);
        alert("Fejl ved sletning: " + error.message);
    }
}

async function editEquipment(equipmentId) {
    try {
        // Hent equipment fra backend
        const response = await fetch(`${apiBaseUrl}/equipment/${equipmentId}`);
        const equipment = await response.json();

        await loadActivitiesForForm();
        await loadEquipmentStates();

        // Vis formen
        document.getElementById("tableView").style.display = "none";
        document.getElementById("formView").style.display = "flex";

        // Fyld felter
        document.getElementById("equipmentName").value = equipment.name;
        document.getElementById("equipmentDescription").value = equipment.description;
        document.getElementById("activitySelect").value = equipment.activity.id;
        document.getElementById("stateSelect").value = equipment.equipmentState.id;

        // Skift knap tekst og event
        const saveBtn = document.getElementById("saveEquipmentBtn");
        saveBtn.textContent = "Opdatér";
        const formTitle = document.getElementById("formTitle");
        formTitle.textContent = "Redigér udstyr";

        // Fjern gamle event listeners
        saveBtn.replaceWith(saveBtn.cloneNode(true));
        const newBtn = document.getElementById("saveEquipmentBtn");

        newBtn.addEventListener("click", () => updateEquipment(equipmentId));

    } catch (error) {
        console.error("Error loading equipment for edit:", error);
        alert("Kunne ikke indlæse udstyr til redigering");
    }
}

async function updateEquipment(equipmentId) {
    const name = document.getElementById("equipmentName").value;
    const description = document.getElementById("equipmentDescription").value;
    const activityId = document.getElementById("activitySelect").value;
    const stateId = document.getElementById("stateSelect").value;

    if (!name || !activityId || !stateId) {
        alert("Udfyld alle felter!");
        return;
    }

    const equipment = {
        name,
        description,
        activity: { id: parseInt(activityId) },
        equipmentState: { id: parseInt(stateId) }
    };

    try {
        const response = await fetch(`${apiBaseUrl}/equipment/update/${equipmentId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(equipment)
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || "Fejl ved opdatering af udstyr");
        }

        alert("Udstyr opdateret!");
        showTable();
        loadEquipment();

    } catch (error) {
        console.error("Error updating equipment:", error);
        alert("Kunne ikke opdatere udstyr: " + error.message);
    }
}