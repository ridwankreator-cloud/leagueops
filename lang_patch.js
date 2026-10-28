// ==========================================
// LANG PATCH — pilihan bahasa Indonesia / English.
//
// Cara kerja: kode game tetap nulis teks Indonesia seperti biasa. Kalau bahasa
// Inggris dipilih, mesin ini menerjemahkan teks di layar memakai kamus di
// lang_en.js (teks statis + teks yang dirender JS), lalu terus mengawasi layar
// supaya teks baru yang muncul ikut diterjemahkan. Kalau bahasa Indonesia
// dipilih lagi, semua dikembalikan ke teks aslinya.
//
// Teks yang gak ada di kamus dibiarkan apa adanya, jadi gak ada yang rusak.
// Pilihan disimpan di localStorage (per perangkat), terpisah dari save game.
//
// Dipasang di <head> SESUDAH lang_en.js, supaya bahasa langsung kepasang
// sebelum layar pertama digambar.
// ==========================================
(function () {
    "use strict";

    var KUNCI = "lod_bahasa"; // "id" | "en"
    var root = document.documentElement;
    var KAMUS = window.LANG_EN || { exact: {}, regex: [] };
    var ATRIBUT = ["placeholder", "title", "aria-label", "alt"];
    var LEWATI = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1 };

    var aktif = "id";
    var pengamat = null;
    var catatanTeks = typeof WeakMap === "function" ? new WeakMap() : null; // node teks -> {asli, hasil}
    var catatanAttr = typeof WeakMap === "function" ? new WeakMap() : null; // elemen -> {atribut: {asli, hasil}}

    function bacaBahasa() {
        try {
            return localStorage.getItem(KUNCI) === "en" ? "en" : "id";
        } catch (e) {
            return "id";
        }
    }

    function simpanBahasa(v) {
        try {
            localStorage.setItem(KUNCI, v);
        } catch (e) {
            /* storage diblokir -- bahasa tetap jalan sampai app ditutup */
        }
    }

    function rapikan(s) {
        return s.replace(/\s+/g, " ").replace(/^ | $/g, "");
    }

    // Terjemahkan satu potongan teks. Hasilnya null kalau gak ada di kamus.
    function terjemah(teks) {
        var k = rapikan(teks);
        if (!k) return null;
        var h = KAMUS.exact[k];
        if (typeof h === "string") return h;
        var r = KAMUS.regex;
        for (var i = 0; i < r.length; i++) {
            var m = r[i][0].exec(k);
            if (m) {
                var out = r[i][1](m);
                if (out) return out;
            }
        }
        return null;
    }

    // ---------- teks biasa ----------
    function prosesTeks(node) {
        var p = node.parentNode;
        if (!p || LEWATI[p.nodeName]) return;
        var v = node.nodeValue;
        var rec = catatanTeks.get(node);
        if (rec && v === rec.hasil) return; // ini hasil tulisan kita sendiri
        var h = terjemah(v);
        if (h === null) {
            if (rec) catatanTeks.delete(node);
            return;
        }
        var awal = v.match(/^\s*/)[0];
        var akhir = v.match(/\s*$/)[0];
        var baru = awal + h + akhir;
        catatanTeks.set(node, { asli: v, hasil: baru });
        node.nodeValue = baru;
    }

    // ---------- atribut (placeholder, title, ...) ----------
    function prosesAtribut(el) {
        for (var i = 0; i < ATRIBUT.length; i++) {
            var a = ATRIBUT[i];
            var v = el.getAttribute(a);
            if (!v) continue;
            var rec = catatanAttr.get(el);
            if (rec && rec[a] && rec[a].hasil === v) continue;
            var h = terjemah(v);
            if (h === null) {
                if (rec && rec[a]) delete rec[a];
                continue;
            }
            if (!rec) {
                rec = {};
                catatanAttr.set(el, rec);
            }
            rec[a] = { asli: v, hasil: h };
            el.setAttribute(a, h);
        }
    }

    function jalan(akar) {
        if (!akar) return;
        if (akar.nodeType === 3) {
            prosesTeks(akar);
            return;
        }
        if (akar.nodeType !== 1 || LEWATI[akar.nodeName]) return;
        prosesAtribut(akar);
        var w = document.createTreeWalker(akar, 1 | 4, null, false); // elemen + teks
        var n;
        while ((n = w.nextNode())) {
            if (n.nodeType === 3) prosesTeks(n);
            else if (!LEWATI[n.nodeName]) prosesAtribut(n);
        }
    }

    // ---------- kembalikan ke Indonesia ----------
    function pulihkan(akar) {
        if (!akar) return;
        var w = document.createTreeWalker(akar, 1 | 4, null, false);
        var n;
        while ((n = w.nextNode())) {
            if (n.nodeType === 3) {
                var rec = catatanTeks.get(n);
                if (rec && n.nodeValue === rec.hasil) n.nodeValue = rec.asli;
                catatanTeks.delete(n);
            } else {
                var ra = catatanAttr.get(n);
                if (ra) {
                    for (var a in ra) {
                        if (n.getAttribute(a) === ra[a].hasil) n.setAttribute(a, ra[a].asli);
                    }
                    catatanAttr.delete(n);
                }
            }
        }
    }

    function saatBerubah(daftar) {
        for (var i = 0; i < daftar.length; i++) {
            var m = daftar[i];
            if (m.type === "childList") {
                for (var j = 0; j < m.addedNodes.length; j++) jalan(m.addedNodes[j]);
            } else if (m.type === "characterData") {
                prosesTeks(m.target);
            } else if (m.type === "attributes") {
                prosesAtribut(m.target);
            }
        }
    }

    function mulaiAwasi() {
        if (pengamat || typeof MutationObserver !== "function") return;
        pengamat = new MutationObserver(saatBerubah);
        pengamat.observe(root, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ATRIBUT
        });
    }

    function berhentiAwasi() {
        if (pengamat) {
            pengamat.disconnect();
            pengamat = null;
        }
    }

    function setAktif(kode) {
        aktif = kode === "en" ? "en" : "id";
        root.setAttribute("lang", aktif);
        if (aktif === "en") {
            mulaiAwasi();
            if (document.body) jalan(document.body);
        } else {
            berhentiAwasi();
            if (document.body) pulihkan(document.body);
        }
    }

    // ---------- alert() dan confirm() ----------
    function terjemahPesan(pesan) {
        if (aktif !== "en" || typeof pesan !== "string") return pesan;
        var utuh = terjemah(pesan);
        if (utuh !== null) return utuh;
        var baris = pesan.split("\n");
        var ada = false;
        for (var i = 0; i < baris.length; i++) {
            var h = terjemah(baris[i]);
            if (h !== null) {
                baris[i] = h;
                ada = true;
            }
        }
        return ada ? baris.join("\n") : pesan;
    }

    var _alert = window.alert ? window.alert.bind(window) : null;
    var _confirm = window.confirm ? window.confirm.bind(window) : null;
    if (_alert) window.alert = function (m) { return _alert(terjemahPesan(m)); };
    if (_confirm) window.confirm = function (m) { return _confirm(terjemahPesan(m)); };

    // ---------- antarmuka untuk script lain ----------
    window.getBahasaAktif = function () { return aktif; };
    window.setBahasaAktif = function (kode) {
        kode = kode === "en" ? "en" : "id";
        simpanBahasa(kode);
        setAktif(kode);
    };
    window.terjemahLang = terjemah; // dipakai kalau ada script lain yang mau nerjemahin teks sendiri

    // ---------- mulai ----------
    if (!catatanTeks || !catatanAttr || !KAMUS.exact) return; // browser terlalu lama: biarkan Indonesia

    var pilihan = bacaBahasa();
    root.setAttribute("lang", pilihan);
    if (pilihan === "en") {
        aktif = "en";
        mulaiAwasi(); // sudah mengawasi sejak <head>, jadi teks yang di-parse ikut diterjemahkan
    }

    function sesudahDomSiap() {
        if (aktif === "en" && document.body) jalan(document.body); // jaring pengaman buat yang kelewat
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", sesudahDomSiap);
    else sesudahDomSiap();
})();
