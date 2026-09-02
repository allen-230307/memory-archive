let memories = [];


// ======================================================
// LOAD MEMORIES
// ======================================================

async function loadMemories() {

    try {

        const response =
            await fetch("data/memories.json?v=8");

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
// MEDIA SORTING
// Videos first, then images.
// Original order is preserved within each type.
// ======================================================

function prioritizeVideos(media) {

    return [...media].sort(
        (a, b) => {

            const aIsVideo =
                a.type === "video";

            const bIsVideo =
                b.type === "video";


            if (aIsVideo && !bIsVideo) {
                return -1;
            }


            if (!aIsVideo && bIsVideo) {
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
        Date.parse(fullDateString);


    if (!isNaN(parsedTime)) {
        return parsedTime;
    }


    const dateOnly =
        Date.parse(memory.date);


    return isNaN(dateOnly)
        ? 0
        : dateOnly;

}


// ======================================================
// RANDOM MEMORY
// ======================================================

function setupRandomMemory() {

    const button =
        document.getElementById("randomMemory");

    if (!button) return;


    button.onclick =
        function () {

            if (memories.length === 0) {
                return;
            }


            const index =
                Math.floor(
                    Math.random() * memories.length
                );


            const selected =
                memories[index];


            window.location.href =
                "memory.html?id=" +
                selected.id;

        };

}


// ======================================================
// OUR STORY — TEXT-ONLY TIMELINE
// ======================================================

function renderTimeline() {

    const timeline =
        document.getElementById("timeline");

    if (!timeline) return;


    timeline.innerHTML = "";


    // Newest first

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


        // ==================================================
        // DATE
        // ==================================================

        const date =
            document.createElement("p");


        date.className =
            "timeline-date";


        date.textContent =
            memory.date || "";


        article.appendChild(date);


        // ==================================================
        // TIME
        // ==================================================

        if (memory.time) {

            const time =
                document.createElement("span");


            time.className =
                "timeline-time";


            time.textContent =
                memory.time;


            article.appendChild(time);

        }


        // ==================================================
        // TITLE
        // ==================================================

        const title =
            document.createElement("h2");


        title.textContent =
            memory.title || "";


        article.appendChild(title);


        // ==================================================
        // LOCATION
        // ==================================================

        if (memory.location) {

            const location =
                document.createElement("p");


            location.className =
                "timeline-location";


            location.textContent =
                memory.location;


            article.appendChild(location);

        }


        // ==================================================
        // DESCRIPTION
        // ==================================================

        if (memory.description) {

            const description =
                document.createElement("p");


            description.className =
                "timeline-description";


            description.textContent =
                memory.description;


            article.appendChild(description);

        }


        // ==================================================
        // OPEN MEMORY
        // ==================================================

        article.addEventListener(
            "click",
            function () {

                window.location.href =
                    "memory.html?id=" +
                    memory.id;

            }
        );


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


    let mediaCount = 0;


    memories.forEach(memory => {

        // ==================================================
        // GET MEDIA
        // ==================================================

        const media =
            prioritizeVideos(
                getMedia(memory)
            );


        // Only image/video media

        const usableMedia =
            media.filter(
                item =>
                    item.type === "image" ||
                    item.type === "video"
            );


        // Skip memories without media

        if (usableMedia.length === 0) {
            return;
        }


        // ==================================================
        // MEMORY GROUP
        // ==================================================

        const group =
            document.createElement("section");


        group.className =
            "gallery-memory";


        // ==================================================
        // MEMORY HEADING
        // ==================================================

        const heading =
            document.createElement("div");


        heading.className =
            "gallery-memory-heading";


        // DATE

        const date =
            document.createElement("p");


        date.className =
            "gallery-date";


        date.textContent =
            memory.date || "";


        heading.appendChild(date);


        // TIME

        if (memory.time) {

            const time =
                document.createElement("span");


            time.className =
                "gallery-time";


            time.textContent =
                memory.time;


            heading.appendChild(time);

        }


        // TITLE

        const title =
            document.createElement("h2");


        title.textContent =
            memory.title || "";


        heading.appendChild(title);


        // LOCATION

        if (memory.location) {

            const location =
                document.createElement("p");


            location.className =
                "gallery-location";


            location.textContent =
                memory.location;


            heading.appendChild(location);

        }


        group.appendChild(heading);


        // ==================================================
        // GALLERY GRID
        // ==================================================

        const grid =
            document.createElement("div");


        grid.className =
            "gallery-grid";


        usableMedia.forEach(item => {

            const figure =
                document.createElement("figure");


            figure.className =
                "gallery-photo";


            // Add video class

            if (item.type === "video") {

                figure.classList.add(
                    "is-video"
                );

            }


            // ==================================================
            // IMAGE
            // ==================================================

            if (item.type === "image") {

                const image =
                    document.createElement("img");


                image.src =
                    "./" + item.src;


                image.alt =
                    item.caption ||
                    memory.title ||
                    "Memory photograph";


                image.loading =
                    "lazy";


                figure.appendChild(image);

            }


            // ==================================================
            // VIDEO
            // ==================================================

            if (item.type === "video") {

                const video =
                    document.createElement("video");


                video.preload =
                    "metadata";


                video.muted =
                    true;


                video.playsInline =
                    true;


                /*
                   Controls are intentionally hidden here.
                   Clicking the preview opens the full
                   video viewer with controls.
                */

                const source =
                    document.createElement("source");


                source.src =
                    "./" + item.src;


                video.appendChild(source);


                figure.appendChild(video);

            }


            // ==================================================
            // CAPTION
            // ==================================================

            if (item.caption) {

                const caption =
                    document.createElement("figcaption");


                caption.textContent =
                    item.caption;


                figure.appendChild(
                    caption
                );

            }


            // ==================================================
            // OPEN FULL MEDIA
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


            grid.appendChild(figure);


            mediaCount++;

        });


        group.appendChild(grid);


        gallery.appendChild(group);

    });


    // ==================================================
    // EMPTY GALLERY
    // ==================================================

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


// ======================================================
// GALLERY / MEMORY LIGHTBOX
// Supports images AND videos
// ======================================================

function openLightbox(
    src,
    caption,
    type = "image"
) {

    const lightbox =
        document.getElementById("lightbox");


    const image =
        document.getElementById("lightboxImage");


    const captionElement =
        document.getElementById(
            "lightboxCaption"
        );


    const content =
        lightbox
            ? lightbox.querySelector(
                ".lightbox-content"
            )
            : null;


    if (!lightbox || !content) {
        return;
    }


    // ==================================================
    // REMOVE OLD LIGHTBOX VIDEO
    // ==================================================

    const oldVideo =
        content.querySelector(
            ".lightbox-video"
        );


    if (oldVideo) {

        oldVideo.pause();

        oldVideo.remove();

    }


    // ==================================================
    // VIDEO
    // ==================================================

    if (type === "video") {

        // Hide image

        if (image) {

            image.style.display =
                "none";

            image.src = "";

        }


        const video =
            document.createElement("video");


        video.className =
            "lightbox-video lightbox-media";


        video.controls =
            true;


        video.preload =
            "metadata";


        video.playsInline =
            true;


        video.setAttribute(
            "aria-label",
            caption || "Memory video"
        );


        const source =
            document.createElement("source");


        source.src =
            "./" + src;


        video.appendChild(source);


        /*
           Put video before caption.
        */

        if (captionElement) {

            content.insertBefore(
                video,
                captionElement
            );

        } else {

            content.appendChild(video);

        }

    }


    // ==================================================
    // IMAGE
    // ==================================================

    else {

        // Remove any previous video

        if (oldVideo) {

            oldVideo.pause();

            oldVideo.remove();

        }


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


    // Prevent background scrolling

    document.body.style.overflow =
        "hidden";

}


// ======================================================
// CLOSE LIGHTBOX
// ======================================================

function closeLightbox() {

    const lightbox =
        document.getElementById("lightbox");


    const image =
        document.getElementById("lightboxImage");


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
// SETUP LIGHTBOX
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


    // ==================================================
    // CLOSE BUTTON
    // ==================================================

    if (closeButton) {

        closeButton.onclick =
            closeLightbox;

    }


    // ==================================================
    // CLICK OUTSIDE MEDIA
    // ==================================================

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


    // ==================================================
    // ESCAPE KEY
    // ==================================================

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
        document.getElementById(
            "memoryContent"
        );


    if (!container) {
        return;
    }


    // ==================================================
    // GET MEMORY ID
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
    // GET + PRIORITIZE MEDIA
    // ==================================================

    const mediaItems =
        prioritizeVideos(
            getMedia(memory)
        );


    // ==================================================
    // BUILD MEDIA
    // ==================================================

    let mediaHTML = "";


    mediaItems.forEach(
        (item, index) => {

            // Ignore unsupported media types

            if (
                item.type !== "image" &&
                item.type !== "video"
            ) {

                return;

            }


            const itemClass =
                `memory-media-item media-${index + 1} media-${item.type}`;


            // ==================================================
            // IMAGE
            // ==================================================

            if (
                item.type === "image"
            ) {

                mediaHTML += `

                    <figure
                        class="${itemClass}"
                        data-src="${item.src}"
                        data-type="image"
                        data-caption="${item.caption || ""}"
                        tabindex="0"
                        role="button"
                        aria-label="Open image"
                    >

                        <img
                            src="./${item.src}"
                            alt="${item.caption || memory.title || "Memory photograph"}"
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


            // ==================================================
            // VIDEO
            // ==================================================

            if (
                item.type === "video"
            ) {

                mediaHTML += `

                    <figure
                        class="${itemClass}"
                        data-src="${item.src}"
                        data-type="video"
                        data-caption="${item.caption || ""}"
                        tabindex="0"
                        role="button"
                        aria-label="Open video"
                    >

                        <video
                            preload="metadata"
                            muted
                            playsinline
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

        }
    );


    // ==================================================
    // BUILD MEMORY PAGE
    // ==================================================

    container.innerHTML = `

        <p class="memory-date">
            ${memory.date || ""}
        </p>


        ${
            memory.time
            ? `
                <p class="memory-time">
                    ${memory.time}
                </p>
              `
            : ""
        }


        <h1>
            ${memory.title || ""}
        </h1>


        ${
            memory.location
            ? `
                <p class="memory-location">
                    ${memory.location}
                </p>
              `
            : ""
        }


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


    // ==================================================
    // ENABLE FULL MEDIA VIEWER
    // ==================================================

    setupMemoryMedia();


    // ==================================================
    // PREVIOUS / NEXT
    // ==================================================

    setupMemoryNavigation(
        memory
    );

}


// ======================================================
// INDIVIDUAL MEMORY MEDIA CLICK
// ======================================================

function setupMemoryMedia() {

    const mediaItems =
        document.querySelectorAll(
            ".memory-media-item"
        );


    mediaItems.forEach(
        function (item) {

            const src =
                item.dataset.src;


            const type =
                item.dataset.type ||
                "image";


            const caption =
                item.dataset.caption ||
                "";


            if (!src) {
                return;
            }


            // ==================================================
            // MOUSE / TOUCH
            // ==================================================

            item.addEventListener(
                "click",
                function () {

                    openLightbox(
                        src,
                        caption,
                        type
                    );

                }
            );


            // ==================================================
            // KEYBOARD
            // ==================================================

            item.addEventListener(
                "keydown",
                function (event) {

                    if (
                        event.key === "Enter
