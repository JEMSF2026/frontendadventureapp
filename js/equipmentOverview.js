const apiBaseUrl = "http://localhost:8080";

document.addEventListener("DOMContentLoaded", () => {
    createLayout();
    loadActivities();
});

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

        <h2>Tilføj nyt udstyr</h2>

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

        if (activities.length > 0) {
            dropdown.value = activities[0].id;
            loadEquipment();
        }

    } catch (error) {
        console.error("Error loading activities:", error);
    }
}

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
                <td><button onclick="deleteEquipment(${eq.id})">Slet</button></td>
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