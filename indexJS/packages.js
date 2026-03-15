import { renderPackageDetails } from "./packageDetails.js";

export function renderPackages(){
    const content = document.querySelector(".content");

    content.innerHTML = "";

    const main = document.createElement("main");

    const section = document.createElement("section");
    section.id = "package-view";

    const title = document.createElement("h1");
    title.textContent = "Firmapakker";

    const container = document.createElement("div");
    container.className = "package-container";

    section.appendChild(title);
    section.appendChild(container);
    main.appendChild(section);

    content.appendChild(main);

    loadPackages();
}

async function loadPackages(){

    const container = document.querySelector(".package-container");

    try{

        const response = await fetch("http://localhost:8080/packages");
        const packages = await response.json();

        if (packages.length === 0){
            container.innerHTML = "<p>Ingen firmapakker fundet</p>"
            return;
        }

        packages.forEach(pkg => {

            const div = document.createElement("div");
            div.className = "package-card";

            const name = document.createElement("h3");
            name.textContent = pkg.packageName;

            const description = document.createElement("p");
            description.textContent = pkg.description;

            const price = document.createElement("h4");
            price.textContent = `Pris: ${pkg.price} DKK`;

            const button = document.createElement("button");
            button.textContent = "Læs mere";

            button.addEventListener("click", () => {
                renderPackageDetails(pkg.id);
            });

            div.appendChild(name);
            div.appendChild(description);
            div.appendChild(price);
            div.appendChild(button);

            container.appendChild(div);
        });
    } catch(error){
        console.error("Kunne ikke hente firmapakker", error);
    }
}

document.getElementById("packages-btn").addEventListener("click", () => {
    renderPackages();
});