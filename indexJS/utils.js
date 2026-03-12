export function formatTime(dateTimeString) {
    const d = new Date(dateTimeString);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatDate(dateString) {
    const d = new Date(dateString);
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
}

export function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    const counter = document.getElementById("cart-count");

    if(counter){
        counter.textContent = cart.length;
    }
}