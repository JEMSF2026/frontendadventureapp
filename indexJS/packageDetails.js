export async function renderPackageDetails(id){

    const content = document.querySelector(".content");
    content.innerHTML = "";

    const main = document.createElement("main");

    const section = document.createElement("section");
    section.id = "package-details";

    const response = await fetch(`http://localhost:8080/packages/${id}`);
    const pkg = await response.json();

    const title = document.createElement("h1");
    title.textContent = pkg.packageName;

    const description = document.createElement("p");
    description.textContent = pkg.description;

    const price = document.createElement("h4");
    price.textContent = `Pris: ${pkg.price} DKK`;

    section.appendChild(title);
    section.appendChild(description);
    section.appendChild(price);

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

        main.appendChild(section);
        content.appendChild(main);

    }
}