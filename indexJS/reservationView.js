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

        reservationDiv.appendChild(customerDiv);

        if (reservation.timeslots && reservation.timeslots.length > 0) {
            const timeslotDiv = document.createElement("div");
            timeslotDiv.innerHTML = `<h3>Timeslots</h3>`;

            reservation.timeslots.forEach(ts => {
                const tsElement = document.createElement("p");
                tsElement.innerHTML = `
                Day: ${ts.dayOfActivity},
                Start: ${ts.startTime},
                End: ${ts.endTime},
                Participants: ${ts.participants}
            `;
                timeslotDiv.appendChild(tsElement);
            });
            reservationDiv.appendChild(timeslotDiv);
        }

        const cancelButton = document.createElement("button");
        cancelButton.textContent = "Cancel Reservation";

        // Attach event listener to call backend cancellation endpoint
        cancelButton.addEventListener("click", async () => {

            // Confirmation dialog to avoid accidental cancellation
            const confirmed = confirm("Are you sure you want to cancel this reservation?");
            if (!confirmed) return;

            try {

                // Call backend cancel endpoint using reservation ID
                const response = await fetch(`${backendUrl}/reservation/${reservation.id}/cancel`, {
                    method: "POST"
                });

                if (!response.ok) {
                    throw new Error("Failed to cancel reservation");
                }

                // Update UI after successful cancellation
                container.innerHTML = `
                    <h2>Reservation Cancelled</h2>
                    <p>The reservation with booking number <strong>${reservation.bookingNumber}</strong> has been cancelled.</p>
                `;

            } catch (error) {

                container.innerHTML = `<p>${error.message}</p>`;
            }

        });

        // Add cancel button under reservation info
        reservationDiv.appendChild(cancelButton);

        // ===============================

        container.appendChild(reservationDiv);
        const timeslotSection = card.querySelector(".timeslot-section");

        reservation.timeslots.forEach(ts => {

            const div = document.createElement("div");
            div.classList.add("timeslot-item");

            div.innerHTML = `
            ${ts.activity.name}<br>
            Dag: ${formatDate(ts.dayOfActivity)}<br>
            Tidsrum: ${formatTime(ts.startTime)} - ${formatTime(ts.endTime)}<br>
            Deltagere: ${ts.participants}<br>
            Pris: ${ts.activity.price}
        `;

            timeslotSection.appendChild(div);

        });

        const totalPrice = document.createElement("p");
        totalPrice.innerHTML = `<strong>Samlet pris: ${reservation.price}</strong>`;
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

            const response = await fetch(`${backendUrl}/${bookingNumber}`);

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