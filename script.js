let memories = [];
let lightboxItems = [];
let lightboxIndex = 0;


// ======================================================
// LOAD MEMORIES
// ======================================================

async function loadMemories() {

    try {

        const response =
            await fetch("./data/memories.json?v=10", { cache: "no-store" });

        if (!response.ok) {
            throw new Error(
                "Could not load memories.json"
            );
        }

        memories = await response.json();

        if (!Array.isArray(memories)) {
            throw new Error(
                "memories.json does not contain an array"
            );
        }

        updateMemoryCounter();

        renderTimeline();

        renderGallery();

        renderMemoryPage();

    } catch (error) {

        console.error(
            "MEMORY ERROR:",
            error
        );

        const timeline =
            document.getElementById("timeline");

        const gallery =
            document.getElementById("gallery");

        const memoryContent =
            document.getElementById(
                "memoryContent"
            );

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
        document.getElementById(
            "memoryCount"
        );

    if (counter) {

        counter.textContent =
            memories.length;

    }
}


// ======================================================
// MEDIA HELPER
// ======================================================

function getMedia(memory) {

    // New media format

    if (Array.isArray(memory.media)) {

        return memory.media;

    }


    // Legacy image format

    if (Array.isArray(memory.images)) {

        return memory.images.map(
            src => ({

                type: "image",

                src: src,

                caption: ""

            })
        );

    }


    return [];

}


// ======================================================
// PRIORITIZE VIDEOS
// Videos first, images after.
// ======================================================

function prioritizeVideos(media) {

    return [...media].sort(
        (a, b) => {

            if (
                a.type === "video" &&
                b.type !== "video"
            ) {
                return -1;
            }

            if (
                a.type !== "video" &&
                b.type === "video"
            ) {
                return 1;
            }

            return 0;

        }
    );

}


// ======================================================
// DATE + TIME HELPER
// ======================================================

function memoryTime(memory) {

    if (!memory.date) {
        return 0;
    }


    const fullDateString =
        memory.time
            ? `${memory.date} ${memory.time}`
            : memory.date;


    const parsedTime =
        Date.parse(
            fullDateString
        );


    if (!isNaN(parsedTime)) {
        return parsedTime;
    }


    const dateOnly =
        Date.parse(
            memory.date
        );


    return isNaN(dateOnly)
        ? 0
        : dateOnly;

}


// ======================================================
// RANDOM MEMORY
// ======================================================

function setupRandomMemory() {

    const button =
        document.getElementById(
            "randomMemory"
        );

    if (!button) {
        return;
    }


    button.onclick =
        function () {

            if (
                memories.length === 0
            ) {
                return;
            }


            const index =
                Math.floor(
                    Math.random() *
                    memories.length
                );


            const selected =
                memories[index];


            if (!selected || !selected.id) {
                return;
            }


            window.location.href =
                "memory.html?id=" +
                encodeURIComponent(
                    selected.id
                );

        };

}


// ======================================================
// OUR STORY — TEXT-ONLY TIMELINE
// ======================================================

function renderTimeline() {

    const timeline =
        document.getElementById(
            "timeline"
        );

    if (!timeline) {
        return;
    }


    timeline.innerHTML = "";


    // Newest first

    const sorted =
        [...memories].sort(
            (a, b) =>
                memoryTime(b) -
                memoryTime(a)
        );


    sorted.forEach(
        memory => {

            const article =
                document.createElement(
                    "article"
                );


            article.className =
                "timeline-memory";


            // ==================================================
            // DATE
            // ==================================================

            const date =
                document.createElement(
                    "p"
                );


            date.className =
                "timeline-date";


            date.textContent =
                memory.date || "";


            article.appendChild(
                date
            );


            // ==================================================
            // TIME
            // ==================================================

            if (memory.time) {

                const time =
                    document.createElement(
                        "span"
                    );


                time.className =
                    "timeline-time";


                time.textContent =
                    memory.time;


                article.appendChild(
                    time
                );

            }


            // ==================================================
            // TITLE
            // ==================================================

            const title =
                document.createElement(
                    "h2"
                );


            title.textContent =
                memory.title || "";


            article.appendChild(
                title
            );


            // ==================================================
            // LOCATION
            // ==================================================

            if (memory.location) {

                const location =
                    document.createElement(
                        "p"
                    );


                location.className =
                    "timeline-location";


                location.textContent =
                    memory.location;


                article.appendChild(
                    location
                );

            }


            // ==================================================
            // DESCRIPTION
            // ==================================================

            if (memory.description) {

                const description =
                    document.createElement(
                        "p"
                    );


                description.className =
                    "timeline-description";


                description.textContent =
                    memory.description;


                article.appendChild(
                    description
                );

            }


            // ==================================================
            // OPEN MEMORY
            // ==================================================

            article.addEventListener(
                "click",
                function () {

                    window.location.href =
                        "memory.html?id=" +
                        encodeURIComponent(
                            memory.id
                        );

                }
            );


            timeline.appendChild(
                article
            );

        }
    );

}


// ======================================================
// GALLERY
// Images + videos
// Videos appear first within each memory.
// ======================================================

function renderGallery() {

    const gallery = document.getElementById("gallery");
    if (!gallery) return;

    gallery.innerHTML = "";
    let mediaCount = 0;

    memories.forEach(memory => {

        const usableMedia = getMedia(memory).filter(
            item => item.type === "image" || item.type === "video"
        );

        if (usableMedia.length === 0) return;

        // ==================================================
        // MEMORY GROUP
        // ==================================================

        const group = document.createElement("section");
        group.className = "gallery-memory";

        const heading = document.createElement("div");
        heading.className = "gallery-memory-heading";

        // TITLE
        const title = document.createElement("h2");
        title.textContent = memory.title || "";
        heading.appendChild(title);

        // DATE + TIME
        const dateTime = document.createElement("p");
        dateTime.className = "gallery-date-time";

        if (memory.date) {
            const date = document.createElement("span");
            date.className = "gallery-date";
            date.textContent = memory.date;
            dateTime.appendChild(date);
        }

        if (memory.time) {
            const time = document.createElement("span");
            time.className = "gallery-time";
            time.textContent = memory.time;
            dateTime.appendChild(time);
        }

        if (dateTime.textContent.trim()) {
            heading.appendChild(dateTime);
        }

        if (memory.location) {
            const location = document.createElement("p");
            location.className = "gallery-location";
            location.textContent = memory.location;
            heading.appendChild(location);
        }

        group.appendChild(heading);

        // ==================================================
        // GRID
        // ==================================================

        const grid = document.createElement("div");
        grid.className = "gallery-grid";

        usableMedia.forEach((item, index) => {

            const figure = document.createElement("figure");
            figure.className = "gallery-photo";

            if (item.type === "video") {
                figure.classList.add("is-video");

                const video = document.createElement("video");
                video.src = "./" + item.src;
                video.preload = "metadata";
                video.muted = true;
                video.playsInline = true;
                figure.appendChild(video);
            } else {
                const image = document.createElement("img");
                image.src = "./" + item.src;
                image.alt = item.caption || memory.title || "Memory photograph";
                image.loading = "lazy";
                figure.appendChild(image);
            }

            figure.addEventListener("click", () => {
                openMediaViewer(usableMedia, index, memory);
            });

            grid.appendChild(figure);
            mediaCount++;
        });

        group.appendChild(grid);
        gallery.appendChild(group);
    });

    if (mediaCount === 0) {
        gallery.innerHTML = `
            <div class="gallery-empty">
                <span>—</span>
                <p>The photographs are still waiting to be added.</p>
            </div>
        `;
    }
}

let lightboxMemory = null;

function openMediaViewer(items, index, memory) {
    lightboxItems = items || [];
    lightboxIndex = Math.max(0, Math.min(index, lightboxItems.length - 1));
    lightboxMemory = memory || null;
    renderLightboxItem();
}

function renderLightboxItem() {
    if (!lightboxItems.length) return;

    const item = lightboxItems[lightboxIndex];
    const lightbox = document.getElementById("lightbox");
    const image = document.getElementById("lightboxImage");
    const captionElement = document.getElementById("lightboxCaption");
    const content = lightbox && lightbox.querySelector(".lightbox-content");

    if (!lightbox || !content) return;

    const existingVideo = content.querySelector(".lightbox-video");
    if (existingVideo) {
        existingVideo.pause();
        existingVideo.remove();
    }

    if (item.type === "video") {
        if (image) {
            image.src = "";
            image.style.display = "none";
        }

        const video = document.createElement("video");
        video.className = "lightbox-video lightbox-media";
        video.src = "./" + item.src;
        video.controls = true;
        video.playsInline = true;
        video.preload = "metadata";
        content.insertBefore(video, captionElement || null);
    } else if (image) {
        image.style.display = "block";
        image.src = "./" + item.src;
        image.alt = item.caption || lightboxMemory?.title || "Memory photograph";
    }

    if (captionElement) {
        const parts = [];
        if (item.caption) parts.push(item.caption);
        if (lightboxMemory?.title) parts.push(lightboxMemory.title);
        parts.push(`${lightboxIndex + 1} / ${lightboxItems.length}`);
        captionElement.textContent = parts.join(" · ");
    }

    const prev = document.getElementById("lightboxPrev");
    const next = document.getElementById("lightboxNext");
    if (prev) prev.disabled = lightboxIndex <= 0;
    if (next) next.disabled = lightboxIndex >= lightboxItems.length - 1;

    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function changeLightbox(direction) {
    const nextIndex = lightboxIndex + direction;
    if (nextIndex < 0 || nextIndex >= lightboxItems.length) return;
    lightboxIndex = nextIndex;
    renderLightboxItem();
}

// ======================================================
// LIGHTBOX
// Supports image + video.
// ======================================================

function openLightbox(src, caption, type) {
    const item = { src, caption, type };
    openMediaViewer([item], 0, null);
}

// ======================================================
// CLOSE LIGHTBOX
// ======================================================

function closeLightbox() {

    const lightbox =
        document.getElementById(
            "lightbox"
        );


    const image =
        document.getElementById(
            "lightboxImage"
        );


    const captionElement =
        document.getElementById(
            "lightboxCaption"
        );


    if (!lightbox) {
        return;
    }


    // ==================================================
    // STOP VIDEO
    // ==================================================

    const video =
        lightbox.querySelector(
            ".lightbox-video"
        );


    if (video) {

        video.pause();

        video.remove();

    }


    // ==================================================
    // CLOSE
    // ==================================================

    lightbox.classList.remove(
        "open"
    );


    lightbox.setAttribute(
        "aria-hidden",
        "true"
    );


    // ==================================================
    // RESET IMAGE
    // ==================================================

    if (image) {

        image.src = "";

        image.style.display =
            "block";

    }


    // ==================================================
    // RESET CAPTION
    // ==================================================

    if (captionElement) {

        captionElement.textContent =
            "";

    }


    // Restore scrolling

    document.body.style.overflow =
        "";

    lightboxItems = [];
    lightboxIndex = 0;
    lightboxMemory = null;

}


// ======================================================
// LIGHTBOX SETUP
// ======================================================

function setupLightbox() {

    const lightbox = document.getElementById("lightbox");
    const closeButton = document.getElementById("lightboxClose");
    const prevButton = document.getElementById("lightboxPrev");
    const nextButton = document.getElementById("lightboxNext");

    if (!lightbox) return;

    if (closeButton) closeButton.addEventListener("click", closeLightbox);
    if (prevButton) prevButton.addEventListener("click", () => changeLightbox(-1));
    if (nextButton) nextButton.addEventListener("click", () => changeLightbox(1));

    lightbox.addEventListener("click", event => {
        if (event.target === lightbox) closeLightbox();
    });

    let touchStartX = 0;
    lightbox.addEventListener("touchstart", event => {
        touchStartX = event.changedTouches[0].screenX;
    }, { passive: true });

    lightbox.addEventListener("touchend", event => {
        const delta = event.changedTouches[0].screenX - touchStartX;
        if (Math.abs(delta) < 50) return;
        if (delta < 0) changeLightbox(1);
        else changeLightbox(-1);
    }, { passive: true });
}

// ======================================================
// INDIVIDUAL MEMORY PAGE
// ======================================================

function renderMemoryPage() {

    const container =
        document.getElementById(
            "memoryContent"
        );


    if (!container) {
        return;
    }


    // ==================================================
    // GET ID FROM URL
    // ==================================================

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


    // ==================================================
    // FIND MEMORY
    // ==================================================

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


    // ==================================================
    // MEDIA
    // ==================================================

    const mediaItems = getMedia(memory);


    // ==================================================
    // BUILD PAGE MEDIA
    // ==================================================

    const mediaContainer =
        document.createElement(
            "div"
        );


    mediaContainer.className =
        "memory-media";


    mediaItems.forEach(
        (item, index) => {

            if (
                item.type !== "image" &&
                item.type !== "video"
            ) {
                return;
            }


            const figure =
                document.createElement(
                    "figure"
                );


            figure.className =
                "memory-media-item";


            figure.classList.add(
                "media-" + item.type
            );


            figure.classList.add(
                "media-" + (index + 1)
            );


            // ==================================================
            // IMAGE
            // ==================================================

            if (
                item.type === "image"
            ) {

                const image =
                    document.createElement(
                        "img"
                    );


                image.src =
                    "./" + item.src;


                image.alt =
                    item.caption ||
                    memory.title ||
                    "Memory photograph";


                image.loading =
                    "lazy";


                figure.appendChild(
                    image
                );

            }


            // ==================================================
            // VIDEO
            // ==================================================

            else if (
                item.type === "video"
            ) {

                figure.classList.add(
                    "is-video"
                );


                const video =
                    document.createElement(
                        "video"
                    );


                video.preload =
                    "metadata";


                video.muted =
                    true;

                video.controls = true;

                video.addEventListener("click", function (event) {
                    event.stopPropagation();
                });

                video.playsInline =
                    true;


                const source =
                    document.createElement(
                        "source"
                    );


                source.src =
                    "./" + item.src;


                video.appendChild(
                    source
                );


                figure.appendChild(
                    video
                );

            }


            // ==================================================
            // CAPTION
            // ==================================================

            if (item.caption) {

                const caption =
                    document.createElement(
                        "figcaption"
                    );


                caption.textContent =
                    item.caption;


                figure.appendChild(
                    caption
                );

            }


            // ==================================================
            // CLICK → FULL MEDIA
            // ==================================================

            figure.addEventListener(
                "click",
                function () {

                    const usableMedia = mediaItems.filter(
                        media => media.type === "image" || media.type === "video"
                    );

                    openMediaViewer(
                        usableMedia,
                        usableMedia.indexOf(item),
                        memory
                    );

                }
            );


            // ==================================================
            // KEYBOARD ACCESS
            // ==================================================

            figure.setAttribute(
                "tabindex",
                "0"
            );


            figure.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {

                        event.preventDefault();

                        const usableMedia = mediaItems.filter(
                            media => media.type === "image" || media.type === "video"
                        );

                        openMediaViewer(
                            usableMedia,
                            usableMedia.indexOf(item),
                            memory
                        );

                    }

                }
            );


            mediaContainer.appendChild(
                figure
            );

        }
    );


    // ==================================================
    // CLEAR OLD CONTENT
    // ==================================================

    container.innerHTML = "";


    // ==================================================
    // DATE
    // ==================================================

    const date =
        document.createElement(
            "p"
        );


    date.className =
        "memory-date";


    date.textContent =
        memory.date || "";


    container.appendChild(
        date
    );


    // ==================================================
    // TIME
    // ==================================================

    if (memory.time) {

        const time =
            document.createElement(
                "p"
            );


        time.className =
            "memory-time";


        time.textContent =
            memory.time;


        container.appendChild(
            time
        );

    }


    // ==================================================
    // TITLE
    // ==================================================

    const title =
        document.createElement(
            "h1"
        );


    title.textContent =
        memory.title || "";


    container.appendChild(
        title
    );


    // ==================================================
    // LOCATION
    // ==================================================

    if (memory.location) {

        const location =
            document.createElement(
                "p"
            );


        location.className =
            "memory-location";


        location.textContent =
            memory.location;


        container.appendChild(
            location
        );

    }


    // ==================================================
    // MEDIA
    // ==================================================

    if (
        mediaContainer.children.length > 0
    ) {

        container.appendChild(
            mediaContainer
        );

    }


    // ==================================================
    // STORY
    // ==================================================

    const story =
        document.createElement(
            "div"
        );


    story.className =
        "memory-story";


    story.innerHTML =
        memory.description || "";


    container.appendChild(
        story
    );


    // ==================================================
    // NAVIGATION
    // ==================================================

    setupMemoryNavigation(
        memory
    );

}


// ======================================================
// PREVIOUS / NEXT MEMORY
// ======================================================

function setupMemoryNavigation(
    currentMemory
) {

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


    // ==================================================
    // PREVIOUS
    // ==================================================

    if (index > 0) {

        previous.href =
            "memory.html?id=" +
            encodeURIComponent(
                sorted[index - 1].id
            );


        previous.style.visibility =
            "visible";

    } else {

        previous.style.visibility =
            "hidden";

    }


    // ==================================================
    // NEXT
    // ==================================================

    if (
        index >= 0 &&
        index < sorted.length - 1
    ) {

        next.href =
            "memory.html?id=" +
            encodeURIComponent(
                sorted[index + 1].id
            );


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


    button.setAttribute("aria-expanded", "false");

    button.addEventListener(
        "click",
        function () {

            const isOpen =
                sidebar.classList.toggle("mobile-open");

            button.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

        }
    );

    sidebar.querySelectorAll(".nav-link").forEach(
        function (link) {

            link.addEventListener(
                "click",
                function () {

                    sidebar.classList.remove("mobile-open");
                    button.setAttribute("aria-expanded", "false");

                }
            );

        }
    );

}


// ======================================================
// KEYBOARD LIGHTBOX
// ======================================================

function setupKeyboard() {

    document.addEventListener(
        "keydown",
        function (event) {

            if (event.key === "Escape") {
                closeLightbox();
            } else if (event.key === "ArrowLeft") {
                changeLightbox(-1);
            } else if (event.key === "ArrowRight") {
                changeLightbox(1);
            }

        }
    );

}


// ======================================================
// THINGS I LOVE ABOUT YOU
// ======================================================

async function loadThings() {

    const container = document.getElementById("thingsList");

    if (!container) {
        return;
    }

    try {

        const response = await fetch("./data/things.json?v=1", { cache: "no-store" });

        if (!response.ok) {
            throw new Error("Could not load things.json");
        }

        const things = await response.json();

        if (!Array.isArray(things)) {
            throw new Error("things.json does not contain an array");
        }

        renderThings(things);

    } catch (error) {

        console.error("THINGS ERROR:", error);
        container.innerHTML = '<p class="loading">Unable to load this page.</p>';

    }
}


function renderThings(things) {

    const container = document.getElementById("thingsList");

    if (!container) {
        return;
    }

    if (!things.length) {
        container.innerHTML = `
            <div class="things-empty">
                <p class="handwritten">Nothing written here yet.</p>
                <p>This page is waiting for the things that only belong here.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = things.map((thing, index) => {

        const number = String(index + 1).padStart(2, "0");
        const title = thing.title || "Untitled";
        const text = thing.text || thing.description || "";
        const date = thing.date ? `<span class="thing-date">${thing.date}</span>` : "";

        return `
            <article class="thing-entry">
                <div class="thing-number">${number}</div>
                <div class="thing-body">
                    <div class="thing-meta">${date}</div>
                    <h2>${title}</h2>
                    <p>${text}</p>
                </div>
            </article>
        `;

    }).join("");
}


// ======================================================
// INITIALIZE
// ======================================================

async function init() {

    setupMobileMenu();

    setupLightbox();

    setupKeyboard();

    await loadMemories();

    await loadThings();

    setupRandomMemory();

}


// ======================================================
// WAIT FOR DOM
// ======================================================

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();

            }
/* ======================================================
   PLACES WE'VE BEEN
   ====================================================== */

async function loadPlaces() {

    const container =
        document.getElementById("placesList");

    if (!container) {
        return;
    }

    try {

        const response =
            await fetch(
                "./data/places.json?v=1",
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {
            throw new Error(
                "Could not load places.json"
            );
        }

        const places =
            await response.json();

        if (!Array.isArray(places)) {
            throw new Error(
                "places.json does not contain an array"
            );
        }

        renderPlaces(places);

    } catch (error) {

        console.error(
            "PLACES ERROR:",
            error
        );

        container.innerHTML =
            '<p class="loading">Unable to load this page.</p>';
    }

}


/* ======================================================
   RENDER PLACES
   ====================================================== */

function renderPlaces(places) {

    const container =
        document.getElementById("placesList");

    if (!container) {
        return;
    }

    if (!places.length) {

        container.innerHTML = `
            <div class="places-empty">
                <p class="handwritten">
                    No places written here yet.
                </p>

                <p>
                    This page is waiting for the places
                    that became part of our story.
                </p>
            </div>
        `;

        return;
    }


    container.innerHTML =
        places
            .map(
                (place, index) => {

                    const number =
                        String(index + 1)
                            .padStart(2, "0");

                    const name =
                        place.name ||
                        "Untitled place";

                    const date =
                        place.date || "";

                    const location =
                        place.location || "";

                    const description =
                        place.description ||
                        place.text ||
                        "";

                    const image =
                        place.image ||
                        "";


                    const metaParts = [];


                    if (date) {

                        metaParts.push(`
                            <span class="place-date">
                                ${escapeHTML(date)}
                            </span>
                        `);

                    }


                    if (
                        date &&
                        location
                    ) {

                        metaParts.push(`
                            <span class="place-separator">
                                ·
                            </span>
                        `);

                    }


                    if (location) {

                        metaParts.push(`
                            <span class="place-location">
                                ${escapeHTML(location)}
                            </span>
                        `);

                    }


                    const imageHTML =
                        image
                            ? `
                                <div class="place-image">
                                    <img
                                        src="./${escapeHTML(image)}"
                                        alt="${escapeHTML(name)}"
                                        loading="lazy"
                                    >
                                </div>
                              `
                            : "";


                    return `
                        <article class="place-entry">

                            <div class="place-number">
                                ${number}
                            </div>

                            <div class="place-body">

                                <div class="place-meta">
                                    ${metaParts.join("")}
                                </div>

                                <h2>
                                    ${escapeHTML(name)}
                                </h2>

                                ${
                                    description
                                        ? `
                                            <p>
                                                ${escapeHTML(description)}
                                            </p>
                                          `
                                        : ""
                                }

                                ${imageHTML}

                            </div>

                        </article>
                    `;

                }
            )
            .join("");

}


/* ======================================================
   SAFE TEXT HELPER
   ====================================================== */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* ======================================================
   NAVIGATION ROUTING
   Makes the new sections work even on older
   HTML pages whose links still contain "#".
   ====================================================== */

function setupArchiveNavigation() {

    document
        .querySelectorAll(".nav-link")
        .forEach(
            link => {

                const label =
                    link.textContent
                        .trim()
                        .toLowerCase();

                if (
                    label ===
                    "places we've been"
                ) {

                    link.href =
                        "places.html";

                }

                if (
                    label ===
                    "things i love about you"
                ) {

                    link.href =
                        "things.html";

                }

                if (
                    label ===
                    "the growing tree"
                ) {

                    link.href =
                        "tree.html";

                }

            }
        );

}


/* ======================================================
   INITIALIZE
   ====================================================== */

async function init() {

    setupMobileMenu();

    setupLightbox();

    setupKeyboard();

    setupArchiveNavigation();

    await loadMemories();

    await loadThings();

    await loadPlaces();

    setupRandomMemory();

}


/* ======================================================
   WAIT FOR DOM
   ====================================================== */

if (
    document.readyState === "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init
    );

} else {

    init();

        }
// ======================================================
// MEMORY UNIVERSE — FINAL
// ======================================================

let universeMilestones = [];
let universeSelectedIndex = -1;
let universePointer = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0
};

let universeAnimationFrame = null;
let universeResizeTimer = null;


// ======================================================
// LOAD UNIVERSE DATA
// ======================================================

async function loadTree() {

    const stage = document.getElementById("treeStage");
    const container = document.getElementById("treeMilestones");

    if (!stage || !container) return;

    try {

        const response = await fetch(
            "./data/tree.json?v=40",
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error("Could not load tree.json");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error(
                "tree.json does not contain an array"
            );
        }

        universeMilestones = data;

        renderTree(data);

    } catch (error) {

        console.error(
            "MEMORY UNIVERSE ERROR:",
            error
        );

        container.innerHTML = "";
    }
}


// ======================================================
// UNIVERSE POSITIONS
// ======================================================

function universePositions(count, mobile = false) {

    const desktop = [

        [19, 25],
        [81, 25],

        [14, 68],
        [86, 68],

        [50, 13],

        [50, 88],

        [30, 43],
        [70, 43],

        [30, 77],
        [70, 77],

        [40, 23],
        [60, 23]

    ];

    const phone = [

        [21, 23],
        [79, 24],

        [17, 67],
        [83, 67],

        [50, 11],

        [50, 88],

        [28, 43],
        [72, 43],

        [30, 78],
        [70, 78]

    ];

    const positions = mobile
        ? phone
        : desktop;

    return positions.slice(
        0,
        Math.min(count, positions.length)
    );
}


// ======================================================
// STAR FIELD
// ======================================================

function renderUniverseStars() {

    const space =
        document.getElementById(
            "universeSpace"
        );

    if (!space) return;

    space.innerHTML = "";

    const mobile =
        window.matchMedia(
            "(max-width: 600px)"
        ).matches;

    const count = mobile ? 58 : 105;

    for (let i = 0; i < count; i++) {

        const star =
            document.createElement("span");

        star.className =
            "universe-star";

        const x =
            3 + Math.random() * 94;

        const y =
            4 + Math.random() * 90;

        const size =
            Math.random() * 1.7 + .45;

        const opacity =
            Math.random() * .25 + .08;

        const duration =
            4 + Math.random() * 6;

        const delay =
            Math.random() * -7;

        star.style.left =
            `${x.toFixed(2)}%`;

        star.style.top =
            `${y.toFixed(2)}%`;

        star.style.setProperty(
            "--star-size",
            `${size.toFixed(2)}px`
        );

        star.style.setProperty(
            "--star-opacity",
            opacity.toFixed(2)
        );

        star.style.setProperty(
            "--star-duration",
            `${duration.toFixed(2)}s`
        );

        star.style.setProperty(
            "--star-delay",
            `${delay.toFixed(2)}s`
        );

        space.appendChild(star);
    }
}


// ======================================================
// CONNECTIONS
// ======================================================

function renderUniverseConnections(
    positions
) {

    const svg =
        document.getElementById(
            "universeConnections"
        );

    if (!svg) return;

    svg.innerHTML = "";

    const center = {
        x: 500,
        y: 350
    };

    const points =
        positions.map(position => ({
            x: position[0] * 10,
            y: position[1] * 7
        }));


    /*
       Main chronological filament.
    */

    for (
        let i = 0;
        i < points.length - 1;
        i++
    ) {

        const a = points[i];
        const b = points[i + 1];

        const curve =
            Math.max(
                35,
                Math.abs(b.x - a.x) * .34
            );

        const direction =
            b.x >= a.x
                ? 1
                : -1;

        const path =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
            );

        path.classList.add(
            "universe-line"
        );

        path.dataset.pair =
            `${i}-${i + 1}`;

        path.setAttribute(
            "d",
            `
                M ${a.x} ${a.y}
                C
                ${a.x + curve * direction}
                ${a.y},
                ${b.x - curve * direction}
                ${b.y},
                ${b.x} ${b.y}
            `
        );

        svg.appendChild(path);
    }


    /*
       Individual memory → central heart.
       These are deliberately extremely subtle.
    */

    points.forEach((point, index) => {

        const bend =
            (index % 2 === 0 ? 1 : -1) *
            (35 + index * 4);

        const path =
            document.createElementNS(
                "http://www.w3.org/2000/svg",
                "path"
            );

        path.classList.add(
            "universe-line",
            "secondary"
        );

        path.dataset.index =
            String(index);

        path.setAttribute(
            "d",
            `
                M ${center.x} ${center.y}
                Q
                ${(
                    (center.x + point.x) / 2
                    + bend
                )}
                ${(
                    (center.y + point.y) / 2
                    - bend * .35
                )}
                ${point.x} ${point.y}
            `
        );

        svg.appendChild(path);
    });
}


// ======================================================
// RENDER MEMORY LIGHTS
// ======================================================

function renderTree(milestones) {

    const container =
        document.getElementById(
            "treeMilestones"
        );

    const stage =
        document.getElementById(
            "treeStage"
        );

    if (!container || !stage) {
        return;
    }

    const mobile =
        window.matchMedia(
            "(max-width: 800px)"
        ).matches;

    const positions =
        universePositions(
            milestones.length,
            mobile
        );

    container.innerHTML = "";

    renderUniverseStars();

    renderUniverseConnections(
        positions
    );


    milestones.forEach(
        (milestone, index) => {

            const position =
                positions[index] || [
                    15 + ((index * 31) % 70),
                    18 + ((index * 47) % 65)
                ];

            const node =
                document.createElement(
                    "button"
                );

            node.type = "button";

            node.className =
                "tree-milestone";

            node.dataset.tone =
                milestone.tone || "sage";

            node.dataset.size =
                milestone.size || "medium";

            node.style.left =
                `${position[0]}%`;

            node.style.top =
                `${position[1]}%`;

            node.setAttribute(
                "aria-label",
                milestone.title
                    ? `Open memory: ${milestone.title}`
                    : "Open memory"
            );

            /*
               IMPORTANT:
               No title.
               No date.
               No description.
               The universe stays visually empty.
            */

            const light =
                document.createElement(
                    "span"
                );

            light.className =
                "universe-node";

            light.setAttribute(
                "aria-hidden",
                "true"
            );

            node.appendChild(light);


            node.addEventListener(
                "click",
                () => {
                    openUniverseMemory(
                        milestone,
                        index,
                        node
                    );
                }
            );


            node.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key === "Enter" ||
                        event.key === " "
                    ) {

                        event.preventDefault();

                        openUniverseMemory(
                            milestone,
                            index,
                            node
                        );
                    }

                }
            );


            container.appendChild(node);
        }
    );


    setupUniverseParallax();
}


// ======================================================
// RESOLVE ACTUAL MEMORY
// ======================================================

function resolveUniverseMemory(
    milestone
) {

    if (
        milestone.memoryId !== undefined &&
        milestone.memoryId !== null
    ) {

        const exact =
            memories.find(
                memory =>
                    String(memory.id) ===
                    String(milestone.memoryId)
            );

        if (exact) {
            return exact;
        }
    }

    return memories.find(
        memory =>
            String(memory.title || "")
                .trim()
                .toLowerCase() ===
            String(milestone.title || "")
                .trim()
                .toLowerCase()
    ) || null;
}


// ======================================================
// OPEN MEMORY CARD
// ======================================================

function openUniverseMemory(
    milestone,
    index,
    element
) {

    universeSelectedIndex =
        index;


    document
        .querySelectorAll(
            ".tree-milestone.is-selected"
        )
        .forEach(node => {
            node.classList.remove(
                "is-selected"
            );
        });


    element.classList.add(
        "is-selected"
    );


    document
        .querySelectorAll(
            ".universe-connections path"
        )
        .forEach(path => {
            path.classList.remove(
                "active"
            );
        });


    const activePaths =
        document.querySelectorAll(
            `.universe-connections path[data-index="${index}"]`
        );

    activePaths.forEach(path => {
        path.classList.add(
            "active"
        );
    });


    const detail =
        document.getElementById(
            "universeDetail"
        );

    const date =
        document.getElementById(
            "universeDetailDate"
        );

    const title =
        document.getElementById(
            "universeDetailTitle"
        );

    const text =
        document.getElementById(
            "universeDetailText"
        );

    const openButton =
        document.getElementById(
            "universeOpenMemory"
        );


    if (!detail) return;


    const actual =
        resolveUniverseMemory(
            milestone
        );


    const actualDate =
        actual?.date ||
        milestone.date ||
        "";

    const actualTitle =
        actual?.title ||
        milestone.title ||
        "A memory";

    const actualText =
        actual?.description ||
        milestone.text ||
        milestone.description ||
        "";


    if (date) {
        date.textContent =
            actualDate;
    }

    if (title) {
        title.textContent =
            actualTitle;
    }

    if (text) {
        text.textContent =
            actualText;
    }


    if (openButton) {

        if (
            actual &&
            actual.id !== undefined &&
            actual.id !== null
        ) {

            openButton.style.display =
                "inline-block";

            openButton.onclick =
                () => {

                    window.location.href =
                        "memory.html?id=" +
                        encodeURIComponent(
                            actual.id
                        );
                };

        } else {

            openButton.style.display =
                "none";
        }
    }


    detail.classList.add(
        "open"
    );

    detail.setAttribute(
        "aria-hidden",
        "false"
    );


    const hint =
        document.querySelector(
            ".universe-interaction-hint"
        );

    if (hint) {
        hint.style.opacity = "0";
    }
}


// ======================================================
// CLOSE MEMORY CARD
// ======================================================

function closeUniverseMemory() {

    universeSelectedIndex = -1;


    const detail =
        document.getElementById(
            "universeDetail"
        );

    if (detail) {

        detail.classList.remove(
            "open"
        );

        detail.setAttribute(
            "aria-hidden",
            "true"
        );
    }


    document
        .querySelectorAll(
            ".tree-milestone.is-selected"
        )
        .forEach(node => {

            node.classList.remove(
                "is-selected"
            );
        });


    document
        .querySelectorAll(
            ".universe-connections path.active"
        )
        .forEach(path => {

            path.classList.remove(
                "active"
            );
        });


    const hint =
        document.querySelector(
            ".universe-interaction-hint"
        );

    if (hint) {
        hint.style.opacity = "";
    }
}


// ======================================================
// DETAIL CARD SETUP
// ======================================================

function setupUniverseDetail() {

    const close =
        document.getElementById(
            "universeClose"
        );

    if (close) {

        close.addEventListener(
            "click",
            closeUniverseMemory
        );
    }
}


// ======================================================
// PARALLAX
// ======================================================

function setupUniverseParallax() {

    const stage =
        document.getElementById(
            "treeStage"
        );

    const core =
        document.getElementById(
            "universeCore"
        );

    if (!stage || !core) {
        return;
    }


    if (
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches
    ) {
        return;
    }


    /*
       Avoid installing duplicate listeners
       if the universe is re-rendered.
    */

    if (
        stage.dataset.parallaxReady === "true"
    ) {
        return;
    }

    stage.dataset.parallaxReady = "true";


    const isTouch =
        window.matchMedia(
            "(hover: none)"
        ).matches;


    if (isTouch) {

        let startX = 0;
        let startY = 0;


        stage.addEventListener(
            "touchstart",
            event => {

                if (!event.touches[0]) {
                    return;
                }

                startX =
                    event.touches[0].clientX;

                startY =
                    event.touches[0].clientY;

            },
            {
                passive: true
            }
        );


        stage.addEventListener(
            "touchmove",
            event => {

                if (!event.touches[0]) {
                    return;
                }

                const rect =
                    stage.getBoundingClientRect();

                const dx =
                    (
                        event.touches[0].clientX -
                        startX
                    ) / rect.width;

                const dy =
                    (
                        event.touches[0].clientY -
                        startY
                    ) / rect.height;


                core.style.setProperty(
                    "--core-x",
                    `${dx * 8}px`
                );

                core.style.setProperty(
                    "--core-y",
                    `${dy * 8}px`
                );

            },
            {
                passive: true
            }
        );


        stage.addEventListener(
            "touchend",
            () => {

                core.style.setProperty(
                    "--core-x",
                    "0px"
                );

                core.style.setProperty(
                    "--core-y",
                    "0px"
                );

            },
            {
                passive: true
            }
        );

        return;
    }


    stage.addEventListener(
        "pointermove",
        event => {

            const rect =
                stage.getBoundingClientRect();


            universePointer.targetX =
                (
                    event.clientX -
                    (
                        rect.left +
                        rect.width / 2
                    )
                ) /
                rect.width *
                28;


            universePointer.targetY =
                (
                    event.clientY -
                    (
                        rect.top +
                        rect.height / 2
                    )
                ) /
                rect.height *
                28;

        }
    );


    stage.addEventListener(
        "pointerleave",
        () => {

            universePointer.targetX = 0;
            universePointer.targetY = 0;

        }
    );


    function animateUniverse() {

        universePointer.x +=
            (
                universePointer.targetX -
                universePointer.x
            ) * .045;


        universePointer.y +=
            (
                universePointer.targetY -
                universePointer.y
            ) * .045;


        core.style.setProperty(
            "--core-x",
            `${universePointer.x * .30}px`
        );

        core.style.setProperty(
            "--core-y",
            `${universePointer.y * .30}px`
        );


        const nodes =
            document.querySelectorAll(
                ".tree-milestone"
            );


        nodes.forEach(
            (node, index) => {

                const depth =
                    .35 +
                    (index % 5) * .11;


                node.style.setProperty(
                    "--node-x",
                    `${(
                        universePointer.x *
                        depth
                    ).toFixed(2)}px`
                );


                node.style.setProperty(
                    "--node-y",
                    `${(
                        universePointer.y *
                        depth
                    ).toFixed(2)}px`
                );

            }
        );


        universeAnimationFrame =
            requestAnimationFrame(
                animateUniverse
            );
    }


    animateUniverse();
}


// ======================================================
// RESIZE
// ======================================================

function setupUniverseResize() {

    if (
        window.__memoryUniverseResizeReady
    ) {
        return;
    }

    window.__memoryUniverseResizeReady =
        true;


    window.addEventListener(
        "resize",
        () => {

            clearTimeout(
                universeResizeTimer
            );

            universeResizeTimer =
                setTimeout(
                    () => {

                        if (
                            universeMilestones.length
                        ) {

                            const stage =
                                document.getElementById(
                                    "treeStage"
                                );

                            if (stage) {
                                stage.dataset.parallaxReady =
                                    "false";
                            }

                            renderTree(
                                universeMilestones
                            );
                        }

                    },
                    180
                );
        }
    );
}


// ======================================================
// ESCAPE KEY
// ======================================================

function setupUniverseKeyboard() {

    if (
        window.__memoryUniverseKeyboardReady
    ) {
        return;
    }

    window.__memoryUniverseKeyboardReady =
        true;


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape"
            ) {

                closeUniverseMemory();
            }
        }
    );
}


// ======================================================
// INITIALIZE UNIVERSE
// ======================================================

setupUniverseResize();
setupUniverseKeyboard();
