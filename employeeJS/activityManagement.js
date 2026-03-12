/*
 * activityManagement.js – Aktivitetsstyring for medarbejderportalen
 *
 * Eksponerer showActivityManagement() globalt.
 * Funktionen kaldes af showActivities() i employee.js
 * når medarbejderen klikker på "Aktiviteter" i nav-baren.
 *
 * Funktionalitet:
 *   - Opret ny aktivitet via POST /activities
 */

/*
 * showActivityManagement()
 * Overskriver .content-divven med en formular til at oprette en ny aktivitet.
 * Kaldes af showActivities() i employee.js.
 */
function showActivityManagement() {
    const content = document.querySelector(".content");
    content.innerHTML = `
        <div class="activity-management-section">
            <h1>Aktivitetsstyring</h1>

            <div class="activity-form-card">
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
                    <div id="activityFormError" class="form-error hidden"></div>
                    <div id="activityFormSuccess" class="form-success hidden"></div>
                    <button type="submit" class="submit-btn">Opret aktivitet</button>
                </form>
            </div>
        </div>
    `;

    document.getElementById("createActivityForm").addEventListener("submit", createActivity);
}

/*
 * createActivity(e)
 * Kaldes ved submit af #createActivityForm.
 * Sender name og description som JSON til POST /activities.
 *   - 201 Created → viser bekræftelse og nulstiller formularen
 *   - Fejl        → viser fejlbesked til brugeren
 */
async function createActivity(e) {
    e.preventDefault();

    const name = document.getElementById("activityName").value.trim();
    const description = document.getElementById("activityDescription").value.trim();
    const errorEl = document.getElementById("activityFormError");
    const successEl = document.getElementById("activityFormSuccess");

    errorEl.classList.add("hidden");
    successEl.classList.add("hidden");

    try {
        const response = await fetch(`${apiBaseUrl}/activities`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, description })
        });

        if (response.status === 201) {
            const created = await response.json();
            successEl.textContent = `Aktiviteten "${created.name}" blev oprettet.`;
            successEl.classList.remove("hidden");
            document.getElementById("createActivityForm").reset();
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