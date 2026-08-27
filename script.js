let memories = [];


// ================================
// LOAD MEMORIES
// ================================

async function loadMemories() {

    try {

        const response =
            await fetch("data/memories.json");

        if (!response.ok) {
            throw new Error("Could not load memories.");
        }

        memories = await response.json();

        updateMemoryCounter();

    } catch (error) {

        console.error(error);

    }
}


// ================================
// MEMORY COUNTER
// ================================

function updateMemoryCounter() {

    const memoryCount =
        document.getElementById("memoryCount");

    if (memoryCount) {

        memoryCount.textContent =
            memories.length;

    }
}


// ================================
// RANDOM MEMORY
// ================================

function setupRandomMemory() {

    const randomMemoryButton =
        document.getElementById("randomMemory");

    if (!randomMemoryButton) return;

    randomMemoryButton.addEventListener(
        "click",
        () => {

            if (memories.length === 0) return;

            const randomIndex =
                Math.floor(
                    Math.random() * memories.length
                );

            const selectedMemory =
                memories[randomIndex];

            alert(
                `${selectedMemory.title}\n\n` +
                `${selectedMemory.date} · ` +
                `${selectedMemory.location}`
            );

        }
    );
}


// ================================
// OUR STORY — TIMELINE
// ================================

function renderTimeline() {

    const timeline =
        document.getElementById("timeline");

    // Only run on story.html
    if (!timeline) return;

    timeline.innerHTML = "";

    // Newest memories first
    const sortedMemories =
        [...memories].sort(
            (a, b) =>
                new Date(b.date) -
                new Date(a.date)
        );

    sortedMemories.forEach(memory => {

        const article =
            document.createElement("article");

        article.className =
            "timeline-memory";

        article.innerHTML = `
            <p class="timeline-date">
                ${memory.date}
            </p>

            <h2>
                ${memory.title}
            </h2>

            <p class="timeline-location">
                ${memory.location}
            </p>

            <p class="timeline-description">
                ${memory.description}
            </p>
        `;

        timeline.appendChild(article);

    });
}


// ================================
// START WEBSITE
// ================================

async function init() {

    // Load memories first
    await loadMemories();

    // Then activate features
    setupRandomMemory();

    // Then create timeline
    renderTimeline();

}

init();        document.getElementById("memoryCount");

    if (memoryCount) {
        memoryCount.textContent = memories.length;
    }
}


// ================================
// RANDOM MEMORY
// ================================

function setupRandomMemory() {

    const randomMemoryButton =
        document.getElementById("randomMemory");

    if (!randomMemoryButton) return;

    randomMemoryButton.addEventListener("click", () => {

        if (memories.length === 0) return;

        const randomIndex =
            Math.floor(Math.random() * memories.length);

        const selectedMemory =
            memories[randomIndex];

        alert(
            `${selectedMemory.title}\n\n` +
            `${selectedMemory.date} · ${selectedMemory.location}`
        );

    });
}


// ================================
// START
// ================================

async function init() {

    await loadMemories();

    setupRandomMemory();

}

init();

// ================================
// MEMORY COUNTER
// ================================



init();
const memoryCount = document.getElementById("memoryCount");

if (memoryCount) {
    memoryCount.textContent = memories.length;
}


// ================================
// RANDOM MEMORY
// ================================

const randomMemoryButton =
    document.getElementById("randomMemory");

if (randomMemoryButton) {

    randomMemoryButton.addEventListener("click", () => {

        const randomIndex =
            Math.floor(Math.random() * memories.length);

        const selectedMemory =
            memories[randomIndex];

        alert(
            `${selectedMemory.title}\n\n` +
            `${selectedMemory.date} · ${selectedMemory.location}`
        );

    });

}
