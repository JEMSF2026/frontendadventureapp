import { formatDate, formatTime } from "./utils.js";

export function renderConfirmation(bookingNumber, customer, cart, dateOfReservation){

    const content = document.querySelector(".content");

    content.innerHTML = "";

    const main = document.createElement("main");

    const section = document.createElement("section");
    section.id = "confirmation-view";

    const layout = document.createElement("div");
    layout.className = "cart-layout";

    const title = document.createElement("h2");
    title.textContent = "Bookingbekræftelse";

    const booking = document.createElement("p");
    booking.innerHTML = `<strong>Bookingnummer: ${bookingNumber}</strong>`;

    const reservationInfo = document.createElement("p");
    const bookingDate = new Date(dateOfReservation);

    reservationInfo.textContent =
        "Booket: " + formatDate(bookingDate) +
        " kl. " +
        formatTime(bookingDate);

    const customerInfo = document.createElement("div");

    let companyInfo = "";

    if (customer.customerType.id === 2){
        companyInfo = `
            <p>Virksomhed: ${customer.companyName}</p>
            <p>CVR: ${customer.cvr}</p>
        `;
    }

    customerInfo.innerHTML = `
    <p>Fornavn: ${customer.firstName}</p>
    <p>Efternavn: ${customer.lastName}</p>
    <p>Email: ${customer.email}</p>
    <p>Telefon: ${customer.phoneNumber}</p>
    ${companyInfo}
    `;

    const activities = document.createElement("div");

    let totalPrice = 0;

    cart.forEach(item => {

        totalPrice += Number(item.activity.price);

        const div = document.createElement("div");
        div.className = "cart-item";

        div.innerHTML = `
        <p><strong>${item.activity.name}</strong></p>
        <p>Dato: ${formatDate(item.dayOfActivity)}</p>
        <p>Tidsrum: ${formatTime(item.startTime)} - ${formatTime(item.endTime)}</p>
        <p>Pris: ${item.activity.price} DKK</p>
        `;

        activities.appendChild(div);
    });

    const total = document.createElement("p");
    total.innerHTML = `<strong>Totalpris: ${totalPrice} DKK</strong>`;

    const confirmationBox = document.createElement("div");
    confirmationBox.className = "cart-box";

    confirmationBox.appendChild(title);
    confirmationBox.appendChild(booking);
    confirmationBox.appendChild(reservationInfo);
    confirmationBox.appendChild(customerInfo);

    const activityTitle = document.createElement("h3");
    activityTitle.textContent = "Bookede aktiviteter";

    confirmationBox.appendChild(activityTitle);
    confirmationBox.appendChild(activities);
    confirmationBox.appendChild(total);

    main.appendChild(confirmationBox)
    section.appendChild(main)

    content.appendChild(section);
}