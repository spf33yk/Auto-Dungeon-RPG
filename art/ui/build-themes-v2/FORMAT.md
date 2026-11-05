# build-theme-art/v2

Production art uses the host image_gen route. Thirty distinct augment illustrations and five class crests are generated as five themed 2-column, 4-row atlases. Slot 0 is the crest; slots 1-6 are the six augment illustrations; slot 7 is unused. The monk, berserker, guardian and gambler atlases were edited by image_gen to remove background haze, preserve complete objects and keep clear margins. Source files and generation hashes, dimensions, crop boxes and runtime sizes are recorded in format.json.

All exports preserve source aspect ratio. Augment art is 192x192; crests are 64x64. The original illustration is cropped to its alpha bounds, scaled uniformly to fit within 88% of the canvas, and centered in transparent padding. These are UI illustrations, not a change to the 64px world grid. Existing ornamental frame art remains shared.

Raw generation PNGs are retained locally in output/themes-v2/sources and are not distributed. Re-export with:

    tools/python312/python.exe scripts/build-theme-art.py --sources output/themes-v2/sources
    node scripts/update-assets.js

Only compressed WebP runtime files, this format and provenance are shipped. qa.json checks nonempty icons and transparent outer corners; it does not replace visual review. All five atlases and the runtime contact sheet were inspected. Model/version and billing estimate were not returned by the host tool; do not infer them.

Capability diagnostics after enabling UTF-8: 0 FAIL, 2 WARN. The warnings were:

    [WARN   ] python.path                    other python.exe on PATH: ~/AppData/Local/Microsoft/WindowsApps/python.exe
    [WARN   ] paths.cwd                      the working folder has spaces or non-ASCII characters

The bundled tools/python312/python.exe and explicitly quoted paths were used. Optional video/code-art dependencies were missing; neither route is used here.
