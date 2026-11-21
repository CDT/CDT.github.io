"""Fit a card on a small, grayscale page image."""

from io import BytesIO
from urllib.parse import unquote, urlsplit
from xml.etree import ElementTree

import pymupdf
from PIL import Image


WIDTH = 528
HEIGHT = 792

# Leave room for the reader's margins and chapter-end indicator.
IMAGE_WIDTH = 448
IMAGE_HEIGHT = 610
CARD_CSS = """
body { margin: 0; padding: 0; color: #161616; font: 23pt/1.25 sans-serif; }
h1 { font: bold 37pt/1.12 sans-serif; margin: 0 0 8pt; }
h2 { font: bold 16pt/1.15 sans-serif; margin: 16pt 0 4pt; }
p, ul, dl { margin: 0 0 7pt; }
.label { display: none; }
.definition { font-size: 25pt; }
.definition em { font-size: 19pt; }
img { width: 272pt; height: auto; }
/* Compact, illustrated one-page X3 vocabulary cards. */
.compact { font: 18pt/1.18 sans-serif; }
.compact h1 { font: bold 31pt/1.1 sans-serif; margin: 0 0 3pt; }
.compact .phonetics { font: 16pt/1.15 sans-serif; margin: 0 0 5pt; }
.compact .definition { font: 19pt/1.18 sans-serif; margin: 0 0 5pt; }
.compact .definition em { font-size: 15pt; }
.compact img { width: 252pt; height: auto; margin: 4pt 0 7pt; }
.compact h2 { font: bold 13pt/1.1 sans-serif; margin: 7pt 0 1pt; }
.compact p { margin: 0 0 3pt; }
.compact section { margin: 0; }


"""


def render_card(card, body, source_dir, archive):
    """Return a grayscale JPEG or raise if the card needs editing."""
    image_count = 0
    for element in body.iter():
        element.tag = element.tag.rsplit("}", 1)[-1]
        if element.tag in {"main", "header", "section", "footer"}:
            element.tag = "div"
        if element.tag == "img":
            src = element.get("src", "")
            href = urlsplit(src)
            image = (card.parent / unquote(href.path)).resolve()
            if href.scheme or href.netloc or not image.is_relative_to(source_dir) or not image.is_file():
                raise ValueError(f"{card.name}: could not read illustration {src!r}")
            element.set("src", image.relative_to(source_dir).as_posix())
            image_count += 1

    html = ElementTree.tostring(body, encoding="unicode", method="html")
    story = pymupdf.Story(html, user_css=CARD_CSS, archive=archive)
    content = pymupdf.Rect(22, 24, IMAGE_WIDTH - 22, IMAGE_HEIGHT - 28)
    more, _ = story.place(content)
    if more:
        raise ValueError(f"{card.name}: content exceeds one X3 page. Shorten the card and rebuild.")

    output = BytesIO()
    writer = pymupdf.DocumentWriter(output)
    device = writer.begin_page(pymupdf.Rect(0, 0, IMAGE_WIDTH, IMAGE_HEIGHT))
    story.draw(device)
    writer.end_page()
    writer.close()
    with pymupdf.open(stream=output.getvalue(), filetype="pdf") as document:
        page = document[0]
        if len(page.get_image_info()) != image_count:
            raise ValueError(f"{card.name}: an illustration did not render")
        blocks = [block for block in page.get_text("blocks") if block[4].strip()]
        if not blocks or any(block[0] < content.x0 - 1 or block[2] > content.x1 + 1 for block in blocks):
            raise ValueError(f"{card.name}: text must fit within the X3 page margins")
        pixmap = page.get_pixmap(colorspace=pymupdf.csGRAY, alpha=False)
        image = Image.frombytes("L", (pixmap.width, pixmap.height), pixmap.samples)
        encoded = BytesIO()
        image.save(encoded, format="JPEG", quality=90, progressive=False, optimize=True)
        return encoded.getvalue()
