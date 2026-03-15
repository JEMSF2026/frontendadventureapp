/**
 * packageBookingCalendar.js
 * Viser en datovælger-kalender til booking af en firmapakke.
 * Ledige dage hentes fra backend og vises med grøn farve;
 * alle andre dage vises som utilgængelige.
 */
import { API_BASE_URL } from "./config.js";
import { renderPackageBooking } from "./packageBooking.js";

// Standard deltagerantal til tilgængeligheds- og tidsrum-forespørgsler.
// Backend kræver denne parameter selvom det endelige antal indsamles
// på bookingformularen.
const DEFAULT_PARTICIPANTS = 10;

let currentMonth;
let currentYear;
let availableDays = [];

/** Henter pakkedetaljer via id. */
async function loadPackage(packageId) {
    const response = await fetch(`${API_BASE_URL}/packages/${packageId}`);
    return response.json();
}

/** Indgangspunkt: henter pakke + ledige dage og viser derefter kalenderen. */
export async function renderPackageCalendar(packageId) {
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();

    const content = document.querySelector(".content");
    content.innerHTML = "";

    const pkg = await loadPackage(packageId);
    await loadAvailableDays(packageId);

    buildPackageCalendar(pkg, packageId, currentMonth, currentYear);
}

/** Henter listen over ledige datostrenge ("ÅÅÅÅ-MM-DD") for pakken. */
async function loadAvailableDays(packageId) {
    const response = await fetch(
        `${API_BASE_URL}/packageAvailableDays?packageId=${packageId}&participants=${DEFAULT_PARTICIPANTS}`
    );
    availableDays = await response.json();
}

/** Bygger og viser pakkens kalender og tidsrum-display. */
function buildPackageCalendar(pkg, packageId, month, year) {
    const content = document.querySelector(".content");

    const calendarWrapper = document.createElement("div");
    calendarWrapper.classList.add("calendarWrapper");

    // Infopanel til venstre
    const infoBox = document.createElement("div");
    infoBox.classList.add("infoBox");
    infoBox.innerHTML = `
        <h2>${pkg.packageName}</h2>
        <p>${pkg.description}</p>
        <p>Pris: ${pkg.price} DKK</p>
        <p>Vælg dato for at se tidsrummet</p>
    `;

    const calendarDiv = document.createElement("div");
    calendarDiv.classList.add("calendarAndTimes");

    const monthNames = [
        "Januar","Februar","Marts","April","Maj","Juni",
        "Juli","August","September","Oktober","November","December"
    ];

    // Mandag-først layout
    const firstDay = new Date(year, month, 1);
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let calendarHTML = `
    <div class="calendarContainer">
        <h3>${monthNames[month]} ${year}</h3>
        <table class="calendar">
        <tbody>
    `;

    let day = 1;
    for (let i = 0; i < 6; i++) {
        calendarHTML += "<tr>";
        for (let j = 0; j < 7; j++) {
            const cellIndex = i * 7 + j;
            if (cellIndex < startDay || day > daysInMonth) {
                calendarHTML += `<td class="empty"></td>`;
            } else {
                const dateString = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                // Dage returneret af backend kan bookes; alle andre er reserverede/utilgængelige
                const cellClass = availableDays.includes(dateString) ? "clickable allAvailable" : "reserved";
                calendarHTML += `<td class="${cellClass}" data-date="${dateString}">${day}</td>`;
                day++;
            }
        }
        calendarHTML += "</tr>";
    }

    calendarHTML += `
        </tbody>
        </table>
    </div>

    <div class="timeContainer">
        <h3>Tidspunkter</h3>
        <table id="timeTable">
            <thead>
                <tr><th>Start</th><th>Slut</th></tr>
            </thead>
            <tbody>
                <tr><td colspan="2">Vælg en dag</td></tr>
            </tbody>
        </table>
        <button id="addToCartBtn">Book pakke</button>
    </div>
    `;

    calendarDiv.innerHTML = calendarHTML;
    calendarWrapper.appendChild(infoBox);
    calendarWrapper.appendChild(calendarDiv);
    content.appendChild(calendarWrapper);

    let selectedDate = null;

    calendarWrapper.querySelectorAll(".clickable").forEach(cell => {
        cell.addEventListener("click", async () => {
            // Fjern tidligere markering
            calendarWrapper.querySelectorAll(".selected").forEach(c => c.classList.remove("selected"));
            cell.classList.add("selected");
            selectedDate = cell.dataset.date;

            // Hent og vis tidsrummet for denne dag
            const response = await fetch(
                `${API_BASE_URL}/packageTimeRange?packageId=${packageId}&dayOfActivity=${selectedDate}&participants=${DEFAULT_PARTICIPANTS}`
            );
            const timeRange = await response.text();
            const [start, end] = timeRange.split(" - ");

            // Rettet: inkluderer åbnings-<tr>-tag
            calendarWrapper.querySelector("#timeTable tbody").innerHTML = `
                <tr><td>${start}</td><td>${end}</td></tr>
            `;
        });
    });

    calendarWrapper.querySelector("#addToCartBtn").addEventListener("click", () => {
        if (!selectedDate) {
            alert("Vælg en dato først");
            return;
        }

        // Gem valget så bookingformularen kan hente det hvis nødvendigt
        localStorage.setItem("packageBooking", JSON.stringify({ packageId, dayOfActivity: selectedDate }));
        renderPackageBooking(packageId, selectedDate);
    });
}
