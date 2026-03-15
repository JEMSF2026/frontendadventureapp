/*
 * activityManagement.js – Aktivitetsstyring for medarbejderportalen
 *
 * Eksponerer showActivityManagement() globalt.
 * Funktionen kaldes af showActivities() i employee.js
 * når medarbejderen klikker på "Aktiviteter" i nav-baren.
 *
 * Kald-flow:
 *   showActivityManagement() → loadActivityList()
 *   Klik på aktivitet        → showActivityDetails(activity)  → loadTimeslots(activityId)
 *   Klik "Tilføj tidsrum"    → showTimeslotForm(activityId)
 *   Submit tidsrum-formular  → submitTimeslot(e, activityId)  → loadTimeslots(activityId)
 */

/*
 * showActivityManagement()
 * Bygger grundlæggende HTML-skelet med en aktivitetsliste og et detalje-panel.
 * Venstre panel indeholder en "Opret ny aktivitet"-knap øverst og listen nedenunder.
 * Kalder loadActivityList() for at hente og vise alle aktiviteter.
 * Kaldes af showActivities() i employee.js.
 */
function showActivityManagement() {
    const content = document.querySelector(".content");
    content.innerHTML = `
        <div class="activity-management-section">
            <h1>Aktivitetsstyring</h1>
            <div class="activity-management-layout">
                <div class="activity-list-panel">
                    <button class="create-activity-btn" id="showCreateActivityBtn">+ Opret ny aktivitet</button>
                    <h2>Aktiviteter</h2>
                    <ul id="activityList" class="activity-list"></ul>
                </div>
                <div id="activityDetailPanel" class="activity-detail-panel hidden"></div>
            </div>
        </div>
    `;

    document.getElementById("showCreateActivityBtn").addEventListener("click", showCreateActivityForm);
    loadActivityList();
}

/*
 * loadActivityList()
 * Henter alle aktiviteter fra GET /activities og bygger listen i #activityList.
 * Hvert listeelement får en click-handler der kalder showActivityDetails(activity).
 */
async function loadActivityList() {
    const listEl = document.getElementById("activityList");
    try {
        const response = await fetch(`${apiBaseUrl}/activities`);
        const activities = await response.json();

        listEl.innerHTML = "";
        activities.forEach(activity => {
            const li = document.createElement("li");
            li.textContent = activity.name;
            li.classList.add("activity-list-item");
            li.addEventListener("click", () => {
                document.querySelectorAll(".activity-list-item").forEach(el => el.classList.remove("active"));
                document.getElementById("showCreateActivityBtn").classList.remove("active");
                li.classList.add("active");
                showActivityDetails(activity);
            });
            listEl.appendChild(li);
        });
    } catch (error) {
        console.error("Fejl ved hentning af aktiviteter:", error);
        listEl.innerHTML = `<li class="form-error">Kunne ikke hente aktiviteter.</li>`;
    }
}

/*
 * showCreateActivityForm()
 * Viser formularen til at oprette en ny aktivitet i detalje-panelet til højre.
 * Markerer "Opret ny aktivitet"-knappen som aktiv og fjerner markering fra aktivitetslisten.
 * Submit-eventet binder til createActivity(e).
 */
function showCreateActivityForm() {
    document.querySelectorAll(".activity-list-item").forEach(el => el.classList.remove("active"));
    document.getElementById("showCreateActivityBtn").classList.add("active");

    const panel = document.getElementById("activityDetailPanel");
    panel.classList.remove("hidden");
    panel.innerHTML = `
        <div class="activity-detail-card">
            <h2>Opret ny aktivitet</h2>
            <form id="createActivityForm">
                <div class="form-group">
                    <label for="activityName">Navn</label>
                    <input type="text" id="activityName" placeholder="Aktivitetsnavn" required>
                </div>
                <div class="form-group">
                    <label for="activityDescription">Beskrivelse</label>
                    <textarea id="activityDescription" placeholder="Beskriv aktiviteten..." rows="4" required></textarea>
                </div>
                <div class="form-group">
                    <label for="activityPrice">Pris (kr.)</label>
                    <input type="number" id="activityPrice" placeholder="F.eks. 249" min="0" step="0.01" required>
                </div>
                <div class="form-group">
                    <label for="activityMaxParticipants">Maks deltagere</label>
                    <input type="number" id="activityMaxParticipants" placeholder="F.eks. 20" min="1" required>
                </div>
                <div class="form-group">
                    <label for="activityMinimumAge">Minimumsalder (år)</label>
                    <input type="number" id="activityMinimumAge" placeholder="F.eks. 12" min="0" required>
                </div>
                <div id="activityFormError" class="form-error hidden"></div>
                <div id="activityFormSuccess" class="form-success hidden"></div>
                <button type="submit" class="submit-btn">Opret aktivitet</button>
            </form>
        </div>
    `;

    document.getElementById("createActivityForm").addEventListener("submit", createActivity);
}

/*
 * createActivity(e)
 * Kaldes ved submit af #createActivityForm.
 * Sender name og description som JSON til POST /activities.
 *   - 201 Created → viser bekræftelse, nulstiller formularen og genindlæser aktivitetslisten
 *   - Fejl        → viser fejlbesked til brugeren
 */
async function createActivity(e) {
    e.preventDefault();

    const name = document.getElementById("activityName").value.trim();
    const description = document.getElementById("activityDescription").value.trim();
    const price = parseFloat(document.getElementById("activityPrice").value);
    const maxParticipants = parseInt(document.getElementById("activityMaxParticipants").value);
    const minimumAge = parseInt(document.getElementById("activityMinimumAge").value);
    const errorEl = document.getElementById("activityFormError");
    const successEl = document.getElementById("activityFormSuccess");

    errorEl.classList.add("hidden");
    successEl.classList.add("hidden");

    try {
        const response = await fetch(`${apiBaseUrl}/activities`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, description, price, maxParticipants, minimumAge })
        });

        if (response.status === 201) {
            const created = await response.json();
            successEl.textContent = `Aktiviteten "${created.name}" blev oprettet.`;
            successEl.classList.remove("hidden");
            document.getElementById("createActivityForm").reset();
            loadActivityList();
        } else {
            errorEl.textContent = "Noget gik galt. Prøv igen.";
            errorEl.classList.remove("hidden");
        }
    } catch (error) {
        console.error("Fejl ved oprettelse af aktivitet:", error);
        errorEl.textContent = "Kunne ikke oprette forbindelse til serveren.";
        errorEl.classList.remove("hidden");
    }
}

/*
 * showActivityDetails(activity)
 * Viser detaljer for den valgte aktivitet i #activityDetailPanel.
 * Kalder loadTimeslots(activity.id) for at hente eksisterende tidsrum.
 * "Tilføj tidsrum"-knappen kalder showTimeslotForm(activity.id).
 */
function showActivityDetails(activity) {
    const panel = document.getElementById("activityDetailPanel");
    panel.classList.remove("hidden");
    panel.innerHTML = `
        <div class="activity-detail-card">
            <div class="activity-detail-header">
                <h2>${activity.name}</h2>
                <div class="activity-detail-actions">
                    <button class="edit-activity-btn" onclick="showEditActivityForm(${activity.id})">Rediger aktivitet</button>
                    <button class="delete-activity-btn" onclick="deleteActivity(${activity.id}, '${activity.name.replace(/'/g, "\\'")}')">Slet aktivitet</button>
                </div>
            </div>
            <p class="activity-detail-description">${activity.description || ""}</p>
            <div class="activity-detail-meta">
                ${activity.price != null           ? `<span>Pris: ${activity.price} kr.</span>` : ""}
                ${activity.durationMinutes != null  ? `<span>Varighed: ${activity.durationMinutes} min.</span>` : ""}
                ${activity.minimumAge != null       ? `<span>Minimumsalder: ${activity.minimumAge} år</span>` : ""}
                ${activity.maxParticipants != null  ? `<span>Maks deltagere: ${activity.maxParticipants}</span>` : ""}
            </div>

            <h3>Tidsrum</h3>
            <div id="timeslotList"></div>

            <button class="submit-btn add-timeslot-btn" onclick="showTimeslotForm(${activity.id})">
                Tilføj tidsrum
            </button>
            <div id="timeslotFormContainer"></div>
        </div>
    `;

    loadTimeslots(activity.id);
}

/*
 * loadTimeslots(activityId)
 * Henter tidsrum for aktiviteten fra GET /timeslots/{activityId}
 * og viser dem som en liste i #timeslotList.
 * Kaldes ved visning af aktivitetsdetaljer og efter oprettelse af nyt tidsrum.
 */
async function loadTimeslots(activityId) {
    const listEl = document.getElementById("timeslotList");
    listEl.innerHTML = "<p>Henter tidsrum...</p>";

    try {
        const response = await fetch(`${apiBaseUrl}/timeslots/${activityId}`);
        const timeslots = await response.json();

        if (timeslots.length === 0) {
            listEl.innerHTML = `<p class="no-timeslots">Ingen tidsrum oprettet endnu.</p>`;
            return;
        }

        listEl.innerHTML = `
            <table class="timeslot-table">
                <thead>
                    <tr>
                        <th>Dato</th>
                        <th>Start</th>
                        <th>Slut</th>
                    </tr>
                </thead>
                <tbody>
                    ${timeslots.map(ts => `
                        <tr>
                            <td>${ts.dayOfActivity}</td>
                            <td>${formatTime(ts.startTime)}</td>
                            <td>${formatTime(ts.endTime)}</td>
                            <td>
                            <button onclick="deleteTimeslot(${ts.id}, ${activityId})">Slet</button>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        `;
    } catch (error) {
        console.error("Fejl ved hentning af tidsrum:", error);
        listEl.innerHTML = `<p class="form-error">Kunne ikke hente tidsrum.</p>`;
    }
}

/*
 * formatTime(datetimeString)
 * Hjælpefunktion der formaterer en ISO datetime-streng til "HH:MM".
 * Eksempel: "2026-03-20T10:00:00" → "10:00"
 */
function formatTime(datetimeString) {
    if (!datetimeString) return "";
    return datetimeString.substring(11, 16);
}

/*
 * showTimeslotForm(activityId)
 * Indsætter formularen til oprettelse af tidsrum i #timeslotFormContainer.
 * Submit-eventet binder til submitTimeslot(e, activityId).
 */
function showTimeslotForm(activityId) {
    const container = document.getElementById("timeslotFormContainer");
    container.innerHTML = `
        <div class="timeslot-form-card">
            <h3>Nyt tidsrum</h3>
            <form id="addTimeslotForm">
                <div class="form-group">
                    <label for="dayOfActivity">Dato</label>
                    <input type="date" id="dayOfActivity" required>
                </div>
                <div class="form-group">
                    <label for="startTime">Starttidspunkt</label>
                    <input type="datetime-local" id="startTime" required>
                </div>
                <div class="form-group">
                    <label for="endTime">Sluttidspunkt</label>
                    <input type="datetime-local" id="endTime" required>
                </div>
                <div id="timeslotError" class="form-error hidden"></div>
                <div id="timeslotSuccess" class="form-success hidden"></div>
                <button type="submit" class="submit-btn">Gem tidsrum</button>
            </form>
        </div>
    `;

    document.getElementById("addTimeslotForm").addEventListener("submit", (e) => submitTimeslot(e, activityId));
}

/*
 * deleteActivity(activityId, activityName)
 * Sletter aktiviteten permanent via DELETE /activities/delete/{activityId}.
 * Beder brugeren om bekræftelse inden sletning.
 *   - 200 OK → skjuler detalje-panelet og genindlæser aktivitetslisten
 *   - Fejl   → viser alert med fejlbesked
 */
async function deleteActivity(activityId, activityName) {
    if (!confirm(`Er du sikker på, at du vil slette "${activityName}"? Denne handling kan ikke fortrydes.`)) {
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/activities/delete/${activityId}`, {
            method: "DELETE"
        });

        if (response.ok) {
            const panel = document.getElementById("activityDetailPanel");
            panel.classList.add("hidden");
            panel.innerHTML = "";
            document.querySelectorAll(".activity-list-item").forEach(el => el.classList.remove("active"));
            loadActivityList();
        } else if (response.status === 409) {
            const message = await response.text();
            alert(message);
        } else {
            alert("Noget gik galt. Aktiviteten kunne ikke slettes.");
        }
    } catch (error) {
        console.error("Fejl ved sletning af aktivitet:", error);
        alert("Kunne ikke oprette forbindelse til serveren.");
    }
}

/*
 * showEditActivityForm(activityId)
 * Henter aktiviteten fra GET /activities/{activityId} og viser en redigeringsformular
 * i detalje-panelet med de eksisterende værdier forudfyldt.
 * Kaldes ved klik på "Rediger aktivitet"-knappen i showActivityDetails().
 */
async function showEditActivityForm(activityId) {
    try {
        const response = await fetch(`${apiBaseUrl}/activities/${activityId}`);
        const activity = await response.json();

        const panel = document.getElementById("activityDetailPanel");
        panel.classList.remove("hidden");
        panel.innerHTML = `
            <div class="activity-detail-card">
                <h2>Rediger aktivitet</h2>
                <form id="editActivityForm">
                    <div class="form-group">
                        <label for="editActivityName">Navn</label>
                        <input type="text" id="editActivityName" value="${activity.name}" required>
                    </div>
                    <div class="form-group">
                        <label for="editActivityDescription">Beskrivelse</label>
                        <textarea id="editActivityDescription" rows="4" required>${activity.description || ""}</textarea>
                    </div>
                    <div class="form-group">
                        <label for="editActivityPrice">Pris (kr.)</label>
                        <input type="number" id="editActivityPrice" value="${activity.price ?? ""}" min="0" step="0.01" required>
                    </div>
                    <div class="form-group">
                        <label for="editActivityMaxParticipants">Maks deltagere</label>
                        <input type="number" id="editActivityMaxParticipants" value="${activity.maxParticipants ?? ""}" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="editActivityMinimumAge">Minimumsalder (år)</label>
                        <input type="number" id="editActivityMinimumAge" value="${activity.minimumAge ?? ""}" min="0" required>
                    </div>
                    <div id="editActivityFormError" class="form-error hidden"></div>
                    <div id="editActivityFormSuccess" class="form-success hidden"></div>
                    <button type="submit" class="submit-btn">Gem ændringer</button>
                </form>
            </div>
        `;

        document.getElementById("editActivityForm").addEventListener("submit", (e) => updateActivity(e, activityId));
    } catch (error) {
        console.error("Fejl ved hentning af aktivitet:", error);
    }
}

/*
 * updateActivity(e, activityId)
 * Kaldes ved submit af #editActivityForm.
 * Sender opdaterede aktivitetsoplysninger som JSON til PUT /activities/update/{activityId}.
 *   - 200 OK → viser bekræftelse, genindlæser aktivitetslisten og viser de opdaterede detaljer
 *   - Fejl   → viser fejlbesked til brugeren
 */
async function updateActivity(e, activityId) {
    e.preventDefault();

    const name = document.getElementById("editActivityName").value.trim();
    const description = document.getElementById("editActivityDescription").value.trim();
    const price = parseFloat(document.getElementById("editActivityPrice").value);
    const maxParticipants = parseInt(document.getElementById("editActivityMaxParticipants").value);
    const minimumAge = parseInt(document.getElementById("editActivityMinimumAge").value);
    const errorEl = document.getElementById("editActivityFormError");
    const successEl = document.getElementById("editActivityFormSuccess");

    errorEl.classList.add("hidden");
    successEl.classList.add("hidden");

    try {
        const response = await fetch(`${apiBaseUrl}/activities/update/${activityId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, description, price, maxParticipants, minimumAge })
        });

        if (response.ok) {
            const updated = await response.json();
            successEl.textContent = `Aktiviteten "${updated.name}" blev opdateret.`;
            successEl.classList.remove("hidden");
            loadActivityList();
            setTimeout(() => showActivityDetails(updated), 1500);
        } else {
            errorEl.textContent = "Noget gik galt. Prøv igen.";
            errorEl.classList.remove("hidden");
        }
    } catch (error) {
        console.error("Fejl ved opdatering af aktivitet:", error);
        errorEl.textContent = "Kunne ikke oprette forbindelse til serveren.";
        errorEl.classList.remove("hidden");
    }
}

/*
 * submitTimeslot(e, activityId)
 * Kaldes ved submit af #addTimeslotForm.
 * Sender tidsrum-data som JSON til POST /timeslots.
 *   - 201 Created → viser bekræftelse og genindlæser tidsrum-listen
 *   - Fejl        → viser fejlbesked
 */
async function submitTimeslot(e, activityId) {
    e.preventDefault();

    const errorEl = document.getElementById("timeslotError");
    const successEl = document.getElementById("timeslotSuccess");
    errorEl.classList.add("hidden");
    successEl.classList.add("hidden");

    const body = {
        dayOfActivity: document.getElementById("dayOfActivity").value,
        startTime: document.getElementById("startTime").value,
        endTime: document.getElementById("endTime").value,
        participants: 0,
        activity: { id: activityId },
        employee: { id: 1 }
    };

    try {
        const response = await fetch(`${apiBaseUrl}/timeslots`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (response.status === 201) {
            successEl.textContent = "Tidsrummet blev oprettet.";
            successEl.classList.remove("hidden");
            document.getElementById("addTimeslotForm").reset();
            loadTimeslots(activityId);
        } else {
            errorEl.textContent = "Noget gik galt. Prøv igen.";
            errorEl.classList.remove("hidden");
        }
    } catch (error) {
        console.error("Fejl ved oprettelse af tidsrum:", error);
        errorEl.textContent = "Kunne ikke oprette forbindelse til serveren.";
        errorEl.classList.remove("hidden");
    }
}

async function deleteTimeslot(timeslotId, activityId) {

    if (!confirm("Er du sikker på du vil slette timeslottet?")) {
        return;
    }

    try {
        const response = await fetch(`${apiBaseUrl}/timeslot/delete/${timeslotId}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text);
        }


        loadTimeslots(activityId);

    } catch (error) {
        console.error("Error deleting timeslot:", error);
        alert("Fejl ved sletning, fordi timeslottet er reserveret.: " + error.message);
    }
}
