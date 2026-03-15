/**
 * activityCalenders.js
 * Viser månedsoversigts-kalender og tidsrum-vælger for én aktivitet.
 * Aktiveres når URL'en indeholder ?activityId=<id>.
 */
import { API_BASE_URL } from "./config.js";
import { formatTime, updateCartCount } from "./utils.js";

// Hentes her fordi allActivities.js ikke længere eksponerer den som global
const content = document.querySelector(".content");

let currentMonth;
let currentYear;
let currentActivityId;
let activities = [];
let selectedTimeslot = null;

/** Henter alle aktiviteter og cacher dem så kalenderen kan slå aktivitetsdetaljer op via id. */
async function loadActivities() {
    const response = await fetch(`${API_BASE_URL}/activities`);
    activities = await response.json();
}

/**
 * Henter tidsrum for den givne aktivitet/måned/år og starter kalendervisningen.
 * Filtrerer backend-tidsrummene til den aktuelle månedsoversigt, da backend
 * returnerer alle tidsrum for aktiviteten på én gang.
 */
async function loadTimeslots(activityId, month, year) {
    const response = await fetch(`${API_BASE_URL}/timeslots/${activityId}`);
    let timeslots = await response.json();

    // Behold kun tidsrum der tilhører den aktuelle månedsoversigt
    timeslots = timeslots.filter(t => {
        const d = new Date(t.dayOfActivity);
        return d.getFullYear() === year && d.getMonth() === month;
    });

    const selectedActivity = activities.find(a => a.id === activityId);
    const activityName = selectedActivity ? selectedActivity.name : "Aktivitet";

    buildCalendar(timeslots, month, year, activityId, activityName);
}

/** Bygger og viser den fulde kalender + tidsrum-vælger. */
function buildCalendar(timeslots, month, year, activityId, activityName) {
    selectedTimeslot = null;
    const selectedActivity = activities.find(a => a.id === activityId);

    const monthNames = [
        "Januar","Februar","Marts","April","Maj","Juni",
        "Juli","August","September","Oktober","November","December"
    ];
    const weekdayLetters = ["M","T","O","T","F","L","S"];

    // Mandag-først layout: konverter søndag (0) → 6, mandag (1) → 0, osv.
    const firstDay = new Date(year, month, 1);
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Indekser tidsrum på datostreng ("ÅÅÅÅ-MM-DD") for O(1)-opslag per celle
    const slotsByDate = {};
    timeslots.forEach(t => {
        const d = new Date(t.dayOfActivity);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        if (!slotsByDate[key]) slotsByDate[key] = [];
        slotsByDate[key].push(t);
    });

    // Fjern eventuel tidligere kalender inden der tegnes en ny
    const oldCalendar = content.querySelector(".calendarWrapper");
    if (oldCalendar) oldCalendar.remove();

    const calendarWrapper = document.createElement("div");
    calendarWrapper.classList.add("calendarWrapper");

    // Infopanel: aktivitetsbeskrivelse, begrænsninger, pris
    const infoBox = document.createElement("div");
    infoBox.classList.add("infoBox");
    infoBox.innerHTML = `
        <h2>${selectedActivity.name}</h2>
        <p>${selectedActivity.description || "Ingen beskrivelse"}</p>
        <p>Aldersgrænse: ${selectedActivity.minimumAge}</p>
        <p>Der er plads til ${selectedActivity.maxParticipants} deltagere</p>
        <p>Pris: ${selectedActivity.price} DKK</p>
    `;

    const calendarDiv = document.createElement("div");
    calendarDiv.classList.add("calendarAndTimes");

    // Byg kalendergitteret som en HTML-streng for bedre ydeevne
    let calendarHTML = `
    <div class="calendarContainer">
        <h3>
            <button id="prevMonth">◀</button>
            ${monthNames[month]} ${year}
            <button id="nextMonth">▶</button>
        </h3>
        <table class="calendar">
            <thead>
                <tr>${weekdayLetters.map(d => `<th>${d}</th>`).join("")}</tr>
            </thead>
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
                const slotsForDay = slotsByDate[dateString];

                let cellClass, title;
                if (!slotsForDay || slotsForDay.length === 0) {
                    cellClass = "noSlots";
                    title = "Ingen tider";
                } else {
                    const reservedCount = slotsForDay.filter(t => t.reservation).length;
                    if (reservedCount === 0) {
                        cellClass = "clickable allAvailable";
                        title = "Ledig";
                    } else if (reservedCount === slotsForDay.length) {
                        cellClass = "reserved";
                        title = "Alle tider optaget";
                    } else {
                        cellClass = "clickable partiallyReserved";
                        title = "Nogle tider optaget";
                    }
                }

                calendarHTML += `<td class="${cellClass}" data-date="${dateString}" title="${title}">${day}</td>`;
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
        <button id="addToCartBtn">Tilføj til kurv</button>
    </div>
    `;

    calendarDiv.innerHTML = calendarHTML;
    calendarWrapper.appendChild(infoBox);
    calendarWrapper.appendChild(calendarDiv);
    content.appendChild(calendarWrapper);

    // --- Hændelseslyttere ---

    let selectedCell = null;

    calendarWrapper.querySelectorAll(".clickable").forEach(cell => {
        cell.addEventListener("click", () => {
            const date = cell.dataset.date;

            if (selectedCell) {
                selectedCell.classList.remove("selected", "selectedPartial");
            }
            // Brug forskellig fremhævningsfarve for delvist-reserverede dage
            cell.classList.add(cell.classList.contains("partiallyReserved") ? "selectedPartial" : "selected");
            selectedCell = cell;

            showTimes(slotsByDate[date]);
        });
    });

    calendarWrapper.querySelector("#prevMonth").addEventListener("click", () => {
        let newMonth = month - 1;
        let newYear = year;
        if (newMonth < 0) { newMonth = 11; newYear--; }
        currentMonth = newMonth;
        currentYear = newYear;
        loadTimeslots(currentActivityId, newMonth, newYear);
    });

    calendarWrapper.querySelector("#nextMonth").addEventListener("click", () => {
        let newMonth = month + 1;
        let newYear = year;
        if (newMonth > 11) { newMonth = 0; newYear++; }
        currentMonth = newMonth;
        currentYear = newYear;
        loadTimeslots(currentActivityId, newMonth, newYear);
    });

    calendarWrapper.querySelector("#addToCartBtn").addEventListener("click", addToCart);
}

/** Udfylder tidsrum-tabellen for den valgte kalenderdag. */
function showTimes(timeslots) {
    selectedTimeslot = null;
    const tbody = document.querySelector("#timeTable tbody");

    if (!timeslots || timeslots.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2">Ingen tider</td></tr>`;
        return;
    }

    timeslots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    tbody.innerHTML = timeslots.map(t => {
        if (t.reservation) {
            return `<tr class="timeReserved"><td>${formatTime(t.startTime)}</td><td>${formatTime(t.endTime)}</td></tr>`;
        }
        return `<tr class="timeAvailable clickableTime" data-id="${t.id}"><td>${formatTime(t.startTime)}</td><td>${formatTime(t.endTime)}</td></tr>`;
    }).join("");

    document.querySelectorAll(".clickableTime").forEach(row => {
        row.addEventListener("click", () => {
            document.querySelectorAll(".clickableTime").forEach(r => r.classList.remove("selectedTime"));
            row.classList.add("selectedTime");
            const id = Number(row.dataset.id);
            selectedTimeslot = timeslots.find(t => Number(t.id) === id);
        });
    });
}

/** Tilføjer det valgte tidsrum til localStorage-kurven. */
function addToCart() {
    if (!selectedTimeslot) {
        alert("Du har ikke valgt en tid");
        return;
    }

    let cart = JSON.parse(localStorage.getItem("cart")) || [];
    if (cart.some(item => Number(item.id) === Number(selectedTimeslot.id))) {
        alert("Dette tidspunkt er allerede i kurven");
        return;
    }

    // Gem kun de felter kurven har brug for — undgår at gemme forældet backend-data
    cart.push({
        id: selectedTimeslot.id,
        activity: {
            id: selectedTimeslot.activity.id,
            name: selectedTimeslot.activity.name,
            price: selectedTimeslot.activity.price,
            minimumAge: selectedTimeslot.activity.minimumAge,
            maxParticipants: selectedTimeslot.activity.maxParticipants
        },
        dayOfActivity: selectedTimeslot.dayOfActivity,
        startTime: selectedTimeslot.startTime,
        endTime: selectedTimeslot.endTime
    });

    localStorage.setItem("cart", JSON.stringify(cart));
    updateCartCount();
    alert("Tidspunkt tilføjet til kurv");

    selectedTimeslot = null;
    document.querySelectorAll(".selectedTime").forEach(el => el.classList.remove("selectedTime"));
}

// Initialiser kun når en aktivitet er valgt via URL
const calParams = new URLSearchParams(window.location.search);
const preselectedActivityId = calParams.get("activityId") ? parseInt(calParams.get("activityId")) : null;

if (preselectedActivityId) {
    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();

    loadActivities().then(() => {
        currentActivityId = preselectedActivityId;
        const selectedActivity = activities.find(a => a.id === currentActivityId);

        if (selectedActivity) {
            loadTimeslots(currentActivityId, currentMonth, currentYear);
        } else {
            console.error("Aktivitet ikke fundet:", currentActivityId);
            content.innerHTML = "<p>Aktiviteten kunne ikke findes.</p>";
        }
    });
}
