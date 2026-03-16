/**
 * packageCalendar.js
 * Viser en datovælger-kalender til booking af en firmapakke.
 * Ledige dage hentes fra backend og vises med grøn farve;
 * alle andre dage vises som utilgængelige.
 *
 * Dataflow:
 *   renderPackageCalendar(packageId)
 *     → henter pakke + ledige dage fra backend (parallelt)
 *     → buildPackageCalendar(...)    – tegner kalender-UI'en
 *     → attachPackageListeners(...)  – tilknytter klik-lyttere
 */
import { API_BASE_URL } from "./config.js";
import { buildCalendarGridHTML } from "./calendarGrid.js";
import { renderPackageBooking } from "./packageBooking.js";

// Standard deltagerantal til tilgængeligheds-forespørgsler.
// Det endelige antal opgives af brugeren i bookingformularen.
const DEFAULT_PARTICIPANTS = 10;

let availableDays = []; // Liste over ledige datoer som "ÅÅÅÅ-MM-DD" strenge


// ─────────────────────────────────────────────
//  API-KALD
// ─────────────────────────────────────────────

/** Henter pakkedetaljer for et enkelt pakke-id. */
async function loadPackage(packageId) {
    const response = await fetch(`${API_BASE_URL}/packages/${packageId}`);
    return response.json();
}

/** Henter alle ledige datoer for pakken ("ÅÅÅÅ-MM-DD" strenge). */
async function loadAvailableDays(packageId) {
    const response = await fetch(
        `${API_BASE_URL}/packageAvailableDays?packageId=${packageId}&participants=${DEFAULT_PARTICIPANTS}`
    );
    availableDays = await response.json();
}


// ─────────────────────────────────────────────
//  KALENDER
// ─────────────────────────────────────────────

/**
 * Indgangspunkt: henter data og viser pakkekalenderen.
 * Pakke og ledige dage hentes parallelt for at spare tid.
 * Eksporteres til packageDetails.js.
 */
export async function renderPackageCalendar(packageId) {
    const idag = new Date();
    const month = idag.getMonth();
    const year = idag.getFullYear();

    const content = document.querySelector(".content");
    content.innerHTML = "";

    // Hent pakke og ledige dage på én gang (Promise.all = parallelt)
    const [pkg] = await Promise.all([
        loadPackage(packageId),
        loadAvailableDays(packageId)
    ]);

    buildPackageCalendar(pkg, packageId, month, year);
}

/** Bygger og viser pakkekalenderen i .content. */
function buildPackageCalendar(pkg, packageId, month, year) {
    const content = document.querySelector(".content");

    const wrapper = document.createElement("div");
    wrapper.classList.add("calendarWrapper");

    // Infopanel: pakkenavn, beskrivelse, pris
    const infoBox = document.createElement("div");
    infoBox.classList.add("infoBox");
    infoBox.innerHTML = `
        <h2>${pkg.packageName}</h2>
        <p>${pkg.description}</p>
        <p>Pris: ${pkg.price} DKK</p>
        <p>Vælg dato for at se tidsrummet</p>
    `;

    // Kalender-grid: grøn for ledige dage, grå for utilgængelige
    // navButtons=false: pakkekalenderen har ingen forrige/næste-navigering
    const calendarDiv = document.createElement("div");
    calendarDiv.classList.add("calendarAndTimes");

    calendarDiv.innerHTML = buildCalendarGridHTML(month, year, (datoStr) => {
        const erLedig = availableDays.includes(datoStr);
        return erLedig
            ? { cellClass: "clickable allAvailable", title: "Ledig" }
            : { cellClass: "reserved", title: "Ikke tilgængelig" };
    }, false) + `
        <div class="timeContainer">
            <h3>Tidspunkter</h3>
            <table id="timeTable">
                <thead><tr><th>Start</th><th>Slut</th></tr></thead>
                <tbody><tr><td colspan="2">Vælg en dag</td></tr></tbody>
            </table>
            <button id="addToCartBtn">Book pakke</button>
        </div>
    `;

    wrapper.appendChild(infoBox);
    wrapper.appendChild(calendarDiv);
    content.appendChild(wrapper);

    attachPackageListeners(wrapper, packageId);
}

/**
 * Tilknytter klik-lyttere til pakkekalenderen.
 * Samlet ét sted for overblik.
 */
function attachPackageListeners(wrapper, packageId) {
    let valgtDato = null;

    // Klik på ledig dag → hent tidsrummet fra backend og vis det
    wrapper.querySelectorAll(".clickable").forEach(celle => {
        celle.addEventListener("click", async () => {
            // Fjern markering fra forrige valg
            wrapper.querySelectorAll(".selected").forEach(c => c.classList.remove("selected"));
            celle.classList.add("selected");
            valgtDato = celle.dataset.date;

            // Hent start og sluttid for denne dag fra backend
            const response = await fetch(
                `${API_BASE_URL}/packageTimeRange?packageId=${packageId}&dayOfActivity=${valgtDato}&participants=${DEFAULT_PARTICIPANTS}`
            );
            const timeRange = await response.text();
            const [start, slut] = timeRange.split(" - ");

            wrapper.querySelector("#timeTable tbody").innerHTML = `
                <tr><td>${start}</td><td>${slut}</td></tr>
            `;
        });
    });

    // "Book pakke"-knap → gå videre til bookingformularen
    wrapper.querySelector("#addToCartBtn").addEventListener("click", () => {
        if (!valgtDato) {
            alert("Vælg en dato først");
            return;
        }
        localStorage.setItem("packageBooking", JSON.stringify({ packageId, dayOfActivity: valgtDato }));
        renderPackageBooking(packageId, valgtDato);
    });
}
