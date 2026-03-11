const apiBaseUrl = "http://localhost:8080";

document.addEventListener("DOMContentLoaded", () => {
    createLayout();
    loadActivities();
});

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

        // Auto-load first activity
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
            `;

            tableBody.appendChild(row);
        });

    } catch (error) {
        console.error("Error loading equipment:", error);
    }
}