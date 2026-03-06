const btn = document.getElementById("aktiviteter-btn");
const dropdown = document.getElementById("activity-dropdown");
const content = document.querySelector(".content");

btn.addEventListener("click", function (e) {
    e.preventDefault();
    if (dropdown.style.display === "block") {
        dropdown.style.display = "none";
    } else {
        dropdown.style.display = "block";
    }
});

fetch("http://localhost:8080/activities")
    .then(response => response.json())
    .then(activities => {
        activities.forEach(activity => {
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.textContent = activity.name;
            a.href = "#";

            a.addEventListener("click", function (e) {
                e.preventDefault();
                dropdown.style.display = "none";
                showActivity(activity.id);
            });

            li.appendChild(a);
            dropdown.appendChild(li);
        });
    })
    .catch(error => console.error("Fejl:", error));

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
