/*
THE ARCHIVE — PATCH 4 WORKER CHANGES

Apply these three changes to the EXISTING Cloudflare Worker source, then Deploy.
This is intentionally a patch file, not a replacement Worker: the Worker contains
working routes for memories, places and things that must be preserved.

IMPORTANT: current uploads go into the public GitHub Pages repository. Audio uploaded
through this Worker is publicly accessible. Do not use for private/sensitive recordings.
*/

// 1) Add beside VIDEO_TYPES near the top of the Worker:
const AUDIO_TYPES = [
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/webm",
  "audio/aac",
  "audio/flac"
];

// 2) Inside POST /upload, replace the existing media validation with:
if (
  !type.startsWith("image/") &&
  !VIDEO_TYPES.includes(type) &&
  !AUDIO_TYPES.includes(type)
) {
  throw new Error("Unsupported memory media type.");
}

// Then replace the existing `const prefix = ...` directly below that validation with:
const prefix = type.startsWith("audio/")
  ? `audio/memory-${String(memoryId).padStart(2, "0")}/`
  : `images/memory-${String(memoryId).padStart(2, "0")}/`;

// 3) Inside PUT /publish, replace the validation inside `for (const item of memory.media)`
// with the block below. Keep `const id = Number(memory.id);` above it unchanged.
const validTypes = ["image", "video", "audio"];
const prefix = item && item.type === "audio"
  ? `audio/memory-${String(id).padStart(2, "0")}/`
  : `images/memory-${String(id).padStart(2, "0")}/`;

if (
  !item ||
  !validTypes.includes(item.type) ||
  typeof item.src !== "string" ||
  !item.src.startsWith(prefix) ||
  item.src.includes("..")
) {
  throw new Error(`Invalid media path in memory ${id}.`);
}

// After all three changes, save and Deploy the Worker. Do not change EDITOR_SECRET
// or GITHUB_TOKEN; the existing secrets remain in use.
