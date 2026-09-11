let memories = [];
let lightboxItems = [];
let lightboxIndex = 0;
let lightboxMemory = null;

// ======================================================
// LOAD MEMORIES
// ======================================================
async function loadMemories() {
    try {
        const response = await fetch("./data/memories.json?v=10", { cache: "no-store" });
        if (!response.ok) throw new Error("Could not load memories.json");

        memories = await response.json();
        if (!Array.isArray(memories)) throw new Error("memories.json does not contain an array");

        updateMemoryCounter();
        renderTimeline();
        renderGallery();
        renderMemoryPage();
    } catch (error) {
        console.error("MEMORY ERROR:", error);

        const message = `<p class="loading">Unable to load memories.</p>`;
        const timeline = document.getElementById("timeline");
        const gallery = document.getElementById("gallery");
        const memoryContent = document.getElementById("memoryContent");

        if (timeline) timeline.innerHTML = message;
        if (gallery) gallery.innerHTML = message;
        if (memoryContent) memoryContent.innerHTML = message;
    }
}

// ======================================================
// MEMORY COUNTER
// ======================================================
function updateMemoryCounter() {
    const counter = document.getElementById("memoryCount");
    if (counter) counter.textContent = memories.length;
}

// ======================================================
// MEDIA HELPER
// ======================================================
function getMedia(memory) {
    if (Array.isArray(memory.media)) return memory.media;

    if (Array.isArray(memory.images)) {
        return memory.images.map(src => ({
            type: "image",
            src,
            caption: ""
        }));
    }

    return [];
}

// ======================================================
// VIDEO PRIORITIZER
// Used only by the Gallery.
// Individual memory pages preserve JSON order.
// ======================================================
function prioritizeVideos(media) {
    return [...media].sort((a, b) => {
        if (a.type === "video" && b.type !== "video") return -1;
        if (a.type !== "video" && b.type === "video") return 1;
        return 0;
    });
}

// ======================================================
// DATE + TIME HELPER
// ======================================================
function memoryTime(memory) {
    if (!memory.date) return 0;

    const fullDateString = memory.time
        ? `${memory.date} ${memory.time}`
        : memory.date;

    const parsedTime = Date.parse(fullDateString);
    if (!isNaN(parsedTime)) return parsedTime;

    const dateOnly = Date.parse(memory.date);
    return isNaN(dateOnly) ? 0 : dateOnly;
}

// ======================================================
// RANDOM MEMORY
// ======================================================
function setupRandomMemory() {
    const button = document.getElementById("randomMemory");
    if (!button) return;

    button.onclick = function () {
        if (!memories.length) return;

        const index = Math.floor(Math.random() * memories.length);
        const selected = memories[index];

        if (!selected || selected.id === undefined || selected.id === null) return;

        window.location.href =
            "memory.html?id=" + encodeURIComponent(selected.id);
    };
}

// ======================================================
// OUR STORY — TEXT-ONLY TIMELINE
// ======================================================
function renderTimeline() {
    const timeline = document.getElementById("timeline");
    if (!timeline) return;

    timeline.innerHTML = "";

    const sorted = [...memories].sort(
        (a, b) => memoryTime(b) - memoryTime(a)
    );

    sorted.forEach(memory => {
        const article = document.createElement("article");
        article.className = "timeline-memory";

        const date = document.createElement("p");
        date.className = "timeline-date";
        date.textContent = memory.date || "";
        article.appendChild(date);

        if (memory.time) {
            const time = document.createElement("span");
            time.className = "timeline-time";
            time.textContent = memory.time;
            article.appendChild(time);
        }

        const title = document.createElement("h2");
        title.textContent = memory.title || "";
        article.appendChild(title);

        if (memory.location) {
            const location = document.createElement("p");
            location.className = "timeline-location";
            location.textContent = memory.location;
            article.appendChild(location);
        }

        if (memory.description) {
            const description = document.createElement("p");
            description.className = "timeline-description";
            description.textContent = memory.description;
            article.appendChild(description);
        }

        article.addEventListener("click", () => {
            window.location.href =
                "memory.html?id=" + encodeURIComponent(memory.id);
        });

        timeline.appendChild(article);
    });
}

// ======================================================
// GALLERY
// Videos appear first within each memory.
// ======================================================
function renderGallery() {
    const gallery = document.getElementById("gallery");
    if (!gallery) return;

    gallery.innerHTML = "";
    let mediaCount = 0;

    memories.forEach(memory => {
        const usableMedia = prioritizeVideos(
            getMedia(memory).filter(
                item => item && (item.type === "image" || item.type === "video")
            )
        );

        if (!usableMedia.length) return;

        const group = document.createElement("section");
        group.className = "gallery-memory";

        const heading = document.createElement("div");
        heading.className = "gallery-memory-heading";

        const title = document.createElement("h2");
        title.textContent = memory.title || "";
        heading.appendChild(title);

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

        if (dateTime.textContent.trim()) heading.appendChild(dateTime);

        if (memory.location) {
            const location = document.createElement("p");
            location.className = "gallery-location";
            location.textContent = memory.location;
            heading.appendChild(location);
        }

        group.appendChild(heading);

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

    if (!mediaCount) {
        gallery.innerHTML = `
            <div class="gallery-empty">
                <span>—</span>
                <p>The photographs are still waiting to be added.</p>
            </div>
        `;
    }
}

// ======================================================
// MEDIA VIEWER
// ======================================================
function openMediaViewer(items, index, memory) {
    lightboxItems = Array.isArray(items) ? items : [];
    if (!lightboxItems.length) return;

    lightboxIndex = Math.max(
        0,
        Math.min(Number(index) || 0, lightboxItems.length - 1)
    );

    lightboxMemory = memory || null;
    renderLightboxItem();
}

function renderLightboxItem() {
    if (!lightboxItems.length) return;

    const item = lightboxItems[lightboxIndex];
    if (!item) return;

    const lightbox = document.getElementById("lightbox");
    if (!lightbox) return;

    const image = document.getElementById("lightboxImage");
    const captionElement = document.getElementById("lightboxCaption");
    const content = lightbox.querySelector(".lightbox-content");
    if (!content) return;

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
        image.alt =
            item.caption ||
            (lightboxMemory && lightboxMemory.title) ||
            "Memory photograph";
    }

    if (captionElement) {
        const parts = [];
        if (item.caption) parts.push(item.caption);
        if (lightboxMemory && lightboxMemory.title) {
            parts.push(lightboxMemory.title);
        }
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
    if (!lightboxItems.length) return;

    const nextIndex = lightboxIndex + direction;
    if (nextIndex < 0 || nextIndex >= lightboxItems.length) return;

    lightboxIndex = nextIndex;
    renderLightboxItem();
}

function openLightbox(src, caption, type) {
    openMediaViewer([{ src, caption, type }], 0, null);
}

// ======================================================
// CLOSE LIGHTBOX
// ======================================================
function closeLightbox() {
    const lightbox = document.getElementById("lightbox");
    if (!lightbox) return;

    const image = document.getElementById("lightboxImage");
    const captionElement = document.getElementById("lightboxCaption");
    const video = lightbox.querySelector(".lightbox-video");

    if (video) {
        video.pause();
        video.remove();
    }

    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");

    if (image) {
        image.src = "";
        image.style.display = "block";
    }

    if (captionElement) captionElement.textContent = "";

    document.body.style.overflow = "";

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
    if (prevButton) {
        prevButton.addEventListener("click", () => changeLightbox(-1));
    }
    if (nextButton) {
        nextButton.addEventListener("click", () => changeLightbox(1));
    }

    lightbox.addEventListener("click", event => {
        if (event.target === lightbox) closeLightbox();
    });

    let touchStartX = 0;

    lightbox.addEventListener(
        "touchstart",
        event => {
            if (event.changedTouches && event.changedTouches[0]) {
                touchStartX = event.changedTouches[0].screenX;
            }
        },
        { passive: true }
    );

    lightbox.addEventListener(
        "touchend",
        event => {
            if (!event.changedTouches || !event.changedTouches[0]) return;

            const delta =
                event.changedTouches[0].screenX - touchStartX;

            if (Math.abs(delta) < 50) return;

            if (delta < 0) changeLightbox(1);
            else changeLightbox(-1);
        },
        { passive: true }
    );
}

// ======================================================
// INDIVIDUAL MEMORY PAGE
// ======================================================
function renderMemoryPage() {
    const container = document.getElementById("memoryContent");
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (id === null) {
        container.innerHTML = `<p class="loading">Memory not selected.</p>`;
        return;
    }

    const memory = memories.find(
        item => String(item.id) === String(id)
    );

    if (!memory) {
        container.innerHTML = `<p class="loading">Memory not found.</p>`;
        return;
    }

    // Preserve the exact order from memories.json.
    const mediaItems = getMedia(memory);

    const mediaContainer = document.createElement("div");
    mediaContainer.className = "memory-media";

    mediaItems.forEach((item, index) => {
        if (
            !item ||
            (item.type !== "image" && item.type !== "video")
        ) return;

        const figure = document.createElement("figure");
        figure.className = "memory-media-item";
        figure.classList.add("media-" + item.type);
        figure.classList.add("media-" + (index + 1));

        if (item.type === "image") {
            const image = document.createElement("img");
            image.src = "./" + item.src;
            image.alt =
                item.caption ||
                memory.title ||
                "Memory photograph";
            image.loading = "lazy";
            figure.appendChild(image);
        } else {
            figure.classList.add("is-video");

            const video = document.createElement("video");
            video.preload = "metadata";
            video.muted = true;
            video.controls = true;
            video.playsInline = true;

            video.addEventListener("click", event => {
                event.stopPropagation();
            });

            const source = document.createElement("source");
            source.src = "./" + item.src;
            video.appendChild(source);
            figure.appendChild(video);
        }

        if (item.caption) {
            const caption = document.createElement("figcaption");
            caption.textContent = item.caption;
            figure.appendChild(caption);
        }

        const usableMedia = mediaItems.filter(
            media =>
                media &&
                (media.type === "image" || media.type === "video")
        );

        figure.addEventListener("click", () => {
            openMediaViewer(
                usableMedia,
                usableMedia.indexOf(item),
                memory
            );
        });

        figure.setAttribute("tabindex", "0");

        figure.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();

                openMediaViewer(
                    usableMedia,
                    usableMedia.indexOf(item),
                    memory
                );
            }
        });

        mediaContainer.appendChild(figure);
    });

    container.innerHTML = "";

    const date = document.createElement("p");
    date.className = "memory-date";
    date.textContent = memory.date || "";
    container.appendChild(date);

    if (memory.time) {
        const time = document.createElement("p");
        time.className = "memory-time";
        time.textContent = memory.time;
        container.appendChild(time);
    }

    const title = document.createElement("h1");
    title.textContent = memory.title || "";
    container.appendChild(title);

    if (memory.location) {
        const location = document.createElement("p");
        location.className = "memory-location";
        location.textContent = memory.location;
        container.appendChild(location);
    }

    if (mediaContainer.children.length) {
        container.appendChild(mediaContainer);
    }

    const story = document.createElement("div");
    story.className = "memory-story";
    story.innerHTML = memory.description || "";
    container.appendChild(story);

    setupMemoryNavigation(memory);
}

// ======================================================
// PREVIOUS / NEXT MEMORY
// ======================================================
function setupMemoryNavigation(currentMemory) {
    const previous = document.getElementById("previousMemory");
    const next = document.getElementById("nextMemory");

    if (!previous || !next) return;

    const sorted = [...memories].sort(
        (a, b) => memoryTime(a) - memoryTime(b)
    );

    const index = sorted.findIndex(
        memory => String(memory.id) === String(currentMemory.id)
    );

    if (index > 0) {
        previous.href =
            "memory.html?id=" +
            encodeURIComponent(sorted[index - 1].id);
        previous.style.visibility = "visible";
    } else {
        previous.style.visibility = "hidden";
    }

    if (index >= 0 && index < sorted.length - 1) {
        next.href =
            "memory.html?id=" +
            encodeURIComponent(sorted[index + 1].id);
        next.style.visibility = "visible";
    } else {
        next.style.visibility = "hidden";
    }
}

// ======================================================
// MOBILE MENU
// ======================================================
function setupMobileMenu() {

    /*
     * Current archive markup uses .menu-toggle.
     * The id fallback keeps compatibility with older pages.
     */
    const button =
        document.querySelector(".menu-toggle") ||
        document.getElementById("menuButton");

    const sidebar =
        document.querySelector(".sidebar");

    if (!button || !sidebar) {
        return;
    }

    const setMenuState = function (isOpen) {

        sidebar.classList.toggle(
            "mobile-open",
            isOpen
        );

        button.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

        button.setAttribute(
            "aria-label",
            isOpen
                ? "Close menu"
                : "Open menu"
        );

        document.body.classList.toggle(
            "mobile-menu-open",
            isOpen
        );

    };

    setMenuState(false);

    button.addEventListener(
        "click",
        function () {

            const isOpen =
                sidebar.classList.contains(
                    "mobile-open"
                );

            setMenuState(!isOpen);

        }
    );

    sidebar.querySelectorAll(".nav-link").forEach(
        function (link) {

            link.addEventListener(
                "click",
                function () {
                    setMenuState(false);
                }
            );

        }
    );

    document.addEventListener(
        "keydown",
        function (event) {

            if (
                event.key === "Escape" &&
                sidebar.classList.contains(
                    "mobile-open"
                )
            ) {
                setMenuState(false);
            }

        }
    );

    /*
     * If the viewport returns to desktop while the
     * mobile panel is open, reset its mobile state.
     */
    window.addEventListener(
        "resize",
        function () {

            if (
                window.innerWidth > 800 &&
                sidebar.classList.contains(
                    "mobile-open"
                )
            ) {
                setMenuState(false);
            }

        }
    );

}

// ======================================================
// KEYBOARD LIGHTBOX
// ======================================================
function setupKeyboard() {
    document.addEventListener("keydown", event => {
        const lightbox = document.getElementById("lightbox");
        const isOpen = lightbox && lightbox.classList.contains("open");

        if (event.key === "Escape") {
            closeLightbox();
        } else if (isOpen && event.key === "ArrowLeft") {
            changeLightbox(-1);
        } else if (isOpen && event.key === "ArrowRight") {
            changeLightbox(1);
        }
    });
}

// ======================================================
// THINGS I LOVE ABOUT YOU
// ======================================================
async function loadThings() {
    const container = document.getElementById("thingsList");
    if (!container) return;

    try {
        const response = await fetch(
            "./data/things.json?v=1",
            { cache: "no-store" }
        );

        if (!response.ok) throw new Error("Could not load things.json");

        const things = await response.json();
        if (!Array.isArray(things)) {
            throw new Error("things.json does not contain an array");
        }

        renderThings(things);
    } catch (error) {
        console.error("THINGS ERROR:", error);
        container.innerHTML =
            '<p class="loading">Unable to load this page.</p>';
    }
}

function renderThings(things) {
    const container = document.getElementById("thingsList");
    if (!container) return;

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
        const title = escapeHTML(thing.title || "Untitled");
        const text = escapeHTML(thing.text || thing.description || "");
        const date = thing.date
            ? `<span class="thing-date">${escapeHTML(thing.date)}</span>`
            : "";

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
// HTML ESCAPE HELPER
// ======================================================

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
// ======================================================
// PLACES WE'VE BEEN
// ======================================================
async function loadPlaces() {
    const container = document.getElementById("placesList");
    if (!container) return;

    try {
        const response = await fetch(
            "./data/places.json?v=1",
            { cache: "no-store" }
        );

        if (!response.ok) throw new Error("Could not load places.json");

        const places = await response.json();
        if (!Array.isArray(places)) {
            throw new Error("places.json does not contain an array");
        }

        renderPlaces(places);
    } catch (error) {
        console.error("PLACES ERROR:", error);
        container.innerHTML =
            '<p class="loading">Unable to load this page.</p>';
    }
}

function renderPlaces(places) {
    const container = document.getElementById("placesList");
    if (!container) return;

    if (!places.length) {
        container.innerHTML = `
            <div class="places-empty">
                <p class="handwritten">No places written here yet.</p>
                <p>This page is waiting for the places that became part of our story.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = places.map((place, index) => {
        const number = String(index + 1).padStart(2, "0");
        const name = escapeHTML(place.name || "Untitled place");
        const date = place.date || "";
        const location = place.location || "";
        const description = place.description || place.text || "";
        const image = place.image || "";

        const metaParts = [];

        if (date) {
            metaParts.push(
                `<span class="place-date">${escapeHTML(date)}</span>`
            );
        }

        if (date && location) {
            metaParts.push(`<span class="place-separator">·</span>`);
        }

        if (location) {
            metaParts.push(
                `<span class="place-location">${escapeHTML(location)}</span>`
            );
        }

        const imageHTML = image
            ? `
                <div class="place-image">
                    <img
                        src="./${escapeHTML(image)}"
                        alt="${name}"
                        loading="lazy"
                    >
                </div>
            `
            : "";

        return `
            <article class="place-entry">
                <div class="place-number">${number}</div>
                <div class="place-body">
                    <div class="place-meta">${metaParts.join("")}</div>
                    <h2>${name}</h2>
                    ${
                        description
                            ? `<p>${escapeHTML(description)}</p>`
                            : ""
                    }
                    ${imageHTML}
                </div>
            </article>
        `;
    }).join("");
}

// ======================================================
// NAVIGATION ROUTING
// ======================================================
function setupArchiveNavigation() {
    document.querySelectorAll(".nav-link").forEach(link => {
        const label = link.textContent.trim().toLowerCase();

        if (label === "places we've been") link.href = "places.html";
        if (label === "things i love about you") link.href = "things.html";
        if (label === "the growing tree") link.href = "tree.html";
    });
}

// ======================================================
// MEMORY UNIVERSE — FINAL GALAXY
// ======================================================

async function loadTree() {

    const stage = document.getElementById("treeStage");
    const stars = document.getElementById("universeStars");
    const lines = document.getElementById("universeConnections");
    const nodes = document.getElementById("universeNodes");
    const detail = document.getElementById("universeDetail");
    const detailDate = document.getElementById("universeDetailDate");
    const detailTitle = document.getElementById("universeDetailTitle");
    const detailText = document.getElementById("universeDetailText");
    const openMemory = document.getElementById("universeOpenMemory");
    const closeMemory = document.getElementById("universeClose");

    if (
        !stage ||
        !stars ||
        !lines ||
        !nodes ||
        !detail
    ) {
        return;
    }

    const reduceMotion =
        window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;

    let universe = [];
    let selected = null;

    const tones = {
        warm: "#ffd37a",
        rose: "#ff8fc7",
        sage: "#8fe3c1",
        gold: "#ffd37a",
        blue: "#67e8f9",
        violet: "#a98cff"
    };


    // ==================================================
    // LOAD UNIVERSE DATA
    // ==================================================

    try {

        const response = await fetch(
            "./data/tree.json?v=31",
            {
                cache: "no-store"
            }
        );

        if (!response.ok) {
            throw new Error(
                "Could not load tree.json"
            );
        }

        universe = await response.json();

        if (!Array.isArray(universe)) {
            throw new Error(
                "tree.json does not contain an array"
            );
        }

    } catch (error) {

        console.error(
            "MEMORY UNIVERSE ERROR:",
            error
        );

        return;
    }


    // ==================================================
    // MEMORY POSITIONS
    // ==================================================

    function nodePosition(item, index) {

        const desktop = [
            [19, 28],
            [69, 23],
            [79, 58],
            [28, 70],
            [53, 83]
        ];

        const mobile = [
            [21, 25],
            [77, 25],
            [79, 58],
            [22, 62],
            [51, 82]
        ];

        const positions =
            window.innerWidth <= 700
                ? mobile
                : desktop;

        return positions[
            index % positions.length
        ];
    }


    // ==================================================
    // STARS
    // ==================================================

    function makeStars() {

        const count =
            window.innerWidth <= 700
                ? 105
                : 190;

        const fragment =
            document.createDocumentFragment();

        const colourClasses = [
            "",
            "",
            "",
            "colour-violet",
            "colour-cyan",
            "colour-rose"
        ];

        for (let i = 0; i < count; i++) {

            const star =
                document.createElement("span");

            star.className =
                "universe-star " +
                colourClasses[
                    Math.floor(
                        Math.random() *
                        colourClasses.length
                    )
                ];

            star.style.setProperty(
                "--x",
                `${Math.random() * 100}%`
            );

            star.style.setProperty(
                "--y",
                `${Math.random() * 100}%`
            );

            star.style.setProperty(
                "--s",
                `${
                    Math.random() < .9
                        ? Math.random() * 1.4 + .45
                        : Math.random() * 2 + 1.2
                }px`
            );

            star.style.setProperty(
                "--o",
                `${Math.random() * .38 + .07}`
            );

            star.style.setProperty(
                "--d",
                `${Math.random() * 5 + 3}s`
            );

            if (
                Math.random() > .45 &&
                !reduceMotion
            ) {
                star.classList.add("twinkle");
            }

            fragment.appendChild(star);
        }

        stars.replaceChildren(fragment);
    }


    // ==================================================
    // CONSTELLATION LINES
    // ==================================================

    function renderLines() {

        const rect =
            stage.getBoundingClientRect();

        lines.setAttribute(
            "viewBox",
            `0 0 ${rect.width} ${rect.height}`
        );

        lines.innerHTML = "";

        const points =
            universe.map((item, index) => {

                const [x, y] =
                    nodePosition(
                        item,
                        index
                    );

                return {
                    x: rect.width * x / 100,
                    y: rect.height * y / 100
                };
            });

        const cx =
            rect.width / 2;

        const cy =
            rect.height / 2;


        // Every memory quietly connects
        // back toward the archive core.

        points.forEach((point, index) => {

            const path =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                );

            const bend =
                (
                    index % 2
                        ? -1
                        : 1
                ) *
                Math.min(
                    90,
                    rect.width * .07
                );

            path.setAttribute(
                "d",
                `
                M ${point.x} ${point.y}
                Q
                ${(point.x + cx) / 2 + bend}
                ${(point.y + cy) / 2 + bend}
                ${cx}
                ${cy}
                `
            );

            path.dataset.index =
                String(index);

            path.classList.add(
                "universe-line"
            );

            lines.appendChild(path);
        });


        // Secondary connections between
        // neighbouring memories.

        for (
            let i = 0;
            i < points.length - 1;
            i++
        ) {

            const a = points[i];
            const b = points[i + 1];

            const path =
                document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "path"
                );

            const mx =
                (a.x + b.x) / 2;

            const my =
                (a.y + b.y) / 2 -
                (i % 2 ? 35 : -28);

            path.setAttribute(
                "d",
                `
                M ${a.x} ${a.y}
                Q ${mx} ${my}
                ${b.x} ${b.y}
                `
            );

            path.dataset.pair =
                `${i}-${i + 1}`;

            path.classList.add(
                "universe-line"
            );

            path.style.opacity = ".48";

            lines.appendChild(path);
        }
    }


    // ==================================================
    // MEMORY LIGHTS
    // ==================================================

    function renderNodes() {

        nodes.replaceChildren();

        const fragment =
            document.createDocumentFragment();

        universe.forEach(
            (item, index) => {

                const [x, y] =
                    nodePosition(
                        item,
                        index
                    );

                const tone =
                    tones[item.tone] ||
                    tones.violet;

                const size =
                    item.size === "large"
                        ? 34
                        : item.size === "medium"
                            ? 27
                            : 22;


                const button =
                    document.createElement(
                        "button"
                    );

                button.type = "button";

                button.className =
                    "universe-node";

                button.dataset.index =
                    String(index);

                button.dataset.memoryId =
                    String(item.memoryId);

                button.setAttribute(
                    "aria-label",
                    "Open memory"
                );

                button.style.setProperty(
                    "--x",
                    `${x}%`
                );

                button.style.setProperty(
                    "--y",
                    `${y}%`
                );

                button.style.setProperty(
                    "--size",
                    `${size}px`
                );

                button.style.setProperty(
                    "--tone",
                    tone
                );


                /*
                 * IMPORTANT:
                 *
                 * There is deliberately NO
                 * title/date/description
                 * rendered beside the light.
                 *
                 * The light itself is the
                 * interface.
                 */

                button.innerHTML = `
                    <span class="node-aura"></span>
                    <span class="node-halo"></span>
                    <span class="node-core"></span>
                `;


                button.addEventListener(
                    "click",
                    () => selectMemory(index)
                );

                fragment.appendChild(button);
            }
        );

        nodes.appendChild(fragment);
    }


    // ==================================================
    // SELECT MEMORY
    // ==================================================

    function selectMemory(index) {

        const item =
            universe[index];

        if (!item) return;


        const memory =
            memories.find(
                memory =>
                    String(memory.id) ===
                    String(item.memoryId)
            );

        if (!memory) return;


        selected = {
            item,
            memory,
            index
        };


        if (detailDate) {

            detailDate.textContent =
                `${memory.date || item.date || ""}` +
                (
                    memory.time
                        ? ` · ${memory.time}`
                        : ""
                );
        }


        if (detailTitle) {

            detailTitle.textContent =
                memory.title ||
                item.title ||
                "";
        }


        if (detailText) {

            detailText.textContent =
                memory.description ||
                item.text ||
                "";
        }


        if (openMemory) {

            openMemory.style.display =
                "inline-block";

            openMemory.dataset.memoryId =
                String(memory.id);
        }


        document
            .querySelectorAll(
                ".universe-node"
            )
            .forEach(node => {

                node.classList.toggle(
                    "selected",
                    Number(
                        node.dataset.index
                    ) === index
                );
            });


        document
            .querySelectorAll(
                ".universe-line"
            )
            .forEach(line => {

                line.classList.toggle(
                    "active",
                    line.dataset.index ===
                    String(index)
                );
            });


        detail.classList.add("open");

        stage.classList.add(
            "focus-mode"
        );

        detail.setAttribute(
            "aria-hidden",
            "false"
        );
    }


    // ==================================================
    // CLOSE MEMORY
    // ==================================================

    function closeDetail() {

        selected = null;

        detail.classList.remove(
            "open"
        );

        stage.classList.remove(
            "focus-mode"
        );

        detail.setAttribute(
            "aria-hidden",
            "true"
        );


        document
            .querySelectorAll(
                ".universe-node"
            )
            .forEach(node => {

                node.classList.remove(
                    "selected"
                );
            });


        document
            .querySelectorAll(
                ".universe-line"
            )
            .forEach(line => {

                line.classList.remove(
                    "active"
                );
            });
    }


    // ==================================================
    // OPEN ACTUAL MEMORY
    // ==================================================

    function openSelectedMemory() {

        if (!selected) return;

        window.location.href =
            "memory.html?id=" +
            encodeURIComponent(
                selected.memory.id
            );
    }


    // ==================================================
    // PARALLAX
    // ==================================================

    let raf = null;

    function parallax(x, y) {

        if (reduceMotion) return;

        if (raf) {
            cancelAnimationFrame(raf);
        }

        raf =
            requestAnimationFrame(
                () => {

                    raf = null;

                    const starsList =
                        stars.children;

                    for (
                        let i = 0;
                        i < starsList.length;
                        i++
                    ) {

                        const depth =
                            (i % 7 + 1) / 7;

                        starsList[i]
                            .style
                            .setProperty(
                                "--px",
                                `${x * depth * 5}px`
                            );

                        starsList[i]
                            .style
                            .setProperty(
                                "--py",
                                `${y * depth * 5}px`
                            );
                    }


                    document
                        .querySelectorAll(
                            ".universe-node"
                        )
                        .forEach(
                            (node, index) => {

                                const depth =
                                    (index % 4 + 1) / 4;

                                node.style.setProperty(
                                    "--px",
                                    `${x * depth * 10}px`
                                );

                                node.style.setProperty(
                                    "--py",
                                    `${y * depth * 8}px`
                                );
                            }
                        );


                    const core =
                        document.querySelector(
                            ".universe-core"
                        );

                    if (core) {

                        core.style.setProperty(
                            "--px",
                            `${x * 4}px`
                        );

                        core.style.setProperty(
                            "--py",
                            `${y * 4}px`
                        );
                    }
                }
            );
    }


    // ==================================================
    // INTERACTION
    // ==================================================

    stage.addEventListener(
        "pointermove",
        event => {

            const rect =
                stage.getBoundingClientRect();

            parallax(
                (
                    (event.clientX - rect.left) /
                    rect.width
                ) * 2 - 1,

                (
                    (event.clientY - rect.top) /
                    rect.height
                ) * 2 - 1
            );
        }
    );


    stage.addEventListener(
        "pointerleave",
        () => {
            parallax(0, 0);
        }
    );


    if (closeMemory) {

        closeMemory.addEventListener(
            "click",
            closeDetail
        );
    }


    if (openMemory) {

        openMemory.addEventListener(
            "click",
            openSelectedMemory
        );
    }


    document.addEventListener(
        "keydown",
        event => {

            if (
                event.key === "Escape" &&
                selected
            ) {
                closeDetail();
            }
        }
    );


    window.addEventListener(
        "resize",
        () => {

            makeStars();
            renderLines();
        }
    );


    // ==================================================
    // INITIAL RENDER
    // ==================================================

    makeStars();
    renderNodes();
    renderLines();
            }
// ======================================================
// INITIALIZE ARCHIVE
// ======================================================

async function init() {
    setupMobileMenu();
    setupLightbox();
    setupKeyboard();
    setupArchiveNavigation();

    await loadMemories();
    await loadThings();
    await loadPlaces();
    await loadTree();

    setupRandomMemory();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
} else {
    init();
}
