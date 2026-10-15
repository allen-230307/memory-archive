/* =========================================================
   THE ARCHIVE — MEMORY UNIVERSE MANAGER
   Keeps the existing tree.json schema and constellation design.
   ========================================================= */

const TREE_WORKER_URL =
    "https://memory-archive-publisher.allen-tinkerer.workers.dev";

let treeEntries = [];
let treeMemories = [];
let editingTreeIndex = null;
let treeHasChanges = false;

const TREE_TONES = {
    warm: "#ffd37a",
    rose: "#ff8fc7",
    sage: "#8fe3c1",
    gold: "#ffd37a",
    blue: "#67e8f9",
    violet: "#a98cff"
};

document.addEventListener("DOMContentLoaded", initTreeManager);

async function initTreeManager() {
    const add = document.getElementById("addTreeEntryButton");
    const cancel = document.getElementById("cancelTreeEntryButton");
    const form = document.getElementById("treeEntryForm");
    const publish = document.getElementById("publishTreeButton");
    const preview = document.getElementById("previewTreeButton");
    const closePreview = document.getElementById("closeTreePreviewButton");

    if (!add || !form || !publish) return;

    add.addEventListener("click", openNewTreeEntry);
    cancel.addEventListener("click", closeTreeForm);
    form.addEventListener("submit", saveTreeEntryDraft);
    publish.addEventListener("click", publishTreeEntries);
    preview.addEventListener("click", showTreePreview);
    closePreview.addEventListener("click", () => {
        document.getElementById("treePreviewPanel").classList.add("hidden");
    });

    window.addEventListener("beforeunload", event => {
        if (!treeHasChanges) return;
        event.preventDefault();
        event.returnValue = "";
    });

    await loadTreeData();
}

async function loadTreeData() {
    const list = document.getElementById("treeEditorList");
    setTreeStatus("Loading Memory Universe content…");

    try {
        const [treeResponse, memoryResponse] = await Promise.all([
            fetch("../data/tree.json?v=32", { cache: "no-store" }),
            fetch("../data/memories.json?v=32", { cache: "no-store" })
        ]);

        if (!treeResponse.ok || !memoryResponse.ok) {
            throw new Error("Could not load tree.json or memories.json.");
        }

        const [entries, memories] = await Promise.all([
            treeResponse.json(), memoryResponse.json()
        ]);

        if (!Array.isArray(entries) || !Array.isArray(memories)) {
            throw new Error("The Memory Universe data is not in the expected format.");
        }

        treeEntries = entries.map(entry => ({ ...entry }));
        treeMemories = memories;
        treeHasChanges = false;
        renderTreeList();
        populateMemoryOptions();
        updateTreePublishButton();
        setTreeStatus(`Loaded ${treeEntries.length} constellation entr${treeEntries.length === 1 ? "y" : "ies"}.`);
    } catch (error) {
        console.error("Memory Universe Manager:", error);
        list.innerHTML = '<div class="loading">Could not load Memory Universe data. Check the files and reload this page.</div>';
        setTreeStatus(error.message, true);
    }
}

function renderTreeList() {
    const list = document.getElementById("treeEditorList");

    if (!treeEntries.length) {
        list.innerHTML = '<div class="loading">No constellation entries yet. Add one to begin.</div>';
        return;
    }

    list.innerHTML = treeEntries.map((entry, index) => {
        const memory = treeMemories.find(item => String(item.id) === String(entry.memoryId));
        const tone = TREE_TONES[entry.tone] || TREE_TONES.violet;
        return `
            <article class="entry-item tree-entry-item">
                <div class="tree-tone-dot" style="--entry-tone:${tone}" aria-hidden="true"></div>
                <div class="tree-entry-copy">
                    <div class="entry-title">${escapeTreeHTML(entry.title || "Untitled entry")}</div>
                    <div class="entry-meta">
                        ${escapeTreeHTML(entry.date || "No date")} · ${escapeTreeHTML(entry.size || "medium")} node · ${escapeTreeHTML(entry.tone || "violet")} tone
                        <br>Linked memory: ${escapeTreeHTML(memory ? memory.title : "Missing memory link")}
                    </div>
                    ${entry.text ? `<p class="tree-entry-description">${escapeTreeHTML(entry.text)}</p>` : ""}
                </div>
                <div class="entry-actions tree-entry-actions">
                    <button class="small-button" type="button" data-move-up="${index}" ${index === 0 ? "disabled" : ""} aria-label="Move entry up">↑</button>
                    <button class="small-button" type="button" data-move-down="${index}" ${index === treeEntries.length - 1 ? "disabled" : ""} aria-label="Move entry down">↓</button>
                    <button class="small-button" type="button" data-tree-edit="${index}">Edit</button>
                    <button class="small-button delete" type="button" data-tree-delete="${index}">Delete</button>
                </div>
            </article>
        `;
    }).join("");

    list.querySelectorAll("[data-tree-edit]").forEach(button => {
        button.addEventListener("click", () => editTreeEntry(Number(button.dataset.treeEdit)));
    });
    list.querySelectorAll("[data-tree-delete]").forEach(button => {
        button.addEventListener("click", () => deleteTreeEntry(Number(button.dataset.treeDelete)));
    });
    list.querySelectorAll("[data-move-up]").forEach(button => {
        button.addEventListener("click", () => moveTreeEntry(Number(button.dataset.moveUp), -1));
    });
    list.querySelectorAll("[data-move-down]").forEach(button => {
        button.addEventListener("click", () => moveTreeEntry(Number(button.dataset.moveDown), 1));
    });
}

function populateMemoryOptions(selectedId = null) {
    const select = document.getElementById("treeMemoryId");
    select.innerHTML = '<option value="">Choose an existing memory…</option>' +
        treeMemories.map(memory => `
            <option value="${Number(memory.id)}" ${String(memory.id) === String(selectedId) ? "selected" : ""}>
                ${escapeTreeHTML(memory.title || `Memory ${memory.id}`)}${memory.date ? ` — ${escapeTreeHTML(memory.date)}` : ""}
            </option>
        `).join("");
}

function openNewTreeEntry() {
    // The current public constellation has five carefully placed node positions.
    // Keep that layout intact until a future layout expansion is designed.
    if (treeEntries.length >= 5) {
        setTreeStatus("The current constellation has five fixed node positions. Remove an entry first if you want to replace it with another memory.", true);
        return;
    }
    editingTreeIndex = null;
    document.getElementById("treeEntryForm").reset();
    document.getElementById("treeEntryFormTitle").textContent = "Add constellation entry";
    document.getElementById("treeEntryDate").value = "";
    document.getElementById("treeEntrySize").value = "medium";
    document.getElementById("treeEntryTone").value = "violet";
    populateMemoryOptions();
    document.getElementById("treeEntryFormPanel").classList.remove("hidden");
    document.getElementById("treePreviewPanel").classList.add("hidden");
    document.getElementById("treeEntryTitle").focus();
}

function editTreeEntry(index) {
    const entry = treeEntries[index];
    if (!entry) return;
    editingTreeIndex = index;
    document.getElementById("treeEntryForm").reset();
    document.getElementById("treeEntryFormTitle").textContent = "Edit constellation entry";
    document.getElementById("treeEntryTitle").value = entry.title || "";
    document.getElementById("treeEntryDate").value = entry.date || "";
    document.getElementById("treeEntryText").value = entry.text || "";
    document.getElementById("treeEntrySize").value = entry.size || "medium";
    document.getElementById("treeEntryTone").value = entry.tone || "violet";
    populateMemoryOptions(entry.memoryId);
    document.getElementById("treeEntryFormPanel").classList.remove("hidden");
    document.getElementById("treePreviewPanel").classList.add("hidden");
    document.getElementById("treeEntryFormPanel").scrollIntoView({ behavior: "smooth", block: "start" });
}

function closeTreeForm() {
    document.getElementById("treeEntryFormPanel").classList.add("hidden");
    document.getElementById("treeEntryForm").reset();
    editingTreeIndex = null;
}

function saveTreeEntryDraft(event) {
    event.preventDefault();
    const memoryId = document.getElementById("treeMemoryId").value;
    const memory = treeMemories.find(item => String(item.id) === String(memoryId));
    if (!memory) {
        setTreeStatus("Choose a valid existing memory before saving.", true);
        return;
    }

    const entry = {
        memoryId: Number(memory.id),
        date: document.getElementById("treeEntryDate").value.trim() || memory.date || "",
        title: document.getElementById("treeEntryTitle").value.trim(),
        text: document.getElementById("treeEntryText").value.trim(),
        size: document.getElementById("treeEntrySize").value,
        tone: document.getElementById("treeEntryTone").value
    };

    if (!entry.title || !entry.text) {
        setTreeStatus("Add both a title and a short description.", true);
        return;
    }

    if (editingTreeIndex === null) {
        if (treeEntries.some(item => String(item.memoryId) === String(entry.memoryId))) {
            setTreeStatus("That memory is already represented in the constellation. Edit its existing entry instead.", true);
            return;
        }
        treeEntries.push(entry);
    } else {
        const duplicate = treeEntries.some((item, index) => index !== editingTreeIndex && String(item.memoryId) === String(entry.memoryId));
        if (duplicate) {
            setTreeStatus("That memory already has another constellation entry.", true);
            return;
        }
        treeEntries[editingTreeIndex] = entry;
    }

    treeHasChanges = true;
    renderTreeList();
    updateTreePublishButton();
    closeTreeForm();
    setTreeStatus("Draft saved in this editor session. Publish to update the live Memory Universe.");
}

function deleteTreeEntry(index) {
    const entry = treeEntries[index];
    if (!entry) return;
    if (!confirm(`Remove “${entry.title}” from the constellation? The underlying memory will not be deleted.`)) return;
    treeEntries.splice(index, 1);
    treeHasChanges = true;
    renderTreeList();
    updateTreePublishButton();
    setTreeStatus("Entry removed from the draft. Publish to apply the change to the live universe.");
}

function moveTreeEntry(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= treeEntries.length) return;
    [treeEntries[index], treeEntries[target]] = [treeEntries[target], treeEntries[index]];
    treeHasChanges = true;
    renderTreeList();
    updateTreePublishButton();
    setTreeStatus("Order changed in the draft. Publish to apply it to the live constellation.");
}

function showTreePreview() {
    const panel = document.getElementById("treePreviewPanel");
    const preview = document.getElementById("treePreviewList");
    if (!treeEntries.length) {
        preview.innerHTML = '<p class="section-description">There are no entries to preview yet.</p>';
    } else {
        preview.innerHTML = treeEntries.map((entry, index) => {
            const tone = TREE_TONES[entry.tone] || TREE_TONES.violet;
            const memory = treeMemories.find(item => String(item.id) === String(entry.memoryId));
            return `<article class="tree-preview-item" style="--entry-tone:${tone}">
                <span class="tree-preview-orb" aria-hidden="true"></span>
                <div><p class="tree-preview-meta">${String(index + 1).padStart(2, "0")} · ${escapeTreeHTML(entry.date || "No date")} · ${escapeTreeHTML(entry.size || "medium")} node</p>
                <h3>${escapeTreeHTML(entry.title || "Untitled entry")}</h3>
                <p>${escapeTreeHTML(entry.text || "")}</p>
                <span class="tree-preview-linked">Linked memory: ${escapeTreeHTML(memory ? memory.title : "Missing memory")}</span></div>
            </article>`;
        }).join("");
    }
    panel.classList.remove("hidden");
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function publishTreeEntries() {
    const button = document.getElementById("publishTreeButton");
    if (!treeHasChanges) {
        setTreeStatus("There are no unpublished changes.");
        return;
    }
    if (!treeEntries.every(entry => treeMemories.some(memory => String(memory.id) === String(entry.memoryId)))) {
        setTreeStatus("One or more entries link to a missing memory. Edit those entries before publishing.", true);
        return;
    }
    if (!confirm("Publish these changes to the live Memory Universe? The constellation design will remain unchanged.")) return;

    const secret = typeof askPlacesSecret === "function" ? await askPlacesSecret() : null;
    if (!secret) {
        setTreeStatus("Publishing cancelled. Your draft remains in this editor session.");
        return;
    }

    button.disabled = true;
    setTreeStatus("Publishing Memory Universe…");
    try {
        const response = await fetch(`${TREE_WORKER_URL}/publish-tree`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Editor-Secret": secret
            },
            body: JSON.stringify({ tree: treeEntries })
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) {
            throw new Error(result.error || `Publishing failed (HTTP ${response.status}).`);
        }
        treeHasChanges = false;
        updateTreePublishButton();
        setTreeStatus("Published successfully. The live constellation may take a short time to reflect the changes.");
    } catch (error) {
        console.error("Publishing Memory Universe failed:", error);
        setTreeStatus(`Publishing failed: ${error.message}. Your draft remains in this editor session.`, true);
        alert("Could not publish Memory Universe changes.\n\n" + error.message + "\n\nDo not refresh this page yet; your draft is still here.");
    } finally {
        button.disabled = false;
        updateTreePublishButton();
    }
}

function updateTreePublishButton() {
    const button = document.getElementById("publishTreeButton");
    if (!button) return;
    button.textContent = treeHasChanges ? "Publish Universe Changes *" : "Publish Universe";
}

function setTreeStatus(message, isError = false) {
    const status = document.getElementById("treePublishStatus");
    if (!status) return;
    status.textContent = message;
    status.style.color = isError ? "#9a3f35" : "";
}

function escapeTreeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
