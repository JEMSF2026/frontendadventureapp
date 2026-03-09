// Hent referencer til knappen, dropdown-listen og indholdsområdet
const content = document.querySelector(".content");
const btn = document.getElementById("aktiviteter-btn");
const dropdown = document.getElementById("activity-dropdown");


// Hent det overordnede listeelement som både knappen og dropdown'en sidder i
const dropdownParent = btn.closest(".dropdown-parent");

// Vis dropdown når musen bevæger sig ind over parentelementet
dropdownParent.addEventListener("mouseenter", function () {
    dropdown.style.display = "block";
});

// Skjul dropdown når musen forlader parentelementet
dropdownParent.addEventListener("mouseleave", function () {
    dropdown.style.display = "none";
});

// Forhindre at siden hopper til toppen når der klikkes på knappen
btn.addEventListener("click", function (e) {
    e.preventDefault();
});

// Hent alle aktiviteter fra API'et og byg dropdown-listen
fetch("http://localhost:8080/activities")
    .then(response => response.json())
    .then(activities => {
        // Opret et listeelement for hver aktivitet
        activities.forEach(activity => {
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.textContent = activity.name;

            // Sæt linket til aktivitetens egen side baseret på dens id
            a.href = "/activities/" + activity.id;

            li.appendChild(a);
            dropdown.appendChild(li);
        });
    })
    .catch(error => console.error("Fejl:", error));

// Hent og vis detaljer for en enkelt aktivitet baseret på dens id
function showActivity(id) {
    fetch("http://localhost:8080/activities/" + id)
        .then(response => response.json())
        .then(activity => {
            content.innerHTML = `
                <h2>${activity.name}</h2>
                <p>${activity.description}</p>
            `;
        })
        .catch(error => console.error("Fejl:", error));
}
