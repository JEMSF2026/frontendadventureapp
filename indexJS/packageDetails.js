/**
 * packageDetails.js
 * Henter og viser detaljevisningen for én firmapakke.
 */
import { API_BASE_URL } from "./config.js";
import { renderPackages } from "./packages.js";
import { renderPackageCalendar } from "./packageBookingCalendar.js";

/** Henter pakke via id og viser detaljevisningen. */
export async function renderPackageDetails(id) {
    const content = document.querySelector(".content");
    content.innerHTML = "";

    const response = await fetch(`${API_BASE_URL}/packages/${id}`);
    const pkg = await response.json();

    // Afbryd visning hvis pakken ikke har nogen aktiviteter
    if (!pkg.activities || pkg.activities.length === 0) return;

    const main = document.createElement("main");
    const wrapper = document.createElement("div");
    wrapper.className = "package-details-wrapper";

    const section = document.createElement("section");
    section.id = "package-details";

    const backButton = document.createElement("button");
    backButton.className = "back-button";
    backButton.textContent = "← tilbage til firmapakker";
    backButton.addEventListener("click", () => renderPackages());

    const title = document.createElement("h1");
    title.textContent = pkg.packageName;

    const description = document.createElement("p");
    description.textContent = pkg.description;

    section.appendChild(title);
    section.appendChild(description);

    const activityTitle = document.createElement("h3");
    activityTitle.textContent = "Aktiviteter i pakken";
    section.appendChild(activityTitle);

    pkg.activities.forEach(activity => {
        const div = document.createElement("div");
        div.className = "package-activity";
        div.innerHTML = `
            <p><strong>${activity.name}</strong></p>
            <p>${activity.description}</p>
        `;
        section.appendChild(div);
    });

    const priceContainer = document.createElement("div");
    priceContainer.className = "package-price";

    const price = document.createElement("h4");
    price.textContent = `Pris: ${pkg.price} DKK`;

    const bookButton = document.createElement("button");
    bookButton.textContent = "Book pakke";
    bookButton.addEventListener("click", () => renderPackageCalendar(id));

    priceContainer.appendChild(price);
    priceContainer.appendChild(bookButton);
    section.appendChild(priceContainer);

    wrapper.appendChild(backButton);
    wrapper.appendChild(section);
    main.appendChild(wrapper);
    content.appendChild(main);
}
