import { renderPackageBooking } from "./packageBooking.js";

const backendUrl = "http://localhost:8080";

let currentMonth;
let currentYear;
let availableDays = [];

async function loadPackage(packageId){
    const response = await fetch(`${backendUrl}/packages/${packageId}`);
    return await response.json();
}

export async function renderPackageCalendar(packageId){

    const today = new Date();
    currentMonth = today.getMonth();
    currentYear = today.getFullYear();

    const content = document.querySelector(".content");
    content.innerHTML = "";

    const pkg = await loadPackage(packageId);

    await loadAvailableDays(packageId);

    buildPackageCalendar(pkg, packageId, currentMonth, currentYear);
}

async function loadAvailableDays(packageId){

    const response = await fetch(
        `${backendUrl}/packageAvailableDays?packageId=${packageId}&participants=10`
    );

    availableDays = await response.json();
}

function buildPackageCalendar(pkg, packageId, month, year){

    const content = document.querySelector(".content");

    const calendarWrapper = document.createElement("div");
    calendarWrapper.classList.add("calendarWrapper");

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

    for (let i=0;i<6;i++){
        calendarHTML += "<tr>";

        for (let j=0;j<7;j++){

            const cellIndex = i*7+j;

            if(cellIndex < startDay || day > daysInMonth){
                calendarHTML += `<td class="empty"></td>`;
            }
            else{

                const dateString =
                    `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

                let cellClass="reserved";

                if(availableDays.includes(dateString)){
                    cellClass="clickable allAvailable";
                }

                calendarHTML +=
                    `<td class="${cellClass}" data-date="${dateString}">${day}</td>`;

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

    calendarWrapper.querySelectorAll(".clickable").forEach(cell=>{
        cell.addEventListener("click", async ()=>{

            calendarWrapper.querySelectorAll(".selected")
                .forEach(c=>c.classList.remove("selected"));

            cell.classList.add("selected");

            selectedDate = cell.dataset.date;

            const response = await fetch(
                `${backendUrl}/packageTimeRange?packageId=${packageId}&dayOfActivity=${selectedDate}&participants=10`
            );

            const timeRange = await response.text();

            const [start,end] = timeRange.split(" - ");

            const tbody = calendarWrapper.querySelector("#timeTable tbody");

            tbody.innerHTML =
                `<td>${start}</td>
                <td>${end}</td>
            </tr>`;
        });
    });

    const bookBtn = calendarWrapper.querySelector("#addToCartBtn");

    bookBtn.addEventListener("click", ()=>{

        if(!selectedDate){
            alert("Vælg en dato først");
            return;
        }

        localStorage.setItem("packageBooking", JSON.stringify({
            packageId: packageId,
            dayOfActivity: selectedDate
        }));

        renderPackageBooking(packageId, selectedDate);
    });
}