/**
 * map.js
 * Bygger det interaktive SVG-kort over parken og viser det i .content.
 * Hver aktivitetszone er en blob-form der lyser op ved hover og navigerer
 * til aktivitetskalenderen ved klik.
 * Køres kun når ingen activityId er angivet i URL'en.
 */
import { API_BASE_URL } from "./config.js";

// Hardkodede kortzoner — ID'er overskrives af backend-svaret
// så kortet altid afspejler de aktuelle aktivitets-ID'er.
const mapActivities = [
    {
        name: "Paintball",
        id: 1,
        emoji: "🎯",
        path: "M 100,60 C 168,32 252,48 272,112 C 292,174 256,218 194,228 C 132,238 72,206 56,158 C 40,110 44,84 100,60 Z",
        labelX: 164, labelY: 142,
        color: "#5a3e6b", hoverColor: "#9b59b6"
    },
    {
        name: "Go-kart",
        id: 2,
        emoji: "🏎️",
        path: "M 62,298 C 128,268 232,274 254,332 C 276,390 242,440 170,450 C 98,460 38,428 32,382 C 26,336 20,320 62,298 Z",
        labelX: 148, labelY: 370,
        color: "#1a4f6e", hoverColor: "#2980b9"
    },
    {
        name: "Bueskydning",
        id: 3,
        emoji: "🏹",
        path: "M 538,42 C 612,18 704,36 726,102 C 748,168 714,222 648,236 C 582,250 508,218 490,160 C 472,102 470,64 538,42 Z",
        labelX: 608, labelY: 140,
        color: "#7d3c2a", hoverColor: "#e74c3c"
    },
    {
        name: "Adventure Area",
        id: 4,
        emoji: "🌲",
        path: "M 388,272 C 460,238 592,244 648,310 C 704,376 690,452 608,470 C 526,488 396,478 342,422 C 288,366 322,304 388,272 Z",
        labelX: 496, labelY: 368,
        color: "#1e5c38", hoverColor: "#27ae60"
    }
];

// Dekorative træpositioner spredt rundt på kortet (undgår overlap med zoner)
const trees = [
    [308, 148], [322, 192], [296, 170], [340, 230],
    [758, 308], [742, 378], [762, 440],
    [48, 220], [32, 255], [60, 240],
    [420, 498], [460, 505], [380, 510],
    [700, 490], [720, 460],
    [310, 420], [280, 350]
];

function buildMap() {
    const content = document.querySelector(".content");
    const svgNS = "http://www.w3.org/2000/svg";

    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 800 530");
    svg.setAttribute("class", "adventure-map");

    // Definer ét glow-filter per aktivitetszone så hver zone får sin egen farve
    const defs = document.createElementNS(svgNS, "defs");
    mapActivities.forEach((activity, i) => {
        const filter = document.createElementNS(svgNS, "filter");
        filter.setAttribute("id", `glow-${i}`);
        filter.setAttribute("x", "-40%");
        filter.setAttribute("y", "-40%");
        filter.setAttribute("width", "180%");
        filter.setAttribute("height", "180%");

        const feFlood = document.createElementNS(svgNS, "feFlood");
        feFlood.setAttribute("flood-color", activity.hoverColor);
        feFlood.setAttribute("flood-opacity", "0.6");
        feFlood.setAttribute("result", "color");

        const feComposite = document.createElementNS(svgNS, "feComposite");
        feComposite.setAttribute("in", "color");
        feComposite.setAttribute("in2", "SourceGraphic");
        feComposite.setAttribute("operator", "in");
        feComposite.setAttribute("result", "coloredSource");

        const feGaussianBlur = document.createElementNS(svgNS, "feGaussianBlur");
        feGaussianBlur.setAttribute("in", "coloredSource");
        feGaussianBlur.setAttribute("stdDeviation", "10");
        feGaussianBlur.setAttribute("result", "glow");

        const feMerge = document.createElementNS(svgNS, "feMerge");
        // Lag 1: sløret glow; Lag 2: skarpt original oven på
        [
            document.createElementNS(svgNS, "feMergeNode"),
            document.createElementNS(svgNS, "feMergeNode")
        ].forEach((node, j) => {
            node.setAttribute("in", j === 0 ? "glow" : "SourceGraphic");
            feMerge.appendChild(node);
        });

        filter.append(feFlood, feComposite, feGaussianBlur, feMerge);
        defs.appendChild(filter);
    });
    svg.appendChild(defs);

    // Grøn græsbaggrund
    const bg = document.createElementNS(svgNS, "rect");
    bg.setAttribute("width", "800");
    bg.setAttribute("height", "530");
    bg.setAttribute("fill", "#d4edaa");
    bg.setAttribute("rx", "20");
    svg.appendChild(bg);

    // Stiplede stier der forbinder aktivitetszonerne
    const pathData = [
        "M 210,180 Q 280,260 200,300",
        "M 272,140 Q 400,100 490,140",
        "M 250,340 Q 310,340 388,330",
        "M 650,236 Q 660,270 640,310"
    ];
    pathData.forEach(d => {
        const road = document.createElementNS(svgNS, "path");
        road.setAttribute("d", d);
        road.setAttribute("stroke", "#bbb");
        road.setAttribute("stroke-width", "6");
        road.setAttribute("stroke-dasharray", "10,6");
        road.setAttribute("fill", "none");
        road.setAttribute("opacity", "0.7");
        svg.appendChild(road);
    });

    // Dekorative træer
    trees.forEach(([x, y]) => {
        const circle = document.createElementNS(svgNS, "circle");
        circle.setAttribute("cx", x);
        circle.setAttribute("cy", y);
        circle.setAttribute("r", "9");
        circle.setAttribute("fill", "#3a7d44");
        circle.setAttribute("opacity", "0.55");
        svg.appendChild(circle);
    });

    // Aktivitetszoner
    mapActivities.forEach((activity, i) => {
        const g = document.createElementNS(svgNS, "g");
        g.style.cursor = "pointer";

        const blob = document.createElementNS(svgNS, "path");
        blob.setAttribute("d", activity.path);
        blob.setAttribute("fill", activity.color);
        blob.setAttribute("stroke", "rgba(255,255,255,0.5)");
        blob.setAttribute("stroke-width", "2");
        blob.setAttribute("opacity", "0.88");

        const emoji = document.createElementNS(svgNS, "text");
        emoji.setAttribute("x", activity.labelX);
        emoji.setAttribute("y", activity.labelY - 14);
        emoji.setAttribute("text-anchor", "middle");
        emoji.setAttribute("font-size", "22");
        emoji.textContent = activity.emoji;

        const label = document.createElementNS(svgNS, "text");
        label.setAttribute("x", activity.labelX);
        label.setAttribute("y", activity.labelY + 10);
        label.setAttribute("text-anchor", "middle");
        label.setAttribute("fill", "#ffffff");
        label.setAttribute("font-size", "14");
        label.setAttribute("font-weight", "bold");
        label.setAttribute("font-family", "Arial, sans-serif");
        label.setAttribute("letter-spacing", "0.5");
        label.textContent = activity.name;

        g.addEventListener("mouseenter", () => {
            blob.setAttribute("fill", activity.hoverColor);
            blob.setAttribute("filter", `url(#glow-${i})`);
            blob.setAttribute("opacity", "1");
        });

        g.addEventListener("mouseleave", () => {
            blob.setAttribute("fill", activity.color);
            blob.removeAttribute("filter");
            blob.setAttribute("opacity", "0.88");
        });

        g.addEventListener("click", () => {
            window.location.href = "?activityId=" + activity.id;
        });

        g.append(blob, emoji, label);
        svg.appendChild(g);
    });

    // Hjælpetekst nederst på kortet
    const title = document.createElementNS(svgNS, "text");
    title.setAttribute("x", "400");
    title.setAttribute("y", "524");
    title.setAttribute("text-anchor", "middle");
    title.setAttribute("fill", "#555");
    title.setAttribute("font-size", "12");
    title.setAttribute("font-family", "Arial, sans-serif");
    title.textContent = "Klik på en zone for at se aktiviteten";
    svg.appendChild(title);

    content.innerHTML = "";
    content.appendChild(svg);
}

// Tegn kun kortet når ingen specifik aktivitet er valgt via URL
const mapParams = new URLSearchParams(window.location.search);
if (!mapParams.get("activityId")) {
    // Hent de rigtige ID'er fra backend så kortlinkene altid er korrekte
    fetch(`${API_BASE_URL}/activities`)
        .then(response => response.json())
        .then(activities => {
            activities.forEach(backendActivity => {
                const match = mapActivities.find(
                    a => a.name.toLowerCase() === backendActivity.name.toLowerCase()
                );
                if (match) match.id = backendActivity.id;
            });
            buildMap();
        })
        .catch(error => {
            console.error("Kunne ikke hente aktiviteter:", error);
            // Byg kortet med fallback-ID'er hvis backend ikke kan nås
            buildMap();
        });
}
