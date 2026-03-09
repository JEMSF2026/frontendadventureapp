function renderCart(){
    document.querySelector(".content").innerHTML = `
    <main>

            <section id="cart-view">

                <div class="cart-layout">

                    <div class="cart-box">
                        <h3>Indkøbskurv</h3>

                        <div id="cart-items"></div>

                        <p><strong>Totalpris: <span id="total-price">0 DKK</span></strong></p>
                    </div>

                    <div class="customer-box">
                        <h3>Kundeinformationer</h3>

                        <label>Fornavn:</label>
                        <input type="text">

                        <label>Efternavn:</label>
                        <input type="text">

                        <label>Email:</label>
                        <input type="email">

                        <label>Telefonnummer:</label>
                        <input type="text">

                        <label>Antal deltagere:</label>
                        <input type="number">
                    </div>

                </div>

                <div class="checkout">

                    <label>
                        <input type="checkbox">
                        Accepter betingelser for booking af aktivitet.
                    </label>

                    <button>Book aktivitet</button>

                </div>

            </section>

        </main>
    `;
    displayCart();
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
    <p>Tidsrum: ${item.time}</p>
    <p>Pris: ${item.price} DKK</p>
`;

        container.appendChild(div)

        totalPrice += Number(item.price);
    });

    document.getElementById("total-price").innerText = totalPrice + " DKK";
}

document.getElementById("cart-icon").addEventListener("click", openCart);

renderCart();