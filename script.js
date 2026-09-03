let memories = [];
let lightboxItems = [];
let lightboxIndex = 0;


// ======================================================
// LOAD MEMORIES
// ======================================================

async function loadMemories() {

    try {

        const response =
            await fetch("./data/memories.json?v=9", { cache: "no-store" });

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

    // One continuous photo-app style grid.
    memories.forEach(memory => {
        const media = getMedia(memory);

        media.forEach((item, index) => {
            if (item.type !== "image" && item.type !== "video") return;

            const figure = document.createElement("figure");
            figure.className = "gallery-photo";
            if (item.type === "video") figure.classList.add("is-video");

            if (item.type === "image") {
                const image = document.createElement("img");
                image.src = "./" + item.src;
                image.alt = item.caption || memory.title || "Memory photograph";
                image.loading = "lazy";
                figure.appendChild(image);
            } else {
                const video = document.createElement("video");
                video.src = "./" + item.src;
                video.preload = "metadata";
                video.muted = true;
                video.playsInline = true;
                figure.appendChild(video);
            }

            figure.addEventListener("click", () => {
                openMediaViewer(media.filter(m => m.type === "image" || m.type === "video"),
                    media.slice(0, index + 1).filter(m => m.type === "image" || m.type === "video").length - 1,
                    memory);
            });

            gallery.appendChild(figure);
            mediaCount++;
        });
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

function openMediaViewer(items, index, memory) {
    lightboxItems = items || [];
    lightboxIndex = Math.max(0, Math.min(index, lightboxItems.length - 1));
    renderLightboxItem(memory);
}

function renderLightboxItem(memory) {
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
        image.alt = item.caption || memory?.title || "Memory photograph";
    }

    if (captionElement) {
        const parts = [];
        if (item.caption) parts.push(item.caption);
        if (memory?.title) parts.push(memory.title);
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

    const mediaItems =
        prioritizeVideos(
            getMedia(memory)
        );


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

                    openLightbox(
                        item.src,
                        item.caption ||
                        memory.title ||
                        "",
                        item.type
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

                        openLightbox(
                            item.src,
                            item.caption ||
                            memory.title ||
                            "",
                            item.type
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

            if (
                event.key === "Escape"
            ) {

                closeLightbox();

            }

        }
    );

}


// ======================================================
// INITIALIZE
// ======================================================

async function init() {

    setupMobileMenu();

    setupLightbox();

    setupKeyboard();

    await loadMemories();

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
