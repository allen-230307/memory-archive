let memories = [];


// ======================================================
// LOAD MEMORIES
// ======================================================

async function loadMemories() {

    try {

        const response =
            await fetch("data/memories.json?v=4");

        if (!response.ok) {
            throw new Error("Could not load memories.json");
        }

        memories = await response.json();

        updateMemoryCounter();

        renderTimeline();

        renderMemoryPage();

        setupLatestMemory();

    } catch (error) {

        console.error("MEMORY ERROR:", error);

        const timeline =
            document.getElementById("timeline");

        const memoryContent =
            document.getElementById("memoryContent");

        const message = `
            <p class="loading">
                Unable to load memories.
            </p>
        `;

        if (timeline) {
            timeline.innerHTML = message;
        }

        if (memoryContent) {
            memoryContent.innerHTML = message;
        }
    }
}


// ======================================================
// MEMORY COUNTER
// ======================================================

function updateMemoryCounter() {

    const counter =
        document.getElementById("memoryCount");

    if (counter) {

        counter.textContent =
            memories.length;

    }
}


// ======================================================
// MEDIA HELPER
// ======================================================

function getMedia(memory) {

    // New format
    if (Array.isArray(memory.media)) {
        return memory.media;
    }

    // Older image format
    if (Array.isArray(memory.images)) {

        return memory.images.map(src => ({

            type: "image",

            src: src,

            caption: ""

        }));

    }

    return [];
}


// ======================================================
// FIRST IMAGE
// ======================================================

function getFirstImage(memory) {

    const media =
        getMedia(memory);

    const image =
        media.find(
            item => item.type === "image"
        );

    return image
        ? image.src
        : null;
}


// ======================================================
// DATE
// ======================================================

function memoryTime(memory) {

    return new Date(memory.date).getTime();

}


// ======================================================
// RANDOM MEMORY
// ======================================================

function setupRandomMemory() {

    const button =
        document.getElementById("randomMemory");

    if (!button) return;

    button.onclick = function () {

        if (memories.length === 0) return;

        const index =
            Math.floor(
                Math.random() * memories.length
            );

        const selected =
            memories[index];

        window.location.href =
            "memory.html?id=" + selected.id;

    };
}


// ======================================================
// HOME — LATEST MEMORY
// ======================================================

function setupLatestMemory() {

    const image =
        document.getElementById("latestMemoryImage");

    if (!image || memories.length === 0) {
        return;
    }

    const sorted =
        [...memories].sort(
            (a, b) =>
                memoryTime(b) -
                memoryTime(a)
        );

    const latest =
        sorted[0];

    const src =
        getFirstImage(latest);

    if (src) {

        image.src =
            "./" + src;

        image.alt =
            latest.title;

    } else {

        image.removeAttribute("src");

        image.alt =
            "No photograph available";

    }
}


// ======================================================
// OUR STORY — TIMELINE
// ======================================================

function renderTimeline() {

    const timeline =
        document.getElementById("timeline");

    if (!timeline) return;

    timeline.innerHTML = "";

    const sorted =
        [...memories].sort(
            (a, b) =>
                memoryTime(b) -
                memoryTime(a)
        );


    sorted.forEach(memory => {

        const article =
            document.createElement("article");

        article.className =
            "timeline-memory";


        // ------------------------------
        // First photograph
        // ------------------------------

        const imageSrc =
            getFirstImage(memory);

        if (imageSrc) {

            const image =
                document.createElement("img");

            image.className =
                "timeline-image";

            image.src =
                "./" + imageSrc;

            image.alt =
                memory.title;

            image.loading =
                "lazy";

            article.appendChild(image);

        }


        // ------------------------------
        // Date
        // ------------------------------

        const date =
            document.createElement("p");

        date.className =
            "timeline-date";

        date.textContent =
            memory.date;


        // ------------------------------
        // Title
        // ------------------------------

        const title =
            document.createElement("h2");

        title.textContent =
            memory.title;


        // ------------------------------
        // Location
        // ------------------------------

        const location =
            document.createElement("p");
// ======================================================
// HOME — LATEST MEMORY
// ======================================================

function setupLatestMemory() {

    const section =
        document.querySelector(".latest-memory");

    if (!section || memories.length === 0) {
        return;
    }

    const image =
        document.getElementById("latestMemoryImage");

    const title =
        section.querySelector(".memory-information h2");

    const date =
        section.querySelector(".memory-information .memory-date");

    const location =
        section.querySelector(".memory-information .memory-location");

    const excerpt =
        section.querySelector(".memory-information .memory-excerpt");

    const openLink =
        section.querySelector(".read-memory");


    // --------------------------------------------------
    // Find latest memory
    // --------------------------------------------------

    const sorted =
        [...memories].sort(
            (a, b) =>
                memoryTime(b) -
                memoryTime(a)
        );

    const latest =
        sorted[0];


    // --------------------------------------------------
    // Update text
    // --------------------------------------------------

    if (date) {
        date.textContent =
            latest.date;
    }

    if (title) {
        title.textContent =
            latest.title;
    }

    if (location) {
        location.textContent =
            latest.location;
    }

    if (excerpt) {
        excerpt.textContent =
            latest.description;
    }


    // --------------------------------------------------
    // Open memory link
    // --------------------------------------------------

    if (openLink) {

        openLink.href =
            "memory.html?id=" +
            latest.id;

    }


    // --------------------------------------------------
    // Handle photograph
    // --------------------------------------------------

    const src =
        getFirstImage(latest);


    if (src) {

        // A photograph exists

        if (image) {

            image.src =
                "./" + src;

            image.alt =
                latest.title;

            image.style.display =
                "block";

        }

    } else {

        // ------------------------------------------------
        // No photograph
        // ------------------------------------------------

        if (image) {

            image.removeAttribute("src");

            image.alt = "";

            image.style.display =
                "none";

        }


        const imageContainer =
            section.querySelector(".memory-image");


        if (imageContainer) {

            imageContainer.innerHTML = `

                <div class="memory-no-photo">

                    <span class="memory-no-photo-mark">
                        —
                    </span>

                    <p>
                        A memory kept in words.
                    </p>

                </div>

            `;

        }

    }

}


// ======================================================
// INDIVIDUAL MEMORY PAGE
// ======================================================

function renderMemoryPage() {

    const container =
        document.getElementById("memoryContent");

    if (!container) return;


    // ------------------------------
    // Get memory ID
    // ------------------------------

    const params =
        new URLSearchParams(
            window.location.search
        );

    const id =
        params.get("id");

    if (!id) {

        container.innerHTML = `
            <p class="loading">
                Memory not selected.
            </p>
        `;

        return;
    }


    // ------------------------------
    // Find memory
    // ------------------------------

    const memory =
        memories.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!memory) {

        container.innerHTML = `
            <p class="loading">
                Memory not found.
            </p>
        `;

        return;
    }


    // ------------------------------
    // Build media
    // ------------------------------

    let mediaHTML = "";


    getMedia(memory).forEach(item => {


        // IMAGE
        if (item.type === "image") {

            mediaHTML += `

                <figure class="memory-photo">

                    <img
                        src="./${item.src}"
                        alt="${item.caption || memory.title}"
                        loading="lazy"
                    >

                    ${
                        item.caption
                        ? `
                            <figcaption>
                                ${item.caption}
                            </figcaption>
                          `
                        : ""
                    }

                </figure>

            `;
        }


        // VIDEO
        if (item.type === "video") {

            mediaHTML += `

                <figure class="memory-video">

                    <video
                        controls
                        preload="metadata"
                    >

                        <source
                            src="./${item.src}"
                        >

                        Your browser does not support
                        video playback.

                    </video>

                    ${
                        item.caption
                        ? `
                            <figcaption>
                                ${item.caption}
                            </figcaption>
                          `
                        : ""
                    }

                </figure>

            `;
        }

    });


    // ------------------------------
    // Build memory page
    // ------------------------------

    container.innerHTML = `

        <p class="memory-date">
            ${memory.date}
        </p>


        <h1>
            ${memory.title}
        </h1>


        <p class="memory-location">
            ${memory.location}
        </p>


        ${
            mediaHTML
            ? `
                <div class="memory-media">
                    ${mediaHTML}
                </div>
              `
            : ""
        }


        <div class="memory-story">

            ${memory.description || ""}

        </div>

    `;


    // ------------------------------
    // Previous / Next
    // ------------------------------

    setupMemoryNavigation(memory);

}


// ======================================================
// PREVIOUS / NEXT MEMORY
// ======================================================

function setupMemoryNavigation(currentMemory) {

    const previous =
        document.getElementById(
            "previousMemory"
        );

    const next =
        document.getElementById(
            "nextMemory"
        );

    if (!previous || !next) {
        return;
    }


    const sorted =
        [...memories].sort(
            (a, b) =>
                memoryTime(a) -
                memoryTime(b)
        );


    const index =
        sorted.findIndex(
            memory =>
                String(memory.id) ===
                String(currentMemory.id)
        );


    // Previous

    if (index > 0) {

        previous.href =
            "memory.html?id=" +
            sorted[index - 1].id;

        previous.style.visibility =
            "visible";

    } else {

        previous.style.visibility =
            "hidden";

    }


    // Next

    if (index < sorted.length - 1) {

        next.href =
            "memory.html?id=" +
            sorted[index + 1].id;

        next.style.visibility =
            "visible";

    } else {

        next.style.visibility =
            "hidden";

    }

}


// ======================================================
// MOBILE MENU
// ======================================================

function setupMobileMenu() {

    const button =
        document.getElementById(
            "menuButton"
        );

    const sidebar =
        document.querySelector(
            ".sidebar"
        );

    if (!button || !sidebar) {
        return;
    }


    button.onclick =
        function () {

            sidebar.classList.toggle(
                "mobile-open"
            );

        };

}


// ======================================================
// START
// ======================================================

async function init() {

    setupMobileMenu();

    await loadMemories();

    setupRandomMemory();

}


init();
