let memories = [];


// ================================
// LOAD MEMORIES
// ================================

async function loadMemories() {

    try {

        const response = await fetch("data/memories.json");

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
