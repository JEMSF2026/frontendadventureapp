import { formatDate, formatTime } from "./utils.js";

const backendUrl = "http://localhost:8080";

document.addEventListener("DOMContentLoaded", () => {

    function renderReservation(reservation) {

        const container = document.querySelector(".content");
        container.innerHTML = "";

        const card = document.createElement("div");
        card.classList.add("reservation-card");

        card.innerHTML = `
        <h2>Reservation</h2>

        <div class="reservation-top">

            <div class="customer-info">
                <h3>Kunde</h3><br>
            </div>
            
            <div class="reservation-info">
                <p><strong>Bookingnummer:</strong> ${reservation.bookingNumber}</p>
                <p><strong>Reserveret den:</strong> ${formatDate(reservation.dateOfReservation)} kl: ${formatTime(reservation.dateOfReservation)}</p>
            </div>

           
        </div>

        <div class="timeslot-section">
            <h3>Aktiviteter</h3>
        </div>
    `;

        const customerBox = card.querySelector(".customer-info");

        const fields = [
            {label: "Fornavn", value: reservation.customer.firstName},
            {label: "Efternavn", value: reservation.customer.lastName},
            {label: "Email", value: reservation.customer.email},
            {label: "Mobil", value: reservation.customer.phoneNumber},
            {label: "Firmanavn", value: reservation.customer.companyName},
            {label: "CVR", value: reservation.customer.cvr}
        ];

        fields.forEach(field => {
            if (field.value) {
                const p = document.createElement("p");
                p.innerHTML = `<strong>${field.label}:</strong> ${field.value}`;
                customerBox.appendChild(p);
            }
        });

        const timeslotSection = card.querySelector(".timeslot-section");

        reservation.timeslots.forEach(ts => {

            const div = document.createElement("div");
            div.classList.add("timeslot-item");

            div.innerHTML = `
            ${ts.activity.name}<br>
            Dag: ${formatDate(ts.dayOfActivity)}<br>
            Tidsrum: ${formatTime(ts.startTime)} - ${formatTime(ts.endTime)}<br>
            Deltagere: ${ts.participants}<br>
            Pris: ${ts.activity.price} DKK
        `;

            timeslotSection.appendChild(div);

        });

        const totalPrice = document.createElement("p");
        totalPrice.innerHTML = `<strong>Samlet pris: ${reservation.price} DKK</strong>`;
        timeslotSection.appendChild(totalPrice);

        container.appendChild(card);
    }

//Event Controller


        const button = document.getElementById("reservation-btn");

        button.addEventListener("click", async (e) => {

            e.preventDefault();

            const bookingNumber = prompt("Enter booking number:");

            if (!bookingNumber) return;

            try {

                const response = await fetch(`${backendUrl}/reservation/${bookingNumber}`);

                if (!response.ok) {
                    throw new Error("Reservation not found");
                }

                const reservation = await response.json();

                renderReservation(reservation);

            } catch (error) {

                document.querySelector(".content").innerHTML =
                    `<p>${error.message}</p>`;
            }

        });
    });