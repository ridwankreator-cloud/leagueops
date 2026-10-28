"""Bikin ikon Android + splash dari 2 gambar sumber.

Dijalankan di workflow GitHub Actions, SETELAH `npx cap add android`:
    python3 make_assets.py

Input (di root repo):
    icon_source.png    -> gambar ikon (kotak membulat dengan margin hitam)
    splash_source.png  -> gambar splash (ada bar loading yang mau dibuang)

Yang dikerjakan:
  1. Ikon: potong sampai tepi kotak, isi sudut membulat, lalu pecah jadi 2 lapis
     ikon adaptif (latar + logo M) untuk semua kepadatan layar.
  2. Splash: hapus bar loading, simpan ke www/splash.jpg, lalu suntik layar splash
     ke www/index.html (ukurannya pakai CSS "cover", jadi pas di semua rasio layar).
  3. Latar window native diganti warna gelap polos (biar gak ada logo Capacitor/kedip putih).
  4. Kunci orientasi potret di AndroidManifest.xml.
"""
import glob
import os
import re
import sys

import numpy as np
from PIL import Image, ImageDraw

ICON_SRC = "icon_source.png"
SPLASH_SRC = "splash_source.png"
WWW = "www"
RES = "android/app/src/main/res"
MANIFEST = "android/app/src/main/AndroidManifest.xml"

# kepadatan layar -> (ukuran ikon lama, ukuran lapisan adaptif)
DENSITAS = {
    "mdpi": (48, 108),
    "hdpi": (72, 162),
    "xhdpi": (96, 216),
    "xxhdpi": (144, 324),
    "xxxhdpi": (192, 432),
}


def isi_terdekat(arr, valid):
    """Isi piksel yang tidak valid dengan rata-rata tetangga valid, melebar bertahap."""
    arr = arr.astype(np.float32).copy()
    valid = valid.copy()
    h, w = valid.shape
    for _ in range(max(h, w)):
        if valid.all():
            break
        v = valid.astype(np.float32)
        jumlah = np.zeros((h, w), np.float32)
        total = np.zeros_like(arr)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            vs = np.roll(v, (dy, dx), (0, 1))
            if dy == 1:
                vs[0, :] = 0
            if dy == -1:
                vs[-1, :] = 0
            if dx == 1:
                vs[:, 0] = 0
            if dx == -1:
                vs[:, -1] = 0
            ars = np.roll(arr, (dy, dx), (0, 1))
            jumlah += vs
            total += ars * vs[..., None]
        baru = (~valid) & (jumlah > 0)
        arr[baru] = total[baru] / jumlah[baru][:, None]
        valid |= baru
    return arr


def siapkan_ikon():
    im = np.array(Image.open(ICON_SRC).convert("RGB")).astype(np.int32)
    ys, xs = np.where(im.max(axis=2) > 3)  # margin hitam pekat = 0, isi kartu >= 4
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    kartu = Image.fromarray(im[y0:y1, x0:x1].astype(np.uint8)).resize((1024, 1024), Image.LANCZOS)
    k = np.array(kartu).astype(np.float32)

    # sudut membulat (di luar kartu) -> diisi warna terdekat dari dalam kartu.
    # Bentuk kartu = persegi membulat dengan radius ~24% lebarnya (hasil ukur dari gambar asli).
    h, w = k.shape[:2]
    m = Image.new("L", (w * 4, h * 4), 0)
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w * 4 - 1, h * 4 - 1), radius=int(0.242 * w * 4), fill=255)
    dalam = np.array(m.resize((w, h), Image.LANCZOS)) >= 250
    for _ in range(4):  # kikis 4 piksel biar tepi anti-alias ikut diganti
        e = dalam.copy()
        e[1:, :] &= dalam[:-1, :]
        e[:-1, :] &= dalam[1:, :]
        e[:, 1:] &= dalam[:, :-1]
        e[:, :-1] &= dalam[:, 1:]
        e[0, :] = e[-1, :] = False
        e[:, 0] = e[:, -1] = False
        dalam = e
    k = isi_terdekat(k, dalam)

    # --- pisahkan logo M (emas) dari latar ---
    kotak = np.zeros((h, w), bool)
    kotak[int(h * 0.20):int(h * 0.88), int(w * 0.24):int(w * 0.76)] = True
    emas_kasar = (k[..., 0] > 70) & (k[..., 0] > k[..., 2] * 1.5) & kotak
    ys2, xs2 = np.where(emas_kasar)
    mx0, mx1, my0, my1 = xs2.min(), xs2.max() + 1, ys2.min(), ys2.max() + 1
    pad = 8
    mx0, my0, mx1, my1 = mx0 - pad, my0 - pad, mx1 + pad, my1 + pad

    # alpha lembut dari kecerahan kanal merah (latar ~10, emas ~230)
    r = k[..., 0]
    alpha = np.clip((r - 28.0) / 150.0, 0, 1)
    jendela = np.zeros((h, w), bool)
    jendela[my0:my1, mx0:mx1] = True
    alpha = np.where(jendela & kotak, alpha, 0.0)

    # latar tanpa M: piksel logo (alpha > 0) dibuang lalu diisi dari sekitarnya
    area_m = alpha > 0.02
    for _ in range(5):  # lebarkan sedikit biar tepi anti-alias ikut terhapus
        area_m = area_m | np.roll(area_m, 1, 0) | np.roll(area_m, -1, 0) | np.roll(area_m, 1, 1) | np.roll(area_m, -1, 1)
    # isi bekas logo pakai permukaan halus (polinomial derajat 3) yang dicocokkan ke latar sekitarnya,
    # jadi gradasi latar tetap mulus dan gak ada bercak gelap bekas logo.
    cincin = area_m.copy()
    for _ in range(45):
        cincin = cincin | np.roll(cincin, 1, 0) | np.roll(cincin, -1, 0) | np.roll(cincin, 1, 1) | np.roll(cincin, -1, 1)
    cincin &= ~area_m
    yy, xx = np.mgrid[0:h, 0:w]
    xn = (xx / float(w) - 0.5) * 2
    yn = (yy / float(h) - 0.5) * 2
    basis = np.stack([np.ones_like(xn), xn, yn, xn * xn, xn * yn, yn * yn,
                      xn ** 3, xn * xn * yn, xn * yn * yn, yn ** 3], axis=-1)
    idx = np.where(cincin.ravel())[0][::3]
    A = basis.reshape(-1, basis.shape[-1])
    latar = k.copy()
    for c in range(3):
        koef, *_ = np.linalg.lstsq(A[idx], k[..., c].ravel()[idx], rcond=None)
        pred = (A @ koef).reshape(h, w)
        latar[..., c] = np.where(area_m, np.clip(pred, 0, 255), k[..., c])

    # warna logo: ambil dari piksel emas pekat, tepi lembut dilebarkan dari dalam
    solid = alpha > 0.9
    warna = isi_terdekat(k, solid)

    # logo dipotong sesuai kotak M, lalu diletakkan di tengah kanvas 108dp
    logo_rgba = np.dstack([np.clip(warna, 0, 255), alpha * 255.0]).astype(np.uint8)
    logo = Image.fromarray(logo_rgba, "RGBA").crop((mx0, my0, mx1, my1))
    latar_img = Image.fromarray(np.clip(latar, 0, 255).astype(np.uint8), "RGB")
    return latar_img, logo


def lapisan_adaptif(latar_img, logo, ukuran):
    bg = latar_img.resize((ukuran, ukuran), Image.LANCZOS)
    # tinggi logo = 46% kanvas -> aman di dalam zona aman ikon adaptif (lingkaran 66dp)
    t = int(ukuran * 0.46)
    l = int(round(logo.width * t / logo.height))
    lg = logo.resize((l, t), Image.LANCZOS)
    fg = Image.new("RGBA", (ukuran, ukuran), (0, 0, 0, 0))
    fg.paste(lg, ((ukuran - l) // 2, (ukuran - t) // 2), lg)
    return bg, fg


def topeng_membulat(ukuran, radius_persen, bulat=False):
    skala = 4
    s = ukuran * skala
    m = Image.new("L", (s, s), 0)
    d = ImageDraw.Draw(m)
    if bulat:
        d.ellipse((0, 0, s - 1, s - 1), fill=255)
    else:
        d.rounded_rectangle((0, 0, s - 1, s - 1), radius=int(s * radius_persen), fill=255)
    return m.resize((ukuran, ukuran), Image.LANCZOS)


def tulis_ikon(latar_img, logo):
    # bersihkan ikon bawaan Capacitor (semua ekstensi) biar gak bentrok resource ganda
    for pola in ("ic_launcher.*", "ic_launcher_round.*"):
        for f in glob.glob(f"{RES}/mipmap-*/{pola}"):
            os.remove(f)

    for nama, (lama, adaptif) in DENSITAS.items():
        folder = f"{RES}/mipmap-{nama}"
        os.makedirs(folder, exist_ok=True)

        bg, fg = lapisan_adaptif(latar_img, logo, adaptif)
        bg.save(f"{folder}/ic_launcher_bg.png")
        fg.save(f"{folder}/ic_launcher_fg.png")

        # ikon lama (Android < 8): gabungan dua lapis, dibulatkan
        gabung = bg.convert("RGBA")
        gabung.alpha_composite(fg)
        sisi = gabung.resize((lama * 4, lama * 4), Image.LANCZOS)
        kotak = sisi.resize((lama, lama), Image.LANCZOS)
        kotak.putalpha(topeng_membulat(lama, 0.22))
        kotak.save(f"{folder}/ic_launcher.png")
        # versi bulat: potong tengah (zona 72/108) biar logo tetap kelihatan penuh
        m = int(adaptif * (108 - 72) / 216)
        tengah = gabung.crop((m, m, adaptif - m, adaptif - m)).resize((lama, lama), Image.LANCZOS)
        tengah.putalpha(topeng_membulat(lama, 0, bulat=True))
        tengah.save(f"{folder}/ic_launcher_round.png")

    xml = (
        '<?xml version="1.0" encoding="utf-8"?>\n'
        '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n'
        '    <background android:drawable="@mipmap/ic_launcher_bg"/>\n'
        '    <foreground android:drawable="@mipmap/ic_launcher_fg"/>\n'
        "</adaptive-icon>\n"
    )
    os.makedirs(f"{RES}/mipmap-anydpi-v26", exist_ok=True)
    for nama in ("ic_launcher.xml", "ic_launcher_round.xml"):
        with open(f"{RES}/mipmap-anydpi-v26/{nama}", "w") as f:
            f.write(xml)


def siapkan_splash():
    sp = np.array(Image.open(SPLASH_SRC).convert("RGB")).astype(np.float32)
    h, w = sp.shape[:2]

    # hapus bar loading: isi area bar dengan interpolasi vertikal dari baris di atas & bawahnya
    y_atas, y_bawah = 1226, 1252
    x0, x1 = 330, 610
    atas = sp[y_atas - 4:y_atas, x0:x1].mean(axis=0)
    bawah = sp[y_bawah:y_bawah + 4, x0:x1].mean(axis=0)
    for y in range(y_atas, y_bawah):
        t = (y - y_atas) / float(y_bawah - y_atas)
        sp[y, x0:x1] = atas * (1 - t) + bawah * t

    gambar = Image.fromarray(np.clip(sp, 0, 255).astype(np.uint8))
    os.makedirs(WWW, exist_ok=True)
    gambar.save(f"{WWW}/splash.png", optimize=True)

    # warna latar polos untuk window native (diambil dari area polos di atas logo)
    warna = sp[int(h * 0.20):int(h * 0.26), int(w * 0.40):int(w * 0.60)].reshape(-1, 3).mean(axis=0)
    return tuple(int(round(c)) for c in warna)


def tulis_splash_native(warna):
    # buang splash bawaan Capacitor (semua orientasi/kepadatan), ganti satu PNG polos
    for f in glob.glob(f"{RES}/drawable*/splash.*"):
        os.remove(f)
    os.makedirs(f"{RES}/drawable", exist_ok=True)
    Image.new("RGB", (8, 8), warna).save(f"{RES}/drawable/splash.png")


SNIPPET_SPLASH = """
<!-- === SPLASH SCREEN APK (disuntik saat build) === -->
<div id="apkSplash"></div>
<style>
#apkSplash{position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483647;
background:#%(hex)s url(splash.png) center center / cover no-repeat;
transition:opacity .45s ease;}
#apkSplash.hide{opacity:0;pointer-events:none;}
</style>
<script>
(function(){
  var mulai=Date.now(), el=document.getElementById("apkSplash");
  function selesai(){
    var sisa=Math.max(0,1300-(Date.now()-mulai));
    setTimeout(function(){
      el.classList.add("hide");
      setTimeout(function(){ if(el.parentNode) el.parentNode.removeChild(el); },520);
    },sisa);
  }
  if(document.readyState==="complete") selesai(); else window.addEventListener("load",selesai);
})();
</script>
"""


def suntik_splash_ke_html(warna):
    p = f"{WWW}/index.html"
    s = open(p, encoding="utf-8").read()
    if 'id="apkSplash"' in s:
        return
    hexw = "%02X%02X%02X" % warna
    snippet = SNIPPET_SPLASH % {"hex": hexw}
    s2, n = re.subn(r"(<body[^>]*>)", lambda m: m.group(1) + snippet, s, count=1, flags=re.I)
    if n != 1:
        sys.exit("GAGAL: tag <body> tidak ketemu di index.html")
    open(p, "w", encoding="utf-8").write(s2)


def kunci_potret():
    s = open(MANIFEST, encoding="utf-8").read()
    if "screenOrientation" in s:
        s = re.sub(r'android:screenOrientation="[^"]*"', 'android:screenOrientation="portrait"', s)
    else:
        s, n = re.subn(r"<activity\b", '<activity android:screenOrientation="portrait"', s, count=1)
        if n != 1:
            sys.exit("GAGAL: tag <activity> tidak ketemu di AndroidManifest.xml")
    open(MANIFEST, "w", encoding="utf-8").write(s)


if __name__ == "__main__":
    for f in (ICON_SRC, SPLASH_SRC):
        if not os.path.exists(f):
            sys.exit(f"GAGAL: file {f} tidak ada di root repo")
    latar_img, logo = siapkan_ikon()
    tulis_ikon(latar_img, logo)
    warna = siapkan_splash()
    tulis_splash_native(warna)
    suntik_splash_ke_html(warna)
    kunci_potret()
    print("Selesai: ikon, splash, dan orientasi potret terpasang. Warna latar splash:", warna)
