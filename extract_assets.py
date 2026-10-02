import re, base64, pathlib

p = pathlib.Path('index.html')
html = p.read_text(encoding='utf-8')

def extract(mime, filename, html):
    pattern = re.compile(r'data:' + re.escape(mime) + r';base64,([A-Za-z0-9+/=]+)')
    m = pattern.search(html)
    if m:
        pathlib.Path(filename).write_bytes(base64.b64decode(m.group(1)))
        html = pattern.sub(filename, html)
        print('Extracted', filename)
    return html

html = extract('application/pdf', 'Aashish_Thapa_CV.pdf', html)
html = extract('image/jpeg', 'profile.jpg', html)

p.write_text(html, encoding='utf-8')