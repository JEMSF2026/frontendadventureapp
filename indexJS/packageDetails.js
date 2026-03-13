import{ renderPackages } from "./packages.js";
import { renderPackageCalendar } from "./bookPackage.js";

export async function renderPackageDetails(id){

    const content = document.querySelector(".content");
    content.innerHTML = "";

    const main = document.createElement("main");

    const wrapper = document.createElement("div");
    wrapper.className = "package-details-wrapper"

    const section = document.createElement("section");
    section.id = "package-details";

    const backButton = document.createElement("button");
    backButton.className = "back-button";
    backButton.textContent = "← tilbage til firmapakker";
    backButton.addEventListener("click", () => {
        renderPackages();
    });

    const response = await fetch(`http://localhost:8080/packages/${id}`);
    const pkg = await response.json();

    const title = document.createElement("h1");
    title.textContent = pkg.packageName;

    const description = document.createElement("p");
    description.textContent = pkg.description;

    section.appendChild(title);
    section.appendChild(description);

    if (pkg.activities && pkg.activities.length > 0){

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

        const button = document.createElement("button");
        button.textContent = "Book pakke";

        button.addEventListener("click", () => {
            renderPackageCalendar(id);
        });

        priceContainer.appendChild(price);
        priceContainer.append(button);

        section.appendChild(priceContainer);

        wrapper.appendChild(backButton);
        wrapper.appendChild(section);

        main.appendChild(wrapper);
        content.appendChild(main);

    }
}