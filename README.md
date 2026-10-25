# THE ARCHIVE

A personal memory archive for stories, shared moments, places, little things, and the Memory Universe.

## Pages

- `index.html` — home
- `story.html` — Our Story
- `memory.html` — individual memory pages
- `gallery.html` — media gallery
- `places.html` — Places We’ve Been list
- `place.html` — individual place detail
- `things.html` — Things I Love About You
- `tree.html` — Memory Universe
- `admin/index.html` — private editing interface

## Data files

- `data/memories.json` — published memories and each memory’s Universe star settings
- `data/tree.json` — optional visual overrides for existing memory IDs (`tone` and `size`)
- `data/places.json` — places
- `data/things.json` — little things

The Memory Universe node list is generated from `data/memories.json`. Its title, date, description, and memory link come from the memory record. Existing `data/tree.json` entries can provide fallback star styling; adding a memory does not require adding a separate Universe entry.

## Publish workflow

1. Keep a backup or create a Git branch before making a large change.
2. Edit memories, places, and things through the admin interface where supported.
3. Publish from the editor and wait for the success response.
4. Confirm the GitHub Pages deployment completes, then refresh the live site.
5. Test on mobile, including image/video and no-media memories.

For a manual update, validate JSON syntax and check that every referenced media path exists before committing. Keep the JSON files and media together in backups.
