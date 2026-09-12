/* =========================================================
   THE ARCHIVE — PRIVATE EDITOR
   ========================================================= */

let memories = [];

let editingMemoryId = null;

let selectedMedia = [];


/* =========================================================
   INITIALISE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    init
);


async function init() {

    setupNavigation();

    setupMemoryForm();

    setupPreview();

    await loadMemories();

}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {

    document
        .querySelectorAll(".manager-card")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const section =
                        button.dataset.section;

                    showSection(section);

                }
            );

        });


    document
        .querySelectorAll(".back-button")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    showSection(
                        button.dataset.back
                    );

                }
            );

        });

}


function showSection(id) {

    document
        .querySelectorAll(".editor-section")
        .forEach(section => {

            section.classList.add("hidden");

        });


    const target =
        document.getElementById(id);

    if (target) {

        target.classList.remove("hidden");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }

}


/* =========================================================
   LOAD MEMORIES
   ========================================================= */

async function loadMemories() {

    const list =
        document.getElementById(
            "memoryList"
        );

    try {

        const response =
            await fetch(
                "../data/memories.json",
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


        renderMemoryList();


    } catch (error) {

        console.error(error);

        list.innerHTML = `
            <div class="loading">
                Could not load memories.json.
            </div>
        `;

    }

}


/* =========================================================
   MEMORY LIST
   ========================================================= */

function renderMemoryList() {

    const list =
        document.getElementById(
            "memoryList"
        );


    if (!memories.length) {

        list.innerHTML = `
            <div class="loading">
                No memories yet.
            </div>
        `;

        return;

    }


    list.innerHTML =
        memories
            .map(
                (memory, index) => {

                    const mediaCount =
                        Array.isArray(memory.media)
                            ? memory.media.length
                            : 0;


                    return `
                        <article
                            class="entry-item"
                        >

                            <div
                                class="entry-number"
                            >
                                ${String(
                                    index + 1
                                ).padStart(2, "0")}
                            </div>


                            <div>

                                <div
                                    class="entry-title"
                                >
                                    ${escapeHTML(
                                        memory.title
                                    )}
                                </div>


                                <div
                                    class="entry-meta"
                                >
                                    ${escapeHTML(
                                        memory.date || ""
                                    )}

                                    ·

                                    ${escapeHTML(
                                        memory.time || ""
                                    )}

                                    ${
                                        memory.location
                                            ? `
                                                ·
                                                ${escapeHTML(
                                                    memory.location
                                                )}
                                            `
                                            : ""
                                    }

                                    <br>

                                    ${mediaCount}
                                    media item${
                                        mediaCount === 1
                                            ? ""
                                            : "s"
                                    }

                                </div>

                            </div>


                            <div
                                class="entry-actions"
                            >

                                <button
                                    class="small-button"
                                    data-edit-memory="${memory.id}"
                                >
                                    Edit
                                </button>


                                <button
                                    class="small-button delete"
                                    data-delete-memory="${memory.id}"
                                >
                                    Delete
                                </button>

                            </div>

                        </article>
                    `;

                }
            )
            .join("");


    list
        .querySelectorAll(
            "[data-edit-memory]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(
                            button.dataset
                                .editMemory
                        );

                    editMemory(id);

                }
            );

        });


    list
        .querySelectorAll(
            "[data-delete-memory]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const id =
                        Number(
                            button.dataset
                                .deleteMemory
                        );

                    deleteMemory(id);

                }
            );

        });

}


/* =========================================================
   ADD MEMORY
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        document
            .getElementById(
                "addMemoryButton"
            )
            .addEventListener(
                "click",
                () => {

                    openNewMemory();

                }
            );

    }
);


function openNewMemory() {

    editingMemoryId = null;

    selectedMedia = [];

    document
        .getElementById(
            "memoryFormElement"
        )
        .reset();


    document
        .getElementById(
            "memoryFormEyebrow"
        )
        .textContent =
        "NEW MEMORY";


    document
        .getElementById(
            "memoryFormTitle"
        )
        .textContent =
        "Add Memory";


    renderMediaPreview();

    showSection(
        "memoryForm"
    );

}


/* =========================================================
   EDIT MEMORY
   ========================================================= */

function editMemory(id) {

    const memory =
        memories.find(
            item =>
                Number(item.id) === id
        );


    if (!memory) {
        return;
    }


    editingMemoryId = id;


    document
        .getElementById(
            "memoryTitle"
        )
        .value =
        memory.title || "";


    document
        .getElementById(
            "memoryDate"
        )
        .value =
        memory.date || "";


    document
        .getElementById(
            "memoryTime"
        )
        .value =
        memory.time || "";


    document
        .getElementById(
            "memoryLocation"
        )
        .value =
        memory.location || "";


    document
        .getElementById(
            "memoryDescription"
        )
        .value =
        memory.description || "";


    /*
     * Existing media is displayed in the editor.
     * The actual file objects are not recreated here.
     */
    selectedMedia =
        Array.isArray(memory.media)
            ? memory.media.map(
                item => ({
                    existing: true,
                    ...item
                })
            )
            : [];


    document
        .getElementById(
            "memoryFormEyebrow"
        )
        .textContent =
        "EDIT MEMORY";


    document
        .getElementById(
            "memoryFormTitle"
        )
        .textContent =
        "Edit Memory";


    renderMediaPreview();


    showSection(
        "memoryForm"
    );

}


/* =========================================================
   MEMORY FORM
   ========================================================= */

function setupMemoryForm() {

    const form =
        document.getElementById(
            "memoryFormElement"
        );


    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            saveMemoryDraft();

        }
    );


    document
        .getElementById(
            "mediaInput"
        )
        .addEventListener(
            "change",
            handleMediaSelection
        );

}


/* =========================================================
   MEDIA SELECTION
   ========================================================= */

function handleMediaSelection(event) {

    const files =
        Array.from(
            event.target.files
        );


    files.forEach(file => {

        const type =
            file.type.startsWith(
                "video/"
            )
                ? "video"
                : "image";


        selectedMedia.push({

            file,

            type,

            name: file.name,

            caption: ""

        });

    });


    renderMediaPreview();


    event.target.value = "";

}


/* =========================================================
   MEDIA PREVIEW
   ========================================================= */

function renderMediaPreview() {

    const container =
        document.getElementById(
            "mediaPreview"
        );


    const count =
        document.getElementById(
            "mediaCount"
        );


    count.textContent =
        `${selectedMedia.length} item${
            selectedMedia.length === 1
                ? ""
                : "s"
        }`;


    if (!selectedMedia.length) {

        container.innerHTML = "";

        return;

    }


    container.innerHTML =
        selectedMedia
            .map(
                (item, index) => {

                    if (
                        item.existing &&
                        item.type === "image"
                    ) {

                        return `
                            <div
                                class="media-item"
                            >

                                <img
                                    src="../${escapeAttribute(
                                        item.src
                                    )}"
                                    alt=""
                                >

                                <button
                                    type="button"
                                    class="media-remove"
                                    data-remove-media="${index}"
                                >
                                    ×
                                </button>

                            </div>
                        `;

                    }


                    if (
                        item.existing &&
                        item.type === "video"
                    ) {

                        return `
                            <div
                                class="media-item"
                            >

                                <video
                                    src="../${escapeAttribute(
                                        item.src
                                    )}"
                                    muted
                                ></video>

                                <button
                                    type="button"
                                    class="media-remove"
                                    data-remove-media="${index}"
                                >
                                    ×
                                </button>

                            </div>
                        `;

                    }


                    const url =
                        URL.createObjectURL(
                            item.file
                        );


                    if (
                        item.type === "video"
                    ) {

                        return `
                            <div
                                class="media-item"
                            >

                                <video
                                    src="${url}"
                                    muted
                                ></video>

                                <button
                                    type="button"
                                    class="media-remove"
                                    data-remove-media="${index}"
                                >
                                    ×
                                </button>

                            </div>
                        `;

                    }


                    return `
                        <div
                            class="media-item"
                        >

                            <img
                                src="${url}"
                                alt=""
                            >

                            <button
                                type="button"
                                class="media-remove"
                                data-remove-media="${index}"
                            >
                                ×
                            </button>

                        </div>
                    `;

                }
            )
            .join("");


    container
        .querySelectorAll(
            "[data-remove-media]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const index =
                        Number(
                            button.dataset
                                .removeMedia
                        );

                    selectedMedia.splice(
                        index,
                        1
                    );

                    renderMediaPreview();

                }
            );

        });

}


/* =========================================================
   SAVE MEMORY DRAFT
   ========================================================= */

function saveMemoryDraft() {

    const title =
        document
            .getElementById(
                "memoryTitle"
            )
            .value
            .trim();


    const date =
        document
            .getElementById(
                "memoryDate"
            )
            .value
            .trim();


    const time =
        document
            .getElementById(
                "memoryTime"
            )
            .value
            .trim();


    const location =
        document
            .getElementById(
                "memoryLocation"
            )
            .value
            .trim();


    const description =
        document
            .getElementById(
                "memoryDescription"
            )
            .value
            .trim();


    if (
        !title ||
        !date ||
        !time ||
        !description
    ) {

        alert(
            "Please complete the required fields."
        );

        return;

    }


    let id;


    if (editingMemoryId !== null) {

        id =
            editingMemoryId;

    } else {

        id =
            memories.length
                ? Math.max(
                    ...memories.map(
                        memory =>
                            Number(
                                memory.id
                            )
                    )
                ) + 1
                : 0;

    }


    /*
     * This object intentionally follows the exact
     * structure used by your current memories.json.
     */
    const memory = {

        id,

        title,

        date,

        time,

        location,

        description,

        media:
            selectedMedia
                .filter(
                    item =>
                        item.existing
                )
                .map(
                    item => ({
                        type:
                            item.type,

                        src:
                            item.src,

                        caption:
                            item.caption || ""
                    })
                )

    };


    if (editingMemoryId !== null) {

        const index =
            memories.findIndex(
                item =>
                    Number(item.id) ===
                    editingMemoryId
            );


        if (index !== -1) {

            memories[index] =
                memory;

        }

    } else {

        memories.push(
            memory
        );

    }


    /*
     * At this stage we don't write directly to GitHub.
     * We generate the exact JSON that will later be
     * committed by the publishing system.
     */
    downloadJSON();


    alert(
        "Memory prepared successfully. The JSON file has been generated."
    );


    renderMemoryList();

    showSection(
        "memories"
    );

}


/* =========================================================
   DELETE MEMORY
   ========================================================= */

function deleteMemory(id) {

    const memory =
        memories.find(
            item =>
                Number(item.id) === id
        );


    if (!memory) {
        return;
    }


    const confirmed =
        confirm(
            `Delete "${memory.title}"?\n\nThis will remove it from the generated JSON.`
        );


    if (!confirmed) {
        return;
    }


    memories =
        memories.filter(
            item =>
                Number(item.id) !== id
        );


    downloadJSON();

    renderMemoryList();

}


/* =========================================================
   GENERATE JSON
   ========================================================= */

function downloadJSON() {

    const json =
        JSON.stringify(
            memories,
            null,
            2
        );


    const blob =
        new Blob(
            [json],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;

    link.download =
        "memories.json";

    document
        .body
        .appendChild(
            link
        );


    link.click();

    link.remove();

    URL.revokeObjectURL(
        url
    );

}


/* =========================================================
   PREVIEW
   ========================================================= */

function setupPreview() {

    document
        .getElementById(
            "previewMemoryButton"
        )
        .addEventListener(
            "click",
            previewMemory
        );


    document
        .getElementById(
            "closePreview"
        )
        .addEventListener(
            "click",
            closePreview
        );


    document
        .querySelector(
            ".modal-backdrop"
        )
        .addEventListener(
            "click",
            closePreview
        );

}


function previewMemory() {

    const title =
        document
            .getElementById(
                "memoryTitle"
            )
            .value
            .trim();


    const date =
        document
            .getElementById(
                "memoryDate"
            )
            .value
            .trim();


    const time =
        document
            .getElementById(
                "memoryTime"
            )
            .value
            .trim();


    const location =
        document
            .getElementById(
                "memoryLocation"
            )
            .value
            .trim();


    const description =
        document
            .getElementById(
                "memoryDescription"
            )
            .value
            .trim();


    document
        .getElementById(
            "previewTitle"
        )
        .textContent =
        title ||
        "Untitled memory";


    document
        .getElementById(
            "previewMeta"
        )
        .textContent =
        [
            date,
            time,
            location
        ]
            .filter(Boolean)
            .join(
                " · "
            );


    document
        .getElementById(
            "previewDescription"
        )
        .textContent =
        description;


    renderPreviewMedia();


    document
        .getElementById(
            "previewModal"
        )
        .classList.remove(
            "hidden"
        );

}


function renderPreviewMedia() {

    const container =
        document.getElementById(
            "previewMedia"
        );


    container.innerHTML = "";


    selectedMedia.forEach(
        item => {

            if (
                item.existing &&
                item.src
            ) {

                if (
                    item.type === "video"
                ) {

                    container.innerHTML += `
                        <video
                            src="../${escapeAttribute(
                                item.src
                            )}"
                            controls
                        ></video>
                    `;

                } else {

                    container.innerHTML += `
                        <img
                            src="../${escapeAttribute(
                                item.src
                            )}"
                            alt=""
                        >
                    `;

                }

                return;

            }


            if (item.file) {

                const url =
                    URL.createObjectURL(
                        item.file
                    );


                if (
                    item.type === "video"
                ) {

                    container.innerHTML += `
                        <video
                            src="${url}"
                            controls
                        ></video>
                    `;

                } else {

                    container.innerHTML += `
                        <img
                            src="${url}"
                            alt=""
                        >
                    `;

                }

            }

        }
    );

}


function closePreview() {

    document
        .getElementById(
            "previewModal"
        )
        .classList.add(
            "hidden"
        );

}


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHTML(value) {

    return String(value)
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


function escapeAttribute(value) {

    return escapeHTML(value);

}
