/* =========================================================
   THE ARCHIVE — FINAL JAVASCRIPT
   ========================================================= */

"use strict";

let memories = [];
let lightboxItems = [];
let lightboxIndex = 0;
let lightboxMemory = null;
let lastFocusedElement = null;


/* =========================================================
   HELPERS
   ========================================================= */

function getMedia(memory) {
    if (Array.isArray(memory?.media)) return memory.media;

    if (Array.isArray(memory?.images)) {
        return memory.images.map(src => ({
            type: "image",
            src,
            caption: ""
        }));
    }

    return [];
}

function usableMedia(memory) {
    return getMedia(memory).filter(
        item => item && (item.type === "image" || item.type === "video") && item.src
    );
}

function memoryTime(memory) {
    if (!memory?.date) return 0;

    const value = memory.time
        ? `${memory.date} ${memory.time}`
        : memory.date;

    const parsed = Date.parse(value);
    if (!Number.isNaN(parsed)) return parsed;

    const dateOnly = Date.parse(memory.date);
    return Number.isNaN(dateOnly) ? 0 : dateOnly;
}

function memoryUrl(id) {
    return `memory.html?id=${encodeURIComponent(id)}`;
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


/* =========================================================
   MEMORY DATA
   ========================================================= */

async function loadMemories() {
    try {
        const response = await fetch("./data/memories.json?v=20", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Could not load memories.json");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("memories.json does not contain an array");
        }

        memories = data;

        updateMemoryCounter();
        renderTimeline();
        renderGallery();
        renderMemoryPage();
        renderLatestMemory();

    } catch (error) {
        console.error("MEMORY ERROR:", error);

        const message = '<p class="loading">Unable to load the memories.</p>';

        ["timeline", "gallery", "memoryContent", "latestMemory"].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.innerHTML = message;
        });
    }
}

function updateMemoryCounter() {
    const count = memories.length;

    const desktop = document.getElementById("memoryCount");
    const mobile = document.getElementById("mobileMemoryCount");

    if (desktop) desktop.textContent = count;
    if (mobile) mobile.textContent = count;
}


/* =========================================================
   HOME — LATEST MEMORY
   ========================================================= */

function renderLatestMemory() {
    const container = document.getElementById("latestMemory");
    if (!container) return;

    if (!memories.length) {
        container.innerHTML = `
            <div class="latest-no-photo">
                <div class="latest-no-photo-mark">—</div>
                <p>The first memory is still waiting.</p>
            </div>
        `;
        return;
    }

    const sorted = [...memories].sort((a, b) => memoryTime(b) - memoryTime(a));
    const memory = sorted[0];
    const media = usableMedia(memory);
    const first = media[0];

    const mediaHTML = first
        ? first.type === "video"
            ? `<video src="./${escapeHTML(first.src)}" muted playsinline preload="metadata" aria-label="${escapeHTML(memory.title || "Latest memory")}"></video>`
            : `<img src="./${escapeHTML(first.src)}" alt="${escapeHTML(first.caption || memory.title || "Latest memory")}" loading="lazy">`
        : `
            <div class="latest-no-photo">
                <div class="latest-no-photo-mark">—</div>
                <p>A memory kept without a photograph.</p>
            </div>
        `;

    container.innerHTML = `
        <div class="latest-media">${mediaHTML}</div>
        <div class="latest-information">
            <p class="latest-date">${escapeHTML(memory.date || "")}${memory.time ? ` · ${escapeHTML(memory.time)}` : ""}</p>
            <h2>${escapeHTML(memory.title || "Untitled memory")}</h2>
            ${memory.location ? `<p class="latest-location">${escapeHTML(memory.location)}</p>` : ""}
            ${memory.description ? `<p class="latest-excerpt">${escapeHTML(memory.description)}</p>` : ""}
            <a class="text-link" href="${memoryUrl(memory.id)}">Open memory <span>→</span></a>
        </div>
    `;
}


/* =========================================================
   OUR STORY
   ========================================================= */

function renderTimeline() {
    const timeline = document.getElementById("timeline");
    if (!timeline) return;

    const sorted = [...memories].sort((a, b) => memoryTime(b) - memoryTime(a));

    if (!sorted.length) {
        timeline.innerHTML = `
            <div class="places-empty">
                <p class="handwritten">Nothing has been written yet.</p>
                <p>The story is waiting for its first memory.</p>
            </div>
        `;
        return;
    }

    timeline.innerHTML = "";

    sorted.forEach(memory => {
        const article = document.createElement("article");
        article.className = "timeline-memory";
        article.tabIndex = 0;
        article.setAttribute("role", "link");
        article.setAttribute("aria-label", `Open memory: ${memory.title || "Untitled memory"}`);

        const meta = document.createElement("div");
        meta.className = "timeline-meta";

        if (memory.date) {
            const date = document.createElement("p");
            date.className = "timeline-date";
            date.textContent = memory.date;
            meta.appendChild(date);
        }

        if (memory.time) {
            const time = document.createElement("span");
            time.className = "timeline-time";
            time.textContent = memory.time;
            meta.appendChild(time);
        }

        article.appendChild(meta);

        const title = document.createElement("h2");
        title.textContent = memory.title || "Untitled memory";
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

        const open = () => {
            window.location.href = memoryUrl(memory.id);
        };

        article.addEventListener("click", open);
        article.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                open();
            }
        });

        timeline.appendChild(article);
    });
}


/* =========================================================
   GALLERY
   ========================================================= */

function renderGallery() {
    const gallery = document.getElementById("gallery");
    if (!gallery) return;

    gallery.innerHTML = "";
    let mediaCount = 0;

    memories.forEach(memory => {
        const items = usableMedia(memory);
        if (!items.length) return;

        const group = document.createElement("section");
        group.className = "gallery-memory";

        const heading = document.createElement("div");
        heading.className = "gallery-memory-heading";

        const title = document.createElement("h2");
        title.textContent = memory.title || "Untitled memory";
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

        items.forEach((item, index) => {
            const figure = document.createElement("figure");
            figure.className = "gallery-photo";

            if (item.type === "video") {
                figure.classList.add("is-video");

                const video = document.createElement("video");
                video.src = `./${item.src}`;
                video.preload = "metadata";
                video.muted = true;
                video.playsInline = true;
                figure.appendChild(video);
            } else {
                const image = document.createElement("img");
                image.src = `./${item.src}`;
                image.alt = item.caption || memory.title || "Memory photograph";
                image.loading = "lazy";
                figure.appendChild(image);
            }

            figure.tabIndex = 0;
            figure.setAttribute("role", "button");
            figure.setAttribute("aria-label", `Open ${item.type}`);

            const open = () => openMediaViewer(items, index, memory);

            figure.addEventListener("click", open);
            figure.addEventListener("keydown", event => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    open();
                }
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


/* =========================================================
   LIGHTBOX
   ========================================================= */

function openMediaViewer(items, index, memory) {
    if (!items?.length) return;

    lightboxItems = items;
    lightboxIndex = Math.max(0, Math.min(index, items.length - 1));
    lightboxMemory = memory || null;
    lastFocusedElement = document.activeElement;

    renderLightboxItem();

    const close = document.getElementById("lightboxClose");
    if (close) close.focus();
}

function renderLightboxItem() {
    if (!lightboxItems.length) return;

    const lightbox = document.getElementById("lightbox");
    const image = document.getElementById("lightboxImage");
    const caption = document.getElementById("lightboxCaption");
    const content = lightbox?.querySelector(".lightbox-content");

    if (!lightbox || !content) return;

    const existingVideo = content.querySelector(".lightbox-video");
    if (existingVideo) {
        existingVideo.pause();
        existingVideo.remove();
    }

    const item = lightboxItems[lightboxIndex];

    if (item.type === "video") {
        if (image) {
            image.src = "";
            image.alt = "";
            image.style.display = "none";
        }

        const video = document.createElement("video");
        video.className = "lightbox-video lightbox-media";
        video.src = `./${item.src}`;
        video.controls = true;
        video.playsInline = true;
        video.preload = "metadata";
        content.insertBefore(video, caption || null);
    } else if (image) {
        image.style.display = "block";
        image.src = `./${item.src}`;
        image.alt = item.caption || lightboxMemory?.title || "Memory photograph";
    }

    if (caption) {
        const parts = [];

        if (item.caption) parts.push(item.caption);
        if (lightboxMemory?.title) parts.push(lightboxMemory.title);

        parts.push(`${lightboxIndex + 1} / ${lightboxItems.length}`);

        caption.textContent = parts.join(" · ");
    }

    const previous = document.getElementById("lightboxPrev");
    const next = document.getElementById("lightboxNext");

    if (previous) {
        previous.disabled = lightboxIndex === 0;
    }

    if (next) {
        next.disabled = lightboxIndex === lightboxItems.length - 1;
    }

    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function changeLightbox(direction) {
    const nextIndex = lightboxIndex + direction;

    if (
        nextIndex < 0 ||
        nextIndex >= lightboxItems.length
    ) {
        return;
    }

    lightboxIndex = nextIndex;
    renderLightboxItem();
}

function openLightbox(src, caption, type = "image") {
    openMediaViewer([{ src, caption, type }], 0, null);
}

function closeLightbox() {
    const lightbox = document.getElementById("lightbox");
    const image = document.getElementById("lightboxImage");
    const caption = document.getElementById("lightboxCaption");

    if (!lightbox) return;

    const video = lightbox.querySelector(".lightbox-video");
    if (video) {
        video.pause();
        video.remove();
    }

    if (image) {
        image.src = "";
        image.style.display = "block";
    }

    if (caption) caption.textContent = "";

    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
        lastFocusedElement.focus();
    }

    lastFocusedElement = null;
    lightboxItems = [];
    lightboxMemory = null;
    lightboxIndex = 0;
}

function setupLightbox() {
    const lightbox = document.getElementById("lightbox");
    if (!lightbox) return;

    document.getElementById("lightboxClose")?.addEventListener("click", closeLightbox);
    document.getElementById("lightboxPrev")?.addEventListener("click", () => changeLightbox(-1));
    document.getElementById("lightboxNext")?.addEventListener("click", () => changeLightbox(1));

    lightbox.addEventListener("click", event => {
        if (event.target === lightbox) closeLightbox();
    });

    let touchStartX = 0;
    let touchStartY = 0;

    lightbox.addEventListener("touchstart", event => {
        const touch = event.changedTouches[0];
        touchStartX = touch.screenX;
        touchStartY = touch.screenY;
    }, { passive: true });

    lightbox.addEventListener("touchend", event => {
        const touch = event.changedTouches[0];
        const dx = touch.screenX - touchStartX;
        const dy = touch.screenY - touchStartY;

        if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;

        changeLightbox(dx < 0 ? 1 : -1);
    }, { passive: true });
}

function setupKeyboard() {
    document.addEventListener("keydown", event => {
        const lightbox = document.getElementById("lightbox");

        if (lightbox?.classList.contains("open")) {
            if (event.key === "Escape") closeLightbox();
            if (event.key === "ArrowLeft") changeLightbox(-1);
            if (event.key === "ArrowRight") changeLightbox(1);
            return;
        }
    });
}


/* =========================================================
   INDIVIDUAL MEMORY
   ========================================================= */

function renderMemoryPage() {
    const container = document.getElementById("memoryContent");
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
        container.innerHTML = '<p class="loading">Memory not selected.</p>';
        return;
    }

    const memory = memories.find(item => String(item.id) === String(id));

    if (!memory) {
        container.innerHTML = '<p class="loading">Memory not found.</p>';
        return;
    }

    const media = usableMedia(memory);
    const mediaContainer = document.createElement("div");
    mediaContainer.className = "memory-media";

    media.forEach((item, index) => {
        const figure = document.createElement("figure");
        figure.className = "memory-media-item";
        figure.classList.add(item.type === "video" ? "is-video" : "is-image");

        if (item.type === "image") {
            const image = document.createElement("img");
            image.src = `./${item.src}`;
            image.alt = item.caption || memory.title || "Memory photograph";
            image.loading = "lazy";
            figure.appendChild(image);
        } else {
            const video = document.createElement("video");
            video.src = `./${item.src}`;
            video.preload = "metadata";
            video.controls = true;
            video.muted = true;
            video.playsInline = true;

            const mark = document.createElement("span");
            mark.className = "video-mark";
            mark.textContent = "▶";
            mark.setAttribute("aria-hidden", "true");

            figure.appendChild(video);
            figure.appendChild(mark);
        }

        if (item.caption) {
            const caption = document.createElement("figcaption");
            caption.textContent = item.caption;
            figure.appendChild(caption);
        }

        figure.tabIndex = 0;
        figure.setAttribute("role", "button");
        figure.setAttribute("aria-label", `Open ${item.type}`);

        const open = event => {
            if (item.type === "video" && event.target?.tagName === "VIDEO") return;
            openMediaViewer(media, index, memory);
        };

        figure.addEventListener("click", open);
        figure.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                open(event);
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
    title.textContent = memory.title || "Untitled memory";
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

    if (memory.description) {
        const story = document.createElement("div");
        story.className = "memory-story";
        story.textContent = memory.description;
        container.appendChild(story);
    }

    setupMemoryNavigation(memory);
    document.title = `${memory.title || "Memory"} — The Archive`;
}

function setupMemoryNavigation(currentMemory) {
    const previous = document.getElementById("previousMemory");
    const next = document.getElementById("nextMemory");

    if (!previous || !next) return;

    const sorted = [...memories].sort((a, b) => memoryTime(a) - memoryTime(b));
    const index = sorted.findIndex(
        memory => String(memory.id) === String(currentMemory.id)
    );

    const setLink = (element, memory) => {
        if (!memory) {
            element.classList.add("disabled");
            element.removeAttribute("href");
            element.setAttribute("aria-hidden", "true");
            return;
        }

        element.classList.remove("disabled");
        element.removeAttribute("aria-hidden");
        element.href = memoryUrl(memory.id);
    };

    setLink(previous, index > 0 ? sorted[index - 1] : null);
    setLink(next, index >= 0 && index < sorted.length - 1 ? sorted[index + 1] : null);
}


/* =========================================================
   MOBILE NAVIGATION
   ========================================================= */

function setupMobileMenu() {
    const button = document.getElementById("menuButton");
    const menu = document.getElementById("mobileNav");

    if (!button || !menu) return;

    const close = () => {
        menu.classList.remove("open");
        menu.setAttribute("aria-hidden", "true");
        button.setAttribute("aria-expanded", "false");
        document.body.classList.remove("menu-open");
    };

    button.addEventListener("click", () => {
        const open = !menu.classList.contains("open");

        menu.classList.toggle("open", open);
        menu.setAttribute("aria-hidden", String(!open));
        button.setAttribute("aria-expanded", String(open));
        document.body.classList.toggle("menu-open", open);
    });

    menu.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", close);
    });

    menu.querySelectorAll("button").forEach(button => {
        button.addEventListener("click", close);
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape") close();
    });
}


/* =========================================================
   RANDOM MEMORY
   ========================================================= */

function setupRandomMemory() {
    const buttons = [
        document.getElementById("randomMemory"),
        document.getElementById("mobileRandomMemory")
    ].filter(Boolean);

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            if (!memories.length) return;

            const currentId = new URLSearchParams(window.location.search).get("id");
            let candidates = memories.filter(memory => String(memory.id) !== String(currentId));

            if (!candidates.length) candidates = memories;

            const selected = candidates[Math.floor(Math.random() * candidates.length)];

            if (selected) {
                window.location.href = memoryUrl(selected.id);
            }
        });
    });
}


/* =========================================================
   THINGS I LOVE ABOUT YOU
   ========================================================= */

async function loadThings() {
    const container = document.getElementById("thingsList");
    if (!container) return;

    try {
        const response = await fetch("./data/things.json?v=20", {
            cache: "no-store"
        });

        if (!response.ok) throw new Error("Could not load things.json");

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
    if (!container) return;

    if (!things.length) {
        container.innerHTML = `
            <div class="things-empty">
                <p class="handwritten">Nothing written here yet.</p>
                <p>This page is waiting for the little things worth remembering.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = things.map((thing, index) => `
        <article class="thing-entry">
            <div class="thing-number">${String(index + 1).padStart(2, "0")}</div>
            <div class="thing-body">
                <h2>${escapeHTML(thing.title || "Untitled")}</h2>
                ${thing.text || thing.description ? `<p>${escapeHTML(thing.text || thing.description)}</p>` : ""}
            </div>
        </article>
    `).join("");
}


/* =========================================================
   PLACES
   ========================================================= */

async function loadPlaces() {
    const container = document.getElementById("placesList");
    if (!container) return;

    try {
        const response = await fetch("./data/places.json?v=20", {
            cache: "no-store"
        });

        if (!response.ok) throw new Error("Could not load places.json");

        const places = await response.json();

        if (!Array.isArray(places)) {
            throw new Error("places.json does not contain an array");
        }

        renderPlaces(places);
    } catch (error) {
        console.error("PLACES ERROR:", error);
        container.innerHTML = '<p class="loading">Unable to load this page.</p>';
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
        const date = place.date || "";
        const location = place.location || "";
        const description = place.description || place.text || "";
        const image = place.image || "";

        const meta = [
            date ? `<span class="place-date">${escapeHTML(date)}</span>` : "",
            date && location ? `<span class="place-separator">·</span>` : "",
            location ? `<span class="place-location">${escapeHTML(location)}</span>` : ""
        ].join("");

        const imageHTML = image
            ? `
                <div class="place-image">
                    <img
                        src="./${escapeHTML(image)}"
                        alt="${escapeHTML(place.name || "Place")}"
                        loading="lazy"
                    >
                </div>
            `
            : "";

        return `
            <article class="place-entry">
                <div class="place-number">${String(index + 1).padStart(2, "0")}</div>
                <div class="place-body">
                    ${meta ? `<div class="place-meta">${meta}</div>` : ""}
                    <h2>${escapeHTML(place.name || "Untitled place")}</h2>
                    ${description ? `<p>${escapeHTML(description)}</p>` : ""}
                    ${imageHTML}
                </div>
            </article>
        `;
    }).join("");
}


/* =========================================================
   THE GROWING TREE
   ========================================================= */

async function loadTree() {
    const container = document.getElementById("treeMilestones");
    const leaves = document.getElementById("treeLeaves");

    if (!container) return;

    try {
        const response = await fetch("./data/tree.json?v=20", {
            cache: "no-store"
        });

        if (!response.ok) throw new Error("Could not load tree.json");

        const milestones = await response.json();

        if (!Array.isArray(milestones)) {
            throw new Error("tree.json does not contain an array");
        }

        renderTree(milestones);
    } catch (error) {
        console.error("TREE ERROR:", error);
        container.innerHTML = "";
        if (leaves) leaves.innerHTML = "";
    }
}

function renderTree(milestones) {
    const container = document.getElementById("treeMilestones");
    const leaves = document.getElementById("treeLeaves");

    if (!container) return;

    if (!milestones.length) {
        container.innerHTML = `
            <div class="tree-empty">
                <p class="handwritten">The tree is waiting.</p>
            </div>
        `;
        return;
    }

    const positions = [79, 63, 49, 36, 25, 16, 9, 4];

    container.innerHTML = milestones.map((milestone, index) => {
        const side = milestone.position === "right" ? "right" : "left";
        const top = positions[index] ?? Math.max(4, 79 - index * 8);

        return `
            <article
                class="tree-milestone ${side}"
                style="top:${top}%"
            >
                ${milestone.date ? `<div class="tree-milestone-date">${escapeHTML(milestone.date)}</div>` : ""}
                <h3>${escapeHTML(milestone.title || "Untitled moment")}</h3>
                ${milestone.text || milestone.description ? `<p>${escapeHTML(milestone.text || milestone.description)}</p>` : ""}
            </article>
        `;
    }).join("");

    if (!leaves) return;

    const leafPositions = [
        [37,20],[44,15],[51,19],[32,27],[57,29],
        [39,34],[48,31],[29,22],[62,24],[54,12],
        [35,14],[59,18],[45,25],[52,36],[31,31]
    ];

    const count = Math.min(
        leafPositions.length,
        Math.max(4, milestones.length * 4)
    );

    leaves.innerHTML = leafPositions.slice(0, count).map((position, index) => {
        const size = index % 5 === 0
            ? "large"
            : index % 3 === 0
                ? "medium"
                : "small";

        return `
            <span
                class="tree-leaf ${size}"
                style="left:${position[0]}%;top:${position[1]}%;animation-delay:${index * 80}ms"
            ></span>
        `;
    }).join("");
}


/* =========================================================
   INITIALIZE
   ========================================================= */

async function init() {
    setupMobileMenu();
    setupLightbox();
    setupKeyboard();

    await loadMemories();
    await Promise.all([
        loadThings(),
        loadPlaces(),
        loadTree()
    ]);

    setupRandomMemory();
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
    init();
}
