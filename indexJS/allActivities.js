/**
 * allActivities.js
 * Udfylder "Aktiviteter"-dropdown'en i navigationen med data fra backend,
 * og styrer dropdown'ens hover-adfærd.
 */
import { API_BASE_URL } from "./config.js";

const content = document.querySelector(".content");
const btn = document.getElementById("aktiviteter-btn");
const dropdown = document.getElementById("activity-dropdown");
const dropdownParent = btn.closest(".dropdown-parent");

// Vis dropdown når musen bevæger sig ind over forælderelementet
dropdownParent.addEventListener("mouseenter", () => {
    dropdown.style.display = "block";
});

// Skjul dropdown når musen forlader forælderelementet
dropdownParent.addEventListener("mouseleave", () => {
    dropdown.style.display = "none";
});

// Forhindrer siden i at hoppe til toppen når knappen klikkes
btn.addEventListener("click", (e) => e.preventDefault());

// Hent alle aktiviteter og byg dropdown-links
fetch(`${API_BASE_URL}/activities`)
    .then(response => response.json())
    .then(activities => {
        activities.forEach(activity => {
            const li = document.createElement("li");
            const a = document.createElement("a");
            a.textContent = activity.name;
            a.href = "?activityId=" + activity.id;
            li.appendChild(a);
            dropdown.appendChild(li);
        });
    })
    .catch(error => console.error("Fejl ved hentning af aktiviteter:", error));
