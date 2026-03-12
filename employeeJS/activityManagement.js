/*
 * activityManagement.js – Aktivitetsstyring for medarbejderportalen (IKKE IMPLEMENTERET ENDNU)
 *
 * Eksponerer showActivityManagement() globalt.
 * Funktionen kaldes af showActivities() i employee.js
 * når medarbejderen klikker på "Aktiviteter" i nav-baren.
 *
 * Fremtidig funktionalitet:
 *   - Tilføje nye aktiviteter
 *   - Redigere eksisterende aktiviteter
 *   - Slette aktiviteter
 *   - Ændre tidsrum for en given aktivitet
 */

/*
 * showActivityManagement()
 * Overskriver .content-divven med en placeholder-visning.
 * Kaldes af showActivities() i employee.js.
 */
function showActivityManagement() {
    const content = document.querySelector(".content");
    content.innerHTML = `
        <div class="placeholder-section">
            <h1>Aktivitetsstyring</h1>
            <p class="placeholder-text">Denne funktion er under udvikling.</p>
            <p class="placeholder-text">Her vil du kunne:</p>
            <ul class="placeholder-list">
                <li>Tilføje nye aktiviteter</li>
                <li>Redigere eksisterende aktiviteter</li>
                <li>Slette aktiviteter</li>
                <li>Ændre tidsrum for en given aktivitet</li>
            </ul>
        </div>
    `;
}