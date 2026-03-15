/**
 * equipmentOverview.js
 * Udstyrsoversigt for medarbejderportalen.
 * Viser en filtrerbar tabel over udstyr per aktivitet samt en formular til tilføjelse/redigering.
 *
 * Eksporterer:
 *   createLayout()   — bygger HTML-skelettet i .content
 *   loadActivities() — henter aktiviteter og udfylder filter-dropdown'en
 */
import { apiBaseUrl } from "./config.js";

/**
 * Skriver udstyrsstabel-skelettet og formular-skelettet ind i .content.
 * Bruger event delegation på #tableView så rediger/slet-knapper fungerer
 * uden at kræve globale funktionsreferencer.
 */
export function createLayout() {
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

    // Event delegation — håndterer rediger/slet for alle rækker uden at forurene det globale scope
    document.getElementById("tableView").addEventListener("click", e => {
        const btn = e.target.closest("button[data-action]");
        if (!btn) return;
        const id = Number(btn.dataset.id);
        if (btn.dataset.action === "edit") editEquipment(id);
        if (btn.dataset.action === "delete") deleteEquipment(id);
    });
}

/**
 * Henter alle aktiviteter fra backend og udfylder filter-dropdown'en.
 * Vælger automatisk den første aktivitet og indlæser dens udstyr.
 */
export async function loadActivities() {
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

        // Indlæs den første aktivitets udstyr automatisk så tabellen ikke er tom ved start
        if (activities.length > 0) {
            dropdown.value = activities[0].id;
            loadEquipment();
        }
    } catch (error) {
        console.error("Fejl ved indlæsning af aktiviteter:", error);
    }
}

/**
 * Henter udstyr for den valgte aktivitet og bygger tabelrækker.
 * Status mappes til en CSS-klasse:
 *   "Active"       → status-green  (grøn)
 *   "Reparation"   → status-yellow (gul)
 *   "Out of Order" → status-red    (rød)
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
            const statusClass =
                status === "Active"        ? "status-green"  :
                status === "Reparation"    ? "status-yellow" :
                status === "Out of Order"  ? "status-red"    : "";

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${eq.name}</td>
                <td class="${statusClass}">${status}</td>
                <td>${eq.description ?? ""}</td>
                <td>
                    <button data-action="edit"   data-id="${eq.id}">Redigér</button>
                    <button data-action="delete" data-id="${eq.id}">Slet</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error("Fejl ved indlæsning af udstyr:", error);
    }
}

/** Viser tilføj-udstyr-formularen med tomme felter. */
async function showForm() {
    await loadActivitiesForForm();
    await loadEquipmentStates();

    document.getElementById("equipmentName").value = "";
    document.getElementById("equipmentDescription").value = "";
    document.getElementById("formTitle").textContent = "Tilføj nyt udstyr";
    document.getElementById("saveEquipmentBtn").textContent = "Gem";

    // Gendan standard gem-handler (i tilfælde af at en redigeringssession var aktiv)
    const saveBtn = document.getElementById("saveEquipmentBtn");
    saveBtn.replaceWith(saveBtn.cloneNode(true));
    document.getElementById("saveEquipmentBtn").addEventListener("click", saveEquipment);

    document.getElementById("tableView").style.display = "none";
    document.getElementById("formView").style.display = "flex";
}

/** Skjuler formularen og viser udstyrstabellen. */
function showTable() {
    document.getElementById("formView").style.display = "none";
    document.getElementById("tableView").style.display = "block";
}

/** Udfylder aktivitets-dropdown'en inde i tilføj/rediger-formularen. */
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

/** Henter alle udstyrstilstande (Active, Reparation, Out of Order) ind i status-dropdown'en. */
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

/** Læser formularen og opretter en ny udstyrspost via POST. */
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
        activity: { id: parseInt(activityId) },
        equipmentState: { id: parseInt(stateId) }
    };

    try {
        const response = await fetch(`${apiBaseUrl}/equipment/save`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
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
        console.error("Fejl ved gem af udstyr:", error);
        alert("Kunne ikke gemme udstyr: " + error.message);
    }
}

/** Bekræfter og sletter en udstyrspost via id. */
async function deleteEquipment(equipmentId) {
    if (!confirm("Er du sikker på du vil slette udstyret?")) return;

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
        console.error("Fejl ved sletning af udstyr:", error);
        alert("Fejl ved sletning: " + error.message);
    }
}

/**
 * Henter udstyrsposten via id, udfylder formularen med eksisterende værdier,
 * og kobler gem-knappen til updateEquipment i stedet for saveEquipment.
 * Bruger replaceWith(cloneNode) til at skifte click-lytter rent.
 */
async function editEquipment(equipmentId) {
    try {
        const response = await fetch(`${apiBaseUrl}/equipment/${equipmentId}`);
        const equipment = await response.json();

        await loadActivitiesForForm();
        await loadEquipmentStates();

        document.getElementById("equipmentName").value = equipment.name;
        document.getElementById("equipmentDescription").value = equipment.description;
        document.getElementById("activitySelect").value = equipment.activity.id;
        document.getElementById("stateSelect").value = equipment.equipmentState.id;

        document.getElementById("formTitle").textContent = "Redigér udstyr";

        // Skift gem-handleren så "Gem" kalder opdatering i stedet for oprettelse
        const saveBtn = document.getElementById("saveEquipmentBtn");
        saveBtn.textContent = "Opdatér";
        saveBtn.replaceWith(saveBtn.cloneNode(true));
        document.getElementById("saveEquipmentBtn").addEventListener("click", () => updateEquipment(equipmentId));

        document.getElementById("tableView").style.display = "none";
        document.getElementById("formView").style.display = "flex";
    } catch (error) {
        console.error("Fejl ved indlæsning af udstyr til redigering:", error);
        alert("Kunne ikke indlæse udstyr til redigering");
    }
}

/** Læser formularen og opdaterer udstyrsposten via PUT. */
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
        console.error("Fejl ved opdatering af udstyr:", error);
        alert("Kunne ikke opdatere udstyr: " + error.message);
    }
}
