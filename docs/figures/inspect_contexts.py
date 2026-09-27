import zipfile
import xml.etree.ElementTree as ET

def inspect_figure_contexts():
    doc_path = r'c:\Users\delwi\OneDrive\Desktop\caps\fordaGo\fordaGo\docs\chapters\chapter-1-3_FINAL_UPDATED_FIGURES.docx'
    with zipfile.ZipFile(doc_path, 'r') as z:
        doc_xml = z.read('word/document.xml')

    root = ET.fromstring(doc_xml)
    ns = {
        'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
        'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
        'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
        'pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture',
        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    }

    body = root.find('.//w:body', ns)
    children = list(body)

    for idx, elem in enumerate(children):
        drawings = elem.findall('.//w:drawing', ns)
        t = ''.join(elem.itertext()).strip()
        if drawings:
            # find blip
            blips = elem.findall('.//a:blip', ns)
            rids = [b.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed') for b in blips]
            prev_t = ''.join(children[idx-1].itertext()).strip() if idx > 0 else ''
            next_t = ''.join(children[idx+1].itertext()).strip() if idx+1 < len(children) else ''
            print(f"=== Figure at Child [{idx}] ===")
            print(f"  RIds: {rids}")
            print(f"  Current paragraph text: '{t}'")
            print(f"  Prev paragraph text:    '{prev_t[:80]}'")
            print(f"  Next paragraph text:    '{next_t[:80]}'")

if __name__ == '__main__':
    inspect_figure_contexts()
