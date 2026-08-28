let memories = [];


// ================================
// LOAD MEMORIES
// ================================

async function loadMemories() {

    try {

        const response =
            await fetch("./data/memories.json");

        if (!response.ok) {
            throw new Error("Could not load memories.");
        }

        memories = await response.json();

        updateMemoryCounter();

    } catch (error) {

        console.error("Memory loading error:", error);

    }
}


// ================================
// MEMORY COUNTER
// ================================

function updateMemoryCounter() {

    const memoryCount =
        document.getElementById("memoryCount");

    if (memoryCount) {
        memoryCount.textContent = memories.length;
    }
}


// ================================
// RANDOM MEMORY
// ================================

function setupRandomMemory() {

    const button =
        document.getElementById("randomMemory");

    if (!button) return;

    button.addEventListener("click", () => {

        if (memories.length === 0) return;

        const randomIndex =
            Math.floor(
                Math.random() * memories.length
            );

        const memory =
            memories[randomIndex];

        window.location.href =
            `memory.html?id=${memory.id}`;

    });
}


// ================================
// GET FIRST IMAGE
// ================================

function getFirstImage(memory) {

    if (!memory.media) return null;

    const image =
        memory.media.find(
            item => item.type === "image"
        );

    return image ? image.src : null;
}


// ================================
// HOME — LATEST MEMORY
// ================================

function setupLatestMemory() {

    const image =
        document.getElementById("latestMemoryImage");

    if (!image || memories.length === 0) return;

    const sortedMemories =
        [...memories].sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        );

    const latest =
        sortedMemories[0];

    const imageSource =
        getFirstImage(latest);

    if (imageSource) {

        image.src =
            `./${imageSource}`;

        image.alt =
            latest.title;

    }

}


// ================================
// OUR STORY — TIMELINE
// ================================

function renderTimeline() {

    const timeline =
        document.getElementById("timeline");

    if (!timeline) return;

    timeline.innerHTML = "";

    const sortedMemories =
        [...memories].sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        );

    sortedMemories.forEach(memory => {

        const article =
            document.createElement("article");

        article.className =
            "timeline-memory";


        const imageSource =
            getFirstImage(memory);


        const imageHTML =
            imageSource

            ? `
                <img
                    class="timeline-image"
                    src="./${imageSource}"
                    alt="${memory.title}"
                >
            `

            : "";


        article.innerHTML = `

            ${imageHTML}

            <p class="timeline-date">
                ${memory.date}
            </p>

            <h2>
                ${memory.title}
            </h2>

            <p class="timeline-location">
                ${memory.location}
            </p>

            <p class="timeline-description">
                ${memory.description}
            </p>

        `;


        article.addEventListener("click", () => {

            window.location.href =
                `memory.html?id=${memory.id}`;

        });


        timeline.appendChild(article);

    });

}


// ================================
// MEMORY PAGE
// ================================

function renderMemoryPage() {

    const memoryContent =
        document.getElementById("memoryContent");

    if (!memoryContent) return;


    const params =
        new URLSearchParams(
            window.location.search
        );

    const memoryId =
        params.get("id");


    if (!memoryId) {

        memoryContent.innerHTML = `
            <p class="loading">
                Memory not found.
            </p>
        `;

        return;

    }


    const memory =
        memories.find(
            item =>
                String(item.id) ===
                String(memoryId)
        );


    if (!memory) {

        memoryContent.innerHTML = `
            <p class="loading">
                Memory not found.
            </p>
        `;

        return;

    }


    // ================================
    // BUILD MEDIA
    // ================================

    let mediaHTML = "";


    if (memory.media) {

        mediaHTML =
            memory.media.map(item => {

                if (item.type === "image") {

                    return `
                        <figure class="memory-photo">

                            <img
                                src="./${item.src}"
                                alt="${item.caption || memory.title}"
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


                if (item.type === "video") {

                    return `
                        <figure class="memory-video">

                            <video
                                controls
                                preload="metadata"
                            >
                                <source
                                    src="./${item.src}"
                                >
                                Your browser does not support video playback.
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


                return "";

            }).join("");

    }


    // ================================
    // DISPLAY MEMORY
    // ================================

    memoryContent.innerHTML = `

        <p class="memory-date">
            ${memory.date}
        </p>

        <h1>
            ${memory.title}
        </h1>

        <p class="memory-location">
            ${memory.location}
        </p>

        ${mediaHTML}

        <div class="memory-story">
            ${memory.description}
        </div>

    `;


    setupMemoryNavigation(memory);

}


// ================================
// PREVIOUS / NEXT MEMORY
// ================================

function setupMemoryNavigation(currentMemory) {

    const previousButton =
        document.getElementById("previousMemory");

    const nextButton =
        document.getElementById("nextMemory");

    if (!previousButton || !nextButton) return;


    const sortedMemories =
        [...memories].sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        );


    const currentIndex =
        sortedMemories.findIndex(
            memory =>
                String(memory.id) ===
                String(currentMemory.id)
        );


    // Previous

    if (
        currentIndex <
        sortedMemories.length - 1
    ) {

        const previous =
            sortedMemories[
                currentIndex + 1
            ];

        previousButton.href =
            `memory.html?id=${previous.id}`;

        previousButton.style.visibility =
            "visible";

    } else {

        previousButton.style.visibility =
            "hidden";

    }


    // Next

    if (currentIndex > 0) {

        const next =
            sortedMemories[
                currentIndex - 1
            ];

        nextButton.href =
            `memory.html?id=${next.id}`;

        nextButton.style.visibility =
            "visible";

    } else {

        nextButton.style.visibility =
            "hidden";

    }

}


// ================================
// MOBILE NAVIGATION
// ================================

function setupMobileMenu() {

    const menuButton =
        document.getElementById("menuButton");

    const sidebar =
        document.querySelector(".sidebar");

    if (!menuButton || !sidebar) return;


    menuButton.addEventListener("click", () => {

        sidebar.classList.toggle(
            "mobile-open"
        );

    });

}


// ================================
// START WEBSITE
// ================================

async function init() {

    await loadMemories();

    setupRandomMemory();

    setupLatestMemory();

    renderTimeline();

    renderMemoryPage();

    setupMobileMenu();

}


init();    const memoryCount =
        document.getElementById("memoryCount");

    if (memoryCount) {
        memoryCount.textContent = memories.length;
    }
}


// ================================
// RANDOM MEMORY
// ================================

function setupRandomMemory() {

    const randomMemoryButton =
        document.getElementById("randomMemory");

    if (!randomMemoryButton) return;

    randomMemoryButton.addEventListener("click", () => {

        if (memories.length === 0) return;

        const randomIndex =
            Math.floor(
                Math.random() * memories.length
            );

        const selectedMemory =
            memories[randomIndex];

        window.location.href =
            `memory.html?id=${selectedMemory.id}`;

    });
}


// ================================
// HOME — LATEST MEMORY
// ================================

function setupLatestMemory() {

    const image =
        document.getElementById("latestMemoryImage");

    if (!image || memories.length === 0) return;

    const sortedMemories =
        [...memories].sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        );

    const latest =
        sortedMemories[0];

    if (
        latest.images &&
        latest.images.length > 0
    ) {

        image.src =
            `./${latest.images[0]}`;

        image.alt =
            latest.title;

    }

}


// ================================
// OUR STORY — TIMELINE
// ================================

function renderTimeline() {

    const timeline =
        document.getElementById("timeline");

    if (!timeline) return;

    timeline.innerHTML = "";

    const sortedMemories =
        [...memories].sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        );

    sortedMemories.forEach(memory => {

        const article =
            document.createElement("article");

        article.className =
            "timeline-memory";


        const imageHTML =
            memory.images &&
            memory.images.length > 0

            ? `
                <img
                    class="timeline-image"
                    src="./${memory.images[0]}"
                    alt="${memory.title}"
                >
            `

            : "";


        article.innerHTML = `

            ${imageHTML}

            <p class="timeline-date">
                ${memory.date}
            </p>

            <h2>
                ${memory.title}
            </h2>

            <p class="timeline-location">
                ${memory.location}
            </p>

            <p class="timeline-description">
                ${memory.description}
            </p>

        `;


        article.addEventListener("click", () => {

            window.location.href =
                `memory.html?id=${memory.id}`;

        });


        timeline.appendChild(article);

    });

}


// ================================
// MEMORY PAGE
// ================================

function renderMemoryPage() {

    const memoryContent =
        document.getElementById("memoryContent");

    if (!memoryContent) return;


    const params =
        new URLSearchParams(
            window.location.search
        );

    const memoryId =
        params.get("id");


    if (!memoryId) {

        memoryContent.innerHTML = `
            <p class="loading">
                Memory not found.
            </p>
        `;

        return;

    }


    const memory =
        memories.find(
            item =>
                String(item.id) ===
                String(memoryId)
        );


    if (!memory) {

        memoryContent.innerHTML = `
            <p class="loading">
                Memory not found.
            </p>
        `;

        return;

    }


    const imagesHTML =
        memory.images &&
        memory.images.length > 0

        ? memory.images.map(image => `
            <div class="memory-photo">
                <img
                    src="./${image}"
                    alt="${memory.title}"
                >
            </div>
        `).join("")

        : "";


    memoryContent.innerHTML = `

        <p class="memory-date">
            ${memory.date}
        </p>

        <h1>
            ${memory.title}
        </h1>

        <p class="memory-location">
            ${memory.location}
        </p>

        ${imagesHTML}

        <div class="memory-story">
            ${memory.description}
        </div>

    `;


    setupMemoryNavigation(memory);

}


// ================================
// PREVIOUS / NEXT MEMORY
// ================================

function setupMemoryNavigation(currentMemory) {

    const previousButton =
        document.getElementById("previousMemory");

    const nextButton =
        document.getElementById("nextMemory");

    if (!previousButton || !nextButton) return;


    const sortedMemories =
        [...memories].sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        );


    const currentIndex =
        sortedMemories.findIndex(
            memory =>
                String(memory.id) ===
                String(currentMemory.id)
        );


    // Previous

    if (
        currentIndex <
        sortedMemories.length - 1
    ) {

        const previous =
            sortedMemories[
                currentIndex + 1
            ];

        previousButton.href =
            `memory.html?id=${previous.id}`;

    } else {

        previousButton.style.visibility =
            "hidden";

    }


    // Next

    if (currentIndex > 0) {

        const next =
            sortedMemories[
                currentIndex - 1
            ];

        nextButton.href =
            `memory.html?id=${next.id}`;

    } else {

        nextButton.style.visibility =
            "hidden";

    }

}


// ================================
// MOBILE NAVIGATION
// ================================

function setupMobileMenu() {

    const menuButton =
        document.getElementById("menuButton");

    const sidebar =
        document.querySelector(".sidebar");

    if (!menuButton || !sidebar) return;


    menuButton.addEventListener("click", () => {

        sidebar.classList.toggle(
            "mobile-open"
        );

    });

}


// ================================
// START WEBSITE
// ================================

async function init() {

    await loadMemories();

    setupRandomMemory();

    setupLatestMemory();

    renderTimeline();

    renderMemoryPage();

    setupMobileMenu();

}


init();
