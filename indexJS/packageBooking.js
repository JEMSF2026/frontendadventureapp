import { renderPackageConfirmation} from "./bookingConfirmation.js";

const backendUrl = "http://localhost:8080";

export async function renderPackageBooking(packageId, dayOfActivity){

    const content = document.querySelector(".content");
    content.innerHTML = "";

    const response = await fetch(`${backendUrl}/packages/${packageId}`);
    const pkg = await response.json();

    const timeResponse = await fetch(`${backendUrl}/packageTimeRange?packageId=${packageId}&dayOfActivity=${dayOfActivity}&participants=10`);

    const timeRange = await timeResponse.text();

    let activitiesHTML = "";

    pkg.activities.forEach(a => {
        activitiesHTML += `<p>${a.name}</p>`;
    });

    const main = document.createElement("main");
    const section = document.createElement("section");
    section.id = "package-booking-view";

    const layout = document.createElement("div");
    layout.className = "cart-layout";

    const packageBox = document.createElement("div");
    packageBox.className = "cart-box";

    const title = document.createElement("h3")
    title.textContent = "Firmapakke";

    const name = document.createElement("p");
    name.textContent = pkg.packageName;

    const date = document.createElement("p");
    date.textContent = "Dato: " + dayOfActivity;

    const time = document.createElement("p");
    time.textContent = "Tidsrum: " + timeRange;

    const activities = document.createElement("div");
    activities.innerHTML = `
    <strong>Aktiviteter:</strong>
    ${activitiesHTML}
    `;

    const price = document.createElement("p");
    price.innerHTML = `<strong>Pris: ${pkg.price} DKK</strong>`;

    packageBox.appendChild(title);
    packageBox.appendChild(name);
    packageBox.appendChild(date);
    packageBox.appendChild(time);
    packageBox.appendChild(activities);
    packageBox.appendChild(price);

    const customerBox = document.createElement("div");
    customerBox.className = "customer-box";

    const customerTitle = document.createElement("h3");
    customerTitle.textContent = "Kundeinformationer";

    customerBox.appendChild(customerTitle);

    function createInput(labelText, type, id){

        const label = document.createElement("div");
        label.textContent = labelText;

        const input = document.createElement("input");
        input.type = type;
        input.id = id;

        customerBox.appendChild(label);
        customerBox.appendChild(input);
    }

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

    const button = document.createElement("button");
    button.textContent = "Book firmapakke";

    const error = document.createElement("p");
    error.id = "form-error";

    const termLabel = document.createElement("label");

    const termsCheckbox = document.createElement("input");
    termsCheckbox.type = "checkbox";
    termsCheckbox.id = "acceptTerms";

    termLabel.appendChild(termsCheckbox);
    termLabel.appendChild(document.createTextNode(" Accepter betingelser for booking af aktivitet."));

    checkout.appendChild(termLabel);
    checkout.appendChild(button);
    checkout.appendChild(error);

    section.appendChild(layout);
    section.appendChild(checkout);

    main.appendChild(section);

    content.appendChild(main);

    button.addEventListener("click", () => bookPackage(packageId, dayOfActivity));
}

async function bookPackage(packageId, dayOfActivity){

    const pkgResponse = await fetch(`${backendUrl}/packages/${packageId}`);
    const pkg = await pkgResponse.json();

    const error = document.getElementById("form-error");
    error.textContent = "";

    const customer = {
        firstName: document.getElementById("firstName").value,
        lastName: document.getElementById("lastName").value,
        companyName: document.getElementById("companyName").value,
        cvr: Number(document.getElementById("cvr").value),
        email: document.getElementById("email").value,
        phoneNumber: document.getElementById("phoneNumber").value,
        customerType: { id: 2 }
    };

    const participants = Number(document.getElementById("participants").value);
    const accepted = document.getElementById("acceptTerms").checked;

    if(!customer.firstName || !customer.lastName || !customer.companyName || !customer.cvr || !customer.email
        || !customer.phoneNumber || !participants){
        error.textContent = "Udfyld venligst alle oplysningerne.";
        return;
    }

    if (!accepted){
        error.textContent = "Du skal acceptere betingelserne.";
        return;
    }

    const response = await fetch(`http://localhost:8080/packageReservation?packageId=${packageId}&dayOfActivity=${dayOfActivity}&participants=${participants}`, {
        method: "POST",
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify(customer)
    });

    if (!response.ok){
        const text = await response.text();
        console.error(text);
        error.textContent = "Booking mislykkedes";
        return;
    }

    const data = await response.json();

    renderPackageConfirmation(data.bookingNumber, customer, data, pkg.packageName);
}