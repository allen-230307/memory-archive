
/* =========================================================
   THE ARCHIVE — PRIVATE EDITOR
   ========================================================= */

const WORKER_URL =
    "https://memory-archive-publisher.allen-tinkerer.workers.dev";

let memories = [];
let editingMemoryId = null;
let selectedMedia = [];
let hasUnsavedChanges = false;


/* =========================================================
   INITIALISE
   ========================================================= */

document.addEventListener("DOMContentLoaded", init);

async function init() {
    setupNavigation();
    setupMemoryForm();
    setupPreview();
    setupPublishing();

    await loadMemories();
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function setupNavigation() {
    document.querySelectorAll(".manager-card").forEach(button => {
        button.addEventListener("click", () => {
            showSection(button.dataset.section);
        });
    });

    document.querySelectorAll(".back-button").forEach(button => {
        button.addEventListener("click", () => {
            showSection(button.dataset.back);
        });
    });

    document.getElementById("addMemoryButton").addEventListener(
        "click",
        openNewMemory
    );
}

function showSection(id) {
    document.querySelectorAll(".editor-section").forEach(section => {
        section.classList.add("hidden");
    });

    const target = document.getElementById(id);

    if (target) {
        target.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
}


/* =========================================================
   LOAD MEMORIES
   ========================================================= */

async function loadMemories() {
    const list = document.getElementById("memoryList");

    try {
        const response = await fetch("../data/memories.json", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Could not load memories.json");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("The memories file is not an array.");
        }

        memories = data;
        hasUnsavedChanges = false;

        renderMemoryList();
        updatePublishButton();
    } catch (error) {
        console.error(error);

        list.textContent =
            "Could not load memories.json. Check the public Archive website and try again.";
    }
}


/* =========================================================
   MEMORY LIST
   ========================================================= */

function renderMemoryList() {
    const list = document.getElementById("memoryList");

    if (!memories.length) {
        list.innerHTML = `
            <div class="loading">No memories yet.</div>
        `;
        return;
    }

    list.innerHTML = memories.map((memory, index) => {
        const mediaCount = Array.isArray(memory.media)
            ? memory.media.length
            : 0;

        return `
            <article class="entry-item">
                <div class="entry-number">
                    ${String(index + 1).padStart(2, "0")}
                </div>

                <div>
                    <div class="entry-title">
                        ${escapeHTML(memory.title || "")}
                    </div>

                    <div class="entry-meta">
                        ${escapeHTML(memory.date || "")}
                        · ${escapeHTML(memory.time || "")}
                        ${memory.location
                            ? ` · ${escapeHTML(memory.location)}`
                            : ""}
                        <br>
                        ${mediaCount} media item${mediaCount === 1 ? "" : "s"}
                    </div>
                </div>

                <div class="entry-actions">
                    <button
                        class="small-button"
                        data-edit-memory="${Number(memory.id)}"
                    >Edit</button>

                    <button
                        class="small-button delete"
                        data-delete-memory="${Number(memory.id)}"
                    >Delete</button>
                </div>
            </article>
        `;
    }).join("");

    list.querySelectorAll("[data-edit-memory]").forEach(button => {
        button.addEventListener("click", () => {
            editMemory(Number(button.dataset.editMemory));
        });
    });

    list.querySelectorAll("[data-delete-memory]").forEach(button => {
        button.addEventListener("click", () => {
            deleteMemory(Number(button.dataset.deleteMemory));
        });
    });
}


/* =========================================================
   ADD MEMORY
   ========================================================= */

function openNewMemory() {
    editingMemoryId = null;
    selectedMedia = [];

    document.getElementById("memoryFormElement").reset();
    document.getElementById("mediaInput").value = "";

    document.getElementById("memoryFormEyebrow").textContent =
        "NEW MEMORY";

    document.getElementById("memoryFormTitle").textContent =
        "Add Memory";

    renderMediaPreview();
    showSection("memoryForm");
}


/* =========================================================
   EDIT MEMORY
   ========================================================= */

function editMemory(id) {
    const memory = memories.find(item => Number(item.id) === id);

    if (!memory) return;

    editingMemoryId = id;

    document.getElementById("memoryTitle").value =
        memory.title || "";

    document.getElementById("memoryDate").value =
        memory.date || "";

    document.getElementById("memoryTime").value =
        memory.time || "";

    document.getElementById("memoryLocation").value =
        memory.location || "";

    document.getElementById("memoryDescription").value =
        memory.description || "";

    selectedMedia = Array.isArray(memory.media)
        ? memory.media.map(item => ({
            existing: true,
            ...item
        }))
        : [];

    document.getElementById("mediaInput").value = "";

    document.getElementById("memoryFormEyebrow").textContent =
        "EDIT MEMORY";

    document.getElementById("memoryFormTitle").textContent =
        "Edit Memory";

    renderMediaPreview();
    showSection("memoryForm");
}


/* =========================================================
   MEMORY FORM
   ========================================================= */

function setupMemoryForm() {
    document.getElementById("memoryFormElement").addEventListener(
        "submit",
        event => {
            event.preventDefault();
            saveMemoryDraft();
        }
    );

    document.getElementById("mediaInput").addEventListener(
        "change",
        handleMediaSelection
    );
}


/* =========================================================
   MEDIA SELECTION
   ========================================================= */

function handleMediaSelection(event) {
    const files = Array.from(event.target.files || []);

    files.forEach(file => {
        selectedMedia.push({
            file,
            type: file.type.startsWith("video/") ? "video" : "image",
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
    const container = document.getElementById("mediaPreview");
    const count = document.getElementById("mediaCount");

    count.textContent =
        `${selectedMedia.length} item${selectedMedia.length === 1 ? "" : "s"}`;

    container.innerHTML = "";

    selectedMedia.forEach((item, index) => {
        const wrapper = document.createElement("div");
        wrapper.className = "media-item";

        if (item.existing && item.src) {
            const url = "../" + item.src;

            if (item.type === "video") {
                const video = document.createElement("video");
                video.src = url;
                video.muted = true;
                wrapper.appendChild(video);
            } else {
                const img = document.createElement("img");
                img.src = url;
                img.alt = "";
                wrapper.appendChild(img);
            }
        } else if (item.file) {
            const url = URL.createObjectURL(item.file);

            if (item.type === "video") {
                const video = document.createElement("video");
                video.src = url;
                video.muted = true;
                wrapper.appendChild(video);
            } else {
                const img = document.createElement("img");
                img.src = url;
                img.alt = "";
                wrapper.appendChild(img);
            }
        }

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "media-remove";
        remove.textContent = "×";
        remove.setAttribute("aria-label", "Remove media");

        remove.addEventListener("click", () => {
            selectedMedia.splice(index, 1);
            renderMediaPreview();
        });

        wrapper.appendChild(remove);
        container.appendChild(wrapper);
    });
}


/* =========================================================
   SAVE MEMORY AS AN UNSENT CHANGE
   ========================================================= */

function saveMemoryDraft() {
    const title = document.getElementById("memoryTitle").value.trim();
    const date = document.getElementById("memoryDate").value.trim();
    const time = document.getElementById("memoryTime").value.trim();
    const location = document.getElementById("memoryLocation").value.trim();
    const description = document.getElementById("memoryDescription").value.trim();

    if (!title || !date || !time || !description) {
        alert("Please complete the required fields.");
        return;
    }

    // Do not silently discard files that have not been uploaded.
    if (selectedMedia.some(item => !item.existing)) {
        alert(
            "New photo/video uploading is not connected yet.\n\n" +
            "Remove the newly selected files using ×, then save. " +
            "Existing media will be preserved."
        );
        return;
    }

    const id = editingMemoryId !== null
        ? editingMemoryId
        : memories.length
            ? Math.max(...memories.map(item => Number(item.id))) + 1
            : 0;

    const memory = {
        id,
        title,
        date,
        time,
        location,
        description,
        media: selectedMedia
            .filter(item => item.existing)
            .map(item => ({
                type: item.type,
                src: item.src,
                caption: item.caption || ""
            }))
    };

    if (editingMemoryId !== null) {
        const index = memories.findIndex(
            item => Number(item.id) === editingMemoryId
        );

        if (index !== -1) {
            memories[index] = memory;
        }
    } else {
        memories.push(memory);
    }

    hasUnsavedChanges = true;
    renderMemoryList();
    updatePublishButton();
    showSection("memories");

    alert(
        "Memory saved in this editor session.\n\n" +
        "It is not published yet. Tap Publish Changes to send it to GitHub."
    );
}


/* =========================================================
   DELETE MEMORY
   ========================================================= */

function deleteMemory(id) {
    const memory = memories.find(item => Number(item.id) === id);

    if (!memory) return;

    if (!confirm(
        `Remove "${memory.title}" from the pending changes?\n\n` +
        "This will affect the live Archive only after you publish."
    )) {
        return;
    }

    memories = memories.filter(item => Number(item.id) !== id);
    hasUnsavedChanges = true;

    renderMemoryList();
    updatePublishButton();
}


/* =========================================================
   PUBLISHING CONTROLS
   ========================================================= */

function setupPublishing() {
    const heading = document.querySelector("#memories .section-heading");

    const button = document.createElement("button");
    button.type = "button";
    button.id = "publishChangesButton";
    button.className = "primary-button";
    button.textContent = "Publish Changes";
    button.addEventListener("click", publishChanges);

    heading.appendChild(button);

    const status = document.createElement("p");
    status.id = "publishStatus";
    status.className = "section-description";
    status.setAttribute("role", "status");
    status.textContent = "Changes are published only when you choose Publish Changes.";

    heading.insertAdjacentElement("afterend", status);

    updatePublishButton();
}

function updatePublishButton() {
    const button = document.getElementById("publishChangesButton");

    if (!button) return;

    button.textContent = hasUnsavedChanges
        ? "Publish Changes *"
        : "Publish Changes";
}

function setPublishStatus(message) {
    const status = document.getElementById("publishStatus");
    if (status) status.textContent = message;
}


/* =========================================================
   ASK FOR SECRET WITHOUT SAVING IT
   ========================================================= */

function requestEditorSecret() {
    return new Promise(resolve => {
        const overlay = document.createElement("div");

        Object.assign(overlay.style, {
            position: "fixed",
            inset: "0",
            zIndex: "99999",
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
        });

        const panel = document.createElement("form");

        Object.assign(panel.style, {
            width: "100%",
            maxWidth: "420px",
            padding: "24px",
            background: "#f5f1e8",
            color: "#292622",
            borderRadius: "8px",
            boxSizing: "border-box"
        });

        const title = document.createElement("h2");
        title.textContent = "Publish to THE ARCHIVE";

        const explanation = document.createElement("p");
        explanation.textContent =
            "Enter your EDITOR_SECRET. It will not be saved by this editor.";

        const input = document.createElement("input");
        input.type = "password";
        input.autocomplete = "off";
        input.placeholder = "Editor secret";
        input.required = true;

        Object.assign(input.style, {
            width: "100%",
            padding: "12px",
            margin: "10px 0 16px",
            boxSizing: "border-box"
        });

        const actions = document.createElement("div");
        Object.assign(actions.style, {
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end"
        });

        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.textContent = "Cancel";

        const submit = document.createElement("button");
        submit.type = "submit";
        submit.textContent = "Publish";

        actions.append(cancel, submit);
        panel.append(title, explanation, input, actions);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function finish(value) {
            input.value = "";
            overlay.remove();
            resolve(value);
        }

        cancel.addEventListener("click", () => finish(null));

        overlay.addEventListener("click", event => {
            if (event.target === overlay) finish(null);
        });

        panel.addEventListener("submit", event => {
            event.preventDefault();
            const secret = input.value;
            finish(secret || null);
        });

        input.focus();
    });
}


/* =========================================================
   PUBLISH TO CLOUDFLARE WORKER
   ========================================================= */

async function publishChanges() {
    if (!hasUnsavedChanges) {
        alert("There are no unpublished changes.");
        return;
    }

    if (!Array.isArray(memories) || memories.some(memory =>
        !memory ||
        !Number.isInteger(Number(memory.id)) ||
        typeof memory.title !== "string" ||
        typeof memory.date !== "string" ||
        !Array.isArray(memory.media)
    )) {
        alert("The memory data has an invalid format. Nothing was published.");
        return;
    }

    if (!confirm(
        "Publish all pending memory changes to GitHub?\n\n" +
        "This will update the live memories.json file."
    )) {
        return;
    }

    const secret = await requestEditorSecret();

    if (!secret) {
        setPublishStatus("Publishing cancelled.");
        return;
    }

    const button = document.getElementById("publishChangesButton");
    button.disabled = true;
    button.textContent = "Publishing…";
    setPublishStatus("Sending memory data to GitHub…");

    try {
        const response = await fetch(`${WORKER_URL}/publish`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Editor-Secret": secret
            },
            body: JSON.stringify({ memories })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            if (response.status === 401) {
                throw new Error(
                    "Authentication failed. Check that EDITOR_SECRET matches the value in Cloudflare."
                );
            }

            throw new Error(
                result.error || `Publishing failed (${response.status}).`
            );
        }

        hasUnsavedChanges = false;
        updatePublishButton();

        setPublishStatus(
            "Published successfully. GitHub Pages may take a short time to update."
        );

        alert(
            "Memory data published successfully!\n\n" +
            "Your website may take a short time to display the changes."
        );
    } catch (error) {
        console.error(error);

        setPublishStatus("Publishing failed. Your pending changes remain in this session.");

        alert(
            "Could not publish the changes.\n\n" +
            error.message +
            "\n\nYour pending changes have not been cleared. Check your connection and Worker settings before retrying."
        );
    } finally {
        button.disabled = false;
        updatePublishButton();
    }
}


/* =========================================================
   PREVIEW
   ========================================================= */

function setupPreview() {
    document.getElementById("previewMemoryButton").addEventListener(
        "click",
        previewMemory
    );

    document.getElementById("closePreview").addEventListener(
        "click",
        closePreview
    );

    document.querySelector(".modal-backdrop").addEventListener(
        "click",
        closePreview
    );
}

function previewMemory() {
    const title = document.getElementById("memoryTitle").value.trim();
    const date = document.getElementById("memoryDate").value.trim();
    const time = document.getElementById("memoryTime").value.trim();
    const location = document.getElementById("memoryLocation").value.trim();
    const description = document.getElementById("memoryDescription").value.trim();

    document.getElementById("previewTitle").textContent =
        title || "Untitled memory";

    document.getElementById("previewMeta").textContent =
        [date, time, location].filter(Boolean).join(" · ");

    document.getElementById("previewDescription").textContent = description;

    renderPreviewMedia();

    document.getElementById("previewModal").classList.remove("hidden");
}

function renderPreviewMedia() {
    const container = document.getElementById("previewMedia");
    container.innerHTML = "";

    selectedMedia.forEach(item => {
        let url;

        if (item.existing && item.src) {
            url = "../" + item.src;
        } else if (item.file) {
            url = URL.createObjectURL(item.file);
        } else {
            return;
        }

        if (item.type === "video") {
            const video = document.createElement("video");
            video.src = url;
            video.controls = true;
            container.appendChild(video);
        } else {
            const img = document.createElement("img");
            img.src = url;
            img.alt = "";
            container.appendChild(img);
        }
    });
}

function closePreview() {
    document.getElementById("previewModal").classList.add("hidden");
}


/* =========================================================
   HELPERS
   ========================================================= */

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
