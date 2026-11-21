"""Build a shuffled EPUB with one grayscale image per Xteink X3 card."""

import argparse
import random
from datetime import datetime, timezone
from pathlib import Path
from xml.etree import ElementTree
from xml.sax.saxutils import escape, quoteattr
from zipfile import ZIP_DEFLATED, ZIP_STORED, ZipFile

import pymupdf

from render_card import HEIGHT, IMAGE_HEIGHT, IMAGE_WIDTH, WIDTH, render_card


ROOT = Path(__file__).resolve().parent
BOOK = ROOT / "book.epub"
XHTML = "{http://www.w3.org/1999/xhtml}"
XML_LANG = "{http://www.w3.org/XML/1998/namespace}lang"
MEDIA_TYPES = {
    ".css": "text/css",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
}


def build_epub(source_dir, output, rng):
    source_dir = source_dir.resolve()
    cards = sorted(source_dir.rglob("*.xhtml"))
    if not cards:
        raise ValueError(f"No XHTML cards found under {source_dir}")
    rng.shuffle(cards)
    archive = pymupdf.Archive(str(source_dir))

    manifest = [
        '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>'
    ]
    spine = []
    toc = []
    languages = set()
    pages = []

    for number, card in enumerate(cards, start=1):
        page = ElementTree.parse(card).getroot()
        title = (page.findtext(f"{XHTML}head/{XHTML}title") or "").strip()
        language = page.get(XML_LANG)
        body = page.find(f"{XHTML}body")
        if not title or not language or body is None:
            raise ValueError(f"{card.name}: each card needs a title, xml:lang, and a body")

        languages.add(language)
        href = f"cards/{number}.xhtml"
        image_href = f"images/{number}.jpg"
        manifest.extend([
            f'<item id="card-{number}" href="{href}" media-type="application/xhtml+xml"/>',
            f'<item id="image-{number}" href="{image_href}" media-type="image/jpeg"/>',
        ])
        spine.append(f'<itemref idref="card-{number}"/>')
        toc.append(
            f'<li><a href="{href}" lang={quoteattr(language)} '
            f'xml:lang={quoteattr(language)}>{escape(title)}</a></li>'
        )

        alt = " ".join(" ".join(body.itertext()).split())
        image = render_card(card, body, source_dir, archive)
        xhtml = f"""<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" lang={quoteattr(language)} xml:lang={quoteattr(language)}>
  <head>
    <title>{escape(title)}</title>
    <meta name="viewport" content="width={WIDTH}, height={HEIGHT}" />
    <style>body {{ margin: 0; background: #fff; text-align: center; }} img {{ display: block; margin: 0 auto; }}</style>
  </head>
  <body><img src="../{image_href}" width="{IMAGE_WIDTH}" height="{IMAGE_HEIGHT}" alt={quoteattr(alt)} /></body>
</html>
"""
        pages.append((href, xhtml, image_href, image))

    modified = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    language_tags = "".join(f"<dc:language>{escape(lang)}</dc:language>" for lang in sorted(languages))
    package = f"""<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="deck-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="deck-id">urn:uuid:31574790-4bd8-4d8a-95bd-f77665b3f11e</dc:identifier>
    <dc:title>Knowledge Cards X3</dc:title>
    {language_tags}
    <meta property="dcterms:modified">{modified}</meta>
    <meta property="rendition:layout">pre-paginated</meta>
    <meta property="rendition:orientation">portrait</meta>
    <meta property="rendition:spread">none</meta>
  </metadata>
  <manifest>{''.join(manifest)}</manifest>
  <spine>{''.join(spine)}</spine>
</package>
"""
    navigation = f"""<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops"
      lang="en" xml:lang="en">
  <head><title>Contents</title></head>
  <body><nav epub:type="toc" id="toc">
    <h1>Contents</h1>
    <ol>{''.join(toc)}</ol>
  </nav></body>
</html>
"""
    container = """<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="EPUB/package.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>
"""
    with ZipFile(output, "w", compression=ZIP_DEFLATED) as book:
        book.writestr("mimetype", "application/epub+zip", compress_type=ZIP_STORED)
        book.writestr("META-INF/container.xml", container)
        book.writestr("EPUB/package.opf", package)
        book.writestr("EPUB/nav.xhtml", navigation)
        for href, xhtml, image_href, image in pages:
            book.writestr("EPUB/" + href, xhtml)
            book.writestr("EPUB/" + image_href, image, compress_type=ZIP_STORED)

    return len(cards)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=BOOK)
    parser.add_argument("--seed", type=int, help="use the same seed to repeat a shuffle")
    args = parser.parse_args()
    try:
        count = build_epub(ROOT / "cards", args.output, random.Random(args.seed))
    except ValueError as error:
        parser.exit(1, f"{error}\n")
    print(f"Wrote {args.output} ({count} cards)")


if __name__ == "__main__":
    main()
