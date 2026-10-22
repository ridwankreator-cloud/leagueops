// ==========================================
// LOAN_BUYOPTION_PATCH.JS
// ==========================================
// Nambahin klausul "Opsi Beli" ke sistem pinjam pemain dari tim AI
// (PINJAM_LAIN), plus NGAKTIFIN fitur pinjamnya sendiri -- sebelum patch
// ini, prosesPinjamPemainLain() cuma definisi doang, gak ada tombol UI
// yang manggil dia sama sekali.
//
// Keputusan desain (hasil diskusi sama user):
// 1. Harga opsi beli dikunci di titik nego disepakati (110% harga pasar
//    saat itu), gak ikut naik/turun lagi walau harga pasar pemain
//    berubah selama masa pinjam.
// 2. Gaji pemain pinjaman 100% ditanggung tim peminjam -- gak dinego lagi.
// 3. Durasi loan ngikut musim tim peminjam (di game ini kalendernya
//    memang satu jam global yang dipakai bareng semua tier/region, jadi
//    ini otomatis konsisten tanpa perlu expiry-tracker terpisah per liga).
// 4. Scope tier: MPL cuma bisa pinjam-minjam sesama MPL (semua region
//    dunia, bukan cuma 4 SEA), MDL/MAL sesama MDL/MAL, LEN gak punya
//    sistem pinjam sama sekali.
// ==========================================

// ------------------------------------------------------------------
// [1] HELPER TIER -- nentuin "kelompok tier" sebuah tim buat keperluan
// kecocokan loan (MPL / MDL_MAL / LEN / null kalau gak ketemu)
// ------------------------------------------------------------------
function _loanKumpulkanPoolMPL() {
    let pool = [
        ...daftarTim,
        ...daftarTimPH,
        ...daftarTimMY,
        ...daftarTimSG
    ];
    if (typeof daftarTimKH !== "undefined") pool.push(...daftarTimKH);
    if (typeof daftarTimMM !== "undefined") pool.push(...daftarTimMM);
    if (typeof daftarTimMENA !== "undefined") pool.push(...daftarTimMENA);
    if (typeof daftarTimTR !== "undefined") pool.push(...daftarTimTR);
    if (typeof daftarTimEECA !== "undefined") pool.push(...daftarTimEECA);
    if (typeof daftarTimEA !== "undefined") pool.push(...daftarTimEA);
    if (typeof daftarTimAM !== "undefined") pool.push(...daftarTimAM);
    if (typeof daftarTimIN !== "undefined") pool.push(...daftarTimIN);
    if (typeof daftarTimWEU !== "undefined") pool.push(...daftarTimWEU);
    return pool;
}

function _loanKumpulkanPoolMDL_MAL() {
    let pool = [];
    if (typeof daftarTimMDL_ID !== "undefined") pool.push(...daftarTimMDL_ID);
    if (typeof daftarTimMDL_PH !== "undefined") pool.push(...daftarTimMDL_PH);
    if (typeof daftarTimMAL_Affiliated_MY !== "undefined") pool.push(...daftarTimMAL_Affiliated_MY);
    if (typeof daftarTimMAL_Challenger_MY !== "undefined") pool.push(...daftarTimMAL_Challenger_MY);
    return pool;
}

function _loanKumpulkanPoolLEN() {
    return (typeof daftarTimLEN !== "undefined") ? daftarTimLEN : [];
}

// Tier tim player sendiri, dipetakan dari ligaPlayer ("MPL"|"MDL"|"MAL"|"LEN")
function _loanTierPlayer() {
    if (typeof ligaPlayer === "undefined") return "MPL";
    if (ligaPlayer === "MDL" || ligaPlayer === "MAL") return "MDL_MAL";
    if (ligaPlayer === "LEN") return "LEN";
    return "MPL";
}

// Tier sebuah tim AI, dicari dari namanya
function _loanTierTim(namaTim) {
    if (_loanKumpulkanPoolMPL().some(t => t.nama === namaTim)) return "MPL";
    if (_loanKumpulkanPoolMDL_MAL().some(t => t.nama === namaTim)) return "MDL_MAL";
    if (_loanKumpulkanPoolLEN().some(t => t.nama === namaTim)) return "LEN";
    return null;
}

// Dipanggil dari ui.js buat nentuin tombol PINJAM di profil TIMLAIN muncul/gak
window.cekTierLoanCocok = function (namaTimLain) {
    let tierPlayer = _loanTierPlayer();
    if (tierPlayer === "LEN") return false; // LEN gak punya sistem pinjam sama sekali
    let tierLawan = _loanTierTim(namaTimLain);
    if (tierLawan === "LEN" || tierLawan === null) return false;
    return tierPlayer === tierLawan;
};

// Dipakai konsisten sama logika starter AI di tempat lain (match_engine.js,
// terapkanMoralPascaMatch) -- roster AI gak punya flag isStarter persisten,
// jadi "pemain inti" AI didefinisikan sebagai top-5 OVR roster mereka.
window.cekPemainIntiAI = function (timLain, namaPemain) {
    if (!timLain || !timLain.roster || timLain.roster.length === 0) return false;
    let top5 = [...timLain.roster]
        .sort((a, b) => (b.ovr || 0) - (a.ovr || 0))
        .slice(0, 5)
        .map(p => p.nama);
    return top5.includes(namaPemain);
};

// Cek apakah pemain ini satu-satunya di role-nya dalam roster timnya --
// dipakai buat nolak penjualan/pinjaman yang bakal bikin role bolong total.
window.cekPemainSatuSatunyaDiRole = function (tim, namaPemain) {
    if (!tim || !tim.roster) return false;
    let target = tim.roster.find(p => p.nama === namaPemain);
    if (!target) return false;
    let jumlahDiRole = tim.roster.filter(p => p.role === target.role).length;
    return jumlahDiRole <= 1;
};

// Milih pemain pengganti/pelapis terbaik dari bursa transfer buat role
// tertentu -- bukan asal ambil yang pertama ketemu. Pertimbangannya: OVR
// (kualitas), sisa kontrak (biar gak abis kontrak bentar lagi), dan umur
// (lebih muda = runway karier lebih panjang).
window.pilihPelapisTerbaik = function (role) {
    let kandidat = pemainTransfer
        .map((pt, idx) => ({ pt, idx }))
        .filter(x => x.pt.role === role);
    if (kandidat.length === 0) return null;

    kandidat.sort((a, b) => {
        let skorA = (a.pt.ovr || 0) + (a.pt.sisaKontrak || 0) * 3 - (a.pt.umur || 22) * 0.5;
        let skorB = (b.pt.ovr || 0) + (b.pt.sisaKontrak || 0) * 3 - (b.pt.umur || 22) * 0.5;
        return skorB - skorA;
    });
    return kandidat[0]; // { pt, idx }
};

// ------------------------------------------------------------------
// [2] OVERRIDE prosesPinjamPemainLain -- dipanggil dari tombol PINJAM
// di modal profil TIMLAIN (ui.js). Nyiapin nego kayak BELI_LAIN tapi
// buat pinjam, plus nyiapin field opsi beli.
// ------------------------------------------------------------------
window.prosesPinjamPemainLain = function (namaPemain, namaTim, hargaPemain) {
    if (!apakahTransferTerbuka()) {
        bukaModal("Bursa Transfer Tertutup", "Bursa transfer belum dibuka.", "#E5484D");
        return;
    }
    if (typeof timPlayerSedangRosterLock === "function") {
        let statusLock = timPlayerSedangRosterLock();
        if (statusLock.terkunci) {
            bukaModal("Roster Terkunci", pesanRosterLockAktif(statusLock), "#E5484D");
            return;
        }
    }
    if (!window.cekTierLoanCocok(namaTim)) {
        bukaModal(
            "Tidak Bisa Dipinjam",
            "Tim ini berada di tingkatan (tier) yang berbeda dengan tim Anda sehingga tidak dapat dipinjam.",
            "#E5484D"
        );
        return;
    }

    let timLain = (typeof cariTimAsliDiDatabase === "function")
        ? cariTimAsliDiDatabase(namaTim)
        : null;
    if (!timLain) {
        bukaModal("Tim Tidak Ditemukan", "Tim lawan tidak ditemukan di database.", "#E5484D");
        return;
    }
    let p = timLain.roster.find(x => x.nama === namaPemain);
    if (!p) {
        bukaModal("Pemain Tidak Ditemukan", "Pemain tidak ditemukan di roster tim tersebut.", "#E5484D");
        return;
    }
    if (window.cekPemainIntiAI(timLain, namaPemain)) {
        bukaModal(
            "Tidak Bisa Dipinjam",
            `${p.nama} adalah pemain inti (roster utama) ${namaTim}. Manajemen mereka menolak untuk meminjamkan pemain inti dengan alasan apapun.`,
            "#E5484D"
        );
        return;
    }
    if (window.cekPemainSatuSatunyaDiRole(timLain, namaPemain)) {
        bukaModal(
            "Tidak Bisa Dipinjam",
            `${p.nama} adalah satu-satunya pemain ${p.role} di roster ${namaTim}. Meminjamkannya akan membuat role tersebut kosong, jadi manajemen mereka menolak.`,
            "#E5484D"
        );
        return;
    }
    if (p.sudahTransfer) {
        bukaModal(
            "Tidak Bisa Dipinjam",
            `${p.nama} tidak dapat dipinjam karena baru saja melakukan transfer pada musim ini.`,
            "#E5484D"
        );
        return;
    }

    dataNego.tipe = "PINJAM_LAIN";
    dataNego.index = -1;
    dataNego.pemain = p;
    dataNego.namaTimLain = namaTim;

    dataNego.demandTransfer = Math.floor(hargaPemain * 0.15); // Loan Fee (15% harga) buat tim AI
    dataNego.demandGaji = p.gaji; // 100% ditanggung, gak dinego
    dataNego.demandDurasi = 1;
    dataNego.demandOpsiBeli = Math.floor(hargaPemain * 1.1); // 110% harga pasar saat ini

    let tampilOvr = p.scouted ? p.ovr : "?";
    getEl("negoPlayerInfo").innerHTML =
        `Peminjaman Pemain: ${p.nama} (${namaTim})<br><span style="font-size:11px; color:#C9971F;">OVR: ${tampilOvr} | Estimasi Harga: Rp ${(hargaPemain / 1000000).toFixed(1)} Jt</span>`;

    getEl("barisDemandTransfer").classList.remove("sembunyi");
    getEl("grupNegoTransfer").classList.remove("sembunyi");
    getEl("labelInputTransfer").innerText = "Biaya Pinjam / Loan Fee (Juta Rp):";
    getEl("negoDemandTransfer").innerText = `Rp ${(dataNego.demandTransfer / 1000000).toFixed(1)} Jt`;

    // Sembunyiin baris/nego gaji normal, tampilin info gaji 100% read-only
    getEl("barisDemandGajiNormal").classList.add("sembunyi");
    getEl("barisInfoGajiPinjam").classList.remove("sembunyi");
    getEl("negoInfoGajiPinjam").innerText = `Rp ${(p.gaji / 1000000).toFixed(1)} Jt`;
    getEl("grupNegoGaji").classList.add("sembunyi");

    getEl("negoDemandDurasi").innerText = "1";

    // Tampilin baris & input opsi beli, reset ke belum dicentang
    getEl("barisDemandOpsiBeli").classList.remove("sembunyi");
    getEl("negoDemandOpsiBeli").innerText = `Rp ${(dataNego.demandOpsiBeli / 1000000).toFixed(1)} Jt`;
    getEl("grupNegoOpsiBeli").classList.remove("sembunyi");
    getEl("cekNegoOpsiBeli").checked = false;
    getEl("inputNegoOpsiBeli").value = (dataNego.demandOpsiBeli / 1000000).toFixed(1);
    getEl("inputNegoOpsiBeli").disabled = true;

    getEl("inputNegoTransfer").value = "";
    getEl("inputNegoGaji").value = "";
    getEl("inputNegoDurasi").value = 1;
    getEl("inputNegoDurasi").disabled = true;
    getEl("modalNego").classList.remove("sembunyi");
};

// Reset elemen-elemen baru (info gaji pinjam, opsi beli) tiap kali modal
// nego ditutup -- baik lewat BATAL, submit sukses, atau apapun -- biar gak
// ada state nyangkut pas modal dibuka lagi buat tipe nego yang beda.
if (typeof window.tutupNego === "function") {
    let _tutupNegoAsli = window.tutupNego;
    window.tutupNego = function () {
        _tutupNegoAsli();
        getEl("barisDemandGajiNormal").classList.remove("sembunyi");
        getEl("barisInfoGajiPinjam").classList.add("sembunyi");
        getEl("grupNegoGaji").classList.remove("sembunyi");
        getEl("barisDemandOpsiBeli").classList.add("sembunyi");
        getEl("grupNegoOpsiBeli").classList.add("sembunyi");
        getEl("cekNegoOpsiBeli").checked = false;
        getEl("inputNegoOpsiBeli").disabled = true;
    };
}

// ------------------------------------------------------------------
// [3] TEBUS OPSI BELI -- dipanggil dari tombol di profil roster
// ------------------------------------------------------------------
window.tebusOpsiBeli = function (namaPemain) {
    if (!apakahTransferTerbuka()) {
        bukaModal(
            "Bursa Transfer Tertutup",
            "Bursa transfer belum dibuka. Opsi beli hanya dapat ditebus saat bursa transfer aktif.",
            "#E5484D"
        );
        return;
    }
    let p = rosterKita.find(x => x.nama === namaPemain);
    if (!p || !p.opsiBeliAktif) {
        bukaModal("Tidak Bisa Ditebus", "Pemain ini tidak memiliki opsi beli aktif.", "#E5484D");
        return;
    }
    let harga = p.opsiBeliHarga || 0;
    if (kasTim < harga) {
        bukaModal(
            "Kas Tidak Cukup",
            `Kas tidak mencukupi. Dibutuhkan Rp ${(harga / 1000000).toFixed(1)} Jt untuk menebus opsi beli ${p.nama}.`,
            "#E5484D"
        );
        return;
    }

    let namaTimAsli = p.timAsli;
    kasTim -= harga;
    catatKas("KELUAR", harga, `Tebus Opsi Beli: ${p.nama}`);

    let timAsalObj = (typeof cariTimAsliDiDatabase === "function")
        ? cariTimAsliDiDatabase(namaTimAsli)
        : null;
    if (timAsalObj) {
        timAsalObj.kas += harga;
    }
    // Kalau tim asal udah gak ada (kena merger dll), fee opsi beli tetap
    // keluar dari kas player tapi gak ada yang nerima -- dianggap hangus.

    delete p.isLoan;
    delete p.timAsli;
    delete p.durasiPinjam;
    delete p.opsiBeliAktif;
    delete p.opsiBeliHarga;
    p.sisaKontrak = 2; // Kontrak baru pas resmi jadi milik permanen

    catatTransferRealTime(p, timPlayer);

    bukaModal(
        "OPSI BELI DITEBUS",
        `<b>${p.nama}</b> resmi menjadi pemain permanen tim Anda dengan harga Rp ${(harga / 1000000).toFixed(1)} Jt.`,
        "#7C3AED"
    );
    tambahBerita(`Opsi Beli Ditebus: <span>${timPlayer}</span> resmi mempermanenkan <span>${p.nama}</span> dari <span>${namaTimAsli}</span>.`);
    updateDashboard();
};
