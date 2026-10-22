"""Download font Google + Font Awesome ke folder www/ biar game jalan offline di APK.
Dipanggil dari workflow: python3 fetch_assets.py www
"""
import os, re, sys, urllib.request

WWW = sys.argv[1] if len(sys.argv) > 1 else "www"
UA = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36"
FA_VER = "6.5.1"
FA_BASE = f"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/{FA_VER}"

def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()

def save(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(data)

def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()

def write(path, text):
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)

def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(text)

# ---- Font Awesome ----
css = get(f"{FA_BASE}/css/all.min.css").decode("utf-8")
names = set(re.findall(r"url\(\.\./webfonts/([^)\"']+)\)", css))
assert names, "Font Awesome: file webfonts tidak ketemu di CSS"
for n in names:
    save(f"{WWW}/fonts/fa/webfonts/{n}", get(f"{FA_BASE}/webfonts/{n}"))
write(f"{WWW}/fonts/fa/css/all.min.css", css)
FA_URL = f"{FA_BASE}/css/all.min.css"
print("FA ok:", len(names), "file font")

# ---- Google Fonts ----
targets = [f"{WWW}/index.html", f"{WWW}/style.css", f"{WWW}/ui_patches.css"]
gf_pat = re.compile(r"https://fonts\.googleapis\.com/css2\?[^\"'\)\s>]+")
found = {}
for t in targets:
    if os.path.exists(t):
        for u in gf_pat.findall(read(t)):
            found.setdefault(u.replace("&amp;", "&"), len(found))

for url, idx in found.items():
    gcss = get(url).decode("utf-8")
    for j, furl in enumerate(sorted(set(re.findall(r"url\((https://fonts\.gstatic\.com/[^)]+)\)", gcss)))):
        ext = furl.split("?")[0].rsplit(".", 1)[-1]
        local = f"gf{idx}_{j}.{ext}"
        save(f"{WWW}/fonts/g/{local}", get(furl))
        gcss = gcss.replace(furl, local)
    write(f"{WWW}/fonts/g/gf{idx}.css", gcss)
    print("Google font ok:", url[:70])

# ---- Ganti link CDN -> file lokal ----
for t in targets:
    if not os.path.exists(t):
        continue
    s = read(t)
    s = s.replace(FA_URL, "fonts/fa/css/all.min.css")
    for url, idx in found.items():
        s = s.replace(url, f"fonts/g/gf{idx}.css").replace(url.replace("&", "&amp;"), f"fonts/g/gf{idx}.css")
    write(t, s)
print("Selesai.")
