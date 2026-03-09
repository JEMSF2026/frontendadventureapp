const content = document.querySelector(".content");

export function renderConfirmation(bookingNumber, customer, cart){

    content.innerHTML = "";

    const main = document.createElement("main");

    const title = document.createElement("h2");
    title.textContent = "Bookingbekræftelse";

    const booking = document.createElement("p");
    booking.innerHTML = "<strong>Bookingnummer: " + bookingNumber + "</strong>"

    const customerInfo = document.createElement("div");

    customerInfo.innerHTML = `
    <p>Fornavn: ${customer.firstName}</p>
    <p>Efternavn: ${customer.lastName}</p>
    <p>Email: ${customer.email}</p>
    <p>Telefon: ${customer.phoneNumber}</p>
    `;

    const activities = document.createElement("div");

    cart.forEach(item => {
        const div = document.createElement("div");

        div.innerHTML = `
        <p><strong>${item.activity}</strong></p>
        <p>Dato: ${item.date}</p>
        <p>Tidsrum: ${item.startTime} - ${item.endTime}</p>
        <p>Pris: ${item.price} DKK</p>
        `;

        activities.appendChild(div);
    });

    main.appendChild(title);
    main.appendChild(booking);
    main.appendChild(customerInfo);
    main.appendChild(activities);

    content.appendChild(main);
}