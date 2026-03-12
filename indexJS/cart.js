import { formatDate, formatTime, updateCartCount } from "./utils.js";
import { renderConfirmation } from "./bookingconfirmation.js";

function renderCart() {
    const content = document.querySelector(".content");
    content.innerHTML = "";

    const main = document.createElement("main");
    const section = document.createElement("section");
    section.id = "cart-view";
    section.style.display = "block";

    const cartLayout = document.createElement("div");
    cartLayout.className = "cart-layout";

    const cartBox = document.createElement("div");
    cartBox.className = "cart-box";

    const cartTitle = document.createElement("h3");
    cartTitle.textContent = "Indkøbskurv";

    const cartItems = document.createElement("div");
    cartItems.id = "cart-items";

    const totalPrice = document.createElement("p");
    totalPrice.innerHTML = "<strong>Totalpris: <span id='total-price'>0 DKK</span></strong>";

    cartBox.appendChild(cartTitle);
    cartBox.appendChild(cartItems);
    cartBox.appendChild(totalPrice);

    const customerBox = document.createElement("div");
    customerBox.className = "customer-box";

    const customerTitle = document.createElement("h3");
    customerTitle.textContent = "Kundeinformationer";

    const typeWrapper = document.createElement("div");

    const typeLabel = document.createElement("p");
    typeLabel.textContent = "Kundetype:";

    const radioContainer = document.createElement("div");
    radioContainer.className = "customer-type-options";

    const privateLabel = document.createElement("label");
    const privateRadio = document.createElement("input");
    privateRadio.type = "radio";
    privateRadio.name = "customerType";
    privateRadio.value = "1";
    privateRadio.checked = true;

    privateLabel.appendChild(privateRadio);
    privateLabel.appendChild(document.createTextNode("Privat"));

    const companyLabel = document.createElement("label");
    const companyRadio = document.createElement("input")
    companyRadio.type = "radio";
    companyRadio.name = "customerType";
    companyRadio.value = "2";

    companyLabel.appendChild(companyRadio);
    companyLabel.appendChild(document.createTextNode("Virksomhed"));

    radioContainer.appendChild(privateLabel);
    radioContainer.appendChild(companyLabel);

    typeWrapper.appendChild(typeLabel);
    typeWrapper.appendChild(radioContainer);

    customerBox.appendChild(typeWrapper);

    function createInput(labelText, type, id) {
        const label = document.createElement("label");
        label.textContent = labelText;

        const input = document.createElement("input");
        input.type = type;
        input.id = id;

        customerBox.appendChild(label);
        customerBox.appendChild(input);
    }

    createInput("Fornavn:", "text", "firstName");
    createInput("Efternavn:", "text", "lastName");
    createInput("Email:", "email", "email");
    createInput("Telefonnummer:", "text", "phoneNumber");
    createInput("Antal deltagere:", "number", "participants");
    createInput("Virksomhedsnavn", "text", "companyName");
    createInput("CVR", "number", "cvr");

    customerBox.prepend(customerTitle);
    cartLayout.appendChild(cartBox);
    cartLayout.appendChild(customerBox);

    const checkout = document.createElement("div");
    checkout.className = "checkout";

    const label = document.createElement("label");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(" Accepter betingelser for booking af aktivitet."));

    const button = document.createElement("button");
    button.textContent = "Book aktivitet";

    checkout.appendChild(label);
    checkout.appendChild(button);

    const errorMessage = document.createElement("p");
    errorMessage.id = "form-error";

    checkout.appendChild(errorMessage);

    section.appendChild(cartLayout);
    section.appendChild(checkout);

    main.appendChild(section);

    document.querySelector(".content").appendChild(main);

    displayCart();

    button.addEventListener("click", bookActivity)
}

//henter indkøbskurv fra LocalStorage, returnere tom liste hvis den er tom.
function getCart(){
    const cart = localStorage.getItem("cart");

    if (cart == null){
        return []
    }

    return JSON.parse(cart)
}

function removeActivityFromCart(index){
    const cart = getCart();

    cart.splice(index, 1);

    localStorage.setItem("cart", JSON.stringify(cart));

    displayCart();
    updateCartCount();
}

//Viser aktiviteter i indkøbskurven
function displayCart() {
    const cart = getCart();
    const container = document.getElementById("cart-items");
    container.innerHTML = "";

    let totalPrice = 0;

    if (cart.length === 0){
        container.innerHTML = "<p>Din indkøbskurv er tom</p>"
        document.getElementById("total-price").innerText = "0 DKK";
        return;
    }

    cart.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "cart-item";

        div.innerHTML = `
    <p>Aktivitet: ${item.activity.name}</p>
    <p>Dato: ${formatDate(item.dayOfActivity)}</p>
    <p>Tidsrum: ${formatTime(item.startTime)} - ${formatTime(item.endTime)}</p>
    <p>Pris: ${item.activity.price} DKK</p>
    <button class="remove-btn">Fjern aktivitet</button>
`;

        const removeButton = div.querySelector(".remove-btn");

        removeButton.addEventListener("click", () => {
            removeActivityFromCart(index);
        });

        container.appendChild(div);
        totalPrice += Number(item.activity.price);
    });

    document.getElementById("total-price").innerText = totalPrice + " DKK";
}

document.getElementById("cart-icon").addEventListener("click", (e) => {
    e.preventDefault();
    renderCart();
});

updateCartCount();

async function bookActivity(){
    const type = document.querySelector("input[name='customerType']:checked").value;

    const customer = {
        firstName: document.getElementById("firstName").value,
        lastName: document.getElementById("lastName").value,
        email: document.getElementById("email").value,
        phoneNumber: document.getElementById("phoneNumber").value,
        companyName: document.getElementById("companyName").value || null,
        cvr: document.getElementById("cvr").value ?
        Number(document.getElementById("cvr").value) : null,
        customerType: {id: Number(type)}
    };

    const participants = Number(document.getElementById("participants").value);
    const cart = getCart();

    const error = document.getElementById("form-error");
    error.textContent = "";

    if (!customer.firstName || !customer.lastName || !customer.email || !customer.phoneNumber
    || !participants){
        error.textContent = "Udfyld venligst alle kundeinformationer";

        return;
    }

    if (type === "2"){
        if (!customer.companyName || customer.companyName.trim() === "" ||
            !customer.cvr){
            error.textContent = "CVR og Virksomhedsnavn påkrævet for virksomheder";
            return;
        }
    }

    const checkbox = document.querySelector(".checkout input[type='checkbox']");
    if(!checkbox.checked){
        error.textContent = "Du skal acceptere betingelserne";
        return;
    }

    const reservation = {
        customer: customer,
        timeslots: cart.map(item => ({
            id: item.id,
            activity: {id: item.activity.id},
            dayOfActivity: item.dayOfActivity,
            startTime: item.startTime,
            endTime: item.endTime,
            participants : participants
        }))
    };

    const response = await fetch("http://localhost:8080/reservation", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(reservation)
    });

    if (!response.ok){
        error.textContent = "Bookningen kunne ikke gennemføres. Tjek dine oplsyninger";
        return;
    }

    const data = await response.json();

    console.log(data)

    renderConfirmation(data.bookingNumber, customer, cart, data.dateOfReservation);

    localStorage.removeItem("cart");
    updateCartCount();
}