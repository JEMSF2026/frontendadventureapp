/**
 * calendarGrid.js
 * Delt hjælpefunktion til at bygge et månedligt kalender-gitter som HTML-streng.
 *
 * Bruges af activityCalendar.js og packageCalendar.js så de ikke gentager
 * den samme grid-bygnings-kode.
 *
 * Eksempel på brug:
 *   const html = buildCalendarGridHTML(5, 2024, (dato) => {
 *       return tilgængeligeDage.includes(dato)
 *           ? { cellClass: "clickable allAvailable", title: "Ledig" }
 *           : { cellClass: "noSlots", title: "Ingen tider" };
 *   });
 */

// Danske månedsnavne (0-indekseret: 0 = Januar, 11 = December)
export const MONTH_NAMES = [
    "Januar","Februar","Marts","April","Maj","Juni",
    "Juli","August","September","Oktober","November","December"
];

/**
 * Bygger en HTML-streng for et månedligt kalender-gitter.
 *
 * @param {number}   month       - Måned, 0-indekseret (0=Januar, 11=December)
 * @param {number}   year        - Årstal, f.eks. 2024
 * @param {function} getCellInfo - Kaldes med en "ÅÅÅÅ-MM-DD" streng for hver dag.
 *                                  Skal returnere { cellClass: string, title: string }
 *                                  som bestemmer cellens farve og hover-tekst.
 * @param {boolean}  [navButtons=true] - Inkludér ◀/▶ navigationsknapper i overskriften
 * @returns {string} Komplet HTML-streng for kalender-div'en
 */
export function buildCalendarGridHTML(month, year, getCellInfo, navButtons = true) {
    const weekdayLetters = ["M","T","O","T","F","L","S"];

    // Mandag-først layout:
    // JS's getDay() giver 0=Søndag. Vi vil have 0=Mandag, 6=Søndag.
    // Konvertering: Søndag (0) → 6, resten −1.
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Overskriften med eller uden navigationsknapper
    const heading = navButtons
        ? `<button id="prevMonth">◀</button> ${MONTH_NAMES[month]} ${year} <button id="nextMonth">▶</button>`
        : `${MONTH_NAMES[month]} ${year}`;

    let html = `
        <div class="calendarContainer">
            <h3>${heading}</h3>
            <table class="calendar">
                <thead>
                    <tr>${weekdayLetters.map(d => `<th>${d}</th>`).join("")}</tr>
                </thead>
                <tbody>
    `;

    let day = 1;
    for (let row = 0; row < 6; row++) {
        if (day > daysInMonth) break; // Alle dage er vist — stop tidligt

        html += "<tr>";
        for (let col = 0; col < 7; col++) {
            const cellIndex = row * 7 + col;

            if (cellIndex < startOffset || day > daysInMonth) {
                // Tom celle: før første dag eller efter måneden slutter
                html += `<td class="empty"></td>`;
            } else {
                const dateStr = toDateKey(year, month + 1, day);
                const { cellClass, title } = getCellInfo(dateStr);
                html += `<td class="${cellClass}" data-date="${dateStr}" title="${title}">${day}</td>`;
                day++;
            }
        }
        html += "</tr>";
    }

    html += `</tbody></table></div>`;
    return html;
}

/**
 * Konverterer år, måned og dag til en "ÅÅÅÅ-MM-DD" datostreng.
 * Bruges til at lave nøgler til dato-opslag.
 *
 * @param {number} year    - Årstal
 * @param {number} month1  - Måned, 1-indekseret (1=Januar, 12=December)
 * @param {number} day     - Dagnummer
 * @returns {string} f.eks. "2024-06-05"
 */
export function toDateKey(year, month1, day) {
    return `${year}-${String(month1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}