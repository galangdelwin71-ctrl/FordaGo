import zipfile
import xml.etree.ElementTree as ET

def check_drawings_and_chapters():
    doc_path = r'c:\Users\delwi\OneDrive\Desktop\caps\fordaGo\fordaGo\docs\chapters\chapter-1-3_FINAL_UPDATED_FIGURES.docx'
    with zipfile.ZipFile(doc_path, 'r') as z:
        doc_xml = z.read('word/document.xml')

    root = ET.fromstring(doc_xml)
    ns = {
        'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
        'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
        'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    }

    body = root.find('.//w:body', ns)
    children = list(body)

    print("=== CHAPTER HEADINGS & PAGE BREAK AUDIT ===")
    for idx, elem in enumerate(children):
        t = ''.join(elem.itertext()).strip()
        if any(t.startswith(ch) for ch in ['CHAPTER ', 'Chapter ', 'REFERENCES', 'APPENDICES', 'CURRICULUM VITAE']):
            if len(t) < 40:
                # check if preceding element or this element has page break
                has_page_break = False
                # check in this element
                for br in elem.findall('.//w:br', ns):
                    if br.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}type') == 'page':
                        has_page_break = True
                # check in previous element
                if idx > 0:
                    prev = children[idx-1]
                    for br in prev.findall('.//w:br', ns):
                        if br.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}type') == 'page':
                            has_page_break = True
                print(f"Child [{idx}]: '{t}' -> Has Page Break before it? {has_page_break}")

    print("\n=== DRAWINGS & FIGURES AUDIT ===")
    for idx, elem in enumerate(children):
        t = ''.join(elem.itertext()).strip()
        anchors = elem.findall('.//wp:anchor', ns)
        inlines = elem.findall('.//wp:inline', ns)
        if anchors or inlines:
            wrap_info = []
            for anc in anchors:
                for c in anc:
                    tag = c.tag.split('}')[-1]
                    if 'wrap' in tag.lower():
                        wrap_info.append(tag)
                posH = anc.find('.//wp:positionH', ns)
                posV = anc.find('.//wp:positionV', ns)
                alignH = posH.find('.//wp:align', ns) if posH is not None else None
                alignV = posV.find('.//wp:align', ns) if posV is not None else None
                posOffV = posV.find('.//wp:posOffset', ns) if posV is not None else None
                print(f"Child [{idx}] ANCHOR: text='{t[:60]}' | wrap={wrap_info} | alignH={alignH.text if alignH is not None else 'offset'} | vOff={posOffV.text if posOffV is not None else 'align'}")
            for inl in inlines:
                pPr = elem.find('.//w:pPr', ns)
                jc = pPr.find('.//w:jc', ns) if pPr is not None else None
                print(f"Child [{idx}] INLINE: text='{t[:60]}' | p_align={jc.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val') if jc is not None else 'default'}")

if __name__ == '__main__':
    check_drawings_and_chapters()
