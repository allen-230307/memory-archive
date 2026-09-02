let memories = [];


// ======================================================
// LOAD MEMORIES
// ======================================================

async function loadMemories() {

    try {

        const response =
            await fetch("data/memories.json?v=8");

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

    const gallery =
        document.getElementById(
            "gallery"
        );

    if (!gallery) {
        return;
    }


    gallery.innerHTML = "";


    let mediaCount = 0;


    memories.forEach(
        memory => {

            const media =
                prioritizeVideos(
                    getMedia(memory)
                );


            const usableMedia =
                media.filter(
                    item =>
                        item.type === "image" ||
                        item.type === "video"
                );


            // No media

            if (
                usableMedia.length === 0
            ) {
                return;
            }


            // ==================================================
            // MEMORY GROUP
            // ==================================================

            const group =
                document.createElement(
                    "section"
                );


            group.className =
                "gallery-memory";


            // ==================================================
            // HEADING
            // ==================================================

            const heading =
                document.createElement(
                    "div"
                );


            heading.className =
                "gallery-memory-heading";


            // DATE

            const date =
                document.createElement(
                    "p"
                );


            date.className =
                "gallery-date";


            date.textContent =
                memory.date || "";


            heading.appendChild(
                date
            );


            // TIME

            if (memory.time) {

                const time =
                    document.createElement(
                        "span"
                    );


                time.className =
                    "gallery-time";


                time.textContent =
                    memory.time;


                heading.appendChild(
                    time
                );

            }


            // TITLE

            const title =
                document.createElement(
                    "h2"
                );


            title.textContent =
                memory.title || "";


            heading.appendChild(
                title
            );


            // LOCATION

            if (memory.location) {

                const location =
                    document.createElement(
                        "p"
                    );


                location.className =
                    "gallery-location";


                location.textContent =
                    memory.location;


                heading.appendChild(
                    location
                );

            }


            group.appendChild(
                heading
            );


            // ==================================================
            // GRID
            // ==================================================

            const grid =
                document.createElement(
                    "div"
                );


            grid.className =
                "gallery-grid";


            usableMedia.forEach(
                item => {

                    const figure =
                        document.createElement(
                            "figure"
                        );


                    figure.className =
                        "gallery-photo";


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
                    // OPEN LIGHTBOX
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


                    grid.appendChild(
                        figure
                    );


                    mediaCount++;

                }
            );


            group.appendChild(
                grid
            );


            gallery.appendChild(
                group
            );

        }
    );


    // ==================================================
    // EMPTY GALLERY
    // ==================================================

    if (
        mediaCount === 0
    ) {

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
// LIGHTBOX
// Supports image + video.
// ======================================================

function openLightbox(
    src,
    caption,
    type
) {

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


    const content =
        lightbox.querySelector(
            ".lightbox-content"
        );


    if (!content) {
        return;
    }


    // ==================================================
    // REMOVE EXISTING LIGHTBOX VIDEO
    // ==================================================

    const existingVideo =
        content.querySelector(
            ".lightbox-video"
        );


    if (existingVideo) {

        existingVideo.pause();

        existingVideo.remove();

    }


    // ==================================================
    // VIDEO
    // ==================================================

    if (
        type === "video"
    ) {

        // Hide normal image

        if (image) {

            image.src = "";

            image.style.display =
                "none";

        }


        const video =
            document.createElement(
                "video"
            );


        video.className =
            "lightbox-video lightbox-media";


        video.controls =
            true;


        video.preload =
            "metadata";


        video.playsInline =
            true;


        const source =
            document.createElement(
                "source"
            );


        source.src =
            "./" + src;


        video.appendChild(
            source
        );


        if (captionElement) {

            content.insertBefore(
                video,
                captionElement
            );

        } else {

            content.appendChild(
                video
            );

        }

    }


    // ==================================================
    // IMAGE
    // ==================================================

    else {

        if (image) {

            image.style.display =
                "block";


            image.src =
                "./" + src;


            image.alt =
                caption || "";

        }

    }


    // ==================================================
    // CAPTION
    // ==================================================

    if (captionElement) {

        captionElement.textContent =
            caption || "";

    }


    // ==================================================
    // OPEN
    // ==================================================

    lightbox.classList.add(
        "open"
    );


    lightbox.setAttribute(
        "aria-hidden",
        "false"
    );


    /*
       Prevent the page underneath from
       scrolling while the lightbox is open.
    */

    document.body.style.overflow =
        "hidden";

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

}


// ======================================================
// LIGHTBOX SETUP
// ======================================================

function setupLightbox() {

    const lightbox =
        document.getElementById(
            "lightbox"
        );


    const closeButton =
        document.getElementById(
            "lightboxClose"
        );


    if (!lightbox) {
        return;
    }


    // Close button

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeLightbox
        );

    }


    // Click outside media

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


    button.addEventListener(
        "click",
        function () {

            sidebar.classList.toggle(
                "mobile-open"
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
