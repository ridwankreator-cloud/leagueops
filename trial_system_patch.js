// ==========================================
// TRIAL_SYSTEM_PATCH.JS
// FASE 17 — SISTEM TRIAL PLAYER
// ==========================================
//
// Sesuai rancangan desain (rangkuman final v9, bagian 16):
// - Trial HANYA untuk pemain TANPA kontrak (Free Agent / Open Recruitment
//   / prospek Akademi)
// - Simulasi INSTANT: skip waktu -> langsung muncul hasil 2-4 scrim
// - Maksimal 5 pemain trial bersamaan
// - Lawan: tim AI RANDOM dari liga yang sama; power lawan jadi modifier
//   kesulitan (makin kuat lawan, makin sulit kandidat tampil bagus)
// - Slot kosong (role tanpa kandidat trial) diisi STARTER ASLI tim player
// - Role bentrok (>=2 kandidat role sama) -> trial BERGILIR round-robin,
//   laporan tetap terpisah per kandidat
// - 3 pilihan akhir: Kontrak Permanen / Perpanjang Trial / Lepas Pemain
// - Trade-off: kandidat bisa "diambil" tim AI lain kalau player kelamaan
//
// File ini dimuat SETELAH database.js, financial_ai_patch.js,
// acquisition_merger_patch.js, mdl_len_engine.js, roster_system_patch.js,
// dan SEBELUM script.js.
// ==========================================

const MAKS_SLOT_TRIAL = 5;
const JUMLAH_SCRIM_PER_TRIAL = 3; // 2-4 scrim, pakai 3 sbg default tengah

// ------------------------------------------------------------------
// [17.1] STATE TRIAL — disimpan di window.trialAktif (array kandidat
// yang sedang dalam masa trial). Persisten lewat save/load (Bagian 4).
// ------------------------------------------------------------------
function initTrialState() {
    if (!window.trialAktif) window.trialAktif = [];
}
initTrialState();

// ------------------------------------------------------------------
// [17.2] CEK APAKAH PEMAIN BOLEH DI-TRIAL
// Hanya pemain TANPA kontrak: ada di pemainTransfer (Free Agent/Open
// Recruitment) ATAU prospek di akademiKita.prospek.
// ------------------------------------------------------------------
function pemainBolehDiTrial(pemainNama, sumberOverride, namaTimLainOverride) {
    if (window.trialAktif.length >= MAKS_SLOT_TRIAL) {
        return { boleh: false, alasan: `Slot trial penuh (maksimal ${MAKS_SLOT_TRIAL} pemain bersamaan).` };
    }
    if (window.trialAktif.some(t => t.pemain.nama === pemainNama)) {
        return { boleh: false, alasan: "Pemain ini sudah dalam masa trial." };
    }

    // Cek sumber override langsung (dari tombol TRIAL di modal profil)
    if (sumberOverride === "TIMLAIN" && namaTimLainOverride) {
        let timLainObj = (typeof cariTimAsliDiDatabase === "function")
            ? cariTimAsliDiDatabase(namaTimLainOverride)
            : null;
        if (!timLainObj) {
            let semuaTim = [...daftarTim, ...(typeof daftarTimPH !== "undefined" ? daftarTimPH : []),
                ...(typeof daftarTimMY !== "undefined" ? daftarTimMY : []),
                ...(typeof daftarTimSG !== "undefined" ? daftarTimSG : [])];
            timLainObj = semuaTim.find(t => t.nama === namaTimLainOverride);
        }
        let pemainTimLain = timLainObj ? timLainObj.roster.find(p => p.nama === pemainNama) : null;
        if (!pemainTimLain) {
            return { boleh: false, alasan: "Pemain tidak ditemukan di tim tersebut." };
        }
        return { boleh: true, sumber: "TIMLAIN", pemain: pemainTimLain, namaTimAsal: namaTimLainOverride };
    }

    let dariFreeAgent = pemainTransfer.find(p => p.nama === pemainNama);
    let dariAkademi = (typeof akademiKita !== "undefined" && akademiKita.prospek)
        ? akademiKita.prospek.find(p => p.nama === pemainNama) : null;

    if (!dariFreeAgent && !dariAkademi) {
        return { boleh: false, alasan: "Pemain ini sudah punya kontrak / tidak ditemukan di pool yang bisa di-trial." };
    }

    return { boleh: true, sumber: dariFreeAgent ? "FREE_AGENT" : "AKADEMI", pemain: dariFreeAgent || dariAkademi };
}

// ------------------------------------------------------------------
// [17.3] MULAI TRIAL — tambahkan kandidat ke window.trialAktif.
// Pemain TIDAK dihapus dari pool asalnya sampai trial selesai (Kontrak/
// Lepas), supaya tetap konsisten kalau player batal di tengah jalan.
// ------------------------------------------------------------------
function mulaiTrial(pemainNama, sumberOverride, namaTimLainOverride) {
    let cek = pemainBolehDiTrial(pemainNama, sumberOverride, namaTimLainOverride);
    if (!cek.boleh) return { sukses: false, pesan: cek.alasan };

    // Reveal stats otomatis saat trial dimulai (menggantikan fungsi intai)
    let pemainRef = cek.pemain;
    if (pemainRef.mekanik === undefined || pemainRef.potensi === undefined) {
        let base = pemainRef.ovr || 65;
        pemainRef.mekanik = base + (Math.floor(Math.random() * 7) - 3);
        pemainRef.makro = base + (Math.floor(Math.random() * 7) - 3);
        pemainRef.mental = base + (Math.floor(Math.random() * 7) - 3);
        pemainRef.spesialis = base + (Math.floor(Math.random() * 7) - 3);
        pemainRef.potensi = base + (Math.floor(Math.random() * 10) + 3);
        if (pemainRef.mekanik > 99) pemainRef.mekanik = 99;
        if (pemainRef.makro > 99) pemainRef.makro = 99;
        if (pemainRef.mental > 99) pemainRef.mental = 99;
        if (pemainRef.spesialis > 99) pemainRef.spesialis = 99;
        if (pemainRef.potensi > 99) pemainRef.potensi = 99;
    }
    pemainRef.scouted = true; // otomatis terungkap saat trial

    window.trialAktif.push({
        pemain: cek.pemain,
        sumber: cek.sumber,
        namaTimAsal: cek.namaTimAsal || null,
        role: cek.pemain.role,
        hasilScrim: [],
        statusTrial: "BERJALAN",
        musimDimulai: typeof musimKe !== "undefined" ? musimKe : 1
    });

    if (typeof tambahBerita === "function") {
        let asalLabel = cek.sumber === "TIMLAIN" ? `(dari ${cek.namaTimAsal})` : `(${cek.sumber === "FREE_AGENT" ? "Free Agent" : "Akademi"})`;
        tambahBerita(`🔍 Trial Dimulai: <span>${cek.pemain.nama}</span> (${cek.pemain.role}) ${asalLabel} memulai masa trial bersama ${timPlayer}.`);
    }

    return { sukses: true };
}

// ------------------------------------------------------------------
// [17.4] PILIH LAWAN TRIAL — tim AI random dari liga yang sama
// (Opsi C dari diskusi: lawan punya nama jelas, lebih immersive)
// ------------------------------------------------------------------
function pilihLawanTrial() {
    let timLiga = (typeof ambilTimUntukLiga === "function") ? ambilTimUntukLiga(ligaPlayer) : [];
    let kandidatLawan = timLiga.filter(t => t.nama !== timPlayer);
    if (kandidatLawan.length === 0) return { nama: "Tim Internal GH", power: 60 }; // fallback aman
    return kandidatLawan[Math.floor(Math.random() * kandidatLawan.length)];
}

// ------------------------------------------------------------------
// [17.5] SUSUN LINE-UP SCRIM — kandidat trial isi slot role-nya sendiri,
// role kosong diisi STARTER ASLI tim player. Mendukung role bentrok
// (>=2 kandidat role sama) lewat parameter kandidatGiliranPerRole,
// yang ditentukan oleh penjadwal round-robin di [17.6].
// ------------------------------------------------------------------
function susunLineupTrial(kandidatGiliranPerRole) {
    const SEMUA_ROLE = ["Goldlaner", "Jungler", "Midlaner", "EXP Laner", "Roamer"];
    let lineup = {};

    SEMUA_ROLE.forEach(role => {
        let kandidat = kandidatGiliranPerRole[role];
        if (kandidat) {
            lineup[role] = { ...kandidat, sumber: "TRIAL" };
        } else {
            let starter = rosterKita.find(p => p.role === role && p.isStarter)
                || rosterKita.find(p => p.role === role)
                || null;
            lineup[role] = starter ? { ...starter, sumber: "STARTER_ASLI" } : null;
        }
    });

    return lineup;
}

// ------------------------------------------------------------------
// [17.6] JADWAL TRIAL BERGILIR UNTUK ROLE BENTROK
// Kelompokkan kandidat trial berdasarkan role, lalu buat jadwal scrim
// round-robin supaya kandidat dengan role sama bergantian mengisi slot,
// masing-masing tetap dapat jumlah scrim yang setara.
// ------------------------------------------------------------------
function susunJadwalTrialBergilir(daftarKandidatTrial, jumlahScrimPerKandidat = JUMLAH_SCRIM_PER_TRIAL) {
    let grupRole = {};
    daftarKandidatTrial.forEach(entry => {
        let role = entry.pemain.role;
        if (!grupRole[role]) grupRole[role] = [];
        grupRole[role].push(entry);
    });

    let totalScrimDiperlukan = 0;
    Object.values(grupRole).forEach(grup => {
        let scrimUntukGrup = grup.length * jumlahScrimPerKandidat;
        totalScrimDiperlukan = Math.max(totalScrimDiperlukan, scrimUntukGrup);
    });

    let jadwalScrim = [];
    for (let i = 0; i < totalScrimDiperlukan; i++) {
        let kandidatGiliranPerRole = {};
        Object.keys(grupRole).forEach(role => {
            let grup = grupRole[role];
            // Round-robin: kandidat ke-(i % grup.length) main di scrim ini.
            // Tapi supaya tiap kandidat dapat TEPAT jumlahScrimPerKandidat
            // (bukan main di SEMUA scrim kalau grupnya kecil), kita cek
            // index scrim spesifik milik kandidat itu.
            let kandidatGiliran = grup[i % grup.length];
            // Pastikan kandidat ini belum melebihi jatah scrimnya
            let scrimTerpakaiKandidat = jadwalScrim.filter(j => j.kandidatPerRole[role] === kandidatGiliran).length;
            if (scrimTerpakaiKandidat < jumlahScrimPerKandidat) {
                kandidatGiliranPerRole[role] = kandidatGiliran;
            }
        });
        if (Object.keys(kandidatGiliranPerRole).length > 0) {
            jadwalScrim.push({ kandidatPerRole: kandidatGiliranPerRole });
        }
    }

    return jadwalScrim;
}

// ==========================================
// BAGIAN 2 — SIMULASI PERFORMA SCRIM & ANALISIS TREND
// ==========================================

// ------------------------------------------------------------------
// [17.7] HITUNG PERFORMA SATU SCRIM
// Formula sesuai diskusi: performa = OVR kandidat + variance(-10~+10)
// - modifierKesulitan(selisih power lawan vs tim player * 0.3)
// ------------------------------------------------------------------
function hitungPerformaScrim(kandidat, lawan) {
    let selisihPower = (lawan.power || 60) - (typeof hitungPowerTim === "function" && cariTimAsliDiDatabase
        ? (cariTimAsliDiDatabase(timPlayer)?.power || 60)
        : 60);
    let modifierKesulitan = selisihPower * 0.3;
    let variance = (Math.random() * 20) - 10;
    let performa = (kandidat.ovr || 60) + variance - modifierKesulitan;
    return Math.max(0, Math.min(100, Math.round(performa)));
}

function catatanPerforma(performa, ovrKandidat) {
    if (performa >= ovrKandidat + 5) return "Tampil di atas ekspektasi!";
    if (performa <= ovrKandidat - 5) return "Kurang meyakinkan";
    return "Performa standar";
}

// ------------------------------------------------------------------
// [17.8] ANALISIS TREND — bukan cuma rata-rata, tapi arah pergerakan
// dari scrim pertama ke terakhir (sesuai diskusi desain)
// ------------------------------------------------------------------
function analisisTrendTrial(hasilScrim) {
    if (hasilScrim.length < 2) {
        return { trend: "STABIL", insight: "Belum cukup data untuk menilai tren." };
    }
    let awal = hasilScrim[0].performa;
    let akhir = hasilScrim[hasilScrim.length - 1].performa;
    let selisih = akhir - awal;

    if (selisih >= 8) return { trend: "MENINGKAT_PESAT", insight: "Adaptasi sangat cepat, potensi besar!" };
    if (selisih >= 3) return { trend: "MENINGKAT", insight: "Adaptasi baik." };
    if (selisih <= -8) return { trend: "MENURUN_PESAT", insight: "Tidak cocok dengan sistem tim, atau tekanan mental tinggi." };
    if (selisih <= -3) return { trend: "MENURUN", insight: "Kurang nyaman di lingkungan baru." };
    return { trend: "STABIL", insight: "Konsisten, sesuai ekspektasi." };
}

// ------------------------------------------------------------------
// [17.9] JALANKAN SEMUA SCRIM TRIAL YANG SEDANG AKTIF (instant result,
// dipanggil saat player skip waktu / klik "Jalankan Trial")
// Menangani role bentrok lewat jadwal bergilir [17.6].
// ------------------------------------------------------------------
function jalankanScrimTrial() {
    if (!window.trialAktif || window.trialAktif.length === 0) {
        return { sukses: false, pesan: "Tidak ada pemain yang sedang trial." };
    }

    let kandidatBerjalan = window.trialAktif.filter(t => t.statusTrial === "BERJALAN");
    if (kandidatBerjalan.length === 0) {
        return { sukses: false, pesan: "Tidak ada trial yang perlu dijalankan." };
    }

    let jadwalScrim = susunJadwalTrialBergilir(kandidatBerjalan, JUMLAH_SCRIM_PER_TRIAL);

    jadwalScrim.forEach(scrimEntry => {
        let lawan = pilihLawanTrial();
        let lineup = susunLineupTrial(scrimEntry.kandidatPerRole);

        // Catat hasil HANYA utk kandidat yang main di scrim ini
        Object.keys(scrimEntry.kandidatPerRole).forEach(role => {
            let kandidatEntry = scrimEntry.kandidatPerRole[role];
            let trialObj = window.trialAktif.find(t => t.pemain.nama === kandidatEntry.pemain.nama);
            if (!trialObj) return;

            let performa = hitungPerformaScrim(kandidatEntry.pemain, lawan);
            trialObj.hasilScrim.push({
                pertandingan: trialObj.hasilScrim.length + 1,
                lawan: lawan.nama,
                powerLawan: lawan.power,
                performa,
                catatan: catatanPerforma(performa, kandidatEntry.pemain.ovr || 60),
                lineupRekan: Object.entries(lineup)
                    .filter(([r]) => r !== role)
                    .map(([r, p]) => p ? `${r}: ${p.nama} (${p.sumber === "STARTER_ASLI" ? "Starter" : "Trial"})` : `${r}: kosong`)
            });
        });
    });

    // Tandai trial yang sudah cukup scrim sbg SELESAI (siap diputuskan)
    window.trialAktif.forEach(t => {
        if (t.statusTrial === "BERJALAN" && t.hasilScrim.length >= JUMLAH_SCRIM_PER_TRIAL) {
            t.statusTrial = "SELESAI";
        }
    });

    if (typeof tambahBerita === "function") {
        tambahBerita(`📋 Hasil trial untuk ${kandidatBerjalan.length} kandidat telah keluar. Cek laporan di menu Trial Player.`);
    }

    return { sukses: true, jumlahKandidat: kandidatBerjalan.length };
}

// ------------------------------------------------------------------
// [17.10] AMBIL RINGKASAN HASIL TRIAL (utk UI) -- termasuk rata-rata
// & trend per kandidat.
// ------------------------------------------------------------------
function ambilRingkasanTrial(pemainNama) {
    let trialObj = window.trialAktif.find(t => t.pemain.nama === pemainNama);
    if (!trialObj) return null;

    let rataRata = trialObj.hasilScrim.length > 0
        ? Math.round(trialObj.hasilScrim.reduce((s, h) => s + h.performa, 0) / trialObj.hasilScrim.length)
        : 0;
    let trendInfo = analisisTrendTrial(trialObj.hasilScrim);

    return {
        pemain: trialObj.pemain,
        sumber: trialObj.sumber,
        statusTrial: trialObj.statusTrial,
        hasilScrim: trialObj.hasilScrim,
        rataRata,
        trend: trendInfo.trend,
        insight: trendInfo.insight
    };
}

// ==========================================
// BAGIAN 3 — KEPUTUSAN AKHIR TRIAL & TRADE-OFF
// ==========================================

// ------------------------------------------------------------------
// [17.11] KONTRAK PERMANEN — kandidat resmi gabung roster, lepas dari
// pool asalnya, lalu lanjut ke negosiasi kontrak normal yang sudah ada
// (kalau tersedia) atau kontrak default sederhana.
// ------------------------------------------------------------------
function kontrakPermanenTrial(pemainNama, gajiDisepakati, durasiDisepakati) {
    let trialIdx = window.trialAktif.findIndex(t => t.pemain.nama === pemainNama);
    if (trialIdx === -1) return { sukses: false, pesan: "Pemain ini tidak sedang dalam trial." };

    let trialObj = window.trialAktif[trialIdx];
    let p = { ...trialObj.pemain };

    // Pemain TIMLAIN: tidak bisa langsung kontrak, harus buyout dulu
    if (trialObj.sumber === "TIMLAIN") {
        return {
            sukses: false,
            perluBuyout: true,
            pesan: `${p.nama} masih terikat kontrak dengan ${trialObj.namaTimAsal}. Lakukan Buyout terlebih dahulu untuk merekrut secara resmi.`,
            pemain: p,
            namaTimAsal: trialObj.namaTimAsal,
            hargaBuyout: p.harga || p.hargaPasar || p.value || 50000000
        };
    }

    // Cek kapasitas roster
    let kapasitas = (typeof databaseGH !== "undefined" && databaseGH[levelGH - 1])
        ? databaseGH[levelGH - 1].limitRoster : 8;
    if (rosterKita.length >= kapasitas) {
        return { sukses: false, pesan: `Roster sudah penuh (maksimal ${kapasitas} pemain). Lepas pemain dulu sebelum kontrak baru.` };
    }

    p.gaji = gajiDisepakati || p.gaji || 5000000;
    p.sisaKontrak = durasiDisepakati || 2;
    p.isStarter = false; // player atur sendiri starter-nya nanti
    p._dariTrial = true;
    p._riwayatTrial = { rataRata: ambilRingkasanTrial(pemainNama)?.rataRata, jumlahScrim: trialObj.hasilScrim.length };

    rosterKita.push(p);

    // Hapus dari pool asal
    if (trialObj.sumber === "FREE_AGENT") {
        let idx = pemainTransfer.findIndex(fp => fp.nama === pemainNama);
        if (idx !== -1) pemainTransfer.splice(idx, 1);
    } else if (trialObj.sumber === "AKADEMI" && typeof akademiKita !== "undefined") {
        let idx = akademiKita.prospek.findIndex(ap => ap.nama === pemainNama);
        if (idx !== -1) akademiKita.prospek.splice(idx, 1);
    }

    window.trialAktif.splice(trialIdx, 1);

    // Power dasar di-recalculate (transfer-triggered, konsisten Fase 15)
    let timPlayerObj = (typeof cariTimAsliDiDatabase === "function") ? cariTimAsliDiDatabase(timPlayer) : null;
    if (timPlayerObj && typeof hitungPowerTim === "function") {
        timPlayerObj.roster = rosterKita;
        timPlayerObj.power = hitungPowerTim(timPlayerObj);
    }

    return { sukses: true, pemain: p };
}

// ------------------------------------------------------------------
// [17.11b] EVALUASI NEGOSIASI KONTRAK TRIAL
// Dipanggil pas player ngajuin tawaran gaji/durasi lewat modal nego.
// Ekspektasi gaji kandidat dihitung dari gaji dasarnya (atau OVR kalau
// gaji dasarnya kekecilan), lalu di-adjust naik/turun berdasar TREND
// hasil trial (makin bagus tren makin pede minta mahal) dan SIFAT-nya
// (Ambisius lebih rewel, Pekerja Keras/Malas lebih gampang puas).
// Dibatasi maksimal 3 ronde biar gak muter-muter selamanya.
// ------------------------------------------------------------------
// ------------------------------------------------------------------
// [NEW] Hitung ekspektasi gaji kandidat berdasar performa trial +
// sifat -- diextract dari evaluasiNegoTrial() biar bisa dipake ulang
// juga sama alur Buyout-dari-Trial (script.js).
// ------------------------------------------------------------------
function hitungEkspektasiGajiTrial(pemainNama) {
    let trialObj = window.trialAktif.find(t => t.pemain.nama === pemainNama);
    if (!trialObj) return null;
    let kandidat = trialObj.pemain;
    let ringkasan = ambilRingkasanTrial(pemainNama) || { trend: "STABIL" };

    let baseGaji = Math.max(kandidat.gaji || 3000000, (kandidat.ovr || 60) * 150000);
    let trendMultiplier = {
        MENINGKAT_PESAT: 1.35, MENINGKAT: 1.15, STABIL: 1.0,
        MENURUN: 0.9, MENURUN_PESAT: 0.75
    }[ringkasan.trend] || 1.0;
    let sifatMultiplier = {
        "Ambisius": 1.20, "Pekerja Keras": 0.90, "Malas": 0.85, "Normal": 1.0
    }[kandidat.sifat] || 1.0;

    return Math.round(baseGaji * trendMultiplier * sifatMultiplier / 100000) * 100000;
}
window.hitungEkspektasiGajiTrial = hitungEkspektasiGajiTrial;

function evaluasiNegoTrial(pemainNama, tawaranGaji, tawaranDurasi) {
    let trialObj = window.trialAktif.find(t => t.pemain.nama === pemainNama);
    if (!trialObj) return { status: "ERROR", pesan: "Kandidat tidak ditemukan di trial aktif." };

    let kandidat = trialObj.pemain;

    trialObj.rondeNego = (trialObj.rondeNego || 0) + 1;
    let rondeKe   = trialObj.rondeNego;
    let maksRonde = 3;

    // [REFACTOR] Formula dasar ekspektasi gaji dipindah ke
    // hitungEkspektasiGajiTrial() biar bisa dipake ulang.
    let ekspektasiGaji = hitungEkspektasiGajiTrial(pemainNama);
    trialObj.ekspektasiGajiTerakhir = ekspektasiGaji;

    let rasioGaji   = tawaranGaji / ekspektasiGaji;
    let bonusDurasi = tawaranDurasi >= 3 ? 0.08 : (tawaranDurasi === 2 ? 0.03 : -0.05);
    let skorTotal   = rasioGaji + bonusDurasi;

    if (skorTotal >= 1.0) {
        return {
            status: "DEAL",
            pesan: `"${kandidat.nama}" setuju dengan tawaran ini, siap gabung!`,
            ekspektasiGaji
        };
    }

    // Ronde terakhir -- ultimatum, gak ada counter lagi
    if (rondeKe >= maksRonde) {
        if (skorTotal >= 0.85) {
            return {
                status: "DEAL",
                pesan: `"${kandidat.nama}" dengan berat hati menerima tawaran terakhir ini.`,
                ekspektasiGaji
            };
        }
        return {
            status: "TOLAK",
            pesan: `"${kandidat.nama}" merasa negosiasi tidak menemukan titik temu dan mundur.`,
            ekspektasiGaji
        };
    }

    if (skorTotal >= 0.70) {
        let counterGaji = Math.round(
            ekspektasiGaji * (kandidat.sifat === "Ambisius" ? 1.05 : 1.0) / 100000
        ) * 100000;
        let counterDurasi = Math.max(tawaranDurasi, 2);
        return {
            status: "COUNTER",
            pesan: `"${kandidat.nama}" merasa tawarannya kurang pas, ngajuin hitungan sendiri.`,
            ekspektasiGaji, counterGaji, counterDurasi, rondeKe, maksRonde
        };
    }

    return {
        status: "TOLAK",
        pesan: `"${kandidat.nama}" menganggap tawaran ini terlalu jauh dari yang diharapkan.`,
        ekspektasiGaji
    };
}
window.evaluasiNegoTrial = evaluasiNegoTrial;

// ------------------------------------------------------------------
// [17.12] PERPANJANG TRIAL — tambah 2-3 scrim lagi sebelum keputusan
// final. Reset status ke BERJALAN supaya jalankanScrimTrial() lanjut
// memproses kandidat ini di putaran berikutnya.
// ------------------------------------------------------------------
function perpanjangTrial(pemainNama) {
    let trialObj = window.trialAktif.find(t => t.pemain.nama === pemainNama);
    if (!trialObj) return { sukses: false, pesan: "Pemain ini tidak sedang dalam trial." };

    trialObj.statusTrial = "BERJALAN";
    // Catatan: hasilScrim TIDAK direset -- scrim baru ditambahkan ke
    // riwayat yang sama, supaya trend tetap bisa dianalisis dari awal.

    return { sukses: true };
}

// ------------------------------------------------------------------
// [17.13] LEPAS PEMAIN — batalkan trial, kandidat kembali ke pool asal
// tanpa perubahan (statusnya tetap free agent/prospek akademi).
// ------------------------------------------------------------------
function lepasTrial(pemainNama) {
    let trialIdx = window.trialAktif.findIndex(t => t.pemain.nama === pemainNama);
    if (trialIdx === -1) return { sukses: false, pesan: "Pemain ini tidak sedang dalam trial." };

    let trialObj = window.trialAktif[trialIdx];
    window.trialAktif.splice(trialIdx, 1);

    if (typeof tambahBerita === "function") {
        let pesanAkhir = trialObj.sumber === "OPEN_RECRUITMENT"
            ? `❌ Trial Berakhir: <span>${pemainNama}</span> tidak dilanjutkan ke kontrak dan meninggalkan tim (kandidat Open Recruitment, tidak masuk Bursa Transfer).`
            : `❌ Trial Berakhir: <span>${pemainNama}</span> tidak dilanjutkan ke kontrak dan kembali ke pasar.`;
        tambahBerita(pesanAkhir);
    }

    return { sukses: true, sumberKembali: trialObj.sumber };
}

// ------------------------------------------------------------------
// [17.14] TRADE-OFF — RISIKO KANDIDAT DIAMBIL TIM AI LAIN
// Dipanggil tiap akhir musim (offseason) untuk kandidat yang trial-nya
// kelamaan (>1 musim berjalan tanpa keputusan final). Probabilitas
// diambil AI naik seiring makin lama trial berlangsung.
// ------------------------------------------------------------------
function prosesRisikoTrialDiambilAI() {
    if (!window.trialAktif || window.trialAktif.length === 0) return [];

    let musimSekarang = typeof musimKe !== "undefined" ? musimKe : 1;
    let hilangList = [];

    window.trialAktif = window.trialAktif.filter(trialObj => {
        let musimBerjalan = musimSekarang - (trialObj.musimDimulai || musimSekarang);
        if (musimBerjalan < 1) return true; // belum cukup lama, aman

        // Probabilitas diambil AI naik tiap musim trial berjalan tanpa keputusan
        let probabilitasDiambil = Math.min(0.6, 0.2 * musimBerjalan);
        if (Math.random() < probabilitasDiambil) {
            hilangList.push(trialObj.pemain.nama);

            // Hapus juga dari pool asal (free agent/akademi) -- benar2 hilang
            if (trialObj.sumber === "FREE_AGENT") {
                let idx = pemainTransfer.findIndex(fp => fp.nama === trialObj.pemain.nama);
                if (idx !== -1) pemainTransfer.splice(idx, 1);
            } else if (trialObj.sumber === "AKADEMI" && typeof akademiKita !== "undefined") {
                let idx = akademiKita.prospek.findIndex(ap => ap.nama === trialObj.pemain.nama);
                if (idx !== -1) akademiKita.prospek.splice(idx, 1);
            }

            return false; // keluar dari trialAktif
        }
        return true;
    });

    return hilangList;
}

// ==========================================
// FASE 18 — OPEN RECRUITMENT
// ==========================================
//
// Sesuai rancangan desain (rangkuman final v9, bagian 16):
// - GRATIS (tanpa biaya), maksimal 2x per musim
// - Generate 3-5 kandidat AMATIR baru (bukan dari pool Free Agent biasa
//   yang sudah ada -- ini pemain yang belum pernah pro sama sekali)
// - OVR cenderung rendah-menengah, TAPI potensiTumbuh bisa random tinggi
//   (unsur kejutan/gacha -- kemungkinan nemu hidden gem)
// - Kandidat hasil Open Recruitment masuk ke pemainTransfer (Free Agent
//   pool) dengan penanda khusus, supaya otomatis bisa langsung di-trial
//   lewat sistem Fase 17 yang sudah ada (tidak perlu pipeline terpisah)
// ==========================================

// ------------------------------------------------------------------
// [18.1] STATE TRACKING — berapa kali Open Recruitment sudah dipakai
// musim ini. Reset tiap awal musim baru.
// ------------------------------------------------------------------
function initOpenRecruitmentState() {
    if (typeof window.openRecruitmentTerpakai !== "number") window.openRecruitmentTerpakai = 0;
    if (typeof window._musimOpenRecruitmentTerakhir !== "number") window._musimOpenRecruitmentTerakhir = 0;
}
initOpenRecruitmentState();

function resetOpenRecruitmentJikaMusimBaru() {
    let musimNow = typeof musimKe !== "undefined" ? musimKe : 1;
    if (window._musimOpenRecruitmentTerakhir !== musimNow) {
        window.openRecruitmentTerpakai = 0;
        window._musimOpenRecruitmentTerakhir = musimNow;
    }
}

const MAKS_OPEN_RECRUITMENT_PER_MUSIM = 2;

// ------------------------------------------------------------------
// [18.2] CEK APAKAH PLAYER MASIH BOLEH BUKA OPEN RECRUITMENT
// ------------------------------------------------------------------
function bolehBukaOpenRecruitment() {
    resetOpenRecruitmentJikaMusimBaru();
    if (window.openRecruitmentTerpakai >= MAKS_OPEN_RECRUITMENT_PER_MUSIM) {
        return { boleh: false, alasan: `Open Recruitment sudah dipakai ${MAKS_OPEN_RECRUITMENT_PER_MUSIM}x musim ini. Coba lagi musim depan.` };
    }
    return { boleh: true, sisaKesempatan: MAKS_OPEN_RECRUITMENT_PER_MUSIM - window.openRecruitmentTerpakai };
}

// ------------------------------------------------------------------
// [18.3] GENERATE SATU KANDIDAT AMATIR
// OVR rendah-menengah (45-65), potensi acak LEBIH LIAR dari prospek
// akademi biasa (bisa sampai 90+ -- itu unsur "gacha"-nya).
// ------------------------------------------------------------------
function generateKandidatAmatir(kriteria) {
    kriteria = kriteria || {};
    let role = kriteria.role || (typeof roleRandom === "function" ? roleRandom() : "Jungler");
    let ovrMin = kriteria.ovrMin || 45;
    let ovr = ovrMin + Math.floor(Math.random() * 20); // 45-65 default range

    // Potensi LEBIH LIAR dibanding prospek akademi biasa -- kemungkinan
    // hidden gem (potensi jauh di atas OVR awal) sengaja dibuka lebar.
    let potensi = Math.min(95, ovr + 15 + Math.floor(Math.random() * 35)); // bisa +15 s/d +49 dari OVR

    let umurMax = kriteria.umurMax || 24;
    let umur = 17 + Math.floor(Math.random() * (umurMax - 16));
    let gaji = 2000000 + Math.floor(Math.random() * 2000000);
    let sifat = (typeof pilihSifatProspek === "function") ? pilihSifatProspek() : "Normal";
    let musimNow = typeof musimKe !== "undefined" ? musimKe : 1;

    return {
        nama: (typeof generateNicknameEsports === "function")
                ? generateNicknameEsports()
                : (typeof namaProspekRandom === "function" ? namaProspekRandom() : "Pemain Amatir"),
        role,
        ovr,
        mekanik: ovr - 2 + Math.floor(Math.random() * 5),
        makro: ovr - 2 + Math.floor(Math.random() * 5),
        mental: ovr - 3 + Math.floor(Math.random() * 6),
        spesialis: ovr,
        potensi,
        sifat,
        umur,
        gaji,
        harga: Math.floor(ovr * 800000 + (potensi - ovr) * 300000), // murah, krn amatir blm terbukti
        sisaKontrak: 0, // belum kontrak -- status Free Agent murni
        negara: (typeof benderaAkademiUntukRegion === "function")
                    ? benderaAkademiUntukRegion(typeof regionPlayer !== "undefined" ? regionPlayer : "ID")
                    : "🇮🇩 Indonesia",
        mental_attr: 50 + Math.floor(Math.random() * 30),
        _dariOpenRecruitment: true,
        musimDirekrut: musimNow
    };
}

// ------------------------------------------------------------------
// [18.4] BUKA OPEN RECRUITMENT — generate 3-5 kandidat, LANGSUNG masuk
// window.trialAktif (BUKAN pemainTransfer/bursa). Kandidat Open
// Recruitment gak pernah nampang di Bursa Transfer biasa -- begitu
// diumumkan, mereka otomatis mulai masa trial. Kalau ujung-ujungnya
// gagal kontrak/dilepas, mereka hilang total (gak balik ke bursa).
// ------------------------------------------------------------------
function bukaOpenRecruitment(kriteria) {
    let cek = bolehBukaOpenRecruitment();
    if (!cek.boleh) return { sukses: false, pesan: cek.alasan };

    let slotTersisa = MAKS_SLOT_TRIAL - window.trialAktif.length;
    if (slotTersisa <= 0) {
        return {
            sukses: false,
            pesan: `Slot trial penuh (maksimal ${MAKS_SLOT_TRIAL} pemain bersamaan). Selesaikan atau lepas trial yang berjalan dulu sebelum buka Open Recruitment.`
        };
    }

    let jumlahKandidat = Math.min(slotTersisa, 3 + Math.floor(Math.random() * 3)); // 3-5, dibatasi slot kosong
    let kandidatBaru = [];
    let musimNow = typeof musimKe !== "undefined" ? musimKe : 1;

    for (let i = 0; i < jumlahKandidat; i++) {
        let k = generateKandidatAmatir(kriteria);
        k.scouted = true; // langsung revealed, gak ada fase intip lagi
        kandidatBaru.push(k);

        window.trialAktif.push({
            pemain: k,
            sumber: "OPEN_RECRUITMENT",
            namaTimAsal: null,
            role: k.role,
            hasilScrim: [],
            statusTrial: "BERJALAN",
            musimDimulai: musimNow
        });
    }

    window.openRecruitmentTerpakai += 1;

    return { sukses: true, kandidat: kandidatBaru, sisaKesempatan: MAKS_OPEN_RECRUITMENT_PER_MUSIM - window.openRecruitmentTerpakai };
}
