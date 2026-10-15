
/* =========================================================
   THE ARCHIVE — PRIVATE EDITOR WITH MEDIA UPLOADS
   ========================================================= */

const WORKER_URL =
    "https://memory-archive-publisher.allen-tinkerer.workers.dev";

const MAX_FILE_BYTES = 8 * 1024 * 1024;

let memories = [];
let editingMemoryId = null;
let selectedMedia = [];
let hasUnsavedChanges = false;


/* INITIALISE */

document.addEventListener("DOMContentLoaded", init);

async function init() {
    setupNavigation();
    setupMemoryForm();
    setupPreview();
    setupPublishing();
    await loadMemories();
}


/* NAVIGATION */

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
        "click", openNewMemory
    );
}

function showSection(id) {
    document.querySelectorAll(".editor-section").forEach(section => {
        section.classList.add("hidden");
    });

    const section = document.getElementById(id);

    if (section) {
        section.classList.remove("hidden");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
}


/* LOAD MEMORIES */

async function loadMemories() {
    const list = document.getElementById("memoryList");

    try {
        const response = await fetch("../data/memories.json", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Could not load memories.json.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("Invalid memories data.");
        }

        memories = data;
        hasUnsavedChanges = false;

        renderMemoryList();
        updatePublishButton();
    } catch (error) {
        console.error(error);
        list.textContent =
            "Could not load memories. Please reload the editor and try again.";
    }
}


/* MEMORY LIST */

function renderMemoryList() {
    const list = document.getElementById("memoryList");

    if (!memories.length) {
        list.innerHTML = '<div class="loading">No memories yet.</div>';
        return;
    }

    list.innerHTML = memories.map((memory, index) => {
        const count = Array.isArray(memory.media)
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
                            ? " · " + escapeHTML(memory.location)
                            : ""}
                        <br>
                        ${count} media item${count === 1 ? "" : "s"}
                    </div>
                </div>

                <div class="entry-actions">
                    <button class="small-button"
                        data-edit="${Number(memory.id)}">Edit</button>
                    <button class="small-button delete"
                        data-delete="${Number(memory.id)}">Delete</button>
                </div>
            </article>
        `;
    }).join("");

    list.querySelectorAll("[data-edit]").forEach(button => {
        button.addEventListener("click", () => {
            editMemory(Number(button.dataset.edit));
        });
    });

    list.querySelectorAll("[data-delete]").forEach(button => {
        button.addEventListener("click", () => {
            deleteMemory(Number(button.dataset.delete));
        });
    });
}


/* NEW MEMORY */

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


/* EDIT MEMORY */

function editMemory(id) {
    const memory = memories.find(item => Number(item.id) === id);
    if (!memory) return;

    editingMemoryId = id;

    document.getElementById("memoryTitle").value = memory.title || "";
    document.getElementById("memoryDate").value = memory.date || "";
    document.getElementById("memoryTime").value = memory.time || "";
    document.getElementById("memoryLocation").value = memory.location || "";
    document.getElementById("memoryDescription").value =
        memory.description || "";

    selectedMedia = (memory.media || []).map(item => ({
        existing: true,
        type: item.type,
        src: item.src,
        caption: item.caption || ""
    }));

    document.getElementById("mediaInput").value = "";

    document.getElementById("memoryFormEyebrow").textContent =
        "EDIT MEMORY";

    document.getElementById("memoryFormTitle").textContent =
        "Edit Memory";

    renderMediaPreview();
    showSection("memoryForm");
}


/* MEMORY FORM */

function setupMemoryForm() {
    document.getElementById("memoryFormElement").addEventListener(
        "submit", event => {
            event.preventDefault();
            saveMemoryDraft();
        }
    );

    document.getElementById("mediaInput").addEventListener(
        "change", handleMediaSelection
    );
}


/* SELECT MEDIA */

function handleMediaSelection(event) {
    const files = Array.from(event.target.files || []);

    for (const file of files) {
        if (file.size > MAX_FILE_BYTES) {
            alert(
                `"${file.name}" is larger than 8 MB. ` +
                "Please compress it before adding it."
            );
            continue;
        }

        if (!file.type.startsWith("image/") &&
            !["video/mp4", "video/webm", "video/quicktime"]
                .includes(file.type)) {
            alert(
                `"${file.name}" has an unsupported format. ` +
                "Use JPEG, PNG, GIF, WebP, AVIF, HEIC, HEIF, MP4, WebM, or MOV."
            );
            continue;
        }

        selectedMedia.push({
            existing: false,
            file,
            name: file.name,
            type: file.type.startsWith("video/") ? "video" : "image",
            caption: ""
        });
    }

    renderMediaPreview();
    event.target.value = "";
}


/* MEDIA PREVIEW AND CAPTIONS */

function renderMediaPreview() {
    const container = document.getElementById("mediaPreview");

    document.getElementById("mediaCount").textContent =
        `${selectedMedia.length} item${selectedMedia.length === 1 ? "" : "s"}`;

    container.innerHTML = "";

    selectedMedia.forEach((item, index) => {
        const wrapper = document.createElement("div");
        wrapper.className = "media-item";

        let url = null;

        if (item.existing && item.src) {
            url = "../" + item.src;
        } else if (item.file) {
            url = URL.createObjectURL(item.file);
        }

        if (url) {
            if (item.type === "video") {
                const video = document.createElement("video");
                video.src = url;
                video.muted = true;
                video.controls = true;
                wrapper.appendChild(video);
            } else {
                const img = document.createElement("img");
                img.src = url;
                img.alt = item.caption || "";
                wrapper.appendChild(img);
            }
        }

        const caption = document.createElement("input");
        caption.type = "text";
        caption.placeholder = "Add a caption (optional)";
        caption.value = item.caption || "";
        caption.setAttribute("aria-label", "Media caption");

        caption.addEventListener("input", () => {
            selectedMedia[index].caption = caption.value;
        });

        Object.assign(caption.style, {
            display: "block",
            width: "100%",
            boxSizing: "border-box",
            marginTop: "8px"
        });

        wrapper.appendChild(caption);

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


/* SAVE MEMORY LOCALLY IN THE EDITOR SESSION */

function saveMemoryDraft() {
    const title = document.getElementById("memoryTitle").value.trim();
    const date = document.getElementById("memoryDate").value.trim();
    const time = document.getElementById("memoryTime").value.trim();
    const location = document.getElementById("memoryLocation").value.trim();
    const description =
        document.getElementById("memoryDescription").value.trim();

    if (!title || !date || !time || !description) {
        alert("Please complete the required fields.");
        return;
    }

    const id = editingMemoryId !== null
        ? editingMemoryId
        : memories.length
            ? Math.max(...memories.map(item => Number(item.id))) + 1
            : 0;

    const media = selectedMedia.map(item => {
        if (item.file) {
            return {
                existing: false,
                file: item.file,
                name: item.name || item.file.name,
                type: item.type,
                caption: item.caption || ""
            };
        }

        return {
            existing: true,
            type: item.type,
            src: item.src,
            caption: item.caption || ""
        };
    });

    const memory = {
        id,
        title,
        date,
        time,
        location,
        description,
        media
    };

    if (editingMemoryId !== null) {
        const index = memories.findIndex(
            item => Number(item.id) === editingMemoryId
        );

        if (index !== -1) memories[index] = memory;
    } else {
        memories.push(memory);
    }

    hasUnsavedChanges = true;

    renderMemoryList();
    updatePublishButton();
    showSection("memories");

    alert(
        "Memory saved in this editor session. " +
        "Tap Publish Changes to upload its new media and publish it."
    );
}


/* DELETE MEMORY */

function deleteMemory(id) {
    const memory = memories.find(item => Number(item.id) === id);
    if (!memory) return;

    if (!confirm(
        `Remove "${memory.title}" from the pending changes?\n\n` +
        "The live website changes only after publishing."
    )) {
        return;
    }

    memories = memories.filter(item => Number(item.id) !== id);
    hasUnsavedChanges = true;

    renderMemoryList();
    updatePublishButton();
}


/* PUBLISHING UI */

function setupPublishing() {
    const heading = document.querySelector(
        "#memories .section-heading"
    );

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
    status.textContent =
        "Changes are published only when you choose Publish Changes.";

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


/* ASK FOR EDITOR SECRET — DO NOT STORE IT */

function requestEditorSecret() {
    return new Promise(resolve => {
        const overlay = document.createElement("div");

        Object.assign(overlay.style, {
            position: "fixed",
            inset: "0",
            zIndex: "99999",
            background: "rgba(0,0,0,.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
        });

        const form = document.createElement("form");

        Object.assign(form.style, {
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

        const note = document.createElement("p");
        note.textContent =
            "Enter your EDITOR_SECRET. It will not be saved by this editor.";

        const input = document.createElement("input");
        input.type = "password";
        input.autocomplete = "off";
        input.placeholder = "Editor secret";
        input.required = true;

        Object.assign(input.style, {
            display: "block",
            width: "100%",
            padding: "12px",
            margin: "12px 0",
            boxSizing: "border-box"
        });

        const cancel = document.createElement("button");
        cancel.type = "button";
        cancel.textContent = "Cancel";

        const submit = document.createElement("button");
        submit.type = "submit";
        submit.textContent = "Continue";

        const actions = document.createElement("div");
        Object.assign(actions.style, {
            display: "flex",
            gap: "10px",
            justifyContent: "flex-end"
        });

        actions.append(cancel, submit);
        form.append(title, note, input, actions);
        overlay.appendChild(form);
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

        form.addEventListener("submit", event => {
            event.preventDefault();
            finish(input.value || null);
        });

        input.focus();
    });
}


/* READ FILE AS BASE64 */

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const result = String(reader.result || "");
            const comma = result.indexOf(",");

            if (comma < 0) {
                reject(new Error("Could not read the selected file."));
                return;
            }

            resolve(result.slice(comma + 1));
        };

        reader.onerror = () => {
            reject(new Error(`Could not read ${file.name}.`));
        };

        reader.readAsDataURL(file);
    });
}


/* UPLOAD ONE FILE */

async function uploadMediaFile(memoryId, item, index, secret) {
    const file = item.file;

    if (!file) return;

    if (file.size > MAX_FILE_BYTES) {
        throw new Error(`${file.name} is larger than 8 MB.`);
    }

    const contentBase64 = await fileToBase64(file);

    // A unique name prevents accidentally overwriting another photo.
    const fileName =
        `${Date.now()}-${index}-${file.name}`;

    const response = await fetch(`${WORKER_URL}/upload`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Editor-Secret": secret
        },
        body: JSON.stringify({
            memoryId,
            fileName,
            contentType: file.type,
            contentBase64
        })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(
            result.error || `Upload failed for ${file.name}.`
        );
    }

    // Keep the uploaded path in memory immediately. If a later
    // operation fails, this file does not need to be uploaded again.
    item.src = result.path;
    item.existing = true;
    delete item.file;
    delete item.name;

    return result.path;
}


/* PUBLISH MEMORIES AND THEIR MEDIA */

async function publishChanges() {
    if (!hasUnsavedChanges) {
        alert("There are no unpublished changes.");
        return;
    }

    for (const memory of memories) {
        if (
            !Number.isInteger(Number(memory.id)) ||
            !memory.title ||
            !memory.date ||
            !Array.isArray(memory.media)
        ) {
            alert("A memory has invalid data. Nothing was published.");
            return;
        }
    }

    const newFileCount = memories.reduce(
        (total, memory) =>
            total + memory.media.filter(item => item.file).length,
        0
    );

    const confirmation = newFileCount
        ? `Publish your changes and upload ${newFileCount} new file(s)?\n\n` +
          "Each file must be 8 MB or smaller."
        : "Publish all pending memory changes to GitHub?";

    if (!confirm(confirmation)) return;

    const secret = await requestEditorSecret();
    if (!secret) {
        setPublishStatus("Publishing cancelled.");
        return;
    }

    const button = document.getElementById("publishChangesButton");
    button.disabled = true;
    button.textContent = "Publishing…";

    try {
        // Upload media first, one file at a time.
        let uploadedCount = 0;
        const totalUploads = newFileCount;

        for (const memory of memories) {
            for (let i = 0; i < memory.media.length; i++) {
                const item = memory.media[i];

                if (!item.file) continue;

                setPublishStatus(
                    `Uploading media: ${uploadedCount + 1} of ${totalUploads}…`
                );

                await uploadMediaFile(memory.id, item, i, secret);
                uploadedCount++;
            }

            // Remove temporary browser-only fields before publishing JSON.
            memory.media = memory.media.map(item => ({
                type: item.type,
                src: item.src,
                caption: item.caption || ""
            }));
        }

        setPublishStatus("Publishing memory data to GitHub…");

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
                    "Authentication failed. Check EDITOR_SECRET in Cloudflare."
                );
            }

            throw new Error(
                result.error || `Publishing failed (${response.status}).`
            );
        }

        hasUnsavedChanges = false;
        updatePublishButton();

        setPublishStatus(
            "Published successfully. Your website may take a short time to update."
        );

        renderMemoryList();

        alert(
            "Published successfully!\n\n" +
            `${uploadedCount} new file(s) uploaded.\n` +
            "The live website may take a short time to update."
        );
    } catch (error) {
        console.error(error);

        setPublishStatus(
            "Publishing failed. Check the message; pending changes remain in this editor session."
        );

        alert(
            "Could not finish publishing.\n\n" +
            error.message +
            "\n\nDo not refresh this page yet. Check the error before retrying."
        );
    } finally {
        button.disabled = false;
        updatePublishButton();
    }
}


/* PREVIEW MODAL */

function setupPreview() {
    document.getElementById("previewMemoryButton").addEventListener(
        "click", previewMemory
    );

    document.getElementById("closePreview").addEventListener(
        "click", closePreview
    );

    document.querySelector(".modal-backdrop").addEventListener(
        "click", closePreview
    );
}

function previewMemory() {
    const title = document.getElementById("memoryTitle").value.trim();
    const date = document.getElementById("memoryDate").value.trim();
    const time = document.getElementById("memoryTime").value.trim();
    const location = document.getElementById("memoryLocation").value.trim();
    const description =
        document.getElementById("memoryDescription").value.trim();

    document.getElementById("previewTitle").textContent =
        title || "Untitled memory";

    document.getElementById("previewMeta").textContent =
        [date, time, location].filter(Boolean).join(" · ");

    document.getElementById("previewDescription").textContent = description;

    const container = document.getElementById("previewMedia");
    container.innerHTML = "";

    selectedMedia.forEach(item => {
        let url = null;

        if (item.existing && item.src) {
            url = "../" + item.src;
        } else if (item.file) {
            url = URL.createObjectURL(item.file);
        }

        if (!url) return;

        if (item.type === "video") {
            const video = document.createElement("video");
            video.src = url;
            video.controls = true;
            container.appendChild(video);
        } else {
            const img = document.createElement("img");
            img.src = url;
            img.alt = item.caption || "";
            container.appendChild(img);
        }

        if (item.caption) {
            const caption = document.createElement("p");
            caption.textContent = item.caption;
            container.appendChild(caption);
        }
    });

    document.getElementById("previewModal").classList.remove("hidden");
}

function closePreview() {
    document.getElementById("previewModal").classList.add("hidden");
}


/* HELPER */

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
