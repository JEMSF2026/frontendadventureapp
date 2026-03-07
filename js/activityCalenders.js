const content = document.querySelector(".content");
const backendUrl = "http://localhost:8080";

let currentMonth;
let currentYear;
let currentActivityId;
let activities = [];
let dropdownWrapper;

// Hent og opret dropdown med aktiviteter
async function loadActivities() {
    const response = await fetch(`${backendUrl}/activities`);
    activities = await response.json();

    const dropdown = document.createElement("select");
    dropdown.id = "activitySelect";

    activities.forEach(a => {
        const option = document.createElement("option");
        option.value = a.id;
        option.textContent = a.name;
        dropdown.appendChild(option);
    });

    dropdown.addEventListener("change", () => {
        currentActivityId = parseInt(dropdown.value);
        loadTimeslots(currentActivityId, currentMonth, currentYear);
    });

    if (!dropdownWrapper) {
        dropdownWrapper = document.createElement("div");
        dropdownWrapper.style.marginBottom = "20px";
        dropdownWrapper.textContent = "Vælg aktivitet: ";
        dropdownWrapper.appendChild(dropdown);
        content.appendChild(dropdownWrapper);
    } else {
        dropdownWrapper.innerHTML = "Vælg aktivitet: ";
        dropdownWrapper.appendChild(dropdown);
    }

    currentActivityId = activities[0].id;
}

// Hent timeslots for aktivitet
async function loadTimeslots(activityId, month, year) {
    const response = await fetch(`${backendUrl}/timeslots/${activityId}`);
    let timeslots = await response.json();

    // Filtrer kun timeslots for den valgte måned
    timeslots = timeslots.filter(t => {
        const d = new Date(t.dayOfActivity);
        return d.getFullYear() === year && d.getMonth() === month;
    });

    const selectedActivity = activities.find(a => a.id === currentActivityId);
    const activityName = selectedActivity ? selectedActivity.name : "Aktivitet";

    buildCalendar(timeslots, month, year, activityId, activityName);
}

// Byg kalender
function buildCalendar(timeslots, month, year, activityId, activityName) {
    const monthNames = [
        "Januar","Februar","Marts","April","Maj","Juni",
        "Juli","August","September","Oktober","November","December"
    ];
    const weekdayLetters = ["M","T","O","T","F","L","S"];

    const firstDay = new Date(year, month, 1);
    let startDay = firstDay.getDay();
    startDay = startDay === 0 ? 6 : startDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Gruppér timeslots efter dato
    const slotsByDate = {};
    timeslots.forEach(t => {
        const dateObj = new Date(t.dayOfActivity);
        const dateStr = `${dateObj.getFullYear()}-${String(dateObj.getMonth()+1).padStart(2,"0")}-${String(dateObj.getDate()).padStart(2,"0")}`;
        if (!slotsByDate[dateStr]) slotsByDate[dateStr] = [];
        slotsByDate[dateStr].push(t);
    });

    let calendarHTML = `
    <div>
        <h2>${activityName}</h2>
        <h3>
            <button id="prevMonth">◀</button>
            ${monthNames[month]} ${year}
            <button id="nextMonth">▶</button>
        </h3>
        <table class="calendar">
            <thead>
                <tr>${weekdayLetters.map(d=>`<th>${d}</th>`).join("")}</tr>
            </thead>
            <tbody>
    `;

    let day = 1;
    for (let i = 0; i < 6; i++) {
        calendarHTML += "<tr>";
        for (let j = 0; j < 7; j++) {
            const cellIndex = i * 7 + j;
            if (cellIndex < startDay || day > daysInMonth) {
                // Celler udenfor måneden
                calendarHTML += `<td class="empty"></td>`;
            } else {
                const dateString = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
                const slotsForDay = slotsByDate[dateString];

                let cellClass = "";
                let title = "";

                if(!slotsForDay || slotsForDay.length === 0){
                    cellClass = "noSlots";
                    title = "Ingen tider";
                } else {
                    const reservedCount = slotsForDay.filter(t => t.reservation).length;
                    if(reservedCount === 0){
                        cellClass = "clickable allAvailable";
                        title = "Ledig";
                    } else if(reservedCount === slotsForDay.length){
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

    <div>
        <h3>Tidspunkter</h3>
        <table id="timeTable">
            <thead>
                <tr><th>Start</th><th>Slut</th></tr>
            </thead>
            <tbody>
                <tr><td colspan="2">Vælg en dag</td></tr>
            </tbody>
        </table>
    </div>
    `;

    const oldCalendar = content.querySelector(".calendarWrapper");
    if (oldCalendar) oldCalendar.remove();

    const calendarWrapper = document.createElement("div");
    calendarWrapper.classList.add("calendarWrapper");
    calendarWrapper.innerHTML = calendarHTML;
    content.appendChild(calendarWrapper);

    // Klik-event kun på dage, der kan vælges
    let selectedCell = null;
    calendarWrapper.querySelectorAll(".clickable").forEach(cell => {
        cell.addEventListener("click", () => {
            const date = cell.dataset.date;

            // Fjern tidligere valg
            if (selectedCell) {
                selectedCell.classList.remove("selected");
                selectedCell.classList.remove("selectedPartial");
            }

            // Marker den nye celle
            if (cell.classList.contains("partiallyReserved")) {
                cell.classList.add("selectedPartial");
            } else {
                cell.classList.add("selected");
            }

            selectedCell = cell;
            showTimes(slotsByDate[date]);
        });
    });

    // Måned navigation
    calendarWrapper.querySelector("#prevMonth").addEventListener("click", () => {
        let newMonth = month - 1;
        let newYear = year;
        if (newMonth < 0) { newMonth = 11; newYear--; }
        currentMonth = newMonth; currentYear = newYear;
        loadTimeslots(currentActivityId, newMonth, newYear);
    });

    calendarWrapper.querySelector("#nextMonth").addEventListener("click", () => {
        let newMonth = month + 1;
        let newYear = year;
        if (newMonth > 11) { newMonth = 0; newYear++; }
        currentMonth = newMonth; currentYear = newYear;
        loadTimeslots(currentActivityId, newMonth, newYear);
    });
}

// Formater tid til 00:00
function formatTime(dateTimeString){
    const d = new Date(dateTimeString);
    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

// Vis timeslots i tids tabellen med korrekt farvekodning
function showTimes(timeslots){
    const tbody = document.querySelector("#timeTable tbody");
    if(!timeslots || timeslots.length === 0){
        tbody.innerHTML = `<tr><td colspan="2">Ingen tider</td></tr>`;
        return;
    }

    timeslots.sort((a,b)=> new Date(a.startTime) - new Date(b.startTime));

    tbody.innerHTML = timeslots.map(t => {
        let cls = "timeAvailable"; // grøn
        if(t.reservation){
            cls = "timeReserved"; // rød
        }
        return `
        <tr>
            <td class="${cls}">${formatTime(t.startTime)}</td>
            <td class="${cls}">${formatTime(t.endTime)}</td>
        </tr>
        `;
    }).join("");
}

// Initialiser kalender
const today = new Date();
currentMonth = today.getMonth();
currentYear = today.getFullYear();

loadActivities().then(() => {
    loadTimeslots(currentActivityId, currentMonth, currentYear);
});