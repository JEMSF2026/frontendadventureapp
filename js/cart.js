import { renderConfirmation } from "./bookingconfirmation.js";

const content = document.querySelector(".content");

function renderCart() {

    content.innerHTML = "";

    const main = document.createElement("main");
    const section = document.createElement("section");
    section.id = "cart-view";

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

    function createInput(labelText, type) {
        const label = document.createElement("label");
        label.textContent = labelText;

        const input = document.createElement("input");
        input.type = type;

        customerBox.appendChild(label);
        customerBox.appendChild(input);
    }

    createInput("Fornavn:", "text");
    createInput("Efternavn:", "text");
    createInput("Email:", "email");
    createInput("Telefonnummer:", "text");
    createInput("Antal deltagere:", "number");

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

    section.appendChild(cartLayout);
    section.appendChild(checkout);

    main.appendChild(section);

    content.appendChild(main);

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
//Åbner indkøbskurv til single page view
function openCart(){
    document.getElementById("cart-view").style.display = "block";

    displayCart();
}
//Viser aktiviteter i indkøbskurven
function displayCart() {
    const cart = getCart();
    const container = document.getElementById("cart-items");
    container.innerHTML = "";

    let totalPrice = 0;

    if (cart.length === 0){
        container.innerHTML = "<p>Din indkøbskurv er tom</p>"
        return;
    }

    cart.forEach(item => {
        const div = document.createElement("div");

        div.className = "cart-item";

        div.innerHTML = `
    <p>Aktivitet: ${item.activity}</p>
    <p>Dato: ${item.date}</p>
    <p>Tidsrum: ${item.startTime} - ${item.endTime}</p>
    <p>Pris: ${item.price} DKK</p>
`;

        container.appendChild(div)

        totalPrice += Number(item.price);
    });

    document.getElementById("total-price").innerText = totalPrice + " DKK";
}

async function bookActivity(){
    const inputs = document.querySelectorAll(".customer-box input");

    const customer = {
        firstName: inputs[0].value,
        lastName: inputs[1].value,
        email: inputs[2].value,
        phoneNumber: inputs[3].value,
    };

    const participants = inputs[4].value;
    const cart = getCart();

    const reservation = {
        customer: customer,
        participants: participants,
        cartItems: cart
    };

    const response = await fetch("http://localhost:8080/reservations", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(reservation)
    });
    
    const data = await response.json();

    renderConfirmation(data.bookingNumber, customer, cart);

    localStorage.removeItem("cart");
}

document.getElementById("cart-icon").addEventListener("click", openCart);

renderCart();