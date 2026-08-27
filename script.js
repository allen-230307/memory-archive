// ================================
// THE ARCHIVE — Main JavaScript
// ================================


// Temporary memories
// We'll move these into memories.json later.

const memories = [
    {
        id: 1,
        title: "That Rainy Evening",
        date: "14 August 2026",
        location: "Kochi",
        description:
            "We weren't supposed to stay that long, but somehow the evening became one worth remembering."
    },

    {
        id: 2,
        title: "The Long Ride",
        date: "20 August 2026",
        location: "Bangalore",
        description:
            "A long journey, unfamiliar streets, and a day that ended far too quickly."
    },

    {
        id: 3,
        title: "An Ordinary Afternoon",
        date: "25 August 2026",
        location: "Kochi",
        description:
            "Nothing particularly extraordinary happened. Maybe that's exactly why it stayed with us."
    }
];


// ================================
// MEMORY COUNTER
// ================================

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
