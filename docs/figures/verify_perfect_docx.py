import zipfile
import xml.etree.ElementTree as ET

def verify_perfect_docx():
    doc_path = r'c:\Users\delwi\OneDrive\Desktop\caps\fordaGo\fordaGo\docs\chapters\chapter-1-3_FINAL_PERFECT_FORMAT.docx'
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

    print("=== CHAPTER HEADINGS & PAGE BREAKS ===")
    for idx, elem in enumerate(children):
        t = ''.join(elem.itertext()).strip()
        for kw in ['CHAPTER I', 'CHAPTER II', 'CHAPTER III', 'CHAPTER IV', 'REFERENCES']:
            if t == kw or t.startswith(kw + ' ') or t.startswith(kw + '\n') or t.startswith(kw + 'Summary'):
                # check page break
                has_br = False
                if idx > 0:
                    prev = children[idx-1]
                    for br in prev.findall('.//w:br', ns):
                        if br.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}type') == 'page':
                            has_br = True
                print(f"[{idx}] '{t[:40]}' -> Preceded by Page Break? {has_br}")

    print("\n=== ALL FIGURES AUDIT (CHECKING FOR INLINE & CENTERING) ===")
    for idx, elem in enumerate(children):
        inlines = elem.findall('.//wp:inline', ns)
        anchors = elem.findall('.//wp:anchor', ns)
        drawings = elem.findall('.//w:drawing', ns)
        if drawings:
            t = ''.join(elem.itertext()).strip()
            prev_t = ''.join(children[idx-1].itertext()).strip() if idx > 0 else ''
            pPr = elem.find('.//w:pPr', ns)
            jc = pPr.find('.//w:jc', ns) if pPr is not None else None
            align_val = jc.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val') if jc is not None else 'NONE'
            ext = elem.find('.//wp:extent', ns)
            cx = int(ext.attrib.get('cx', '0')) if ext is not None else 0
            cy = int(ext.attrib.get('cy', '0')) if ext is not None else 0
            w_in = cx / 914400.0
            h_in = cy / 914400.0
            
            # Blip rId
            blip = elem.find('.//a:blip', ns)
            rid = blip.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed') if blip is not None else 'NONE'
            
            print(f"Child [{idx}]:")
            print(f"   rId: {rid} | Type: {'INLINE' if inlines else 'ANCHOR'} | Align: {align_val} | Size: {w_in:.2f}in x {h_in:.2f}in")
            print(f"   Caption right above it: '{prev_t}'")
            if anchors:
                print(f"   WARNING: Anchor detected in child [{idx}]!")

if __name__ == '__main__':
    verify_perfect_docx()
