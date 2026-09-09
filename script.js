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
/* ======================================================
   THE GROWING TREE
   ====================================================== */

async function loadTree() {

    const container =
        document.getElementById("treeMilestones");

    const leaves =
        document.getElementById("treeLeaves");

    if (!container) {
        return;
    }

    try {

        const response =
            await fetch(
                "./data/tree.json?v=1",
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {

            throw new Error(
                "Could not load tree.json"
            );

        }

        const milestones =
            await response.json();

        if (!Array.isArray(milestones)) {

            throw new Error(
                "tree.json does not contain an array"
            );

        }

        renderTree(milestones);

    } catch (error) {

        console.error(
            "TREE ERROR:",
            error
        );

        container.innerHTML = "";

        if (leaves) {
            leaves.innerHTML = "";
        }

    }

}


function renderTree(milestones) {

    const container =
        document.getElementById("treeMilestones");

    const leaves =
        document.getElementById("treeLeaves");

    if (!container) {
        return;
    }


    /*
       Vertical positions for milestones.

       The tree becomes visually denser as
       more moments are added.
    */

    const positions = [
        79,
        63,
        49,
        36,
        25,
        16,
        9,
        3
    ];


    container.innerHTML =
        milestones
            .map(
                (milestone, index) => {

                    const position =
                        milestone.position === "right"
                            ? "right"
                            : "left";

                    const top =
                        positions[index] !== undefined
                            ? positions[index]
                            : Math.max(
                                4,
                                79 - (index * 8)
                            );

                    const date =
                        milestone.date || "";

                    const title =
                        milestone.title ||
                        "Untitled moment";

                    const text =
                        milestone.text ||
                        milestone.description ||
                        "";

                    return `
                        <article
                            class="tree-milestone ${position}"
                            style="top: ${top}%"
                        >

                            ${
                                date
                                    ? `
                                        <div class="tree-milestone-date">
                                            ${escapeHTML(date)}
                                        </div>
                                      `
                                    : ""
                            }

                            <h3>
                                ${escapeHTML(title)}
                            </h3>

                            ${
                                text
                                    ? `
                                        <p>
                                            ${escapeHTML(text)}
                                        </p>
                                      `
                                    : ""
                            }

                        </article>
                    `;

                }
            )
            .join("");


    /*
       Add leaves around the upper
       portion of the tree.

       Their positions are intentionally
       organic rather than perfectly symmetrical.
    */

    if (!leaves) {
        return;
    }

    const leafPositions = [

        [37, 20],
        [44, 15],
        [51, 19],
        [32, 27],
        [57, 29],
        [39, 34],
        [48, 31],
        [29, 22],
        [62, 24],
        [54, 12],
        [35, 14],
        [59, 18],
        [45, 25],
        [52, 36],
        [31, 31]

    ];


    const leafCount =
        Math.min(
            leafPositions.length,
            Math.max(
                4,
                milestones.length * 4
            )
        );


    leaves.innerHTML =
        leafPositions
            .slice(0, leafCount)
            .map(
                (position, index) => {

                    const left =
                        position[0];

                    const top =
                        position[1];

                    let size =
                        "small";

                    if (
                        index % 5 === 0
                    ) {

                        size = "large";

                    } else if (
                        index % 3 === 0
                    ) {

                        size = "medium";

                    }

                    return `
                        <span
                            class="tree-leaf ${size}"
                            style="
                                left: ${left}%;
                                top: ${top}%;
                                animation-delay: ${index * 90}ms;
                            "
                        ></span>
                    `;

                }
            )
            .join("");

}


/* ======================================================
   TREE INITIALIZATION
   ====================================================== */

const originalInit =
    window.init;

window.init =
    async function () {

        if (typeof originalInit === "function") {

            await originalInit();

        }

        await loadTree();

    };
