// ==========================================================================
// SPONSOR_NEGOTIATION_PATCH.JS
// Bikin tawaran sponsor gak lagi statis/permanen. Tiga penambahan:
//   1) COUNTDOWN 7 HARI -- tiap tawaran otomatis mundur (hilang dari list)
//      kalau gak direspon dalam 7 hari, gak ada penalti apapun.
//   2) TOMBOL TOLAK -- bisa nolak tawaran kapan aja secara manual, instan,
//      tanpa penalti (sebelumnya cuma ada "Tanda Tangani Kontrak").
//   3) REFRESH BERKALA -- tiap 5 hari, kalau slot pending belum penuh (4)
//      dan masih ada slot sponsor kosong, ada kans nyisipin 1 tawaran baru
//      yang lolos syarat reputasi/power -- biar list-nya kerasa hidup,
//      gak cuma diem nunggu di-generate ulang pas kosong total.
//
// CATATAN: penawaranSponsor TIDAK termasuk skema save/load game aslinya
// (regenerate tiap kali reload) -- jadi countdown & properti tambahan di
// sini pun otomatis reset kalau game di-reload, konsisten sama perilaku
// yang sudah ada sebelumnya, bukan keterbatasan baru dari patch ini.
// ==========================================================================

(function () {

const SISA_HARI_AWAL = 7;
const INTERVAL_TOPUP_HARI = 5;
const MAX_TAWARAN_PENDING = 4; // dari 3 -- biar ada lebih banyak pilihan buat dibandingin

let hariSejakTopUpTerakhir = 0;

// [FIX] script.js ke-load & manggil updateDashboard() SEBELUM patch ini
// (liat urutan <script> di index.html) -- jadi kalau dia sempet generate
// penawaranSponsor duluan pake generatePenawaranSponsor() versi ASLI
// (belum ke-override sama versi patch ini), entry yang kebentuk gak
// punya field sisaHari sampe tick harian pertama jalan. Efeknya:
// countdown di render pertama kebaca "undefined hari". Backfill sekali
// di sini biar langsung bener dari awal, gak perlu nunggu hari berganti.
if (typeof penawaranSponsor !== "undefined" && Array.isArray(penawaranSponsor)) {
    penawaranSponsor.forEach(sp => {
        if (typeof sp.sisaHari !== "number") sp.sisaHari = SISA_HARI_AWAL;
    });
}

// --------------------------------------------------------------------
// [1] TIMPA generatePenawaranSponsor -- logic filter/acak/limit-DARK
// disamain PERSIS sama versi asli (script.js), cuma nambah: sisaHari
// per tawaran, dan max slot dari 3 jadi 4.
// --------------------------------------------------------------------
window.generatePenawaranSponsor = function () {
    penawaranSponsor = [];

    let powerTimKita = 0;
    if (rosterKita && rosterKita.length > 0) {
        let totalOvr = 0;
        rosterKita.forEach(p => (totalOvr += p.ovr));
        powerTimKita = Math.floor(totalOvr / rosterKita.length);
    }

    let sponsorLayak = daftarSponsor.filter(
        s => reputasiTim >= s.minimalReputasi && powerTimKita >= s.minimalPower
    );

    let shuffled = sponsorLayak.sort(() => 0.5 - Math.random());

    let sudahAdaDark = false;
    shuffled = shuffled.filter(s => {
        if (s.tier !== "DARK") return true;
        if (sudahAdaDark) return false;
        sudahAdaDark = true;
        return true;
    });

    let maxOffer = Math.min(MAX_TAWARAN_PENDING, shuffled.length);

    for (let i = 0; i < maxOffer; i++) {
        let sp = JSON.parse(JSON.stringify(shuffled[i]));
        sp.durasi = Math.floor(Math.random() * 2) + 1;
        sp.bayar = sp.bayar * sp.durasi;
        sp.sisaHari = SISA_HARI_AWAL;
        penawaranSponsor.push(sp);
    }
};

// --------------------------------------------------------------------
// [2] TOLAK TAWARAN -- manual, instan, tanpa penalti apapun.
// --------------------------------------------------------------------
window.tolakSponsor = function (index) {
    let sp = penawaranSponsor[index];
    if (!sp) return;
    penawaranSponsor.splice(index, 1);
    if (typeof tambahBerita === "function") {
        tambahBerita(`📭 Manajemen menolak tawaran sponsor dari <span>${sp.nama}</span>.`);
    }
    if (typeof window.renderSponsorUI === "function") window.renderSponsorUI();
};

// --------------------------------------------------------------------
// [3] TICK HARIAN -- countdown mundur + refresh berkala. Dihook lewat
// wrap klikTombolUtama (fungsi "maju hari" utama), deteksi hari
// berjalan lewat selisih kalenderGame sebelum/sesudah -- gak perlu
// nyentuh script.js sama sekali, dan otomatis kepanggil di SEMUA
// jalur maju hari (reguler, jeda turnamen, off-season, dll).
// --------------------------------------------------------------------
function prosesTickSponsor(jumlahHariLewat) {
    if (!penawaranSponsor || penawaranSponsor.length === 0) {
        hariSejakTopUpTerakhir += jumlahHariLewat;
    } else {
        let adaMundur = false;
        for (let i = penawaranSponsor.length - 1; i >= 0; i--) {
            let sp = penawaranSponsor[i];
            if (typeof sp.sisaHari !== "number") sp.sisaHari = SISA_HARI_AWAL; // jaga2 tawaran lama dari sebelum patch ini
            sp.sisaHari -= jumlahHariLewat;
            if (sp.sisaHari <= 0) {
                if (typeof tambahBerita === "function") {
                    tambahBerita(`⏳ Tawaran sponsor dari <span>${sp.nama}</span> mundur otomatis karena tidak direspon dalam 7 hari.`);
                }
                penawaranSponsor.splice(i, 1);
                adaMundur = true;
            }
        }
        hariSejakTopUpTerakhir += jumlahHariLewat;
        if (adaMundur && typeof window.renderSponsorUI === "function") window.renderSponsorUI();
    }

    // --- REFRESH BERKALA ---
    if (hariSejakTopUpTerakhir < INTERVAL_TOPUP_HARI) return;
    hariSejakTopUpTerakhir = 0;

    let st = window.sponsorTim || {};
    let slotPenuh = st.utama && st.minor1 && st.minor2;
    if (slotPenuh) return;
    if (!penawaranSponsor || penawaranSponsor.length >= MAX_TAWARAN_PENDING) return;
    if (typeof daftarSponsor === "undefined" || typeof rosterKita === "undefined") return;

    let powerTimKita = 0;
    if (rosterKita.length > 0) {
        let totalOvr = 0;
        rosterKita.forEach(p => (totalOvr += p.ovr));
        powerTimKita = Math.floor(totalOvr / rosterKita.length);
    }

    let namaSudahAda = new Set(
        penawaranSponsor.map(s => s.nama)
            .concat([st.utama, st.minor1, st.minor2].filter(Boolean).map(s => s.nama))
    );

    let kandidat = daftarSponsor.filter(s =>
        reputasiTim >= s.minimalReputasi &&
        powerTimKita >= s.minimalPower &&
        !namaSudahAda.has(s.nama) &&
        (s.tier !== "DARK" || !penawaranSponsor.some(p => p.tier === "DARK")) // tetep jaga max 1 DARK pending
    );
    if (kandidat.length === 0) return;

    let pilihan = kandidat[Math.floor(Math.random() * kandidat.length)];
    let spBaru = JSON.parse(JSON.stringify(pilihan));
    spBaru.durasi = Math.floor(Math.random() * 2) + 1;
    spBaru.bayar = spBaru.bayar * spBaru.durasi;
    spBaru.sisaHari = SISA_HARI_AWAL;
    penawaranSponsor.push(spBaru);

    if (typeof tambahBerita === "function") {
        tambahBerita(`📨 Tawaran sponsor baru masuk dari <span>${spBaru.nama}</span>.`);
    }
    if (typeof window.renderSponsorUI === "function") window.renderSponsorUI();
}

if (typeof window.klikTombolUtama === "function" && !window._klikTombolUtamaAsliSebelumSponsorPatch) {
    window._klikTombolUtamaAsliSebelumSponsorPatch = window.klikTombolUtama;
    window.klikTombolUtama = function () {
        let tglSebelum = (typeof kalenderGame !== "undefined") ? kalenderGame.getTime() : null;
        let hasil = window._klikTombolUtamaAsliSebelumSponsorPatch.apply(this, arguments);
        let tglSesudah = (typeof kalenderGame !== "undefined") ? kalenderGame.getTime() : null;
        if (tglSebelum !== null && tglSesudah !== null && tglSesudah > tglSebelum) {
            let jumlahHari = Math.round((tglSesudah - tglSebelum) / 86400000);
            if (jumlahHari > 0) prosesTickSponsor(jumlahHari);
        }
        return hasil;
    };
}

// --------------------------------------------------------------------
// [4] RENDER -- suntik countdown + tombol Tolak ke tiap card, tanpa
// nulis ulang seluruh renderSponsorUI (biar tetep sinkron kalau ada
// perubahan lain di fungsi aslinya nanti).
// --------------------------------------------------------------------
if (typeof window.renderSponsorUI === "function" && !window._renderSponsorUIAsliSebelumNegoPatch) {
    window._renderSponsorUIAsliSebelumNegoPatch = window.renderSponsorUI;
    window.renderSponsorUI = function () {
        window._renderSponsorUIAsliSebelumNegoPatch();

        let listSponsorEl = document.getElementById("listSponsor");
        if (!listSponsorEl) return;
        let cardEls = listSponsorEl.querySelectorAll(".sponsor-offer-card");

        cardEls.forEach((el, i) => {
            let sp = penawaranSponsor[i];
            if (!sp) return;

            let btnAsli = el.querySelector(".sponsor-offer-card__btn");
            if (!btnAsli) return;

            // Bungkus tombol asli + tombol Tolak (icon ✕) dalam 1 baris
            let baris = document.createElement("div");
            baris.className = "sponsor-offer-card__btn-row";
            btnAsli.parentNode.insertBefore(baris, btnAsli);
            baris.appendChild(btnAsli);

            let btnTolak = document.createElement("button");
            btnTolak.className = "sponsor-offer-card__btn-reject";
            btnTolak.innerHTML = '<i class="fa-solid fa-xmark"></i>';
            btnTolak.onclick = function () { window.tolakSponsor(i); };
            baris.appendChild(btnTolak);

            // Expiry -- teks kecil di bawah, merah+bold kalau udah mepet (<=2 hari)
            let expiryEl = document.createElement("div");
            expiryEl.className = "sponsor-offer-card__expiry" + (sp.sisaHari <= 2 ? " sponsor-offer-card__expiry--urgent" : "");
            expiryEl.innerText = `Berakhir dalam ${sp.sisaHari} hari`;
            baris.parentNode.appendChild(expiryEl);
        });
    };
}

console.log("Sponsor Negotiation Patch: countdown 7 hari, tombol tolak, & refresh berkala aktif.");

})();
