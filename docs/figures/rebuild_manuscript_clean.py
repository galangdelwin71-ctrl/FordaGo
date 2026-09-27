import zipfile
import xml.etree.ElementTree as ET
import os
from PIL import Image

def rebuild_clean_manuscript():
    doc_in = r'c:\Users\delwi\OneDrive\Desktop\caps\fordaGo\fordaGo\docs\chapters\chapter-1-3_FINAL_UPDATED_FIGURES.docx'
    doc_out = r'c:\Users\delwi\OneDrive\Desktop\caps\fordaGo\fordaGo\docs\chapters\chapter-1-3_FINAL_PERFECT_FORMAT.docx'
    fig_dir = r'c:\Users\delwi\OneDrive\Desktop\caps\fordaGo\fordaGo\docs\figures'

    # Master figure specifications
    figures_spec = [
        {
            'key': 'fig1',
            'rId': 'rId8',
            'file': os.path.join(fig_dir, 'fig1_ecosystem_architecture.png'),
            'caption': 'Figure 1. FordaGO Tri-Tier Ecosystem Architecture',
            'chapter': 'CHAPTER I',
            'target_text_marker': 'FordaGO Tri-Tier Ecosystem Architecture'
        },
        {
            'key': 'fig2',
            'rId': 'rId9',
            'file': os.path.join(fig_dir, 'fig2_ipo_model.png'),
            'caption': 'Figure 2. IPO Model of FordaGO',
            'chapter': 'CHAPTER I',
            'target_text_marker': 'IPO Model of FordaGO'
        },
        {
            'key': 'fig_locale',
            'rId': 'rId10',
            'file': None, # keep original image3
            'caption': 'Figure 1. Map of the Municipality of Cabiao, Nueva Ecija; the Research Locale',
            'chapter': 'CHAPTER II',
            'target_text_marker': 'Map of the Municipality of Cabiao'
        },
        {
            'key': 'fig_gantt',
            'rId': 'rIdGanttChart',
            'file': os.path.join(fig_dir, '01_gantt_chart.png'),
            'caption': 'Figure 1. Gantt Chart of Activities for FordaGO System Development (January-September)',
            'chapter': 'CHAPTER III',
            'target_text_marker': 'Gantt Chart of Activities'
        },
        {
            'key': 'fig_arch',
            'rId': 'rId11',
            'file': os.path.join(fig_dir, '02_tools_languages_architecture.png'),
            'caption': 'Figure 2. FordaGO Full-Stack Architectural Framework',
            'chapter': 'CHAPTER III',
            'target_text_marker': 'FordaGO Full-Stack Architectural Framework'
        },
        {
            'key': 'fig_usecase',
            'rId': 'rId12',
            'file': os.path.join(fig_dir, 'fig3_use_case_diagram.png'),
            'caption': 'Figure 3. Use Case Diagram of FordaGO',
            'chapter': 'CHAPTER III',
            'target_text_marker': 'Use Case Diagram of FordaGO'
        },
        {
            'key': 'fig_context',
            'rId': 'rId13',
            'file': os.path.join(fig_dir, 'fig4_context_diagram_level0.png'),
            'caption': 'Figure 4. Context Diagram Level 0 of FordaGO',
            'chapter': 'CHAPTER III',
            'target_text_marker': 'Context Diagram Level 0 of FordaGO'
        },
        {
            'key': 'fig_dfd',
            'rId': 'rId14',
            'file': os.path.join(fig_dir, 'fig5_dfd_level1.png'),
            'caption': 'Figure 5. Data Flow Diagram Level 1 (DFD Level 1) of FordaGO',
            'chapter': 'CHAPTER III',
            'target_text_marker': 'Data Flow Diagram Level 1'
        },
        {
            'key': 'fig_erd',
            'rId': 'rId15',
            'file': os.path.join(fig_dir, '04_updated_erd_black_and_white.png'),
            'caption': 'Figure 6. Entity-Relationship Diagram (ERD) of FordaGO',
            'chapter': 'CHAPTER III',
            'target_text_marker': 'Entity-Relationship Diagram (ERD)'
        },
        {
            'key': 'fig_vscode',
            'rId': 'rId16',
            'file': None, # keep original image9
            'caption': 'Figure 7. Visual Studio Code Environment with PHP / Laravel Source Code',
            'chapter': 'CHAPTER III',
            'target_text_marker': 'Visual Studio Code Environment'
        },
        {
            'key': 'fig_db',
            'rId': 'rId17',
            'file': None, # keep original image10
            'caption': 'Figure 8. Database Tables and Implementation Environment (MySQL / phpMyAdmin)',
            'chapter': 'CHAPTER III',
            'target_text_marker': 'Database Tables and Implementation Environment'
        }
    ]

    # Calculate exact EMU dimensions for max 5.95 inches width
    MAX_W_IN = 5.95
    MAX_H_IN = 7.50

    with zipfile.ZipFile(doc_in, 'r') as zin:
        files = {name: zin.read(name) for name in zin.namelist()}

    doc_xml = files['word/document.xml']
    root = ET.fromstring(doc_xml)
    ns = {
        'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
        'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
        'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
        'pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture',
        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    }

    body = root.find('.//w:body', ns)

    # 1. Ensure automatic page breaks before every chapter and major section
    # Iterate through body elements
    i = 0
    while i < len(body):
        elem = body[i]
        t = ''.join(elem.itertext()).strip()
        
        # Check for chapter headings: CHAPTER II, CHAPTER III, CHAPTER IV, REFERENCES
        needs_page_break = False
        is_chapter = False
        for kw in ['CHAPTER II', 'CHAPTER III', 'CHAPTER IV', 'REFERENCES']:
            if t == kw or t.startswith(kw + ' ') or t.startswith(kw + '\n') or t.startswith(kw + 'Summary'):
                needs_page_break = True
                is_chapter = True
                break
                
        if needs_page_break:
            # Check if previous element already has a page break
            has_br = False
            if i > 0:
                prev_elem = body[i-1]
                for br in prev_elem.findall('.//w:br', ns):
                    if br.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}type') == 'page':
                        has_br = True
            for br in elem.findall('.//w:br', ns):
                if br.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}type') == 'page':
                    has_br = True
                    
            if not has_br:
                pb_xml = '<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:r><w:br w:type="page"/></w:r></w:p>'
                pb_elem = ET.fromstring(pb_xml)
                body.insert(i, pb_elem)
                print(f"Inserted automatic Page Break before '{t[:30]}'")
                i += 1 # advance past inserted break
        i += 1

    # 2. Convert all figures to clean, centered INLINE drawings with dedicated centered 10pt captions
    # First, let's map rId to image file dimensions
    rId_dims = {}
    for spec in figures_spec:
        rid = spec['rId']
        fpath = spec['file']
        if fpath and os.path.exists(fpath):
            with Image.open(fpath) as im:
                w_px, h_px = im.size
            aspect = h_px / float(w_px)
            w_in = MAX_W_IN
            h_in = w_in * aspect
            if h_in > MAX_H_IN:
                h_in = MAX_H_IN
                w_in = h_in / aspect
            cx = int(round(w_in * 914400))
            cy = int(round(h_in * 914400))
            rId_dims[rid] = (cx, cy, spec['caption'])
        else:
            # for images already in docx (image3, image9, image10)
            # Find their current extent in docx
            for anc in root.findall('.//wp:anchor', ns) + root.findall('.//wp:inline', ns):
                blip = anc.find('.//a:blip', ns)
                if blip is not None and blip.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed') == rid:
                    ext = anc.find('.//wp:extent', ns)
                    if ext is not None:
                        old_cx = int(ext.attrib.get('cx', '5440680'))
                        old_cy = int(ext.attrib.get('cy', '3600000'))
                        # scale width to max 5.95 in if larger
                        max_cx = int(round(MAX_W_IN * 914400))
                        if old_cx > max_cx:
                            scale = max_cx / float(old_cx)
                            old_cx = max_cx
                            old_cy = int(round(old_cy * scale))
                        rId_dims[rid] = (old_cx, old_cy, spec['caption'])
                    break

    # Now, inspect every paragraph that currently contains a drawing or a figure caption
    # We will remove old floating anchors and replace with clean (Caption Paragraph -> Inline Drawing Paragraph)
    def create_figure_pair(caption_text, rId, cx, cy, doc_id):
        caption_xml = f'''<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:pPr>
            <w:spacing w:before="240" w:after="120"/>
            <w:jc w:val="center"/>
            <w:rPr>
              <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
              <w:b/>
              <w:i/>
              <w:sz w:val="20"/>
              <w:szCs w:val="20"/>
              <w:color w:val="000000"/>
            </w:rPr>
          </w:pPr>
          <w:r>
            <w:rPr>
              <w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/>
              <w:b/>
              <w:i/>
              <w:sz w:val="20"/>
              <w:szCs w:val="20"/>
              <w:color w:val="000000"/>
            </w:rPr>
            <w:t>{caption_text}</w:t>
          </w:r>
        </w:p>'''

        drawing_xml = f'''<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
          <w:pPr>
            <w:spacing w:before="120" w:after="240"/>
            <w:jc w:val="center"/>
          </w:pPr>
          <w:r>
            <w:drawing>
              <wp:inline distT="0" distB="0" distL="0" distR="0">
                <wp:extent cx="{cx}" cy="{cy}"/>
                <wp:effectExtent l="0" t="0" r="0" b="0"/>
                <wp:docPr id="{doc_id}" name="Figure_{doc_id}" descr="{caption_text}"/>
                <wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>
                <a:graphic>
                  <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                    <pic:pic>
                      <pic:nvPicPr>
                        <pic:cNvPr id="{doc_id}" name="Figure_{doc_id}" descr="{caption_text}"/>
                        <pic:cNvPicPr><a:picLocks noChangeAspect="1"/></pic:cNvPicPr>
                      </pic:nvPicPr>
                      <pic:blipFill>
                        <a:blip r:embed="{rId}"/>
                        <a:stretch><a:fillRect/></a:stretch>
                      </pic:blipFill>
                      <pic:spPr>
                        <a:xfrm><a:off x="0" y="0"/><a:ext cx="{cx}" cy="{cy}"/></a:xfrm>
                        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                      </pic:spPr>
                    </pic:pic>
                  </a:graphicData>
                </a:graphic>
              </wp:inline>
            </w:drawing>
          </w:r>
        </w:p>'''
        return ET.fromstring(caption_xml), ET.fromstring(drawing_xml)

    # We do a targeted replacement for each figure in figures_spec:
    for spec_idx, spec in enumerate(figures_spec):
        rid = spec['rId']
        marker = spec['target_text_marker']
        caption = spec['caption']
        if rid not in rId_dims:
            continue
        cx, cy, _ = rId_dims[rid]
        
        # Locate the element(s) currently containing this figure or caption
        children = list(body)
        target_indices = []
        for idx, el in enumerate(children):
            t = ''.join(el.itertext()).strip()
            # check if element contains drawing with this rId
            blips = el.findall('.//a:blip', ns)
            has_rid = any(b.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed') == rid for b in blips)
            # check if element text matches marker
            matches_marker = marker in t and len(t) < 150
            if has_rid or matches_marker:
                target_indices.append(idx)
                
        if target_indices:
            # We replace the range of target_indices with our clean pair!
            min_idx = min(target_indices)
            max_idx = max(target_indices)
            print(f"Refactoring {spec['key']} ({caption}) at body indices {min_idx} to {max_idx}")
            
            cap_elem, draw_elem = create_figure_pair(caption, rid, cx, cy, 100 + spec_idx)
            
            # Remove all elements in the target range (from max to min)
            for rm_idx in range(max_idx, min_idx - 1, -1):
                body.remove(children[rm_idx])
                
            # Insert caption then drawing at min_idx
            body.insert(min_idx, cap_elem)
            body.insert(min_idx + 1, draw_elem)

    files['word/document.xml'] = ET.tostring(root, encoding='utf-8', xml_declaration=True)

    with zipfile.ZipFile(doc_out, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
        for name, content in files.items():
            zout.writestr(name, content)

    print(f"Rebuild complete! Saved to: {doc_out} (Size: {os.path.getsize(doc_out)} bytes)")

if __name__ == '__main__':
    rebuild_clean_manuscript()
