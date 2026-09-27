import zipfile
import xml.etree.ElementTree as ET
import os
from PIL import Image

def update_figures():
    doc_in = r'c:\Users\delwi\OneDrive\Desktop\caps\fordaGo\fordaGo\docs\chapters\chapter-1-3_FINAL.docx2.docx'
    doc_out = r'c:\Users\delwi\OneDrive\Desktop\caps\fordaGo\fordaGo\docs\chapters\chapter-1-3_FINAL_UPDATED_FIGURES.docx'
    fig_dir = r'c:\Users\delwi\OneDrive\Desktop\caps\fordaGo\fordaGo\docs\figures'

    # Mapping of docx media to regenerated high-contrast figures
    image_replacement_map = {
        'word/media/image1.png': os.path.join(fig_dir, 'fig1_ecosystem_architecture.png'),
        'word/media/image2.png': os.path.join(fig_dir, 'fig2_ipo_model.png'),
        'word/media/image4.png': os.path.join(fig_dir, '02_tools_languages_architecture.png'),
        'word/media/image5.png': os.path.join(fig_dir, 'fig3_use_case_diagram.png'),
        'word/media/image6.png': os.path.join(fig_dir, 'fig4_context_diagram_level0.png'),
        'word/media/image7.png': os.path.join(fig_dir, 'fig5_dfd_level1.png'),
        'word/media/image8.png': os.path.join(fig_dir, '04_updated_erd_black_and_white.png'),
    }

    # Strict compliance with ITCAP01_ManuscriptFormat.pdf:
    # Paper: Letter (8.5 x 11 in)
    # Margins: Top 1.0", Bottom 1.0", Left 1.5", Right 1.0"
    # Printable Width = 8.5 - 2.5 = 6.00 inches max!
    MAX_WIDTH_IN = 5.95
    MAX_HEIGHT_IN = 7.50

    extents_map = {}
    for media_name, file_path in image_replacement_map.items():
        with Image.open(file_path) as im:
            w_px, h_px = im.size
        aspect = h_px / float(w_px)
        w_in = MAX_WIDTH_IN
        h_in = w_in * aspect
        if h_in > MAX_HEIGHT_IN:
            h_in = MAX_HEIGHT_IN
            w_in = h_in / aspect
        cx = int(round(w_in * 914400))
        cy = int(round(h_in * 914400))
        extents_map[media_name] = (cx, cy)
        print(f"Extent for {os.path.basename(file_path)}: {w_in:.2f}in x {h_in:.2f}in ({cx}x{cy} EMUs)")

    with zipfile.ZipFile(doc_in, 'r') as zin:
        files = {name: zin.read(name) for name in zin.namelist()}

    # Parse rels
    rels_xml = files['word/_rels/document.xml.rels']
    root_rels = ET.fromstring(rels_xml)
    rel_to_media = {}
    for rel in root_rels:
        rid = rel.attrib.get('Id')
        target = rel.attrib.get('Target')
        if target and 'media/' in target:
            media_name = 'word/' + target if not target.startswith('word/') else target
            rel_to_media[rid] = media_name

    # Add gantt chart rel
    gantt_path = os.path.join(fig_dir, '01_gantt_chart.png')
    gantt_rid = 'rIdGanttChart'
    
    existing_gantt_rel = None
    for rel in root_rels:
        if rel.attrib.get('Id') == gantt_rid:
            existing_gantt_rel = rel
            break
            
    if existing_gantt_rel is None:
        ET.SubElement(root_rels, '{http://schemas.openxmlformats.org/package/2006/relationships}Relationship', {
            'Id': gantt_rid,
            'Type': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/image',
            'Target': 'media/image_gantt.png'
        })
    files['word/_rels/document.xml.rels'] = ET.tostring(root_rels, encoding='utf-8', xml_declaration=True)
    with open(gantt_path, 'rb') as gf:
        files['word/media/image_gantt.png'] = gf.read()

    # Replace existing images with new high-res ones
    for media_name, file_path in image_replacement_map.items():
        with open(file_path, 'rb') as f:
            files[media_name] = f.read()

    # Modify document.xml
    doc_xml = files['word/document.xml']
    root_doc = ET.fromstring(doc_xml)
    ns = {
        'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
        'a': 'http://schemas.openxmlformats.org/drawingml/2006/main',
        'wp': 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
        'pic': 'http://schemas.openxmlformats.org/drawingml/2006/picture',
        'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
    }

    # Center anchors and update extents
    for container in root_doc.findall('.//wp:anchor', ns) + root_doc.findall('.//wp:inline', ns):
        blip = container.find('.//a:blip', ns)
        if blip is not None:
            rid = blip.attrib.get('{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed')
            media_name = rel_to_media.get(rid)
            if media_name in extents_map:
                cx, cy = extents_map[media_name]
                # remove any crop
                blipFill = container.find('.//pic:blipFill', ns)
                if blipFill is not None:
                    srcRect = blipFill.find('.//a:srcRect', ns)
                    if srcRect is not None:
                        blipFill.remove(srcRect)
                # update wp:extent
                extent = container.find('.//wp:extent', ns)
                if extent is not None:
                    extent.attrib['cx'] = str(cx)
                    extent.attrib['cy'] = str(cy)
                # update a:ext
                xfrm = container.find('.//a:xfrm', ns)
                if xfrm is not None:
                    a_ext = xfrm.find('.//a:ext', ns)
                    if a_ext is not None:
                        a_ext.attrib['cx'] = str(cx)
                        a_ext.attrib['cy'] = str(cy)
                
                # Center anchor horizontally relative to margin
                if container.tag.endswith('anchor'):
                    posH = container.find('.//wp:positionH', ns)
                    if posH is not None:
                        posH.attrib['relativeFrom'] = 'margin'
                        # remove posOffset if exists
                        posOffset = posH.find('.//wp:posOffset', ns)
                        if posOffset is not None:
                            posH.remove(posOffset)
                        align = posH.find('.//wp:align', ns)
                        if align is None:
                            align = ET.SubElement(posH, '{http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing}align')
                        align.text = 'center'

    # Gantt chart dimensions:
    with Image.open(gantt_path) as im:
        gw, gh = im.size
    gaspect = gh / float(gw)
    gw_in = MAX_WIDTH_IN
    gh_in = gw_in * gaspect
    gantt_cx = int(round(gw_in * 914400))
    gantt_cy = int(round(gh_in * 914400))

    body = root_doc.find('.//w:body', ns)
    body_children = list(body)
    for idx, elem in enumerate(body_children):
        t = ''.join(elem.itertext()).strip()
        if 'Gantt Chart of Activities' in t:
            # Fix missing parenthesis in caption
            for r in elem.findall('.//w:r', ns):
                for wt in r.findall('.//w:t', ns):
                    if wt.text and 'Gantt Chart' in wt.text and not wt.text.endswith(')'):
                        wt.text = wt.text + ')'
            
            # Target paragraph right after caption
            target_p = body_children[idx+1]
            for child in list(target_p):
                if child.tag.endswith('r'):
                    target_p.remove(child)
            
            pPr = target_p.find('.//w:pPr', ns)
            if pPr is not None:
                jc = pPr.find('.//w:jc', ns)
                if jc is not None:
                    jc.attrib['{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val'] = 'center'
            
            drawing_xml = f'''<w:drawing xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
              <wp:inline distT="0" distB="0" distL="0" distR="0">
                <wp:extent cx="{gantt_cx}" cy="{gantt_cy}"/>
                <wp:effectExtent l="0" t="0" r="0" b="0"/>
                <wp:docPr id="999" name="Picture Gantt" descr="Gantt Chart"/>
                <wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr>
                <a:graphic>
                  <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture">
                    <pic:pic>
                      <pic:nvPicPr>
                        <pic:cNvPr id="999" name="Picture Gantt" descr="Gantt Chart"/>
                        <pic:cNvPicPr><a:picLocks noChangeAspect="1"/></pic:cNvPicPr>
                      </pic:nvPicPr>
                      <pic:blipFill>
                        <a:blip r:embed="{gantt_rid}"/>
                        <a:stretch><a:fillRect/></a:stretch>
                      </pic:blipFill>
                      <pic:spPr>
                        <a:xfrm><a:off x="0" y="0"/><a:ext cx="{gantt_cx}" cy="{gantt_cy}"/></a:xfrm>
                        <a:prstGeom prst="rect"><a:avLst/></a:prstGeom>
                      </pic:spPr>
                    </pic:pic>
                  </a:graphicData>
                </a:graphic>
              </wp:inline>
            </w:drawing>'''
            
            r_elem = ET.SubElement(target_p, '{http://schemas.openxmlformats.org/wordprocessingml/2006/main}r')
            r_elem.append(ET.fromstring(drawing_xml))
            print(f"Inserted Gantt chart ({gw_in:.2f}in x {gh_in:.2f}in) centered!")
            break

    # Also ensure all caption paragraphs are styled to 10pt (sz=20), black, Times New Roman as per ITCAP01
    for p in root_doc.findall('.//w:p', ns):
        t = ''.join(p.itertext()).strip()
        if t.startswith('Figure ') or ('Figure ' in t and len(t) < 120 and any(w in t for w in ['Architecture', 'Model', 'Framework', 'Diagram', 'Chart', 'Environment'])):
            pPr = p.find('.//w:pPr', ns)
            if pPr is not None:
                jc = pPr.find('.//w:jc', ns)
                if jc is not None:
                    jc.attrib['{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val'] = 'center'
                rPr = pPr.find('.//w:rPr', ns)
                if rPr is not None:
                    sz = rPr.find('.//w:sz', ns)
                    if sz is not None:
                        sz.attrib['{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val'] = '20'

    files['word/document.xml'] = ET.tostring(root_doc, encoding='utf-8', xml_declaration=True)

    with zipfile.ZipFile(doc_out, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
        for name, content in files.items():
            zout.writestr(name, content)

    print(f"Successfully generated: {doc_out} (Size: {os.path.getsize(doc_out)} bytes)")

if __name__ == '__main__':
    update_figures()
