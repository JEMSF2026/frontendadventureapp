const backendUrl = "http://localhost:8080";

document.addEventListener("DOMContentLoaded", () => {

    function renderReservation(reservation) {

        const container = document.querySelector(".content");
        container.innerHTML = ""; // clear previous content

        const reservationDiv = document.createElement("div");

        reservationDiv.innerHTML = `
        <h2>Reservation:</h2>
        <p><strong>ID:</strong> ${reservation.id}</p>
        <p><strong>Booking Number:</strong> ${reservation.bookingNumber}</p>
        <p><strong>Date of Reservation:</strong> ${reservation.dateOfReservation}</p>
        <p><strong>Price:</strong> ${reservation.price}</p>
    `;

        const customer = reservation.customer;

        const customerDiv = document.createElement("div");
        customerDiv.innerHTML = `<h3>Customer</h3>`;

        const fields = [
            {label: "First Name", value: customer.firstName},
            {label: "Last Name", value: customer.lastName},
            {label: "Email", value: customer.email},
            {label: "Phone Number", value: customer.phoneNumber},
            {label: "Company Name", value: customer.companyName},
            {label: "CVR", value: customer.cvr}
        ];
        //Performs check on whether fields are empty in the loaded object, and only assigns a paragraph element and appends
        //these to the customer div container, so that they lastly can be shown in a sequential manner.
        fields.forEach(field => {
            if (field.value !== null && field.value !== undefined && field.value !== "" && field.value !== 0) {
                const p = document.createElement("p");
                p.innerHTML = `<strong>${field.label}:</strong> ${field.value}`;
                customerDiv.appendChild(p);
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

        container.appendChild(reservationDiv);
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