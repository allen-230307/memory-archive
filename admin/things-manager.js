
/* =========================================================
   THE ARCHIVE — THINGS I LOVE ABOUT YOU MANAGER
   Keeps the existing { title, text, date? } data format.
   ========================================================= */

const THINGS_WORKER_URL =
    "https://memory-archive-publisher.allen-tinkerer.workers.dev";

let thingsData = [];
let editingThingIndex = null;
let thingsHaveChanges = false;

document.addEventListener("DOMContentLoaded", initThingsManager);

async function initThingsManager() {
    document.getElementById("addThingButton")
        .addEventListener("click", openNewThing);

    document.getElementById("cancelThingButton")
        .addEventListener("click", closeThingForm);

    document.getElementById("thingFormElement")
        .addEventListener("submit", saveThingDraft);

    document.getElementById("publishThingsButton")
        .addEventListener("click", publishThings);

    await loadThingsData();
}

async function loadThingsData() {
    const list = document.getElementById("thingsEditorList");

    try {
        const response = await fetch("../data/things.json", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Could not load data/things.json.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("things.json must contain an array.");
        }

        thingsData = data.map(thing => ({
            title: String(thing.title || ""),
            text: String(thing.text || thing.description || ""),
            ...(thing.date ? { date: String(thing.date) } : {})
        }));

        thingsHaveChanges = false;
        renderThingsList();
        updateThingsPublishButton();
    } catch (error) {
        console.error("THINGS MANAGER ERROR:", error);
        list.textContent =
            "Could not load things.json. Check the file and reload the editor.";
    }
}

function renderThingsList() {
    const list = document.getElementById("thingsEditorList");

    if (!thingsData.length) {
        list.innerHTML =
            '<div class="loading">No entries yet. Add your first one.</div>';
        return;
    }

    list.innerHTML = thingsData.map((thing, index) => `
        <article class="entry-item">
            <div class="entry-number">
                ${String(index + 1).padStart(2, "0")}
            </div>

            <div>
                <div class="entry-title">
                    ${escapeThingHTML(thing.title || "Untitled")}
                </div>
                <div class="entry-meta">
                    ${escapeThingHTML(thing.date || "No date")}
                </div>
                <p class="entry-description">
                    ${escapeThingHTML(thing.text)}
                </p>
            </div>

            <div class="entry-actions">
                <button type="button" class="small-button"
                    data-edit-thing="${index}">Edit</button>
                <button type="button" class="small-button delete"
                    data-delete-thing="${index}">Delete</button>
            </div>
        </article>
    `).join("");

    list.querySelectorAll("[data-edit-thing]").forEach(button => {
        button.addEventListener("click", () => {
            editThing(Number(button.dataset.editThing));
        });
    });

    list.querySelectorAll("[data-delete-thing]").forEach(button => {
        button.addEventListener("click", () => {
            deleteThing(Number(button.dataset.deleteThing));
        });
    });
}

function openNewThing() {
    editingThingIndex = null;
    document.getElementById("thingFormElement").reset();

    document.getElementById("thingFormEyebrow").textContent = "NEW ENTRY";
    document.getElementById("thingFormTitle").textContent = "Add a Thing";

    showThingForm(true);
}

function editThing(index) {
    const thing = thingsData[index];
    if (!thing) return;

    editingThingIndex = index;

    document.getElementById("thingTitle").value = thing.title;
    document.getElementById("thingDate").value = thing.date || "";
    document.getElementById("thingText").value = thing.text;

    document.getElementById("thingFormEyebrow").textContent = "EDIT ENTRY";
    document.getElementById("thingFormTitle").textContent = "Edit Entry";

    showThingForm(true);
}

function showThingForm(show) {
    document.getElementById("thingsListPanel")
        .classList.toggle("hidden", show);

    document.getElementById("thingFormElement")
        .classList.toggle("hidden", !show);

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function closeThingForm() {
    showThingForm(false);
}

function saveThingDraft(event) {
    event.preventDefault();

    const title = document.getElementById("thingTitle").value.trim();
    const text = document.getElementById("thingText").value.trim();
    const date = document.getElementById("thingDate").value.trim();

    if (!title || !text) {
        alert("Please enter both a title and a description.");
        return;
    }

    const thing = { title, text };

    if (date) {
        thing.date = date;
    }

    if (editingThingIndex === null) {
        thingsData.push(thing);
    } else {
        thingsData[editingThingIndex] = thing;
    }

    thingsHaveChanges = true;
    renderThingsList();
    updateThingsPublishButton();
    showThingForm(false);

    setThingsStatus(
        "Entry saved in this editor session. Publish Things to make it live."
    );
}

function deleteThing(index) {
    const thing = thingsData[index];
    if (!thing) return;

    if (!confirm(
        `Delete "${thing.title}" from the pending changes?\n\n` +
        "The live website changes only after publishing."
    )) {
        return;
    }

    thingsData.splice(index, 1);
    thingsHaveChanges = true;

    renderThingsList();
    updateThingsPublishButton();
    setThingsStatus("Entry removed from pending changes. Publish to confirm.");
}

function updateThingsPublishButton() {
    document.getElementById("publishThingsButton").textContent =
        thingsHaveChanges ? "Publish Things *" : "Publish Things";
}

function setThingsStatus(message) {
    document.getElementById("thingsPublishStatus").textContent = message;
}

async function publishThings() {
    if (!thingsHaveChanges) {
        alert("There are no unpublished changes to Things I Love About You.");
        return;
    }

    if (!confirm(`Publish ${thingsData.length} entries to the live archive?`)) {
        return;
    }

    /*
     * Reuses the secure secret prompt already defined by
     * places-manager.js. Keep places-manager.js loaded first.
     */
    if (typeof askPlacesSecret !== "function") {
        alert("The shared editor-secret prompt is unavailable. Check script order.");
        return;
    }

    const secret = await askPlacesSecret();
    if (!secret) {
        setThingsStatus("Publishing cancelled.");
        return;
    }

    const button = document.getElementById("publishThingsButton");
    button.disabled = true;
    button.textContent = "Publishing…";

    try {
        setThingsStatus("Publishing things.json to GitHub…");

        const response = await fetch(
            `${THINGS_WORKER_URL}/publish-things`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "X-Editor-Secret": secret
                },
                body: JSON.stringify({ things: thingsData })
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.error || `Publishing failed (${response.status}).`
            );
        }

        thingsHaveChanges = false;
        renderThingsList();
        updateThingsPublishButton();

        setThingsStatus(
            "Published successfully. The public page may take a short time to update."
        );

        alert(
            "Things I Love About You published successfully!\n\n" +
            "The public page may take a short time to update."
        );
    } catch (error) {
        console.error("PUBLISH THINGS ERROR:", error);

        setThingsStatus(
            "Publishing failed. Your pending changes remain in this editor session."
        );

        alert(
            "Could not publish the entries.\n\n" +
            error.message +
            "\n\nDo not refresh this page until you have checked the error."
        );
    } finally {
        button.disabled = false;
        updateThingsPublishButton();
    }
}

function escapeThingHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
