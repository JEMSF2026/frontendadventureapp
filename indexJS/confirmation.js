/**
 * confirmation.js
 * Viser bekræftelsesskærmen efter en booking.
 * Eksporterer to funktioner — én til aktivitetsbookinger, én til pakkebookinger.
 *
 * Tidligere hedde denne fil bookingConfirmation.js.
 */
import { formatDate, formatTime } from "./utils.js";

/**
 * Viser bekræftelsesskærmen for en aktivitetsbooking (via kurv).
 * @param {string} bookingNumber      - Bookingens referencenummer
 * @param {object} customer           - Kundeoplysninger
 * @param {Array}  cart               - Liste over bookede tidsrum
 * @param {string} dateOfReservation  - ISO-datostreng for hvornår bookingen blev foretaget
 * @param {number} participants       - Antal deltagere
 */
export function renderConfirmation(bookingNumber, customer, cart, dateOfReservation, participants) {
    const content = document.querySelector(".content");
    content.innerHTML = "";

    const main = document.createElement("main");
    const section = document.createElement("section");
    section.id = "confirmation-view";

    const confirmationBox = document.createElement("div");
    confirmationBox.className = "cart-box";

    const title = document.createElement("h2");
    title.textContent = "Bookingbekræftelse";

    const bookingEl = document.createElement("p");
    bookingEl.innerHTML = `<strong>Bookingnummer: ${bookingNumber}</strong>`;

    const bookingDate = new Date(dateOfReservation);
    const reservationInfo = document.createElement("p");
    reservationInfo.textContent = `Booket: ${formatDate(bookingDate)} kl. ${formatTime(bookingDate)}`;

    // Kundeinfo — virksomhedsfelter vises kun for virksomhedskunder (type 2)
    const customerInfo = document.createElement("div");
    const companyInfo = customer.customerType.id === 2
        ? `<p>Virksomhed: ${customer.companyName}</p><p>CVR: ${customer.cvr}</p>`
        : "";

    customerInfo.innerHTML = `
        <p>Fornavn: ${customer.firstName}</p>
        <p>Efternavn: ${customer.lastName}</p>
        <p>Email: ${customer.email}</p>
        <p>Telefon: ${customer.phoneNumber}</p>
        ${companyInfo}
    `;

    // Liste over bookede aktiviteter med samlet pris
    const aktiviteter = document.createElement("div");
    let totalPris = 0;

    cart.forEach(item => {
        totalPris += Number(item.activity.price);
        const div = document.createElement("div");
        div.className = "cart-item";
        div.innerHTML = `
            <p><strong>${item.activity.name}</strong></p>
            <p>Dato: ${formatDate(item.dayOfActivity)}</p>
            <p>Tidsrum: ${formatTime(item.startTime)} - ${formatTime(item.endTime)}</p>
            <p>Antal deltagere: ${participants}</p>
            <p>Pris: ${item.activity.price} DKK</p>
        `;
        aktiviteter.appendChild(div);
    });

    const total = document.createElement("p");
    total.innerHTML = `<strong>Totalpris: ${totalPris} DKK</strong>`;

    const aktivitetTitle = document.createElement("h3");
    aktivitetTitle.textContent = "Bookede aktiviteter";

    confirmationBox.appendChild(title);
    confirmationBox.appendChild(bookingEl);
    confirmationBox.appendChild(reservationInfo);
    confirmationBox.appendChild(customerInfo);
    confirmationBox.appendChild(aktivitetTitle);
    confirmationBox.appendChild(aktiviteter);
    confirmationBox.appendChild(total);

    section.appendChild(confirmationBox);
    main.appendChild(section);
    content.appendChild(main);
}

/**
 * Viser bekræftelsesskærmen for en pakkebooking.
 * Beregner det samlede tidsvindue ved at gennemgå alle tidsrum i reservationen.
 * @param {string} bookingNumber  - Bookingens referencenummer
 * @param {object} customer       - Kundeoplysninger
 * @param {object} reservation    - Fuldt reservationssvar fra backend
 * @param {string} packageName    - Visningsnavn for den bookede pakke
 */
export function renderPackageConfirmation(bookingNumber, customer, reservation, packageName) {
    const content = document.querySelector(".content");
    content.innerHTML = "";

    const main = document.createElement("main");
    const section = document.createElement("section");
    section.id = "confirmation-view";

    const confirmationBox = document.createElement("div");
    confirmationBox.className = "cart-box";

    const title = document.createElement("h2");
    title.textContent = "Bookingbekræftelse";

    const bookingEl = document.createElement("p");
    bookingEl.innerHTML = `<strong>Bookingnummer: ${bookingNumber}</strong>`;

    const bookingDate = new Date(reservation.dateOfReservation);
    const reservationInfo = document.createElement("p");
    reservationInfo.textContent = `Booket: ${formatDate(bookingDate)} kl. ${formatTime(bookingDate)}`;

    const customerInfo = document.createElement("div");
    customerInfo.innerHTML = `
        <p>Fornavn: ${customer.firstName}</p>
        <p>Efternavn: ${customer.lastName}</p>
        <p>Email: ${customer.email}</p>
        <p>Telefonnummer: ${customer.phoneNumber}</p>
        <p>Virksomhedsnavn: ${customer.companyName}</p>
        <p>CVR: ${customer.cvr}</p>
    `;

    // Beregn det samlede tidsvindue: tidligste start → seneste slut
    const tidsrum = reservation.timeslots;
    const deltagere = tidsrum[0].participants;
    let start = new Date(tidsrum[0].startTime);
    let slut = new Date(tidsrum[0].endTime);
    tidsrum.forEach(t => {
        const s = new Date(t.startTime);
        const e = new Date(t.endTime);
        if (s < start) start = s;
        if (e > slut) slut = e;
    });

    // Saml unikke aktivitetsnavne (en pakke kan have flere tidsrum per aktivitet)
    const aktivitetsNavne = [...new Set(tidsrum.map(t => t.activity.name))];
    const aktiviteterHTML = aktivitetsNavne.map(navn => `<p>${navn}</p>`).join("");

    const packageInfo = document.createElement("div");
    packageInfo.innerHTML = `
        <h3>Bookede aktiviteter</h3>
        <p><strong>Pakke: ${packageName}</strong></p>
        ${aktiviteterHTML}
        <p>Dato: ${formatDate(start)}</p>
        <p>Tidsrum: ${formatTime(start)} - ${formatTime(slut)}</p>
        <p>Antal deltagere: ${deltagere}</p>
        <p><strong>Pris: ${reservation.price} DKK</strong></p>
    `;

    confirmationBox.appendChild(title);
    confirmationBox.appendChild(bookingEl);
    confirmationBox.appendChild(reservationInfo);
    confirmationBox.appendChild(customerInfo);
    confirmationBox.appendChild(packageInfo);

    section.appendChild(confirmationBox);
    main.appendChild(section);
    content.appendChild(main);
}