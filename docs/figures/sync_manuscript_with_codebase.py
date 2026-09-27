import zipfile
import xml.etree.ElementTree as ET
import os
import html

def sync_manuscript():
    doc_path = r'c:\Users\delwi\OneDrive\Desktop\caps\fordaGo\fordaGo\docs\chapters\chapter-1-3_FINAL_UPDATED_FIGURES.docx'
    
    with zipfile.ZipFile(doc_path, 'r') as zin:
        files = {name: zin.read(name) for name in zin.namelist()}
        
    doc_xml = files['word/document.xml']
    root = ET.fromstring(doc_xml)
    ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    
    body = root.find('.//w:body', ns)
    children = list(body)
    
    # 1. Enrich Chapter 1 Table 1 (Technical Architecture & Development Stack)
    for idx, elem in enumerate(children):
        t = ''.join(elem.itertext()).strip()
        if 'Table 1. Technical Architecture & Development Stack' in t:
            tbl = children[idx+1]
            tbl_text = ''.join(tbl.itertext())
            if 'PayMongo' not in tbl_text:
                def make_row(c1, c2, c3):
                    e1 = html.escape(c1)
                    e2 = html.escape(c2)
                    e3 = html.escape(c3)
                    row_xml = f'''<w:tr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                      <w:tc><w:p><w:pPr><w:jc w:val="both"/><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>{e1}</w:t></w:r></w:p></w:tc>
                      <w:tc><w:p><w:pPr><w:jc w:val="both"/><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>{e2}</w:t></w:r></w:p></w:tc>
                      <w:tc><w:p><w:pPr><w:jc w:val="both"/><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>{e3}</w:t></w:r></w:p></w:tc>
                    </w:tr>'''
                    return ET.fromstring(row_xml)
                
                tbl.append(make_row(
                    'Cashless Payment Gateway',
                    'PayMongo API (GCash, Maya, Debit/Credit Card, OTC)',
                    'Processes online digital transactions for membership plans and supplement orders with instant webhook confirmation.'
                ))
                tbl.append(make_row(
                    'Biometric & MFA Security',
                    'Capacitor Biometric Auth, TOTP Two-Factor Authentication (2FA)',
                    'Enforces 1-tap fingerprint/facial biometric authentication and OTP verification for account protection and role integrity.'
                ))
                print("Enriched Chapter 1 Table 1 with PayMongo and Biometrics/2FA.")
            break

    # 2. Enrich Chapter 3 Table 1 (User Role and Access Privilege Matrix)
    for idx, elem in enumerate(children):
        t = ''.join(elem.itertext()).strip()
        if 'Table 1. User Role and Access Privilege Matrix of FordaGO' in t:
            tbl = children[idx+1]
            tbl_text = ''.join(tbl.itertext())
            if 'Cashless Online Payment' not in tbl_text:
                def make_matrix_row(c1, c2, c3, c4, c5, c6):
                    row_xml = f'''<w:tr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                      <w:tc><w:p><w:pPr><w:jc w:val="both"/><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>{html.escape(c1)}</w:t></w:r></w:p></w:tc>
                      <w:tc><w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>{html.escape(c2)}</w:t></w:r></w:p></w:tc>
                      <w:tc><w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>{html.escape(c3)}</w:t></w:r></w:p></w:tc>
                      <w:tc><w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>{html.escape(c4)}</w:t></w:r></w:p></w:tc>
                      <w:tc><w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>{html.escape(c5)}</w:t></w:r></w:p></w:tc>
                      <w:tc><w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>{html.escape(c6)}</w:t></w:r></w:p></w:tc>
                    </w:tr>'''
                    return ET.fromstring(row_xml)
                
                tbl.append(make_matrix_row(
                    'Cashless Online Payment & PayMongo Checkout',
                    'Full Access', 'Full Access', 'Transaction Lookup Only', 'No Access', 'Full Checkout & Receipts'
                ))
                tbl.append(make_matrix_row(
                    'Biometric 1-Tap & Two-Factor (2FA) Security',
                    'Configurable', 'Configurable', 'Configurable', 'Configurable', 'Configurable (Self)'
                ))
                tbl.append(make_matrix_row(
                    'Direct Real-Time Chat & Consultation (Reverb)',
                    'Monitoring Access', 'Monitoring Access', 'No Access', 'Full Active Messaging', 'Full Active Messaging'
                ))
                tbl.append(make_matrix_row(
                    'System Security Audit Trail & Activity Logs',
                    'Full Access', 'Full Access', 'Restricted (No Access)', 'No Access', 'No Access'
                ))
                print("Enriched Chapter 3 Table 1 (Role Matrix) with 4 new capability rows.")
            break

    # 3. Enrich Chapter 3 Table 2 (users Data Dictionary)
    for idx, elem in enumerate(children):
        t = ''.join(elem.itertext()).strip()
        if 'Table 2. Data Dictionary for the users Table' in t:
            tbl = children[idx+1]
            tbl_text = ''.join(tbl.itertext())
            if 'weight_kg' not in tbl_text:
                def make_dict_row(c1, c2, c3, c4):
                    row_xml = f'''<w:tr xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                      <w:tc><w:p><w:pPr><w:jc w:val="both"/><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>{html.escape(c1)}</w:t></w:r></w:p></w:tc>
                      <w:tc><w:p><w:pPr><w:jc w:val="both"/><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>{html.escape(c2)}</w:t></w:r></w:p></w:tc>
                      <w:tc><w:p><w:pPr><w:jc w:val="both"/><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>{html.escape(c3)}</w:t></w:r></w:p></w:tc>
                      <w:tc><w:p><w:pPr><w:jc w:val="both"/><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>{html.escape(c4)}</w:t></w:r></w:p></w:tc>
                    </w:tr>'''
                    return ET.fromstring(row_xml)
                
                tbl.append(make_dict_row('weight_kg', 'DECIMAL(5,2)', 'NULLABLE', 'Body weight in kilograms for fitness assessment'))
                tbl.append(make_dict_row('height_cm', 'DECIMAL(5,2)', 'NULLABLE', 'Body height in centimeters for BMI calculation'))
                tbl.append(make_dict_row('fitness_goal', 'ENUM', 'NULLABLE', 'Goal: muscle_gain, weight_loss, endurance, maintenance'))
                tbl.append(make_dict_row('two_factor_enabled', 'BOOLEAN', 'DEFAULT FALSE', 'Flag indicating whether TOTP 2FA is active'))
                tbl.append(make_dict_row('biometrics_enabled', 'BOOLEAN', 'DEFAULT FALSE', 'Flag indicating whether device biometric login is active'))
                tbl.append(make_dict_row('membership_status', 'ENUM', 'NOT NULL', 'Status: active, inactive, expired'))
                print("Enriched Chapter 3 Table 2 (users Data Dictionary) with fitness and security attributes.")
            break

    # 4. Add Table 8: Data Dictionary for the payments Table after Table 7
    children = list(body)
    for idx, elem in enumerate(children):
        t = ''.join(elem.itertext()).strip()
        if 'Table 7. Data Dictionary for the orders Table' in t:
            doc_full_text = ''.join(body.itertext())
            if 'Table 8. Data Dictionary for the payments Table' not in doc_full_text:
                pos_to_insert = idx + 2
                
                table8_caption_xml = '''<w:p xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                  <w:pPr><w:spacing w:before="240" w:after="120"/><w:jc w:val="center"/><w:rPr><w:b/><w:i/><w:sz w:val="20"/></w:rPr></w:pPr>
                  <w:r><w:rPr><w:b/><w:i/><w:sz w:val="20"/></w:rPr><w:t>Table 8. Data Dictionary for the payments Table</w:t></w:r>
                </w:p>'''
                
                table8_tbl_xml = '''<w:tbl xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
                  <w:tblPr><w:tblW w:w="0" w:type="auto"/><w:jc w:val="center"/><w:tblBorders><w:top w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:bottom w:val="single" w:sz="4" w:space="0" w:color="000000"/><w:insideH w:val="single" w:sz="4" w:space="0" w:color="000000"/></w:tblBorders></w:tblPr>
                  <w:tr>
                    <w:tc><w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:b/><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>Field Name</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:b/><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>Data Type</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:b/><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>Key / Constraint</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:jc w:val="center"/><w:rPr><w:b/><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>Description</w:t></w:r></w:p></w:tc>
                  </w:tr>
                  <w:tr>
                    <w:tc><w:p><w:pPr><w:rPr><w:b/><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>id</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>INT UNSIGNED</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>Primary Key, Auto Increment</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>Unique transaction payment record ID</w:t></w:r></w:p></w:tc>
                  </w:tr>
                  <w:tr>
                    <w:tc><w:p><w:pPr><w:rPr><w:b/><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>user_id</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>INT</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>Foreign Key (users.id), NULLABLE</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>Associated payer account ID</w:t></w:r></w:p></w:tc>
                  </w:tr>
                  <w:tr>
                    <w:tc><w:p><w:pPr><w:rPr><w:b/><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>receipt_number</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>VARCHAR(50)</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>UNIQUE, NOT NULL</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>Human-readable receipt tracking number</w:t></w:r></w:p></w:tc>
                  </w:tr>
                  <w:tr>
                    <w:tc><w:p><w:pPr><w:rPr><w:b/><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>payment_for</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>ENUM</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>NOT NULL</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>Category: membership, order, attendance, program, proposal</w:t></w:r></w:p></w:tc>
                  </w:tr>
                  <w:tr>
                    <w:tc><w:p><w:pPr><w:rPr><w:b/><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>amount</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>DECIMAL(10,2)</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>NOT NULL</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>Gross transacted payment amount in PHP</w:t></w:r></w:p></w:tc>
                  </w:tr>
                  <w:tr>
                    <w:tc><w:p><w:pPr><w:rPr><w:b/><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>payment_channel</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>ENUM</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>NOT NULL</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>Channel: gcash, paymaya, card, cash</w:t></w:r></w:p></w:tc>
                  </w:tr>
                  <w:tr>
                    <w:tc><w:p><w:pPr><w:rPr><w:b/><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>status</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>ENUM</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>DEFAULT 'pending'</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>Settlement: pending, paid, failed, cancelled</w:t></w:r></w:p></w:tc>
                  </w:tr>
                  <w:tr>
                    <w:tc><w:p><w:pPr><w:rPr><w:b/><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>gateway</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>VARCHAR(30)</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>DEFAULT 'paymongo'</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>Processor: paymongo or manual_counter</w:t></w:r></w:p></w:tc>
                  </w:tr>
                  <w:tr>
                    <w:tc><w:p><w:pPr><w:rPr><w:b/><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="20"/></w:rPr><w:t>paid_at</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>TIMESTAMP</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>NULLABLE</w:t></w:r></w:p></w:tc>
                    <w:tc><w:p><w:pPr><w:rPr><w:sz w:val="20"/></w:rPr></w:pPr><w:r><w:rPr><w:sz w:val="20"/></w:rPr><w:t>Timestamp of successful settlement</w:t></w:r></w:p></w:tc>
                  </w:tr>
                </w:tbl>'''
                
                cap_elem = ET.fromstring(table8_caption_xml)
                tbl_elem = ET.fromstring(table8_tbl_xml)
                
                body.insert(pos_to_insert, cap_elem)
                body.insert(pos_to_insert + 1, tbl_elem)
                print("Inserted Table 8 (payments Data Dictionary) into Chapter 3!")
            break

    files['word/document.xml'] = ET.tostring(root, encoding='utf-8', xml_declaration=True)
    
    with zipfile.ZipFile(doc_path, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
        for name, content in files.items():
            zout.writestr(name, content)
            
    print("Manuscript synchronization complete! File size:", os.path.getsize(doc_path))

if __name__ == '__main__':
    sync_manuscript()
