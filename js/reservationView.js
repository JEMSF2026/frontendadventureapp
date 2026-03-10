export function renderReservation(reservation, containerId) {

    const content = document.getElementById(".content");
    container.innerHTML = ""; // clear previous content
    const backendUrl = http://localhost:8080;

    const reservationDiv = document.createElement("div");

    reservationDiv.innerHTML = `
        <h2>Reservationer:</h2>
        <p><strong>ID:</strong> ${reservation.id}</p>
        <p><strong>Booking Number:</strong> ${reservation.bookingNumber}</p>
        <p><strong>Date of Reservation:</strong> ${reservation.dateOfReservation}</p>
        <p><strong>Price:</strong> ${reservation.price}</p>
    `;

    const customer = reservation.customer;

    const customerDiv = document.createElement("div");
    customerDiv.innerHTML = `<h3>Customer</h3>`;

    const fields = [
        { label: "First Name", value: customer.firstName },
        { label: "Last Name", value: customer.lastName },
        { label: "Email", value: customer.email },
        { label: "Phone Number", value: customer.phoneNumber },
        { label: "Company Name", value: customer.companyName },
        { label: "CVR", value: customer.cvr }
    ];

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