let memories = [];
let lightboxItems = [];
let lightboxIndex = 0;
let lightboxMemory = null;


// ======================================================
// LOAD MEMORIES
// ======================================================

async function loadMemories() {

    try {

        const response =
            await fetch(
                "./data/memories.json?v=11",
                {
                    cache: "no-store"
                }
            );

        if (!response.ok) {

            throw new Error(
                "Could not load memories.json"
            );

        }

        memories =
            await response.json();

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

        const message =
            '<p class="loading">Unable to load memories.</p>';

        const timeline =
            document.getElementById(
                "timeline"
            );

        const gallery =
            document.getElementById(
                "gallery"
            );

        const memoryContent =
            document.getElementById(
                "memoryContent"
            );

        if (timeline) {

            timeline.innerHTML =
                message;

        }

        if (gallery) {

            gallery.innerHTML =
                message;

        }

        if (memoryContent) {

            memoryContent.innerHTML =
                message;

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

    if (
        Array.isArray(
            memory.media
        )
    ) {

        return memory.media;

    }


    // Legacy image format

    if (
        Array.isArray(
            memory.images
        )
    ) {

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
// VIDEO PRIORITIZER
// Gallery only.
// Individual memory pages preserve JSON order.
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


            if (
                !selected ||
                selected.id === undefined ||
                selected.id === null
            ) {

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


    timeline.innerHTML =
        "";


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


            // DATE

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


            // TIME

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


            // TITLE

            const title =
                document.createElement(
                    "h2"
                );


            title.textContent =
                memory.title || "";


            article.appendChild(
                title
            );


            // LOCATION

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


            // DESCRIPTION

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


            // OPEN MEMORY

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


    gallery.innerHTML =
        "";


    let mediaCount =
        0;


    memories.forEach(
        memory => {

            const usableMedia =
                prioritizeVideos(
                    getMedia(memory).filter(
                        item =>
                            item &&
                            (
                                item.type === "image" ||
                                item.type === "video"
                            )
                    )
                );


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


            // DATE + TIME

            const dateTime =
                document.createElement(
                    "p"
                );


            dateTime.className =
                "gallery-date-time";


            if (memory.date) {

                const date =
                    document.createElement(
                        "span"
                    );


                date.className =
                    "gallery-date";


                date.textContent =
                    memory.date;


                dateTime.appendChild(
                    date
                );

            }


            if (memory.time) {

                const time =
                    document.createElement(
                        "span"
                    );


                time.className =
                    "gallery-time";


                time.textContent =
                    memory.time;


                dateTime.appendChild(
                    time
                );

            }


            if (
                dateTime.textContent.trim()
            ) {

                heading.appendChild(
                    dateTime
                );

            }


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
                (item, index) => {

                    const figure =
                        document.createElement(
                            "figure"
                        );


                    figure.className =
                        "gallery-photo";


                    // VIDEO

                    if (
                        item.type === "video"
                    ) {

                        figure.classList.add(
                            "is-video"
                        );


                        const video =
                            document.createElement(
                                "video"
                            );


                        video.src =
                            "./" + item.src;


                        video.preload =
                            "metadata";


                        video.muted =
                            true;


                        video.playsInline =
                            true;


                        figure.appendChild(
                            video
                        );

                    }


                    // IMAGE

                    else {

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


                    // OPEN FULL VIEWER

                    figure.addEventListener(
                        "click",
                        function () {

                            openMediaViewer(
                                usableMedia,
                                index,
                                memory
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


    // EMPTY GALLERY

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
// OPEN MEDIA VIEWER
// ======================================================

function openMediaViewer(
    items,
    index,
    memory
) {

    lightboxItems =
        Array.isArray(items)
            ? items
            : [];


    if (
        !lightboxItems.length
    ) {

        return;

    }


    lightboxIndex =
        Math.max(
            0,
            Math.min(
                Number(index) || 0,
                lightboxItems.length - 1
            )
        );


    lightboxMemory =
        memory || null;


    renderLightboxItem();

}


// ======================================================
// RENDER LIGHTBOX ITEM
// ======================================================

function renderLightboxItem() {

    if (
        !lightboxItems.length
    ) {

        return;

    }


    const item =
        lightboxItems[
            lightboxIndex
        ];


    if (!item) {

        return;

    }


    const lightbox =
        document.getElementById(
            "lightbox"
        );


    if (!lightbox) {

        return;

    }


    const image =
        document.getElementById(
            "lightboxImage"
        );


    const captionElement =
        document.getElementById(
            "lightboxCaption"
        );


    const content =
        lightbox.querySelector(
            ".lightbox-content"
        );


    if (!content) {

        return;

    }


    // Remove previous video

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
        item.type === "video"
    ) {

        if (image) {

            image.src =
                "";

            image.style.display =
                "none";

        }


        const video =
            document.createElement(
                "video"
            );


        video.className =
            "lightbox-video lightbox-media";


        video.src =
            "./" + item.src;


        video.controls =
            true;


        video.playsInline =
            true;


        video.preload =
            "metadata";


        content.insertBefore(
            video,
            captionElement || null
        );

    }


    // ==================================================
    // IMAGE
    // ==================================================

    else if (image) {

        image.style.display =
            "block";


        image.src =
            "./" + item.src;


        image.alt =
            item.caption ||
            (
                lightboxMemory &&
                lightboxMemory.title
            ) ||
            "Memory photograph";

    }


    // ==================================================
    // CAPTION
    // ==================================================

    if (captionElement) {

        const parts =
            [];


        if (item.caption) {

            parts.push(
                item.caption
            );

        }


        if (
            lightboxMemory &&
            lightboxMemory.title
        ) {

            parts.push(
                lightboxMemory.title
            );

        }


        parts.push(
            `${lightboxIndex + 1} / ${lightboxItems.length}`
        );


        captionElement.textContent =
            parts.join(
                " · "
            );

    }


    // ==================================================
    // PREVIOUS / NEXT
    // ==================================================

    const previous =
        document.getElementById(
            "lightboxPrev"
        );


    const next =
        document.getElementById(
            "lightboxNext"
        );


    if (previous) {

        previous.disabled =
            lightboxIndex <= 0;

    }


    if (next) {

        next.disabled =
            lightboxIndex >=
            lightboxItems.length - 1;

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


    document.body.style.overflow =
        "hidden";

}


// ======================================================
// CHANGE LIGHTBOX
// ======================================================

function changeLightbox(
    direction
) {

    if (
        !lightboxItems.length
    ) {

        return;

    }


    const nextIndex =
        lightboxIndex +
        direction;


    if (
        nextIndex < 0 ||
        nextIndex >= lightboxItems.length
    ) {

        return;

    }


    lightboxIndex =
        nextIndex;


    renderLightboxItem();

}


// ======================================================
// SIMPLE LIGHTBOX OPENER
// ======================================================

function openLightbox(
    src,
    caption,
    type
) {

    openMediaViewer(
        [
            {
                src: src,
                caption: caption,
                type: type
            }
        ],
        0,
        null
    );

}


// ======================================================
// CLOSE LIGHTBOX
// ======================================================

function closeLightbox() {

    const lightbox =
        document.getElementById(
            "lightbox"
        );


    if (!lightbox) {

        return;

    }


    const image =
        document.getElementById(
            "lightboxImage"
        );


    const captionElement =
        document.getElementById(
            "lightboxCaption"
        );


    const video =
        lightbox.querySelector(
            ".lightbox-video"
        );


    // STOP VIDEO

    if (video) {

        video.pause();

        video.remove();

    }


    // CLOSE

    lightbox.classList.remove(
        "open"
    );


    lightbox.setAttribute(
        "aria-hidden",
        "true"
    );


    // RESET IMAGE

    if (image) {

        image.src =
            "";

        image.style.display =
            "block";

    }


    // RESET CAPTION

    if (captionElement) {

        captionElement.textContent =
            "";

    }


    // RESTORE SCROLLING

    document.body.style.overflow =
        "";


    lightboxItems =
        [];


    lightboxIndex =
        0;


    lightboxMemory =
        null;

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


    const previousButton =
        document.getElementById(
            "lightboxPrev"
        );


    const nextButton =
        document.getElementById(
            "lightboxNext"
        );


    if (!lightbox) {

        return;

    }


    // CLOSE BUTTON

    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeLightbox
        );

    }


    // PREVIOUS

    if (previousButton) {

        previousButton.addEventListener(
            "click",
            function () {

                changeLightbox(
                    -1
                );

            }
        );

    }


    // NEXT

    if (nextButton) {

        nextButton.addEventListener(
            "click",
            function () {

                changeLightbox(
                    1
                );

            }
        );

    }


    // BACKGROUND CLICK

    lightbox.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                lightbox
            ) {

                closeLightbox();

            }

        }
    );


    // ==================================================
    // SWIPE
    // ==================================================

    let touchStartX =
        0;


    lightbox.addEventListener(
        "touchstart",
        function (event) {

            if (
                event.changedTouches &&
                event.changedTouches[0]
            ) {

                touchStartX =
                    event.changedTouches[0]
                        .screenX;

            }

        },
        {
            passive: true
        }
    );


    lightbox.addEventListener(
        "touchend",
        function (event) {

            if (
                !event.changedTouches ||
                !event.changedTouches[0]
            ) {

                return;

            }


            const delta =
                event.changedTouches[0]
                    .screenX -
                touchStartX;


            if (
                Math.abs(delta) < 50
            ) {

                return;

            }


            if (
                delta < 0
            ) {

                changeLightbox(
                    1
                );

            } else {

                changeLightbox(
                    -1
                );

            }

        },
        {
            passive: true
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


    const params =
        new URLSearchParams(
            window.location.search
        );


    const id =
        params.get(
            "id"
        );


    if (id === null) {

        container.innerHTML =
            '<p class="loading">Memory not selected.</p>';

        return;

    }


    const memory =
        memories.find(
            item =>
                String(item.id) ===
                String(id)
        );


    if (!memory) {

        container.innerHTML =
            '<p class="loading">Memory not found.</p>';

        return;

    }


    // IMPORTANT:
    // Individual memory pages preserve
    // exact JSON media order.

    const mediaItems =
        getMedia(memory);


    const usableMedia =
        mediaItems.filter(
            media =>
                media &&
                (
                    media.type === "image" ||
                    media.type === "video"
                )
        );


    const mediaContainer =
        document.createElement(
            "div"
        );


    mediaContainer.className =
        "memory-media";


    usableMedia.forEach(
        (item, index) => {

            const figure =
                document.createElement(
                    "figure"
                );


            figure.className =
                "memory-media-item";


            figure.classList.add(
                "media-" +
                item.type
            );


            figure.classList.add(
                "media-" +
                (index + 1)
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

            else {

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


                video.controls =
                    true;


                video.playsInline =
                    true;


                /*
                 * Clicking the actual video controls
                 * should keep the video usable.
                 */

                video.addEventListener(
                    "click",
                    function (event) {

                        event.stopPropagation();

                    }
                );


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

                    openMediaViewer(
                        usableMedia,
                        index,
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


                        openMediaViewer(
                            usableMedia,
                            index,
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

    container.innerHTML =
        "";


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
        mediaContainer.children.length
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


    if (
        !previous ||
        !next
    ) {

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

    if (
        index > 0
    ) {

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
        index <
            sorted.length - 1
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


    if (
        !button ||
        !sidebar
    ) {

        return;

    }


    button.setAttribute(
        "aria-expanded",
        "false"
    );


    button.addEventListener(
        "click",
        function () {

            const isOpen =
                sidebar.classList.toggle(
                    "mobile-open"
                );


            button.setAttribute(
                "aria-expanded",
                String(isOpen)
            );

        }
    );


    sidebar
        .querySelectorAll(
            ".nav-link"
        )
        .forEach(
            function (link) {

                link.addEventListener(
                    "click",
                    function () {

                        sidebar.classList.remove(
                            "mobile-open"
                        );


                        button.setAttribute(
                            "aria-expanded",
                            "false"
                        );

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

            const lightbox =
                document.getElementById(
                    "lightbox"
                );


            const isOpen =
                lightbox &&
                lightbox.classList.contains(
                    "open"
                );


            if (
                event.key === "Escape"
            ) {

                if (isOpen) {

                    closeLightbox();

                }

            }


            else if (
                isOpen &&
                event.key === "ArrowLeft"
            ) {

                changeLightbox(
                    -1
                );

            }


            else if (
                isOpen &&
                event.key === "ArrowRight"
            ) {

                changeLightbox(
                    1
                );

            }

        }
    );

}


// ======================================================
// THINGS I LOVE ABOUT YOU
// ======================================================

async function loadThings() {

    const container =
        document.getElementById(
            "thingsList"
        );


    if (!container) {

        return;

    }


    try {

        const response =
            await fetch(
                "./data/things.json?v=2",
                {
                    cache: "no-store"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Could not load things.json"
            );

        }


        const things =
            await response.json();


        if (
            !Array.isArray(things)
        ) {

            throw new Error(
                "things.json does not contain an array"
            );

        }


        renderThings(
            things
        );

    } catch (error) {

        console.error(
            "THINGS ERROR:",
            error
        );


        container.innerHTML =
            '<p class="loading">Unable to load this page.</p>';

    }

}


// ======================================================
// RENDER THINGS
// ======================================================

function renderThings(
    things
) {

    const container =
        document.getElementById(
            "thingsList"
        );


    if (!container) {

        return;

    }


    if (
        !things.length
    ) {

        container.innerHTML = `
            <div class="things-empty">
                <p class="handwritten">
                    Nothing written here yet.
                </p>

                <p>
                    This page is waiting for
                    the things that only belong here.
                </p>
            </div>
        `;

        return;

    }


    container.innerHTML =
        things
            .map(
                (thing, index) => {

                    const number =
                        String(
                            index + 1
                        ).padStart(
                            2,
                            "0"
                        );


                    const title =
                        escapeHTML(
                            thing.title ||
                            "Untitled"
                        );


                    const text =
                        escapeHTML(
                            thing.text ||
                            thing.description ||
                            ""
                        );


                    const date =
                        thing.date
                            ? `
                                <span class="thing-date">
                                    ${escapeHTML(
                                        thing.date
                                    )}
                                </span>
                              `
                            : "";


                    return `
                        <article class="thing-entry">

                            <div class="thing-number">
                                ${number}
                            </div>

                            <div class="thing-body">

                                <div class="thing-meta">
                                    ${date}
                                </div>

                                <h2>
                                    ${title}
                                </h2>

                                <p>
                                    ${text}
                                </p>

                            </div>

                        </article>
                    `;

                }
            )
            .join("");

}


// ======================================================
// PLACES WE'VE BEEN
// ======================================================

async function loadPlaces() {

    const container =
        document.getElementById(
            "placesList"
        );


    if (!container) {

        return;

    }


    try {

        const response =
            await fetch(
                "./data/places.json?v=2",
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


        if (
            !Array.isArray(places)
        ) {

            throw new Error(
                "places.json does not contain an array"
            );

        }


        renderPlaces(
            places
        );

    } catch (error) {

        console.error(
            "PLACES ERROR:",
            error
        );


        container.innerHTML =
            '<p class="loading">Unable to load this page.</p>';

    }

}


// ======================================================
// RENDER PLACES
// ======================================================

function renderPlaces(
    places
) {

    const container =
        document.getElementById(
            "placesList"
        );


    if (!container) {

        return;

    }


    if (
        !places.length
    ) {

        container.innerHTML = `
            <div class="places-empty">

                <p class="handwritten">
                    No places written here yet.
                </p>

                <p>
                    This page is waiting for
                    the places that became part
                    of our story.
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
                        String(
                            index + 1
                        ).padStart(
                            2,
                            "0"
                        );


                    const name =
                        escapeHTML(
                            place.name ||
                            "Untitled place"
                        );


                    const date =
                        place.date ||
                        "";


                    const location =
                        place.location ||
                        "";


                    const description =
                        place.description ||
                        place.text ||
                        "";


                    const image =
                        place.image ||
                        "";


                    const metaParts =
                        [];


                    // DATE

                    if (date) {

                        metaParts.push(
                            `
                                <span class="place-date">
                                    ${escapeHTML(
                                        date
                                    )}
                                </span>
                            `
                        );

                    }


                    // SEPARATOR

                    if (
                        date &&
                        location
                    ) {

                        metaParts.push(
                            `
                                <span class="place-separator">
                                    ·
                                </span>
                            `
                        );

                    }


                    // LOCATION

                    if (location) {

                        metaParts.push(
                            `
                                <span class="place-location">
                                    ${escapeHTML(
                                        location
                                    )}
                                </span>
                            `
                        );

                    }


                    // IMAGE

                    const imageHTML =
                        image
                            ? `
                                <div class="place-image">

                                    <img
                                        src="./${escapeHTML(
                                            image
                                        )}"
                                        alt="${name}"
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
                                    ${name}
                                </h2>

                                ${
                                    description
                                        ? `
                                            <p>
                                                ${escapeHTML(
                                                    description
                                                )}
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


// ======================================================
// NAVIGATION ROUTING
// ======================================================

function setupArchiveNavigation() {

    document
        .querySelectorAll(
            ".nav-link"
        )
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


// ======================================================
// THE GROWING TREE
// ======================================================

async function loadTree() {

    const container =
        document.getElementById(
            "treeMilestones"
        );


    const leaves =
        document.getElementById(
            "treeLeaves"
        );


    if (!container) {

        return;

    }


    try {

        const response =
            await fetch(
                "./data/tree.json?v=2",
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


        if (
            !Array.isArray(
                milestones
            )
        ) {

            throw new Error(
                "tree.json does not contain an array"
            );

        }


        renderTree(
            milestones
        );

    } catch (error) {

        console.error(
            "TREE ERROR:",
            error
        );


        container.innerHTML =
            "";


        if (leaves) {

            leaves.innerHTML =
                "";

        }

    }

}


// ======================================================
// RENDER TREE
// ======================================================

function renderTree(
    milestones
) {

    const container =
        document.getElementById(
            "treeMilestones"
        );


    const leaves =
        document.getElementById(
            "treeLeaves"
        );


    if (!container) {

        return;

    }


    // Vertical positions

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
                        milestone.position ===
                        "right"
                            ? "right"
                            : "left";


                    const top =
                        positions[index] !==
                        undefined
                            ? positions[index]
                            : Math.max(
                                4,
                                79 -
                                (
                                    index *
                                    8
                                )
                            );


                    const date =
                        milestone.date ||
                        "";


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
                                            ${escapeHTML(
                                                date
                                            )}
                                        </div>
                                      `
                                    : ""
                            }

                            <h3>
                                ${escapeHTML(
                                    title
                                )}
                            </h3>

                            ${
                                text
                                    ? `
                                        <p>
                                            ${escapeHTML(
                                                text
                                            )}
                                        </p>
                                      `
                                    : ""
                            }

                        </article>
                    `;

                }
            )
            .join("");


    // ==================================================
    // TREE LEAVES
    // ==================================================

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
            .slice(
                0,
                leafCount
            )
            .map(
                (position, index) => {

                    let size =
                        "small";


                    if (
                        index % 5 ===
                        0
                    ) {

                        size =
                            "large";

                    }


                    else if (
                        index % 3 ===
                        0
                    ) {

                        size =
                            "medium";

                    }


                    return `
                        <span
                            class="tree-leaf ${size}"
                            style="
                                left: ${position[0]}%;
                                top: ${position[1]}%;
                                animation-delay: ${index * 90}ms;
                            "
                        ></span>
                    `;

                }
            )
            .join("");

}


// ======================================================
// SAFE TEXT HELPER
// ======================================================

function escapeHTML(
    value
) {

    return String(
        value
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


// ======================================================
// INITIALIZE
// IMPORTANT:
// THERE IS ONLY ONE INIT FUNCTION.
// ======================================================

async function init() {

    setupMobileMenu();

    setupLightbox();

    setupKeyboard();

    setupArchiveNavigation();


    // Load all page data.

    await loadMemories();

    await loadThings();

    await loadPlaces();

    await loadTree();


    // Random memory button.

    setupRandomMemory();

}


// ======================================================
// WAIT FOR DOM
// IMPORTANT:
// THERE IS ONLY ONE DOMContentLoaded HANDLER.
// ======================================================

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        init,
        {
            once: true
        }
    );

} else {

    init();

}
