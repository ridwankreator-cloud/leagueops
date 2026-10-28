// ==========================================
// SETTINGS PATCH — menu "Pengaturan" di tab Lainnya + pilihan tema dan bahasa.
//
// Dipasang di <head> index.html (SEBELUM <body>) supaya tema langsung
// kepasang sebelum layar pertama digambar -- jadi gak ada kedip putih
// pas buka app di mode gelap. Bagian bikin layar nunggu DOM siap.
//
// Pilihan tema disimpan di localStorage (per perangkat), terpisah dari
// save game, jadi gak ikut ke-reset pas save dihapus atau di-import.
// ==========================================
(function () {
    "use strict";

    var KUNCI = "lod_tema"; // "terang" | "gelap"
    var root = document.documentElement;

    function bacaTema() {
        try {
            var v = localStorage.getItem(KUNCI);
            return v === "gelap" ? "gelap" : "terang";
        } catch (e) {
            return "terang";
        }
    }

    function simpanTema(v) {
        try {
            localStorage.setItem(KUNCI, v);
        } catch (e) {
            /* storage diblokir -- tema tetap jalan sampai app ditutup */
        }
    }

    function terapkanTema(tema) {
        if (tema === "gelap") root.setAttribute("data-theme", "dark");
        else root.removeAttribute("data-theme");

        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute("content", tema === "gelap" ? "#0E1118" : "#EDF0F5");
    }

    // Langsung dijalankan: ini yang bikin gak ada kedip.
    terapkanTema(bacaTema());

    // Dipakai script lain kalau perlu tahu tema aktif.
    window.getTemaAktif = bacaTema;
    window.setTemaAktif = function (tema) {
        tema = tema === "gelap" ? "gelap" : "terang";
        simpanTema(tema);
        terapkanTema(tema);
        tandaiPilihan(tema);
    };

    // ---------------------------------------------------------
    // Layar Pengaturan
    // ---------------------------------------------------------
    var HTML_LAYAR =
        '<div class="header-sub">' +
        '<h2 class="text-gold"><i class="fa-solid fa-sliders"></i> PENGATURAN</h2>' +
        '<button class="btn-kembali" onclick="tutupSubLayar()">Kembali</button>' +
        "</div>" +
        '<div class="hub-section-label">Tampilan</div>' +
        '<div class="pengaturan-card">' +
        '<div class="pengaturan-card__judul">Tema</div>' +
        '<div class="pengaturan-card__desc">Pilih tampilan yang paling nyaman. Pilihan disimpan di perangkat ini.</div>' +
        '<div class="tema-grid">' +
        opsiTema("terang", "fa-sun", "Terang", "Latar cerah, nyaman dipakai di siang hari.") +
        opsiTema("gelap", "fa-moon", "Gelap", "Latar gelap, lebih adem di mata saat malam.") +
        "</div>" +
        "</div>" +
        kartuBahasa();

    function opsiTema(kode, ikon, nama, deskripsi) {
        return (
            '<button type="button" class="tema-opsi tema-opsi--' + kode + '" data-tema="' + kode + '">' +
            '<div class="tema-opsi__preview"><span></span><span></span></div>' +
            '<div class="tema-opsi__label"><i class="fa-solid ' + ikon + '"></i>' + nama +
            '<i class="fa-solid fa-circle-check tema-opsi__cek"></i></div>' +
            '<div class="tema-opsi__desc">' + deskripsi + "</div>" +
            "</button>"
        );
    }

    // ---- kartu pilihan bahasa (mesin penerjemahnya ada di lang_patch.js) ----
    function opsiBahasa(kode, bendera, nama, deskripsi) {
        return (
            '<button type="button" class="tema-opsi tema-opsi--bahasa" data-bahasa="' + kode + '">' +
            '<div class="tema-opsi__preview tema-opsi__preview--bahasa"><span>' + bendera + "</span></div>" +
            '<div class="tema-opsi__label">' + nama +
            '<i class="fa-solid fa-circle-check tema-opsi__cek"></i></div>' +
            '<div class="tema-opsi__desc">' + deskripsi + "</div>" +
            "</button>"
        );
    }

    function kartuBahasa() {
        return (
            '<div class="pengaturan-card" style="margin-top:14px;">' +
            '<div class="pengaturan-card__judul">Bahasa / Language</div>' +
            '<div class="pengaturan-card__desc">Pilih bahasa tampilan. Beberapa teks yang dibuat otomatis oleh game (seperti berita dan highlight pertandingan) mungkin masih berbahasa Indonesia.</div>' +
            '<div class="tema-grid">' +
            opsiBahasa("id", "🇮🇩", "Bahasa Indonesia", "Tampilan dalam bahasa Indonesia.") +
            opsiBahasa("en", "🇬🇧", "English", "Display in English.") +
            "</div>" +
            "</div>"
        );
    }

    function bahasaSekarang() {
        return typeof window.getBahasaAktif === "function" ? window.getBahasaAktif() : "id";
    }

    function tandaiBahasa(kode) {
        var tombol = document.querySelectorAll("#layarPengaturan .tema-opsi[data-bahasa]");
        for (var i = 0; i < tombol.length; i++) {
            var aktif = tombol[i].getAttribute("data-bahasa") === kode;
            if (aktif) tombol[i].classList.add("aktif");
            else tombol[i].classList.remove("aktif");
            tombol[i].setAttribute("aria-pressed", aktif ? "true" : "false");
        }
    }

    function tandaiPilihan(tema) {
        var tombol = document.querySelectorAll("#layarPengaturan .tema-opsi[data-tema]");
        for (var i = 0; i < tombol.length; i++) {
            var aktif = tombol[i].getAttribute("data-tema") === tema;
            if (aktif) tombol[i].classList.add("aktif");
            else tombol[i].classList.remove("aktif");
            tombol[i].setAttribute("aria-pressed", aktif ? "true" : "false");
        }
    }

    function bangunLayarPengaturan() {
        if (document.getElementById("layarPengaturan")) return;

        var layar = document.createElement("div");
        layar.id = "layarPengaturan";
        layar.className = "sub-layar sembunyi";
        layar.innerHTML = HTML_LAYAR;

        var hub = document.getElementById("layarHubLainnya");
        if (hub && hub.parentNode) hub.parentNode.insertBefore(layar, hub.nextSibling);
        else document.body.appendChild(layar);

        layar.addEventListener("click", function (e) {
            var el = e.target;
            while (el && el !== layar) {
                if (el.classList && el.classList.contains("tema-opsi")) {
                    var kodeBahasa = el.getAttribute("data-bahasa");
                    if (kodeBahasa) {
                        if (typeof window.setBahasaAktif === "function") window.setBahasaAktif(kodeBahasa);
                        tandaiBahasa(bahasaSekarang());
                    } else {
                        window.setTemaAktif(el.getAttribute("data-tema"));
                    }
                    return;
                }
                el = el.parentNode;
            }
        });

        tandaiPilihan(bacaTema());
        tandaiBahasa(bahasaSekarang());
    }

    function pasangKartuDiHub() {
        var hub = document.getElementById("layarHubLainnya");
        if (!hub || document.getElementById("hubCardPengaturan")) return;

        var grid = hub.querySelectorAll(".hub-grid");
        if (!grid.length) return;
        var gridSistem = grid[grid.length - 1]; // grid terakhir = bagian "Sistem"

        var kartu = document.createElement("div");
        kartu.className = "hub-card";
        kartu.id = "hubCardPengaturan";
        kartu.setAttribute("onclick", "window.bukaDariHub('layarPengaturan','layarHubLainnya')");
        kartu.innerHTML =
            '<div class="hub-card__icon" style="background:var(--blue-dim);color:var(--blue);"><i class="fa-solid fa-sliders"></i></div>' +
            '<div class="hub-card__body">' +
            '<div class="hub-card__title">Pengaturan</div>' +
            '<div class="hub-card__desc">Tampilan, tema, dan bahasa aplikasi.</div>' +
            "</div>" +
            '<div class="hub-card__arrow">›</div>';

        gridSistem.insertBefore(kartu, gridSistem.firstChild);
    }

    function init() {
        bangunLayarPengaturan();
        pasangKartuDiHub();
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
