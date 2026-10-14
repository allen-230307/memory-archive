
/* =========================================================
   THE ARCHIVE — PLACES MANAGER
   Independent of the existing memory editor.
   ========================================================= */

const PLACES_WORKER_URL =
    "https://memory-archive-publisher.allen-tinkerer.workers.dev";

const PLACES_MAX_FILE_BYTES = 8 * 1024 * 1024;

let placesData = [];
let editingPlaceIndex = null;
let selectedPlaceImage = null;
let placesHaveChanges = false;

document.addEventListener("DOMContentLoaded", initPlacesManager);

async function initPlacesManager() {
    document.getElementById("addPlaceButton")
        .addEventListener("click", openNewPlace);

    document.getElementById("cancelPlaceButton")
        .addEventListener("click", closePlaceForm);

    document.getElementById("placeFormElement")
        .addEventListener("submit", savePlaceDraft);

    document.getElementById("placeImageFile")
        .addEventListener("change", handlePlaceImage);

    document.getElementById("publishPlacesButton")
        .addEventListener("click", publishPlaces);

    await loadPlacesData();
}

/* LOAD */

async function loadPlacesData() {
    const list = document.getElementById("placesEditorList");

    try {
        const response = await fetch("../data/places.json", {
            cache: "no-store"
        });

        if (!response.ok) {
            throw new Error("Could not load data/places.json.");
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error("places.json must contain an array.");
        }

        placesData = data.map(place => ({
            name: String(place.name || ""),
            date: String(place.date || ""),
            location: String(place.location || ""),
            description: String(place.description || place.text || ""),
            image: String(place.image || "")
        }));

        placesHaveChanges = false;
        renderPlacesList();
        updatePlacesPublishButton();
    } catch (error) {
        console.error(error);
        list.textContent =
            "Could not load places.json. Check the file and reload the editor.";
    }
}

/* LIST */

function renderPlacesList() {
    const list = document.getElementById("placesEditorList");

    if (!placesData.length) {
        list.innerHTML =
            '<div class="loading">No places yet. Add your first place.</div>';
        return;
    }

    list.innerHTML = placesData.map((place, index) => `
        <article class="entry-item">
            <div class="entry-number">
                ${String(index + 1).padStart(2, "0")}
            </div>

            <div>
                <div class="entry-title">${escapePlacesHTML(place.name || "Untitled place")}</div>
                <div class="entry-meta">
                    ${escapePlacesHTML(place.date)}
                    ${place.location
                        ? " · " + escapePlacesHTML(place.location)
                        : ""}
                    <br>
                    ${place.image ? "Photo attached" : "No photo"}
                </div>
            </div>

            <div class="entry-actions">
                <button type="button" class="small-button"
                    data-edit-place="${index}">Edit</button>
                <button type="button" class="small-button delete"
                    data-delete-place="${index}">Delete</button>
            </div>
        </article>
    `).join("");

    list.querySelectorAll("[data-edit-place]").forEach(button => {
        button.addEventListener("click", () => {
            editPlace(Number(button.dataset.editPlace));
        });
    });

    list.querySelectorAll("[data-delete-place]").forEach(button => {
        button.addEventListener("click", () => {
            deletePlace(Number(button.dataset.deletePlace));
        });
    });
}

/* FORM */

function openNewPlace() {
    editingPlaceIndex = null;
    selectedPlaceImage = null;

    document.getElementById("placeFormElement").reset();
    document.getElementById("placeFormEyebrow").textContent = "NEW PLACE";
    document.getElementById("placeFormTitle").textContent = "Add a Place";
    document.getElementById("placeImagePreview").replaceChildren();

    showPlaceForm(true);
}

function editPlace(index) {
    const place = placesData[index];
    if (!place) return;

    editingPlaceIndex = index;
    selectedPlaceImage = null;

    document.getElementById("placeName").value = place.name;
    document.getElementById("placeDate").value = place.date;
    document.getElementById("placeLocation").value = place.location;
    document.getElementById("placeDescription").value = place.description;
    document.getElementById("placeImage").value = place.image;
    document.getElementById("placeImageFile").value = "";

    document.getElementById("placeFormEyebrow").textContent = "EDIT PLACE";
    document.getElementById("placeFormTitle").textContent = "Edit Place";

    renderPlaceImagePreview(place.image);
    showPlaceForm(true);
}

function showPlaceForm(show) {
    document.getElementById("placesListPanel")
        .classList.toggle("hidden", show);

    document.getElementById("placeFormElement")
        .classList.toggle("hidden", !show);

    window.scrollTo({ top: 0, behavior: "smooth" });
}

function closePlaceForm() {
    selectedPlaceImage = null;
    showPlaceForm(false);
}

function handlePlaceImage(event) {
    const file = event.target.files && event.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
        alert("Please select an image file.");
        event.target.value = "";
        return;
    }

    if (file.size > PLACES_MAX_FILE_BYTES) {
        alert("The image must be 8 MB or smaller. Compress it and try again.");
        event.target.value = "";
        return;
    }

    selectedPlaceImage = file;

    const preview = document.getElementById("placeImagePreview");
    preview.replaceChildren();

    const image = document.createElement("img");
    image.src = URL.createObjectURL(file);
    image.alt = "Selected place photo";

    Object.assign(image.style, {
        display: "block",
        maxWidth: "100%",
        maxHeight: "260px",
        objectFit: "contain",
        marginTop: "12px",
        borderRadius: "6px"
    });

    preview.appendChild(image);
}

function renderPlaceImagePreview(path) {
    const preview = document.getElementById("placeImagePreview");
    preview.replaceChildren();

    if (!path) return;

    const image = document.createElement("img");
    image.src = "../" + path;
    image.alt = "Current place photo";

    Object.assign(image.style, {
        display: "block",
        maxWidth: "100%",
        maxHeight: "260px",
        objectFit: "contain",
        marginTop: "12px",
        borderRadius: "6px"
    });

    image.onerror = () => {
        image.alt = "Current photo could not be previewed.";
    };

    preview.appendChild(image);
}

/* SAVE DRAFT */

function savePlaceDraft(event) {
    event.preventDefault();

    const name = document.getElementById("placeName").value.trim();

    if (!name) {
        alert("Please enter a place name.");
        return;
    }

    const oldPlace = editingPlaceIndex === null
        ? null
        : placesData[editingPlaceIndex];

    const place = {
        name,
        date: document.getElementById("placeDate").value.trim(),
        location: document.getElementById("placeLocation").value.trim(),
        description: document.getElementById("placeDescription").value.trim(),
        image: document.getElementById("placeImage").value.trim()
            || (oldPlace ? oldPlace.image : ""),
        _pendingImage: selectedPlaceImage || null
    };

    if (editingPlaceIndex === null) {
        placesData.push(place);
    } else {
        placesData[editingPlaceIndex] = place;
    }

    placesHaveChanges = true;
    renderPlacesList();
    updatePlacesPublishButton();
    showPlaceForm(false);

    setPlacesStatus(
        "Place saved in this editor session. Publish Places to make it live."
    );
}

/* DELETE */

function deletePlace(index) {
    const place = placesData[index];
    if (!place) return;

    if (!confirm(
        `Remove "${place.name || "this place"}" from the pending changes?\n\n` +
        "The live website will change only after publishing."
    )) {
        return;
    }

    placesData.splice(index, 1);
    placesHaveChanges = true;

    renderPlacesList();
    updatePlacesPublishButton();
    setPlacesStatus("Place removed from the pending list. Publish to confirm.");
}

/* PUBLISH UI */

function updatePlacesPublishButton() {
    const button = document.getElementById("publishPlacesButton");

    button.textContent = placesHaveChanges
        ? "Publish Places *"
        : "Publish Places";
}

function setPlacesStatus(message) {
    document.getElementById("placesPublishStatus").textContent = message;
}

/* PASSWORD PROMPT */

function askPlacesSecret() {
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

        const heading = document.createElement("h2");
        heading.textContent = "Publish Places";

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
        submit.textContent = "Continue";

        actions.append(cancel, submit);
        form.append(heading, note, input, actions);
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

/* FILE CONVERSION AND UPLOAD */

function placeFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            const result = String(reader.result || "");
            const comma = result.indexOf(",");

            if (comma < 0) {
                reject(new Error("Could not read the selected image."));
                return;
            }

            resolve(result.slice(comma + 1));
        };

        reader.onerror = () => reject(new Error("Could not read the image."));
        reader.readAsDataURL(file);
    });
}

async function uploadPlaceImage(index, place, secret) {
    if (!place._pendingImage) return;

    const file = place._pendingImage;
    const contentBase64 = await placeFileToBase64(file);

    const response = await fetch(`${PLACES_WORKER_URL}/upload-place`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Editor-Secret": secret
        },
        body: JSON.stringify({
            placeId: index,
            fileName: `${Date.now()}-${file.name}`,
            contentType: file.type,
            contentBase64
        })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.error || "Place photo upload failed.");
    }

    place.image = result.path;
    delete place._pendingImage;
    document.getElementById("placeImage").value = result.path;
}

/* PUBLISH */

async function publishPlaces() {
    if (!placesHaveChanges) {
        alert("There are no unpublished place changes.");
        return;
    }

    for (const place of placesData) {
        if (!place.name || typeof place.name !== "string") {
            alert("Every place must have a name. Nothing was published.");
            return;
        }

        if (
            place.image &&
            (!place.image.startsWith("images/") || place.image.includes(".."))
        ) {
            alert(
                `Invalid image path for "${place.name}".\n\n` +
                "Use a repository path starting with images/, or upload a photo."
            );
            return;
        }
    }

    const photoCount = placesData.filter(place => place._pendingImage).length;

    if (!confirm(
        `Publish ${placesData.length} place(s)` +
        (photoCount ? ` and upload ${photoCount} photo(s)` : "") +
        " to the live archive?"
    )) {
        return;
    }

    const secret = await askPlacesSecret();

    if (!secret) {
        setPlacesStatus("Publishing cancelled.");
        return;
    }

    const button = document.getElementById("publishPlacesButton");
    button.disabled = true;
    button.textContent = "Publishing…";

    try {
        for (let i = 0; i < placesData.length; i++) {
            const place = placesData[i];

            if (place._pendingImage) {
                setPlacesStatus(
                    `Uploading photo for ${place.name} (${i + 1}/${placesData.length})…`
                );
                await uploadPlaceImage(i, place, secret);
            }
        }

        const publishedPlaces = placesData.map(place => ({
            name: place.name,
            date: place.date || "",
            location: place.location || "",
            description: place.description || "",
            image: place.image || ""
        }));

        setPlacesStatus("Publishing places.json to GitHub…");

        const response = await fetch(`${PLACES_WORKER_URL}/publish-places`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Editor-Secret": secret
            },
            body: JSON.stringify({ places: publishedPlaces })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.error || `Publishing failed (${response.status}).`
            );
        }

        placesData = publishedPlaces;
        placesHaveChanges = false;

        renderPlacesList();
        updatePlacesPublishButton();

        setPlacesStatus(
            "Published successfully. Your Places page may take a short time to update."
        );

        alert(
            "Places published successfully!\n\n" +
            "Your live website may take a short time to update."
        );
    } catch (error) {
        console.error(error);
        setPlacesStatus(
            "Publishing failed. Your pending changes remain in this editor session."
        );

        alert(
            "Could not finish publishing.\n\n" +
            error.message +
            "\n\nDo not refresh this page yet. Check the error before retrying."
        );
    } finally {
        button.disabled = false;
        updatePlacesPublishButton();
    }
}

/* HELPER */

function escapePlacesHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
