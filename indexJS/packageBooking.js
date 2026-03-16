/**
 * packageBooking.js
 * Viser bookingformularen for firmapakker og indsender reservationen.
 * Pakkedata hentes én gang og genbruges til både formularvisning og indsendelse,
 * så en unødvendig ekstra hentning undgås når brugeren indsender.
 */
import { API_BASE_URL } from "./config.js";
import { renderPackageConfirmation } from "./confirmation.js";

// Standard deltagerantal til tidsrum-forhåndsvisning (samme som kalendersteget)
const DEFAULT_PARTICIPANTS = 10;

/**
 * Henter pakke og tidsrum, og viser derefter bookingformularen.
 * Det hentede `pkg`-objekt sendes direkte til `bookPackage` ved indsendelse
 * så data ikke behøver at blive hentet igen.
 */
export async function renderPackageBooking(packageId, dayOfActivity) {
    const content = document.querySelector(".content");
    content.innerHTML = "";

    const [pkgResponse, timeResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/packages/${packageId}`),
        fetch(`${API_BASE_URL}/packageTimeRange?packageId=${packageId}&dayOfActivity=${dayOfActivity}&participants=${DEFAULT_PARTICIPANTS}`)
    ]);

    const pkg = await pkgResponse.json();
    const timeRange = await timeResponse.text();

    const activitiesHTML = pkg.activities.map(a => `<p>${a.name}</p>`).join("");

    const main = document.createElement("main");
    const section = document.createElement("section");
    section.id = "package-booking-view";

    const layout = document.createElement("div");
    layout.className = "cart-layout";

    // Venstre kolonne: pakkeoversigt
    const packageBox = document.createElement("div");
    packageBox.className = "cart-box";

    packageBox.innerHTML = `
        <h3>Firmapakke</h3>
        <p>${pkg.packageName}</p>
        <p>Dato: ${dayOfActivity}</p>
        <p>Tidsrum: ${timeRange}</p>
        <div><strong>Aktiviteter:</strong>${activitiesHTML}</div>
        <p><strong>Pris: ${pkg.price} DKK</strong></p>
    `;

    // Højre kolonne: kundeoplysningsformular
    const customerBox = document.createElement("div");
    customerBox.className = "customer-box";

    const customerTitle = document.createElement("h3");
    customerTitle.textContent = "Kundeinformationer";
    customerBox.appendChild(customerTitle);

    /** Tilføjer et labelled inputfelt til customerBox. */
    function createInput(labelText, type, id) {
        const label = document.createElement("div");
        label.textContent = labelText;
        const input = document.createElement("input");
        input.type = type;
        input.id = id;
        customerBox.appendChild(label);
        customerBox.appendChild(input);
    }

    // Pakkebookinger er altid virksomhedsreservationer — ingen privat mulighed
    createInput("Fornavn", "text", "firstName");
    createInput("Efternavn", "text", "lastName");
    createInput("Virksomhedsnavn", "text", "companyName");
    createInput("CVR", "number", "cvr");
    createInput("Email", "email", "email");
    createInput("Telefonnummer", "text", "phoneNumber");
    createInput("Antal deltagere", "number", "participants");

    layout.appendChild(packageBox);
    layout.appendChild(customerBox);

    const checkout = document.createElement("div");
    checkout.className = "checkout";

    const termLabel = document.createElement("label");
    const termsCheckbox = document.createElement("input");
    termsCheckbox.type = "checkbox";
    termsCheckbox.id = "acceptTerms";
    termLabel.appendChild(termsCheckbox);
    termLabel.appendChild(document.createTextNode(" Accepter betingelser for booking af aktivitet."));

    const button = document.createElement("button");
    button.textContent = "Book firmapakke";

    const error = document.createElement("p");
    error.id = "form-error";

    checkout.appendChild(termLabel);
    checkout.appendChild(button);
    checkout.appendChild(error);

    section.appendChild(layout);
    section.appendChild(checkout);
    main.appendChild(section);
    content.appendChild(main);

    // Send den allerede hentede pakke videre for at undgå en ekstra netværksforespørgsel ved indsendelse
    button.addEventListener("click", () => bookPackage(packageId, dayOfActivity, pkg));
}

/**
 * Validerer formularen og sender pakkereservationen.
 * Modtager `pkg` fra `renderPackageBooking` så ingen ny hentning er nødvendig.
 */
async function bookPackage(packageId, dayOfActivity, pkg) {
    const error = document.getElementById("form-error");
    error.textContent = "";

    const customer = {
        firstName: document.getElementById("firstName").value,
        lastName: document.getElementById("lastName").value,
        companyName: document.getElementById("companyName").value,
        cvr: Number(document.getElementById("cvr").value),
        email: document.getElementById("email").value,
        phoneNumber: document.getElementById("phoneNumber").value,
        customerType: { id: 2 } // Pakkebookinger er altid virksomheder (type 2)
    };

    const participants = Number(document.getElementById("participants").value);
    const accepted = document.getElementById("acceptTerms").checked;

    if (!customer.firstName || !customer.lastName || !customer.companyName || !customer.cvr
        || !customer.email || !customer.phoneNumber || !participants) {
        error.textContent = "Udfyld venligst alle oplysningerne.";
        return;
    }

    if (!accepted) {
        error.textContent = "Du skal acceptere betingelserne.";
        return;
    }

    const response = await fetch(
        `${API_BASE_URL}/packageReservation?packageId=${packageId}&dayOfActivity=${dayOfActivity}&participants=${participants}`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(customer)
        }
    );

    if (!response.ok) {
        const text = await response.text();
        console.error(text);
        error.textContent = "Booking mislykkedes";
        return;
    }

    const data = await response.json();
    renderPackageConfirmation(data.bookingNumber, customer, data, pkg.packageName);
}
