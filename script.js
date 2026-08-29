let memories = [];


// ================================
// LOAD MEMORIES
// ================================

async function loadMemories() {

    try {

        const response = await fetch("data/memories.json?v=3");

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

        const timeline = document.getElementById("timeline");

        if (timeline) {
            timeline.innerHTML = `
                <p class="loading">
                    Unable to load memories.
                </p>
            `;
        }
    }
}


// ================================
// MEMORY COUNTER
// ================================

function updateMemoryCounter() {

    const counter =
        document.getElementById("memoryCount");

    if (counter) {
        counter.textContent = memories.length;
    }
}


// ================================
// MEDIA HELPER
// ================================

function getMedia(memory) {

    if (Array.isArray(memory.media)) {
        return memory.media;
    }

    if (Array.isArray(memory.images)) {

        return memory.images.map(src => ({
            type: "image",
            src: src,
            caption: ""
        }));

    }

    return [];
}


// ================================
// FIRST IMAGE
// ================================

function getFirstImage(memory) {

    const media = getMedia(memory);

    const image =
        media.find(item => item.type === "image");

    return image ? image.src : null;
}


// ================================
// DATE
// ================================

function memoryTime(memory) {

    return new Date(memory.date).getTime();

}


// ================================
// RANDOM MEMORY
// ================================

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

        window.location.href =
            "memory.html?id=" + memories[index].id;

    };
}


// ================================
// HOME IMAGE
// ================================

function setupLatestMemory() {

    const image =
        document.getElementById("latestMemoryImage");

    if (!image || memories.length === 0) return;

    const sorted =
        [...memories].sort(
            (a, b) => memoryTime(b) - memoryTime(a)
        );

    const latest = sorted[0];

    const src = getFirstImage(latest);

    if (src) {

        image.src = "./" + src;

        image.alt = latest.title;

    }
}


// ================================
// OUR STORY
// ================================

function renderTimeline() {

    const timeline =
        document.getElementById("timeline");

    if (!timeline) return;

    timeline.innerHTML = "";

    const sorted =
        [...memories].sort(
            (a, b) => memoryTime(b) - memoryTime(a)
        );


    sorted.forEach(memory => {

        const article =
            document.createElement("article");

        article.className =
            "timeline-memory";


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

            article.appendChild(image);

        }


        const date =
            document.createElement("p");

        date.className =
            "timeline-date";

        date.textContent =
            memory.date;


        const title =
            document.createElement("h2");

        title.textContent =
            memory.title;


        const location =
            document.createElement("p");

        location.className =
            "timeline-location";

        location.textContent =
            memory.location;


        const description =
            document.createElement("p");

        description.className =
            "timeline-description";

        description.textContent =
            memory.description;


        article.appendChild(date);
        article.appendChild(title);
        article.appendChild(location);
        article.appendChild(description);


        article.onclick = function () {

            window.location.href =
                "memory.html?id=" + memory.id;

        };


        timeline.appendChild(article);

    });

}


// ================================
// MEMORY PAGE
// ================================

function renderMemoryPage() {

    const container =
        document.getElementById("memoryContent");

    if (!container) return;


    const params =
        new URLSearchParams(
            window.location.search
        );

    const id =
        params.get("id");


    if (!id) return;


    const memory =
        memories.find(
            item => String(item.id) === String(id)
        );


    if (!memory) {

        container.innerHTML =
            "<p class='loading'>Memory not found.</p>";

        return;

    }


    let mediaHTML = "";


    getMedia(memory).forEach(item => {

        if (item.type === "image") {

            mediaHTML += `
                <figure class="memory-photo">

                    <img
                        src="./${item.src}"
                        alt="${item.caption || memory.title}"
                    >

                    ${
                        item.caption
                        ? `<figcaption>${item.caption}</figcaption>`
                        : ""
                    }

                </figure>
            `;

        }


        if (item.type === "video") {

            mediaHTML += `
                <figure class="memory-video">

                    <video controls preload="metadata">

                        <source src="./${item.src}">

                    </video>

                    ${
                        item.caption
                        ? `<figcaption>${item.caption}</figcaption>`
                        : ""
                    }

                </figure>
            `;

        }

    });


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

        ${mediaHTML}

        <div class="memory-story">
            ${memory.description}
        </div>

    `;

}


// ================================
// MOBILE MENU
// ================================

function setupMobileMenu() {

    const button =
        document.getElementById("menuButton");

    const sidebar =
        document.querySelector(".sidebar");

    if (!button || !sidebar) return;


    button.onclick = function () {

        sidebar.classList.toggle("mobile-open");

    };

}


// ================================
// START
// ================================

async function init() {

    setupMobileMenu();

    setupRandomMemory();

    await loadMemories();

}


init();
