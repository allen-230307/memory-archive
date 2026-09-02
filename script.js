let memories = [];

/* ======================================================
   LOAD MEMORIES
   ====================================================== */

async function loadMemories() {
    try {
        const response = await fetch("./data/memories.json", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Could not load memories.json");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("memories.json must contain an array");
        }

        memories = data;

        updateMemoryCounter();
        renderTimeline();
        renderGallery();
        renderMemoryPage();

    } catch (error) {
        console.error("Memory loading error:", error);

        const message = `
            <p class="loading">
                Unable to load memories.
            </p>
        `;

        const timeline = document.getElementById("timeline");
        const gallery = document.getElementById("gallery");
        const memoryContent = document.getElementById("memoryContent");

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


/* ======================================================
   MEMORY COUNTER
   ====================================================== */

function updateMemoryCounter() {
    const counter = document.getElementById("memoryCount");

    if (counter) {
        counter.textContent = memories.length;
    }
}


/* ======================================================
   MEDIA HELPER
   ====================================================== */

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


/* ======================================================
   MEDIA URL
   ====================================================== */

function mediaURL(src) {
    if (!src) return "";

    if (
        src.startsWith("http://") ||
        src.startsWith("https://") ||
        src.startsWith("/")
    ) {
        return src;
    }

    return "./" + src.replace(/^\.?\//, "");
}


/* ======================================================
   VIDEO PRIORITY
   ====================================================== */

function prioritizeVideos(media) {
    return [...media].sort((a, b) => {
        if (a.type === "video" && b.type !== "video") {
            return -1;
        }

        if (a.type !== "video" && b.type === "video") {
            return 1;
        }

        return 0;
    });
}


/* ======================================================
   DATE + TIME
   ====================================================== */

function memoryTime(memory) {
    if (!memory.date) {
        return 0;
    }

    const fullDate = memory.time
        ? `${memory.date} ${memory.time}`
        : memory.date;

    const parsed = Date.parse(fullDate);

    if (!isNaN(parsed)) {
        return parsed;
    }

    const dateOnly = Date.parse(memory.date);

    return isNaN(dateOnly) ? 0 : dateOnly;
}


/* ======================================================
   RANDOM MEMORY
   ====================================================== */

function setupRandomMemory() {
    const button = document.getElementById("randomMemory");

    if (!button) {
        return;
    }

    button.addEventListener("click", () => {
        if (memories.length === 0) {
            return;
        }

        const index = Math.floor(
            Math.random() * memories.length
        );

        const selected = memories[index];

        if (!selected || selected.id === undefined) {
            return;
        }

        window.location.href =
            "memory.html?id=" +
            encodeURIComponent(selected.id);
    });
}


/* ======================================================
   OUR STORY
   ====================================================== */

function renderTimeline() {
    const timeline = document.getElementById("timeline");

    if (!timeline) {
        return;
    }

    timeline.innerHTML = "";

    const sorted = [...memories].sort(
        (a, b) => memoryTime(b) - memoryTime(a)
    );

    sorted.forEach(memory => {

        const article = document.createElement("article");
        article.className = "timeline-memory";

        /* DATE */

        const date = document.createElement("p");
        date.className = "timeline-date";
        date.textContent = memory.date || "";

        article.appendChild(date);


        /* TIME */

        if (memory.time) {
            const time = document.createElement("span");
            time.className = "timeline-time";
            time.textContent = memory.time;

            article.appendChild(time);
        }


        /* TITLE */

        const title = document.createElement("h2");
        title.textContent = memory.title || "";

        article.appendChild(title);


        /* LOCATION */

        if (memory.location) {
            const location = document.createElement("p");
            location.className = "timeline-location";
            location.textContent = memory.location;

            article.appendChild(location);
        }


        /* DESCRIPTION */

        if (memory.description) {
            const description = document.createElement("p");
            description.className = "timeline-description";
            description.textContent = memory.description;

            article.appendChild(description);
        }


        /* OPEN MEMORY */

        article.addEventListener("click", () => {
            window.location.href =
                "memory.html?id=" +
                encodeURIComponent(memory.id);
        });

        timeline.appendChild(article);
    });
}


/* ======================================================
   GALLERY
   ====================================================== */

function renderGallery() {
    const gallery = document.getElementById("gallery");

    if (!gallery) {
        return;
    }

    gallery.innerHTML = "";

    let mediaCount = 0;

    memories.forEach(memory => {

        const media = prioritizeVideos(
            getMedia(memory)
        );

        const usableMedia = media.filter(
            item =>
                item &&
                (item.type === "image" ||
                 item.type === "video") &&
                item.src
        );

        if (usableMedia.length === 0) {
            return;
        }


        /* MEMORY GROUP */

        const group = document.createElement("section");
        group.className = "gallery-memory";


        /* HEADING */

        const heading = document.createElement("div");
        heading.className = "gallery-memory-heading";


        /* DATE */

        const date = document.createElement("p");
        date.className = "gallery-date";
        date.textContent = memory.date || "";

        heading.appendChild(date);


        /* TIME */

        if (memory.time) {
            const time = document.createElement("span");
            time.className = "gallery-time";
            time.textContent = memory.time;

            heading.appendChild(time);
        }


        /* TITLE */

        const title = document.createElement("h2");
        title.textContent = memory.title || "";

        heading.appendChild(title);


        /* LOCATION */

        if (memory.location) {
            const location = document.createElement("p");
            location.className = "gallery-location";
            location.textContent = memory.location;

            heading.appendChild(location);
        }

        group.appendChild(heading);


        /* GRID */

        const grid = document.createElement("div");
        grid.className = "gallery-grid";


        usableMedia.forEach(item => {

            const figure = document.createElement("figure");
            figure.className = "gallery-photo";


            /* IMAGE */

            if (item.type === "image") {

                const image = document.createElement("img");

                image.src = mediaURL(item.src);

                image.alt =
                    item.caption ||
                    memory.title ||
                    "Memory photograph";

                image.loading = "lazy";

                figure.appendChild(image);
            }


            /* VIDEO */

            if (item.type === "video") {

                figure.classList.add("is-video");

                const video = document.createElement("video");

                video.src = mediaURL(item.src);
                video.preload = "metadata";
                video.muted = true;
                video.playsInline = true;

                figure.appendChild(video);
            }


            /* CAPTION */

            if (item.caption) {

                const caption =
                    document.createElement("figcaption");

                caption.textContent = item.caption;

                figure.appendChild(caption);
            }


            /* LIGHTBOX */

            figure.addEventListener("click", () => {
                openLightbox(
                    item.src,
                    item.caption || memory.title || "",
                    item.type
                );
            });

            grid.appendChild(figure);

            mediaCount++;
        });


        group.appendChild(grid);
        gallery.appendChild(group);
    });


    /* EMPTY */

    if (mediaCount === 0) {
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


/* ======================================================
   LIGHTBOX
   ====================================================== */

function openLightbox(src, caption, type) {

    const lightbox =
        document.getElementById("lightbox");

    if (!lightbox) {
        return;
    }

    const content =
        lightbox.querySelector(".lightbox-content");

    if (!content) {
        return;
    }

    const image =
        document.getElementById("lightboxImage");

    const captionElement =
        document.getElementById("lightboxCaption");


    /* REMOVE OLD VIDEO */

    const oldVideo =
        content.querySelector(".lightbox-video");

    if (oldVideo) {
        oldVideo.pause();
        oldVideo.remove();
    }


    /* VIDEO */

    if (type === "video") {

        if (image) {
            image.style.display = "none";
            image.src = "";
        }

        const video =
            document.createElement("video");

        video.className =
            "lightbox-video lightbox-media";

        video.src = mediaURL(src);

        video.controls = true;
        video.preload = "metadata";
        video.playsInline = true;

        content.insertBefore(
            video,
            captionElement
        );

    }

    /* IMAGE */

    else {

        if (image) {
            image.style.display = "block";
            image.src = mediaURL(src);
            image.alt = caption || "";
        }
    }


    /* CAPTION */

    if (captionElement) {
        captionElement.textContent =
            caption || "";
    }


    /* OPEN */

    lightbox.classList.add("open");

    lightbox.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow = "hidden";
}


/* ======================================================
   CLOSE LIGHTBOX
   ====================================================== */

function closeLightbox() {

    const lightbox =
        document.getElementById("lightbox");

    if (!lightbox) {
        return;
    }

    const image =
        document.getElementById("lightboxImage");

    const captionElement =
        document.getElementById("lightboxCaption");


    /* STOP VIDEO */

    const video =
        lightbox.querySelector(".lightbox-video");

    if (video) {
        video.pause();
        video.remove();
    }


    /* CLOSE */

    lightbox.classList.remove("open");

    lightbox.setAttribute(
        "aria-hidden",
        "true"
    );


    /* RESET IMAGE */

    if (image) {
        image.src = "";
        image.style.display = "block";
    }


    /* RESET CAPTION */

    if (captionElement) {
        captionElement.textContent = "";
    }


    document.body.style.overflow = "";
}


/* ======================================================
   LIGHTBOX SETUP
   ====================================================== */

function setupLightbox() {

    const lightbox =
        document.getElementById("lightbox");

    if (!lightbox) {
        return;
    }

    const closeButton =
        document.getElementById("lightboxClose");


    if (closeButton) {
        closeButton.addEventListener(
            "click",
            closeLightbox
        );
    }


    lightbox.addEventListener(
        "click",
        event => {

            if (event.target === lightbox) {
                closeLightbox();
            }

        }
    );
}


/* ======================================================
   INDIVIDUAL MEMORY PAGE
   ====================================================== */

function renderMemoryPage() {

    const container =
        document.getElementById("memoryContent");

    if (!container) {
        return;
    }


    /* GET ID */

    const params =
        new URLSearchParams(
            window.location.search
        );

    const id = params.get("id");


    if (!id) {

        container.innerHTML = `
            <p class="loading">
                Memory not selected.
            </p>
        `;

        return;
    }


    /* FIND MEMORY */

    const memory =
        memories.find(
            item =>
                String(item.id) === String(id)
        );


    if (!memory) {

        container.innerHTML = `
            <p class="loading">
                Memory not found.
            </p>
        `;

        return;
    }


    /* CLEAR */

    container.innerHTML = "";


    /* DATE */

    const date =
        document.createElement("p");

    date.className = "memory-date";
    date.textContent = memory.date || "";

    container.appendChild(date);


    /* TIME */

    if (memory.time) {

        const time =
            document.createElement("p");

        time.className = "memory-time";
        time.textContent = memory.time;

        container.appendChild(time);
    }


    /* TITLE */

    const title =
        document.createElement("h1");

    title.textContent =
        memory.title || "";

    container.appendChild(title);


    /* LOCATION */

    if (memory.location) {

        const location =
            document.createElement("p");

        location.className =
            "memory-location";

        location.textContent =
            memory.location;

        container.appendChild(location);
    }


    /* MEDIA */

    const mediaContainer =
        document.createElement("div");

    mediaContainer.className =
        "memory-media";


    const mediaItems =
        prioritizeVideos(
            getMedia(memory)
        );


    mediaItems.forEach((item, index) => {

        if (
            !item ||
            !item.src ||
            (item.type !== "image" &&
             item.type !== "video")
        ) {
            return;
        }


        const figure =
            document.createElement("figure");

        figure.className =
            "memory-media-item";

        figure.classList.add(
            "media-" + item.type
        );

        figure.classList.add(
            "media-" + (index + 1)
        );


        /* IMAGE */

        if (item.type === "image") {

            const image =
                document.createElement("img");

            image.src =
                mediaURL(item.src);

            image.alt =
                item.caption ||
                memory.title ||
                "Memory photograph";

            image.loading = "lazy";

            figure.appendChild(image);
        }


        /* VIDEO */

        if (item.type === "video") {

            figure.classList.add("is-video");

            const video =
                document.createElement("video");

            video.src =
                mediaURL(item.src);

            video.preload = "metadata";
            video.muted = true;
            video.playsInline = true;

            figure.appendChild(video);
        }


        /* CAPTION */

        if (item.caption) {

            const caption =
                document.createElement("figcaption");

            caption.textContent =
                item.caption;

            figure.appendChild(caption);
        }


        /* CLICK */

        figure.addEventListener(
            "click",
            () => {

                openLightbox(
                    item.src,
                    item.caption ||
                    memory.title ||
                    "",
                    item.type
                );

            }
        );


        /* KEYBOARD */

        figure.setAttribute(
            "tabindex",
            "0"
        );

        figure.addEventListener(
            "keydown",
            event => {

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


        mediaContainer.appendChild(figure);
    });


    /* ADD MEDIA */

    if (mediaContainer.children.length > 0) {
        container.appendChild(mediaContainer);
    }


    /* STORY */

    if (memory.description) {

        const story =
            document.createElement("div");

        story.className =
            "memory-story";

        story.textContent =
            memory.description;

        container.appendChild(story);
    }


    /* PREVIOUS / NEXT */

    setupMemoryNavigation(memory);
}


/* ======================================================
   MEMORY NAVIGATION
   ====================================================== */

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


    /* PREVIOUS */

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


    /* NEXT */

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


/* ======================================================
   MOBILE MENU
   ====================================================== */

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


    button.setAttribute(
        "aria-expanded",
        "false"
    );


    button.addEventListener(
        "click",
        event => {

            event.stopPropagation();

            const isOpen =
                sidebar.classList.toggle(
                    "mobile-open"
                );

            button.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

            button.setAttribute(
                "aria-label",
                isOpen
                    ? "Close navigation"
                    : "Open navigation"
            );
        }
    );


    /* CLOSE AFTER NAVIGATION */

    sidebar
        .querySelectorAll(".nav-link")
        .forEach(link => {

            link.addEventListener(
                "click",
                () => {

                    sidebar.classList.remove(
                        "mobile-open"
                    );

                    button.setAttribute(
                        "aria-expanded",
                        "false"
                    );

                    button.setAttribute(
                        "aria-label",
                        "Open navigation"
                    );
                }
            );
        });


    /* CLICK OUTSIDE */

    document.addEventListener(
        "click",
        event => {

            if (
                sidebar.classList.contains(
                    "mobile-open"
                ) &&
                !sidebar.contains(event.target) &&
                event.target !== button
            ) {

                sidebar.classList.remove(
                    "mobile-open"
                );

                button.setAttribute(
                    "aria-expanded",
                    "false"
                );
            }
        }
    );
}


/* ======================================================
   KEYBOARD
   ====================================================== */

function setupKeyboard() {

    document.addEventListener(
        "keydown",
        event => {

            if (event.key === "Escape") {
                closeLightbox();
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

    await loadMemories();

    setupRandomMemory();
}


/* ======================================================
   DOM READY
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
