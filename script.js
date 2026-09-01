let memories = [];


// ======================================================
// LOAD MEMORIES
// ======================================================

async function loadMemories() {

    try {

        const response =
            await fetch("data/memories.json?v=5");

        if (!response.ok) {
            throw new Error("Could not load memories.json");
        }

        memories = await response.json();

        updateMemoryCounter();

        renderTimeline();

        renderGallery();

        renderMemoryPage();

    } catch (error) {

        console.error("MEMORY ERROR:", error);

        const timeline =
            document.getElementById("timeline");

        const gallery =
            document.getElementById("gallery");

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

        if (gallery) {
            gallery.innerHTML = message;
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

        location.className =
            "timeline-location";

        location.textContent =
            memory.location;


        // ------------------------------
        // Description
        // ------------------------------

        const description =
            document.createElement("p");

        description.className =
            "timeline-description";

        description.textContent =
            memory.description;


        // ------------------------------
        // Add content
        // ------------------------------

        article.appendChild(date);

        article.appendChild(title);

        article.appendChild(location);

        article.appendChild(description);


        // ------------------------------
        // Open memory
        // ------------------------------

        article.onclick =
            function () {

                window.location.href =
                    "memory.html?id=" +
                    memory.id;

            };


        timeline.appendChild(article);

    });
}


// ======================================================
// GALLERY
// ======================================================

function renderGallery() {

    const gallery =
        document.getElementById("gallery");

    if (!gallery) return;

    gallery.innerHTML = "";

    let photoCount = 0;


    memories.forEach(memory => {

        const media =
            getMedia(memory);

        const images =
            media.filter(
                item => item.type === "image"
            );


        // Skip memories without photographs

        if (images.length === 0) {
            return;
        }


        // ------------------------------
        // Memory group
        // ------------------------------

        const group =
            document.createElement("section");

        group.className =
            "gallery-memory";


        // ------------------------------
        // Memory heading
        // ------------------------------

        const heading =
            document.createElement("div");

        heading.className =
            "gallery-memory-heading";

        heading.innerHTML = `
            <p class="gallery-date">
                ${memory.date}
            </p>

            <h2>
                ${memory.title}
            </h2>

            <p class="gallery-location">
                ${memory.location}
            </p>
        `;

        group.appendChild(heading);


        // ------------------------------
        // Photo grid
        // ------------------------------

        const grid =
            document.createElement("div");

        grid.className =
            "gallery-grid";


        images.forEach(item => {

            const figure =
                document.createElement("figure");

            figure.className =
                "gallery-photo";


            const image =
                document.createElement("img");

            image.src =
                "./" + item.src;

            image.alt =
                item.caption ||
                memory.title;

            image.loading =
                "lazy";


            // --------------------------
            // Lightbox
            // --------------------------

            image.addEventListener(
                "click",
                function () {

                    openLightbox(
                        item.src,
                        item.caption ||
                        memory.title
                    );

                }
            );


            figure.appendChild(image);


            // --------------------------
            // Caption
            // --------------------------

            if (item.caption) {

                const caption =
                    document.createElement("figcaption");

                caption.textContent =
                    item.caption;

                figure.appendChild(
                    caption
                );

            }


            grid.appendChild(figure);

            photoCount++;

        });


        group.appendChild(grid);

        gallery.appendChild(group);

    });


    // ------------------------------
    // Empty gallery
    // ------------------------------

    if (photoCount === 0) {

        gallery.innerHTML = `

            <div class="gallery-empty">

                <span>—</span>

                <p>
                    The photographs are still waiting
                    to be added.
                </p>

            </div>

        `;

    }
}


// ======================================================
// GALLERY LIGHTBOX
// ======================================================

function openLightbox(src, caption) {

    const lightbox =
        document.getElementById("lightbox");

    const image =
        document.getElementById("lightboxImage");

    const captionElement =
        document.getElementById("lightboxCaption");

    if (!lightbox || !image) {
        return;
    }


    image.src =
        "./" + src;

    image.alt =
        caption || "";


    if (captionElement) {

        captionElement.textContent =
            caption || "";

    }


    lightbox.classList.add("open");

    lightbox.setAttribute(
        "aria-hidden",
        "false"
    );

}


// ======================================================
// CLOSE LIGHTBOX
// ======================================================

function closeLightbox() {

    const lightbox =
        document.getElementById("lightbox");

    const image =
        document.getElementById("lightboxImage");

    if (!lightbox) {
        return;
    }


    lightbox.classList.remove("open");

    lightbox.setAttribute(
        "aria-hidden",
        "true"
    );


    if (image) {
        image.src = "";
    }

}


// ======================================================
// SETUP LIGHTBOX
// ======================================================

function setupLightbox() {

    const lightbox =
        document.getElementById("lightbox");

    const closeButton =
        document.getElementById("lightboxClose");

    if (!lightbox) {
        return;
    }


    // Close button

    if (closeButton) {

        closeButton.onclick =
            closeLightbox;

    }


    // Click outside image

    lightbox.addEventListener(
        "click",
        function (event) {

            if (
                event.target === lightbox
            ) {

                closeLightbox();

            }

        }
    );


    // Escape key

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape"
            ) {

                closeLightbox();

            }

        }
    );

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
    // Build page
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
    // Navigation
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


    // ------------------------------
    // Previous
    // ------------------------------

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


    // ------------------------------
    // Next
    // ------------------------------

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

    setupLightbox();

    await loadMemories();

    setupRandomMemory();

}


init();
