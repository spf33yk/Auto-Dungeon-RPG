# Web compatibility build

Source: PixelGameFontJP-Futogo.ttf (unaltered original). The original contains CFF outlines despite its .ttf suffix.

PixelGameFontJP-Futogo-web.woff is generated with fonteditor-core 2.6.3 by converting the source outlines to TrueType and packaging as WOFF. The design and Unicode coverage are retained. The SIL OFL 1.1 in OFL.txt applies to both files; original copyright notices remain unchanged.

Rebuild: npm install --prefix output/font-compat-tools --no-save --no-package-lock fonteditor-core@2.6.3, then node scripts/build-font-web.cjs. The conversion dependency is a local build tool and is not shipped to browsers.
