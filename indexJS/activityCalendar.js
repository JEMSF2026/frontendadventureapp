/**
 * activityCalendar.js
 * Viser en månedsoversigs-kalender og tidsrum-vælger for én aktivitet.
 * Aktiveres kun når URL'en indeholder ?activityId=<id>.
 *
 * Dataflow:
 *   URL-parameter "activityId"
 *     → loadActivities()              – cacher alle aktiviteter fra backend
 *     → loadTimeslots(id, md, år)     – henter og filtrerer tidsrum for måneden
 *     → buildCalendar(tidsrum, ...)   – tegner hele kalender-UI'en:
 *         buildInfoPanel(aktivitet)           – venstre panel: navn, pris, info
 *         buildCalendarAndTimesPanel(...)     – midter/højre: grid + tidsrum-tabel
 *         attachListeners(wrapper, ...)       – tilknytter alle klik-lyttere
 */
import { API_BASE_URL } from "./config.js";
import { formatTime, updateCartCount } from "./utils.js";
import { buildCalendarGridHTML, toDateKey } from "./calendarGrid.js";

const content = document.querySelector(".content");

// --- Tilstand (deles på tværs af funktioner) ---
let currentMonth;
let currentYear;
let currentActivityId;
let activities = [];       // Cache af alle aktiviteter fra backend
let selectedTimeslot = null; // Det tidsrum brugeren har valgt i tidsrum-tabellen


// ─────────────────────────────────────────────
//  API-KALD
// ─────────────────────────────────────────────

/** Henter og cacher alle aktiviteter fra backend. */
async function loadActivities() {
    const response = await fetch(`${API_BASE_URL}/activities`);
    activities = await response.json();
}

/**
 * Henter tidsrum for en aktivitet i én bestemt måned/år og starter kalendervisningen.
 * Backend returnerer alle tidsrum for aktiviteten på én gang,
 * så vi filtrerer dem til den ønskede måned her på klienten.
 */
async function loadTimeslots(activityId, month, year) {
    const response = await fetch(`${API_BASE_URL}/timeslots/${activityId}`);
    const alle = await response.json();

    // Behold kun tidsrum der tilhører den ønskede måned/år
    const tidsrum = alle.filter(t => {
        const d = new Date(t.dayOfActivity);
        return d.getFullYear() === year && d.getMonth() === month;
    });

    buildCalendar(tidsrum, month, year, activityId);
}


// ─────────────────────────────────────────────
//  HJÆLPEFUNKTIONER TIL KALENDER-BYGNING
// ─────────────────────────────────────────────

/**
 * Indekserer tidsrum i et objekt med datostreng som nøgle → O(1) opslag per dag.
 * I stedet for at søge hele listen igennem for hver kalenderdag, kan vi slå op direkte.
 *
 * Eksempel på resultat:
 *   { "2024-06-15": [tidsrum1, tidsrum2], "2024-06-20": [tidsrum3] }
 */
function indexTimeslotsByDate(tidsrum) {
    const map = {};
    tidsrum.forEach(t => {
        const d = new Date(t.dayOfActivity);
        const nøgle = toDateKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
        if (!map[nøgle]) map[nøgle] = [];
        map[nøgle].push(t);
    });
    return map;
}

/**
 * Bestemmer CSS-klasse og tooltip-tekst for en kalenderdag.
 * Returnerer altid { cellClass, title } — bruges som callback til buildCalendarGridHTML().
 *
 *   Alle ledige     → grøn  (allAvailable)
 *   Delvist optaget → orange (partiallyReserved)
 *   Alle optaget    → grå   (reserved)
 *   Ingen tidsrum   → grå   (noSlots)
 */
function getCellStatus(tidsrumForDagen) {
    if (!tidsrumForDagen || tidsrumForDagen.length === 0) {
        return { cellClass: "noSlots", title: "Ingen tider" };
    }

    const reserveretAntal = tidsrumForDagen.filter(t => t.reservation).length;

    if (reserveretAntal === 0) {
        return { cellClass: "clickable allAvailable", title: "Ledig" };
    } else if (reserveretAntal === tidsrumForDagen.length) {
        return { cellClass: "reserved", title: "Alle tider optaget" };
    } else {
        return { cellClass: "clickable partiallyReserved", title: "Nogle tider optaget" };
    }
}

/** Bygger infopanelet (venstre) med aktivitetsbeskrivelse og begrænsninger. */
function buildInfoPanel(aktivitet) {
    const div = document.createElement("div");
    div.classList.add("infoBox");
    div.innerHTML = `
        <h2>${aktivitet.name}</h2>
        <p>${aktivitet.description || "Ingen beskrivelse"}</p>
        <p>Aldersgrænse: ${aktivitet.minimumAge}</p>
        <p>Der er plads til ${aktivitet.maxParticipants} deltagere</p>
        <p>Pris: ${aktivitet.price} DKK</p>
    `;
    return div;
}

/**
 * Bygger midterpanelet: kalender-grid + tidsrum-tabel.
 * Selve grid-HTML'en genereres af buildCalendarGridHTML() fra calendarGrid.js.
 */
function buildCalendarAndTimesPanel(tidsrumPerDato, month, year) {
    const div = document.createElement("div");
    div.classList.add("calendarAndTimes");

    // buildCalendarGridHTML er fra calendarGrid.js — giver os selve gitteret
    const gridHTML = buildCalendarGridHTML(month, year, (datoStr) =>
        getCellStatus(tidsrumPerDato[datoStr])
    );

    div.innerHTML = gridHTML + `
        <div class="timeContainer">
            <h3>Tidspunkter</h3>
            <table id="timeTable">
                <thead><tr><th>Start</th><th>Slut</th></tr></thead>
                <tbody><tr><td colspan="2">Vælg en dag</td></tr></tbody>
            </table>
            <button id="addToCartBtn">Tilføj til kurv</button>
        </div>
    `;

    return div;
}

/**
 * Tilknytter alle klik-lyttere til den renderede kalender.
 * Samlet ét sted så buildCalendar() ikke drukner i lytter-kode.
 */
function attachListeners(wrapper, tidsrumPerDato, month, year, activityId) {
    let valgtCelle = null;

    // Klik på en dag → vis dens tidsrum i tidsrum-tabellen
    wrapper.querySelectorAll(".clickable").forEach(celle => {
        celle.addEventListener("click", () => {
            // Fjern markering fra forrige valgte dag
            if (valgtCelle) {
                valgtCelle.classList.remove("selected", "selectedPartial");
            }
            // Delvist-reserverede dage bruger anderledes fremhævningsfarve
            const fremhævClass = celle.classList.contains("partiallyReserved")
                ? "selectedPartial" : "selected";
            celle.classList.add(fremhævClass);
            valgtCelle = celle;

            showTimes(tidsrumPerDato[celle.dataset.date]);
        });
    });

    // Forrige måned-knap
    wrapper.querySelector("#prevMonth").addEventListener("click", () => {
        let m = month - 1, y = year;
        if (m < 0) { m = 11; y--; }
        currentMonth = m;
        currentYear = y;
        loadTimeslots(currentActivityId, m, y);
    });

    // Næste måned-knap
    wrapper.querySelector("#nextMonth").addEventListener("click", () => {
        let m = month + 1, y = year;
        if (m > 11) { m = 0; y++; }
        currentMonth = m;
        currentYear = y;
        loadTimeslots(currentActivityId, m, y);
    });

    wrapper.querySelector("#addToCartBtn").addEventListener("click", addToCart);
}


// ─────────────────────────────────────────────
//  HOVED-FUNKTION: BYGGING AF KALENDER
// ─────────────────────────────────────────────

/**
 * Bygger og viser den fulde kalender-UI.
 * Opdeler arbejdet i 4 klare trin for at holde funktionen overskuelig.
 */
function buildCalendar(tidsrum, month, year, activityId) {
    selectedTimeslot = null;
    const aktivitet = activities.find(a => a.id === activityId);

    // Trin 1: Indeksér tidsrum for hurtig dato-opslag
    const tidsrumPerDato = indexTimeslotsByDate(tidsrum);

    // Trin 2: Fjern eventuel tidligere kalender
    content.querySelector(".calendarWrapper")?.remove();

    // Trin 3: Byg layout med tre paneler (info | kalender | tidsrum)
    const wrapper = document.createElement("div");
    wrapper.classList.add("calendarWrapper");
    wrapper.appendChild(buildInfoPanel(aktivitet));
    wrapper.appendChild(buildCalendarAndTimesPanel(tidsrumPerDato, month, year));
    content.appendChild(wrapper);

    // Trin 4: Tilknyt alle klik-lyttere
    attachListeners(wrapper, tidsrumPerDato, month, year, activityId);
}


// ─────────────────────────────────────────────
//  TIDSRUM-VISNING
// ─────────────────────────────────────────────

/** Udfylder tidsrum-tabellen for den valgte kalenderdag. */
function showTimes(tidsrum) {
    selectedTimeslot = null;
    const tbody = document.querySelector("#timeTable tbody");

    if (!tidsrum || tidsrum.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2">Ingen tider</td></tr>`;
        return;
    }

    // Sorter kronologisk så tidligste tid vises øverst
    tidsrum.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    tbody.innerHTML = tidsrum.map(t => {
        if (t.reservation) {
            // Reserverede tider vises men kan ikke vælges
            return `<tr class="timeReserved">
                        <td>${formatTime(t.startTime)}</td>
                        <td>${formatTime(t.endTime)}</td>
                    </tr>`;
        }
        return `<tr class="timeAvailable clickableTime" data-id="${t.id}">
                    <td>${formatTime(t.startTime)}</td>
                    <td>${formatTime(t.endTime)}</td>
                </tr>`;
    }).join("");

    // Klik på en ledig tid → gem den som det valgte tidsrum
    document.querySelectorAll(".clickableTime").forEach(række => {
        række.addEventListener("click", () => {
            document.querySelectorAll(".clickableTime").forEach(r => r.classList.remove("selectedTime"));
            række.classList.add("selectedTime");
            const id = Number(række.dataset.id);
            selectedTimeslot = tidsrum.find(t => Number(t.id) === id);
        });
    });
}


// ─────────────────────────────────────────────
//  KURV
// ─────────────────────────────────────────────

/** Tilføjer det valgte tidsrum til kurven i localStorage. */
function addToCart() {
    if (!selectedTimeslot) {
        alert("Du har ikke valgt en tid");
        return;
    }

    let kurv = JSON.parse(localStorage.getItem("cart")) || [];

    // Undgå dubletter — tjek om tidsrummet allerede er i kurven
    if (kurv.some(item => Number(item.id) === Number(selectedTimeslot.id))) {
        alert("Dette tidspunkt er allerede i kurven");
        return;
    }

    // Gem kun de felter kurven har brug for — undgår at gemme unødvendige backend-data
    kurv.push({
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

    localStorage.setItem("cart", JSON.stringify(kurv));
    updateCartCount();
    alert("Tidspunkt tilføjet til kurv");

    // Nulstil valg visuelt
    selectedTimeslot = null;
    document.querySelectorAll(".selectedTime").forEach(el => el.classList.remove("selectedTime"));
}


// ─────────────────────────────────────────────
//  INITIALISERING
// ─────────────────────────────────────────────

// Aktiver kun når en aktivitets-id er angivet i URL'en (?activityId=<id>)
const params = new URLSearchParams(window.location.search);
const forvalgtId = params.get("activityId") ? parseInt(params.get("activityId")) : null;

if (forvalgtId) {
    const idag = new Date();
    currentMonth = idag.getMonth();
    currentYear = idag.getFullYear();

    loadActivities().then(() => {
        currentActivityId = forvalgtId;
        const aktivitet = activities.find(a => a.id === currentActivityId);

        if (aktivitet) {
            loadTimeslots(currentActivityId, currentMonth, currentYear);
        } else {
            console.error("Aktivitet ikke fundet:", currentActivityId);
            content.innerHTML = "<p>Aktiviteten kunne ikke findes.</p>";
        }
    });
}
