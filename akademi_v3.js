// ============================================================
// AKADEMI v3.0 — MLBB PRO CIRCUIT MANAGER
// Di-load SETELAH script.js
// Menggantikan: akademi_patch.js + akademi_realism_patch.js
//
// === RIWAYAT ===
// v1.0 — Sistem dasar: potensi, development, biaya, harga jual
// v2.0 — umur [A], pelatih [B], OVR resmi [C], reputasi [D],
//         scout aktif [E], fix musimMasuk [F], historyOvr [G]
// v2.1 — guard init [H], clamp usiaDiAkademi [I],
//         sisaKontrak [J], sub-stat cap [K],
//         scout cooldown [L], biaya AI [M]
// v3.0 — REALISM UPDATE (sejalan konsep esports ML):
//         [R1] Bootcamp Event (Lokal & Korea/China)
//         [R2] Loan Prospek ke Tim MDL
//         [R3] Jam Terbang di Roster Aktif (rookie bonus)
//         [R4] Fast Track — Promosi Darurat
//         [R5] UI terintegrasi, tombol Loan & Fast Track per kartu
// ============================================================


// ============================================================
// BAGIAN 1: KONSTANTA & HELPERS
// ============================================================

const SIFAT_PROSPEK = ["Pekerja Keras", "Ambisius", "Normal", "Malas"];
const SIFAT_WEIGHT  = [0.25, 0.40, 0.25, 0.10];
const BIAYA_AKADEMI      = { 1: 15000000, 2: 35000000 };
const BIAYA_SCOUT_AKTIF  = { 1: 50000000, 2: 80000000 };

// [R1] Konfigurasi Bootcamp
const BOOTCAMP_CONFIG = {
    basic: {
        biaya: 25000000,
        label: "Bootcamp Lokal",
        ovrMin: 1, ovrMax: 2,
        cooldownKey: "bootcampDilakukan",
        requireCoach: false,
        deskripsi: "Sesi latihan intensif lokal. Semua prospek naik 1–2 OVR."
    },
    elite: {
        biaya: 60000000,
        label: "Bootcamp Korea/China",
        ovrMin: 2, ovrMax: 4,
        cooldownKey: "bootcampEliteDilakukan",
        requireCoach: true,
        deskripsi: "Training camp luar negeri bersama coach top. Semua prospek naik 2–4 OVR + bonus mental."
    }
};

// [R2] Daftar tim tujuan loan
const TIM_LOAN = [
    { nama: "Genflix Aerowolf",          tier: "MDL",      logo: "🛩️" },
    { nama: "Rebellion Zion",            tier: "MDL",      logo: "⚔️" },
    { nama: "Bigetron Alpha",            tier: "MDL",      logo: "🤖" },
    { nama: "Alter Ego Celestials",      tier: "MDL",      logo: "✨" },
    { nama: "Rex Regum Qeon Academy",    tier: "Regional", logo: "👑" },
    { nama: "Burn X Flash",              tier: "Regional", logo: "🔥" },
];

function pilihSifatProspek() {
    let r = Math.random(), kum = 0;
    for (let i = 0; i < SIFAT_PROSPEK.length; i++) {
        kum += SIFAT_WEIGHT[i];
        if (r < kum) return SIFAT_PROSPEK[i];
    }
    return "Normal";
}

function hitungHargaProspek(p) {
    let basePotensi = (p.potensi || p.ovr || 60) * 500000;
    let bonusOvr    = (p.ovr || 60) * 200000;
    let kelipGaji   = (p.gaji || 3000000) * 2;
    return Math.max(5000000, Math.floor(basePotensi + bonusOvr + kelipGaji));
}
window.hitungHargaProspek = hitungHargaProspek;


// ============================================================
// BAGIAN 2: GENERATE & KEMBANGKAN PROSPEK
// ============================================================

// [D] Bonus OVR & potensi berdasarkan reputasi tim
// [FIX] Sebelumnya cuma baca reputasiTim (variabel global, punya tim
// player doang) -- sekarang bisa dikasih reputasi tim MANAPUN lewat
// parameter, biar bisa dipakai buat tim AI juga (lihat generateProspek).
function bonusReputasiAkademi(reputasiOverride) {
    let rep = (typeof reputasiOverride === "number")
        ? reputasiOverride
        : ((typeof reputasiTim !== "undefined") ? reputasiTim : 50);
    if (rep >= 90) return { ovrBonus: 6, potBonus: 5 };
    if (rep >= 70) return { ovrBonus: 4, potBonus: 2 };
    if (rep >= 50) return { ovrBonus: 2, potBonus: 0 };
    return { ovrBonus: 0, potBonus: 0 };
}

// Generate prospek baru
window.generateProspek = function(levelAkademi, isPlayerTeam, kodeRegion, reputasiTimIni) {
    let baseOvr  = levelAkademi >= 2 ? 58 : 50;
    let ovrRange = levelAkademi >= 2 ? 10 : 8;
    // [FIX] Dulu tim AI SELALU dapet ovrBonus/potBonus 0 apapun reputasi
    // mereka sendiri (cuma isPlayerTeam yang kebagian bonus) -- org AI
    // elite (reputasi tinggi) jadi gak ada bedanya sama org AI medioker
    // soal kualitas akademi. Sekarang tim player tetap pakai reputasiTim
    // (variabel global tim yang lagi dipegang), tim AI pakai reputasi
    // TIM MEREKA SENDIRI lewat parameter reputasiTimIni (dikirim caller,
    // biasanya tim.reputasi).
    let repBonus = bonusReputasiAkademi(isPlayerTeam
        ? ((typeof reputasiTim !== "undefined") ? reputasiTim : 50)
        : reputasiTimIni);
    baseOvr += repBonus.ovrBonus;

    let ovr     = baseOvr + Math.floor(Math.random() * ovrRange);
    let role    = (typeof roleRandom === "function") ? roleRandom() : "Jungler";
    let sifat   = pilihSifatProspek();
    let potBase = (levelAkademi >= 2 ? 10 : 5) + repBonus.potBonus;
    let potensi = Math.min(95, ovr + potBase + Math.floor(Math.random() * 16));
    let gaji    = 3000000 + Math.floor(Math.random() * 2000000);
    let musimNow = (typeof musimKe !== "undefined") ? musimKe : 1;

    // Region buat nentuin bendera: kalau ini prospek tim player, pakai
    // regionPlayer (region tim yang lagi dipegang player). Kalau AI,
    // wajib dikasih tim.region lewat parameter kodeRegion.
    let regionDipakai = kodeRegion
        || (isPlayerTeam && typeof regionPlayer !== "undefined" ? regionPlayer : null)
        || "ID";

    return {
        nama:           (typeof generateNicknameEsports === "function") ? generateNicknameEsports() : "Rafly",
        role,
        ovr,
        mekanik:        ovr - 2 + Math.floor(Math.random() * 5),
        makro:          ovr - 2 + Math.floor(Math.random() * 5),
        mental:         ovr - 3 + Math.floor(Math.random() * 6),
        spesialis:      ovr,
        potensi,
        sifat,
        umur:           17 + Math.floor(Math.random() * 2),
        gaji,
        harga:          hitungHargaProspek({ ovr, potensi, gaji }),
        sisaKontrak:    2,
        negara:         (typeof benderaAkademiUntukRegion === "function")
                            ? benderaAkademiUntukRegion(regionDipakai)
                            : "🇮🇩 Indonesia",
        dariAkademi:    true,
        musimMasuk:     musimNow,
        musimMasukReal: musimNow // [F]
    };
};

// [C] + [B] Kembangkan prospek dalam akademi (per offseason)
function kembangkanProspekAkademi(p) {
    if (!p.potensi) p.potensi = Math.min(95, p.ovr + 10);
    let gap = p.potensi - p.ovr;
    if (gap <= 0) return;

    // [B] Bonus buffPower pelatih
    let buffPelatih = 0;
    if (typeof staffKita !== "undefined" && staffKita && staffKita.pelatih) {
        buffPelatih = staffKita.pelatih.buffPower || 0;
    }
    let bonusBuff = Math.min(0.20, buffPelatih * 0.05);

    let peluang = (p.sifat === "Pekerja Keras" ? 0.80
                 : p.sifat === "Ambisius"       ? 0.65
                 : p.sifat === "Malas"          ? 0.20
                 : 0.50) + bonusBuff;

    if (Math.random() <= peluang) {
        let poin = gap >= 5 ? Math.floor(Math.random() * 3) + 1 : 1;
        let stats = ["mekanik", "makro", "mental", "spesialis"];
        for (let i = 0; i < poin; i++) {
            let s = stats[Math.floor(Math.random() * stats.length)];
            if (p[s] !== undefined) {
                p[s]++;
                p[s] = Math.min(p[s], p.potensi); // [K]
            }
        }
        if (typeof hitungOVRDatabase === "function") {
            p.ovr = hitungOVRDatabase(p);
        } else {
            p.ovr = Math.round((p.mekanik + p.makro + p.mental + p.spesialis) / 4);
        }
        p.ovr = Math.min(p.ovr, p.potensi);
        p.harga = hitungHargaProspek(p);
    }

    // 5% hidden gem reveal
    if (Math.random() < 0.05 && p.potensi < 92) {
        p.potensi += 1;
    }
}
window.kembangkanProspekAkademi = kembangkanProspekAkademi;

// Helper potong biaya operasional
function potongBiayaAkademi(levelAk) {
    let biaya = BIAYA_AKADEMI[levelAk] || 15000000;
    if (typeof kasTim !== "undefined") {
        kasTim -= biaya;
        if (typeof catatKas === "function") {
            catatKas("KELUAR", biaya, `Operasional Akademi Level ${levelAk >= 2 ? "Elite" : "Dasar"}`);
        }
    }
    return biaya;
}
window.potongBiayaAkademi = potongBiayaAkademi;


// ============================================================
// BAGIAN 3: PROSES OFFSEASON — PLAYER & AI
// ============================================================

window.prosesAkademiPlayer = function() {
    if (typeof levelGH === "undefined" || levelGH < 2) {
        if (typeof akademiKita !== "undefined") akademiKita.aktif = false;
        return;
    }

    // [H] Guard init
    if (typeof akademiKita === "undefined" || akademiKita === null) {
        window.akademiKita = { aktif: false, levelAkademi: 1, prospek: [], totalLulusan: 0, sudahScoutMusim: false };
    }
    if (!Array.isArray(akademiKita.prospek)) akademiKita.prospek = [];
    if (typeof akademiKita.totalLulusan !== "number") akademiKita.totalLulusan = 0;

    let ak = akademiKita;
    ak.aktif        = true;
    ak.levelAkademi = levelGH >= 3 ? 2 : 1;
    let musimNow    = typeof musimKe !== "undefined" ? musimKe : 1;

    // [L] Reset cooldown scout & bootcamp tiap offseason
    ak.sudahScoutMusim        = false;
    ak.bootcampDilakukan      = false;
    ak.bootcampEliteDilakukan = false;

    // [A] Umur bertambah tiap tahun (2 season = 1 tahun)
    let tahunBerganti = musimKe % 2 === 0;
    if (tahunBerganti) {
        ak.prospek.forEach(p => { if (typeof p.umur !== "undefined") p.umur += 1; });
    }

    // [J] Kurangi sisaKontrak
    ak.prospek.forEach(p => {
        if (typeof p.sisaKontrak === "number") {
            p.sisaKontrak = Math.max(0, p.sisaKontrak - 1);
        }
    });

    // [R2] Proses loan development dulu (1.5× lebih cepat)
    ak.prospek.forEach(p => {
        if (!p.statusLoan) return;
        let gap = (p.potensi || p.ovr) - p.ovr;
        if (gap <= 0) return;
        let peluang = p.sifat === "Pekerja Keras" ? 0.90
                    : p.sifat === "Malas"          ? 0.45
                    : 0.75;
        if (Math.random() <= peluang) {
            let poin = gap >= 5 ? Math.floor(Math.random() * 3) + 2 : 2;
            for (let i = 0; i < poin; i++) {
                let s = ["mekanik","makro","mental","spesialis"][Math.floor(Math.random() * 4)];
                if (p[s] !== undefined && p[s] < 95) p[s]++;
            }
            if (typeof hitungOVRDatabase === "function") {
                p.ovr = hitungOVRDatabase(p);
            } else {
                p.ovr = Math.round((p.mekanik + p.makro + p.mental + p.spesialis) / 4);
            }
            p.ovr = Math.min(p.ovr, p.potensi);
        }
        // Kembalikan setelah 1 musim
        if ((musimNow - p.statusLoan.musimMulai) >= 1) {
            delete p.statusLoan;
        }
    });

    // Kembangkan semua prospek (yang tidak sedang loan)
    ak.prospek.forEach(p => {
        if (!p.statusLoan) kembangkanProspekAkademi(p);
    });

    // Potong biaya operasional
    let biaya = potongBiayaAkademi(ak.levelAkademi);
    if (typeof tambahBerita === "function") {
        tambahBerita(
            `💸 Akademi: Biaya operasional musim ini — <b style="color:#E5484D;">-Rp ${(biaya/1000000).toFixed(0)} Jt</b> dipotong dari kas.`
        );
    }

    // Produksi 2 prospek/musim, maks 5
    for (let i = 0; i < 2; i++) {
        if (ak.prospek.length >= 5) break;
        let baru = window.generateProspek(ak.levelAkademi, true);
        ak.prospek.push(baru);
        if (typeof tambahEmail === "function") {
            tambahEmail(
                "Laporan Akademi",
                "Direktur Akademi",
                `Prospek baru dari akademi siap dievaluasi:<br>` +
                `<b>${baru.nama}</b> — ${baru.role}<br>` +
                `OVR: <b style="color:#5B3DF5;">${baru.ovr}</b> | Potensi: <b style="color:#00B37E;">${baru.potensi}</b><br>` +
                `Umur: ${baru.umur} thn | Sifat: <b>${baru.sifat}</b><br><br>` +
                `Buka menu <b>Fasilitas GH → Akademi</b> untuk mempromosikannya.`
            );
        }
    }

    // [F] Prospek terlantar >= 3 musim → bursa
    ak.prospek = ak.prospek.filter(p => {
        let masuk = (p.musimMasukReal !== undefined) ? p.musimMasukReal : (p.musimMasuk || musimNow);
        let usia  = musimNow - masuk;
        if (usia >= 3) {
            let hargaAdil = hitungHargaProspek(p);
            if (typeof pemainTransfer !== "undefined") {
                pemainTransfer.push({ ...p, dariAkademi: false, harga: hargaAdil });
            }
            return false;
        }
        return true;
    });
};

// AI akademi
window.prosesAkademiAI = function() {
    let semuaRegion = [
        ...(typeof daftarTim   !== "undefined" ? daftarTim   : []),
        ...(typeof daftarTimPH !== "undefined" ? daftarTimPH : []),
        ...(typeof daftarTimMY !== "undefined" ? daftarTimMY : []),
        ...(typeof daftarTimSG !== "undefined" ? daftarTimSG : [])
    ];
    let musimNow      = typeof musimKe !== "undefined" ? musimKe : 1;
    let tahunBerganti = musimNow % 2 === 0;
    const ROLE_LIST_LOC = ["Roamer","Jungler","Midlaner","Goldlaner","EXP Laner"];

    semuaRegion.forEach(tim => {
        if (tim.nama === (typeof timPlayer !== "undefined" ? timPlayer : "")) return;
        if ((tim.levelGH || 1) < 2) return;

        if (!tim.akademi) tim.akademi = { prospek: [] };

        // [A] Umur AI
        if (tahunBerganti) {
            tim.akademi.prospek.forEach(p => { if (typeof p.umur !== "undefined") p.umur += 1; });
        }

        // [J] sisaKontrak AI
        tim.akademi.prospek.forEach(p => {
            if (typeof p.sisaKontrak === "number") {
                p.sisaKontrak = Math.max(0, p.sisaKontrak - 1);
            }
        });

        // Kembangkan prospek AI
        tim.akademi.prospek.forEach(p => {
            if (!p.potensi) p.potensi = Math.min(95, p.ovr + 10);
            let gap = p.potensi - p.ovr;
            if (gap <= 0) return;
            if (Math.random() <= 0.55) {
                let poin = gap >= 5 ? Math.floor(Math.random() * 2) + 1 : 1;
                let stats = ["mekanik","makro","mental","spesialis"];
                for (let i = 0; i < poin; i++) {
                    let s = stats[Math.floor(Math.random() * stats.length)];
                    if (p[s] !== undefined) {
                        p[s]++;
                        p[s] = Math.min(p[s], p.potensi); // [K]
                    }
                }
                if (typeof hitungOVRDatabase === "function") {
                    p.ovr = hitungOVRDatabase(p);
                } else {
                    p.ovr = Math.round((p.mekanik + p.makro + p.mental + p.spesialis) / 4);
                }
                p.ovr = Math.min(p.ovr, p.potensi);
            }
        });

        // [M] Biaya operasional AI
        let lvlAkAI = (tim.levelGH || 1) >= 3 ? 2 : 1;
        let biayaAI = BIAYA_AKADEMI[lvlAkAI] || 15000000;
        if (typeof tim.kas === "number") {
            tim.kas = Math.max(0, tim.kas - biayaAI);
        }

        // Produksi 2 prospek/musim, maks 5
        for (let i = 0; i < 2; i++) {
            if (tim.akademi.prospek.length >= 5) break;
            tim.akademi.prospek.push(window.generateProspek(lvlAkAI, false, tim.region, tim.reputasi));
        }

        // Promosi ke roster jika ada role kosong
        let roleKosong = ROLE_LIST_LOC.filter(r => !tim.roster || !tim.roster.some(p => p.role === r));
        if (roleKosong.length > 0 && tim.akademi.prospek.length > 0) {
            let cocok = tim.akademi.prospek.findIndex(p => roleKosong.includes(p.role));
            let idx   = cocok !== -1 ? cocok : 0;
            let dp    = tim.akademi.prospek.splice(idx, 1)[0];
            if (!dp.historyOvr) dp.historyOvr = [dp.ovr];
            if (!tim.roster) tim.roster = [];
            tim.roster.push({ ...dp });
        }

        // [F] Terlantar >= 3 musim → bursa
        tim.akademi.prospek = tim.akademi.prospek.filter(p => {
            let masuk = (p.musimMasukReal !== undefined) ? p.musimMasukReal : (p.musimMasuk || musimNow);
            if ((musimNow - masuk) >= 3) {
                let hargaAdil = hitungHargaProspek(p);
                if (typeof pemainTransfer !== "undefined") {
                    pemainTransfer.push({ ...p, dariAkademi: false, harga: hargaAdil });
                }
                return false;
            }
            return true;
        });
    });
};


// ============================================================
// BAGIAN 4: AKSI PLAYER — PROMOSI, LEPAS, SCOUT
// ============================================================

// [G] Promosi prospek ke roster utama
window.promosiProspek = function(index) {
    let p = akademiKita.prospek[index];
    if (!p) return;

    // [R2] Cek jika sedang loan
    if (p.statusLoan) {
        bukaModal("SEDANG DIPINJAMKAN ⚠️",
            `<b>${p.nama}</b> tidak bisa dipromosikan karena sedang dipinjam ke <b>${p.statusLoan.tim}</b>.`, "#5B3DF5");
        return;
    }

    let gh = databaseGH[levelGH - 1];
    if (rosterKita.length >= gh.limitRoster) {
        bukaModal(
            "ROSTER PENUH! 🚫",
            `Kapasitas roster GH Level ${levelGH} sudah penuh (${gh.limitRoster} orang). ` +
            `Lepas pemain dulu atau upgrade GH.`,
            "#E5484D"
        );
        return;
    }

    // [G] Inject historyOvr
    if (!p.historyOvr || p.historyOvr.length === 0) {
        let musimNow = typeof musimKe !== "undefined" ? musimKe : 1;
        let masuk    = (p.musimMasukReal !== undefined) ? p.musimMasukReal : (p.musimMasuk || musimNow);
        let usia     = Math.max(1, musimNow - masuk);
        let ovrAwal  = Math.max(50, p.ovr - usia * 2);
        p.historyOvr = [];
        for (let s = 0; s <= usia; s++) {
            p.historyOvr.push(Math.min(p.ovr, Math.round(ovrAwal + (s / usia) * (p.ovr - ovrAwal))));
        }
    }
    p.trendText  = "📈 Naik (Lulusan Akademi)";
    p.trendColor = "#00B37E";

    if (typeof hitungHargaPasar === "function") {
        p.harga = hitungHargaPasar(p);
        p.gaji  = Math.floor(p.harga * 0.15);
    }

    // [R3] Tandai sebagai rookie ex-akademi untuk jam terbang bonus
    p._dariAkademi    = true;
    p._matchDiRoster  = 0;

    rosterKita.push({ ...p });
    akademiKita.prospek.splice(index, 1);
    akademiKita.totalLulusan++;

    if (typeof catatKas === "function") catatKas("MASUK", 0, `Promosi akademi: ${p.nama}`);
    if (typeof tambahBerita === "function") {
        tambahBerita(
            `⬆️ Promosi: <span>${p.nama}</span> (OVR ${p.ovr}, Potensi ${p.potensi || "?"}) ` +
 `resmi naik ke skuad utama <span>${timPlayer}</span>.`
        );
    }
    bukaModal(
        "PROMOSI BERHASIL! 🎉",
        `<b>${p.nama}</b> (${p.role}, OVR ${p.ovr}) kini jadi bagian dari tim utama!<br>` +
        `<span style="font-size:11px;color:#5C6472;">Potensi: ${p.potensi || "?"} | Sifat: ${p.sifat || "Normal"}</span><br>` +
        `<span style="font-size:11px;color:#00B37E;">📈 Dia akan terus berkembang lewat jam terbang di pertandingan resmi.</span>`,
        "#00B37E"
    );
    if (typeof renderFasilitas === "function") renderFasilitas();
};

// Lepas prospek ke bursa
window.lepasProspek = function(index) {
    let p = akademiKita.prospek[index];
    if (!p) return;
    let hargaAdil = hitungHargaProspek(p);
    akademiKita.prospek.splice(index, 1);
    if (typeof pemainTransfer !== "undefined") {
        pemainTransfer.push({ ...p, dariAkademi: false, harga: hargaAdil });
    }
    if (typeof renderFasilitas === "function") renderFasilitas();
};

// [E] Scout Berbakat — investasi aktif mid-musim
window.scoutProspekBerbakat = function() {
    if (typeof levelGH === "undefined" || levelGH < 2) {
        bukaModal("AKADEMI TERKUNCI 🔒", "Akademi butuh GH Level 2.", "#E5484D");
        return;
    }
    let ak = akademiKita;
    ak.levelAkademi = levelGH >= 3 ? 2 : 1;

    if (ak.sudahScoutMusim === true) {
        bukaModal("SCOUT SUDAH DIPAKAI ⏳", "Kamu sudah melakukan scouting berbakat musim ini. Tunggu offseason berikutnya.", "#5B3DF5");
        return;
    }
    if (ak.prospek.length >= 5) {
        bukaModal("SLOT PENUH 🚫", "Akademi sudah penuh (5 prospek). Promosikan atau lepas dulu.", "#E5484D");
        return;
    }
    let biaya = BIAYA_SCOUT_AKTIF[ak.levelAkademi] || 50000000;
    if (typeof kasTim !== "undefined" && kasTim < biaya) {
        bukaModal("KAS TIDAK CUKUP 💸", `Butuh Rp ${(biaya/1000000).toFixed(0)} Jt untuk scouting khusus.`, "#E5484D");
        return;
    }
    if (!confirm(`Keluarkan Rp ${(biaya/1000000).toFixed(0)} Jt untuk mendatangkan prospek berbakat?`)) return;

    kasTim -= biaya;
    if (typeof catatKas === "function") catatKas("KELUAR", biaya, "Scouting Prospek Berbakat");
    ak.sudahScoutMusim = true;

    let lvlBoost = Math.min(2, ak.levelAkademi + 1);
    let baru = window.generateProspek(lvlBoost, true);
    if (baru.potensi < 75) baru.potensi = 75 + Math.floor(Math.random() * 10);
    if (baru.sifat === "Malas") baru.sifat = "Normal";
    baru.harga = hitungHargaProspek(baru);

    ak.prospek.push(baru);
    if (typeof tambahBerita === "function") {
        tambahBerita(
            `🔭 Scout Berbakat: Ditemukan <b>${baru.nama}</b> ` +
 `(${baru.role}, OVR ${baru.ovr}, Potensi <b style="color:#00B37E;">${baru.potensi}</b>, Sifat: ${baru.sifat}).`
        );
    }
    if (typeof tambahEmail === "function") {
        tambahEmail(
            "Hasil Scouting Khusus",
            "Direktur Akademi",
            `Tim scout berhasil menemukan prospek istimewa:<br>` +
            `<b>${baru.nama}</b> — ${baru.role}<br>` +
            `OVR: <b style="color:#5B3DF5;">${baru.ovr}</b> | Potensi: <b style="color:#00B37E;">${baru.potensi}</b><br>` +
            `Umur: ${baru.umur} thn | Sifat: <b>${baru.sifat}</b>`
        );
    }
    bukaModal(
        "SCOUTING BERHASIL! 🔭",
        `Ditemukan: <b>${baru.nama}</b> (${baru.role})<br>` +
        `OVR ${baru.ovr} → Potensi <b style="color:#00B37E;">${baru.potensi}</b>`,
        "#00B37E"
    );
    if (typeof renderFasilitas === "function") renderFasilitas();
};


// ============================================================
// BAGIAN 5: [R1] BOOTCAMP EVENT
// ============================================================

window.adakanBootcamp = function(tipe) {
    let ak = (typeof akademiKita !== "undefined") ? akademiKita : null;

    // Fallback: cukup cek levelGH >= 2, tidak harus nunggu flag aktif dari offseason
    if (typeof levelGH === "undefined" || levelGH < 2) {
        bukaModal("AKADEMI BELUM TERSEDIA ❌", "Akademi butuh GH Level 2.", "#E5484D");
        return;
    }

    // Auto-init jika belum ada (save lama / belum offseason pertama)
    if (!ak) {
        window.akademiKita = { aktif: true, levelAkademi: levelGH >= 3 ? 2 : 1, prospek: [], totalLulusan: 0, sudahScoutMusim: false, bootcampDilakukan: false, bootcampEliteDilakukan: false };
        ak = window.akademiKita;
    }
    if (!ak.aktif) ak.aktif = true;
    if (!ak.levelAkademi) ak.levelAkademi = levelGH >= 3 ? 2 : 1;
    if (!Array.isArray(ak.prospek)) ak.prospek = [];
    if (ak.prospek.length === 0) {
        bukaModal("TIDAK ADA PROSPEK 🚫", "Tidak ada prospek yang bisa mengikuti bootcamp.", "#E5484D");
        return;
    }
    let cfg = BOOTCAMP_CONFIG[tipe];
    if (!cfg) return;

    if (ak[cfg.cooldownKey]) {
        bukaModal("BOOTCAMP SUDAH DILAKUKAN ⏳",
            `${cfg.label} sudah dilakukan musim ini. Tunggu offseason berikutnya.`, "#5B3DF5");
        return;
    }
    if (cfg.requireCoach) {
        let buffPelatih = 0;
        if (typeof staffKita !== "undefined" && staffKita && staffKita.pelatih) {
            buffPelatih = staffKita.pelatih.buffPower || 0;
        }
        if (buffPelatih < 2) {
            bukaModal("BUTUH COACH BERKUALITAS 🧑‍🏫",
                "Bootcamp elite butuh pelatih dengan buffPower minimal 2. Rekrut pelatih yang lebih baik dulu.", "#E5484D");
            return;
        }
    }
    if (typeof kas === "undefined" || kas < cfg.biaya) {
        bukaModal("KAS TIDAK CUKUP 💸",
            `Butuh <b>Rp ${(cfg.biaya/1000000).toFixed(0)} Jt</b> untuk ${cfg.label}.`, "#E5484D");
        return;
    }

    bukaModal(
        `🏋️ ${cfg.label.toUpperCase()}`,
        `${cfg.deskripsi}<br><br>` +
        `Biaya: <b style="color:#E5484D;">-Rp ${(cfg.biaya/1000000).toFixed(0)} Jt</b><br>` +
        `Peserta: <b>${ak.prospek.length} prospek</b><br><br>` +
        `<button onclick="window._konfirmasiBootcamp('${tipe}')" ` +
        `style="background:#00B37E;color:#fff;border:none;padding:10px 20px;border-radius:6px;` +
        `font-weight:bold;cursor:pointer;font-family:'Oswald',sans-serif;letter-spacing:1px;margin-right:8px;">` +
        `✅ LAKSANAKAN</button>` +
        `<button onclick="tutupModal()" ` +
        `style="background:#F1F3F8;color:#5C6472;border:1px solid #333;padding:10px 20px;border-radius:6px;` +
        `font-weight:bold;cursor:pointer;font-family:'Oswald',sans-serif;">` +
        `❌ BATAL</button>`,
        "#00B37E"
    );
};

window._konfirmasiBootcamp = function(tipe) {
    tutupModal();
    let ak  = akademiKita;
    let cfg = BOOTCAMP_CONFIG[tipe];

    if (typeof catatKas === "function") {
        catatKas("KELUAR", cfg.biaya, `Biaya ${cfg.label}`);
    } else {
        kas -= cfg.biaya;
    }

    let ringkasan = [];
    ak.prospek.forEach(p => {
        let ovrLama = p.ovr;
        let naik    = cfg.ovrMin + Math.floor(Math.random() * (cfg.ovrMax - cfg.ovrMin + 1));
        for (let i = 0; i < naik; i++) {
            let s = ["mekanik","makro","mental","spesialis"][Math.floor(Math.random() * 4)];
            if (p[s] !== undefined && p[s] < 95) p[s]++;
        }
        if (tipe === "elite" && p.mental < 95) p.mental = Math.min(95, p.mental + 1);

        if (typeof hitungOVRDatabase === "function") {
            p.ovr = hitungOVRDatabase(p);
        } else {
            p.ovr = Math.round((p.mekanik + p.makro + p.mental + p.spesialis) / 4);
        }
        p.ovr = Math.min(p.ovr, p.potensi);

        let selisih = p.ovr - ovrLama;
        if (selisih > 0) {
            ringkasan.push(`<b>${p.nama}</b> +${selisih} OVR (→ ${p.ovr})`);
            if (!p.historyOvr) p.historyOvr = [ovrLama];
            p.historyOvr.push(p.ovr);
            if (p.historyOvr.length > 15) p.historyOvr.shift();
        }
    });

    ak[cfg.cooldownKey] = true;

    bukaModal(
        `✅ ${cfg.label.toUpperCase()} SELESAI`,
        `Hasil perkembangan:<br><br>` +
        (ringkasan.length > 0
            ? ringkasan.map(r => `• ${r}`).join("<br>")
            : "Semua prospek sudah di puncak potensi saat ini."),
        "#00B37E"
    );
    if (typeof renderFasilitas === "function") renderFasilitas();
};


// ============================================================
// BAGIAN 6: [R2] LOAN PROSPEK KE TIM MDL
// ============================================================

window.pinjamkanProspek = function(index) {
    let ak = (typeof akademiKita !== "undefined") ? akademiKita : null;
    if (!ak || !ak.prospek[index]) return;

    let p = ak.prospek[index];
    if (p.statusLoan) {
        bukaModal("SEDANG DIPINJAMKAN ⚠️",
            `<b>${p.nama}</b> sudah dipinjamkan ke <b>${p.statusLoan.tim}</b> musim ini.`, "#5B3DF5");
        return;
    }

    let timLoan = TIM_LOAN[Math.floor(Math.random() * TIM_LOAN.length)];
    bukaModal(
        `📤 PINJAMKAN ${p.nama.toUpperCase()}`,
        `<b>${timLoan.logo} ${timLoan.nama}</b> (${timLoan.tier}) tertarik meminjam <b>${p.nama}</b> selama 1 musim.<br><br>` +
        `Keuntungan:<br>` +
        `• Laju perkembangan <b style="color:#00B37E;">1.5× lebih cepat</b><br>` +
        `• Dapat pengalaman kompetitif nyata<br>` +
        `• Kembali otomatis setelah 1 musim<br><br>` +
        `<b style="color:#5B3DF5;">⚠️ Tidak bisa dipromosikan selama masa pinjaman.</b><br><br>` +
        `<button onclick="window._konfirmasiLoan(${index},'${timLoan.nama}','${timLoan.tier}')" ` +
        `style="background:#00B37E;color:#fff;border:none;padding:10px 20px;border-radius:6px;` +
        `font-weight:bold;cursor:pointer;font-family:'Oswald',sans-serif;letter-spacing:1px;margin-right:8px;">` +
        `✅ PINJAMKAN</button>` +
        `<button onclick="tutupModal()" ` +
        `style="background:#F1F3F8;color:#5C6472;border:1px solid #333;padding:10px 20px;border-radius:6px;` +
        `font-weight:bold;cursor:pointer;font-family:'Oswald',sans-serif;">` +
        `❌ BATAL</button>`,
        "#00B37E"
    );
};

window._konfirmasiLoan = function(index, namaTim, tier) {
    tutupModal();
    let p        = akademiKita.prospek[index];
    if (!p) return;
    let musimNow = typeof musimKe !== "undefined" ? musimKe : 1;
    p.statusLoan = { tim: namaTim, tier, musimMulai: musimNow };
    bukaModal("PINJAMAN DISETUJUI ✅",
        `<b>${p.nama}</b> resmi bergabung dengan <b>${namaTim}</b> musim ini.<br>` +
        `Dia akan kembali di offseason berikutnya dengan pengalaman lebih matang.`,
        "#00B37E"
    );
    if (typeof renderFasilitas === "function") renderFasilitas();
};


// ============================================================
// BAGIAN 7: [R3] JAM TERBANG DI ROSTER AKTIF
// Hook ke prosesPerkembanganPemain di script.js
// ============================================================

const _origProsesPerkembanganPemain = window.prosesPerkembanganPemain;
window.prosesPerkembanganPemain = function() {
    if (typeof _origProsesPerkembanganPemain === "function") {
        _origProsesPerkembanganPemain();
    }
    if (typeof rosterKita === "undefined") return;

    rosterKita.forEach(p => {
        if (!p._dariAkademi) return;
        if (p.ovr >= 75) {
            // Sudah mapan, hapus flag
            delete p._dariAkademi;
            delete p._matchDiRoster;
            return;
        }
        p._matchDiRoster = (p._matchDiRoster || 0) + 1;

        // Setiap 4 match = 1 kesempatan naik
        if (p._matchDiRoster % 4 === 0) {
            let gap = (p.potensi || p.ovr) - p.ovr;
            if (gap > 0 && Math.random() < 0.65) {
                let s = ["mekanik","makro","mental","spesialis"][Math.floor(Math.random() * 4)];
                if (p[s] !== undefined && p[s] < 95) p[s]++;

                let ovrBaru = typeof hitungOVRDatabase === "function"
                    ? hitungOVRDatabase(p)
                    : Math.round((p.mekanik + p.makro + p.mental + p.spesialis) / 4);
                ovrBaru = Math.min(ovrBaru, p.potensi || 99);

                if (ovrBaru > p.ovr) {
                    p.ovr = ovrBaru;
                }
            }
        }
    });
};


// ============================================================
// BAGIAN 8: [R4] FAST TRACK — PROMOSI DARURAT
// ============================================================

window.fastTrackProspek = function(index) {
    let ak = (typeof akademiKita !== "undefined") ? akademiKita : null;
    if (!ak || !ak.prospek[index]) return;

    let gh         = databaseGH[levelGH - 1];
    let maxRoster  = gh ? gh.limitRoster : 5;
    let slotRoster = typeof rosterKita !== "undefined" ? rosterKita.length : maxRoster;

    if (slotRoster >= maxRoster) {
        bukaModal("ROSTER PENUH 🚫",
            `Roster sudah penuh (${slotRoster}/${maxRoster} pemain). Lepas pemain dulu.`, "#E5484D");
        return;
    }

    let p = ak.prospek[index];
    if (p.statusLoan) {
        bukaModal("SEDANG DIPINJAMKAN ⚠️",
            `<b>${p.nama}</b> tidak bisa di-fast track karena sedang dipinjam ke <b>${p.statusLoan.tim}</b>.`, "#C9971F");
        return;
    }

    const BIAYA_FASTTRACK = 10000000;
    if (typeof kas === "undefined" || kas < BIAYA_FASTTRACK) {
        bukaModal("KAS TIDAK CUKUP 💸",
            `Fast Track butuh biaya administrasi <b>Rp ${(BIAYA_FASTTRACK/1000000).toFixed(0)} Jt</b>.`, "#E5484D");
        return;
    }

    bukaModal(
        `⚡ FAST TRACK — ${p.nama.toUpperCase()}`,
        `Promosikan <b>${p.nama}</b> (OVR ${p.ovr}) ke roster utama sekarang juga!<br><br>` +
        `Biaya administrasi: <b style="color:#E5484D;">-Rp ${(BIAYA_FASTTRACK/1000000).toFixed(0)} Jt</b><br><br>` +
        `⚠️ Gunakan hanya saat roster butuh pengisian darurat.<br><br>` +
        `<button onclick="window._konfirmasiFastTrack(${index})" ` +
        `style="background:#5B3DF5;color:#fff;border:none;padding:10px 20px;border-radius:6px;` +
        `font-weight:bold;cursor:pointer;font-family:'Oswald',sans-serif;letter-spacing:1px;margin-right:8px;">` +
        `⚡ FAST TRACK SEKARANG</button>` +
        `<button onclick="tutupModal()" ` +
        `style="background:#F1F3F8;color:#5C6472;border:1px solid #333;padding:10px 20px;border-radius:6px;` +
        `font-weight:bold;cursor:pointer;font-family:'Oswald',sans-serif;">` +
        `❌ BATAL</button>`,
        "#5B3DF5"
    );
};

window._konfirmasiFastTrack = function(index) {
    tutupModal();
    const BIAYA_FASTTRACK = 10000000;
    if (typeof catatKas === "function") {
        catatKas("KELUAR", BIAYA_FASTTRACK, "Biaya Fast Track Promosi Akademi");
    } else {
        kas -= BIAYA_FASTTRACK;
    }

    let p        = akademiKita.prospek[index];
    let musimNow = typeof musimKe !== "undefined" ? musimKe : 1;
    let masuk    = p.musimMasukReal !== undefined ? p.musimMasukReal : (p.musimMasuk || musimNow);

    if (!p.historyOvr) p.historyOvr = [p.ovr];
    p.historyOvr.push(p.ovr);
    if (p.historyOvr.length > 15) p.historyOvr.shift();

    p.trendText   = "📈 Naik (Fast Track)";
    p.trendColor  = "#C9971F";
    p._dariAkademi   = true;
    p._matchDiRoster = 0;

    if (typeof hitungHargaPasar === "function") {
        p.harga = hitungHargaPasar(p);
        p.gaji  = Math.floor(p.harga * 0.15);
    }

    rosterKita.push({ ...p });
    akademiKita.prospek.splice(index, 1);
    akademiKita.totalLulusan++;

    if (typeof catatKas === "function") catatKas("MASUK", 0, `Fast Track akademi: ${p.nama}`);
    bukaModal("FAST TRACK BERHASIL ⚡",
        `<b>${p.nama}</b> (${p.role}, OVR ${p.ovr}) kini bagian dari roster utama!<br>` +
        `<span style="font-size:11px;color:#00B37E;">📈 Dia akan terus berkembang lewat jam terbang di pertandingan resmi.</span>`,
        "#5B3DF5"
    );

    if (typeof hitungPowerTim === "function") hitungPowerTim();
    if (typeof renderFasilitas === "function") renderFasilitas();
    if (typeof renderRoster === "function") renderRoster();
};


// ============================================================
// BAGIAN 9: UI — renderFasilitas lengkap v3.0
// ============================================================

const _origRenderFasilitas = window.renderFasilitas;
window.renderFasilitas = function() {
    if (typeof _origRenderFasilitas === "function") _origRenderFasilitas();
    if (typeof levelGH === "undefined" || levelGH < 2) return;

    let ak = (typeof akademiKita !== "undefined") ? akademiKita : null;
    if (!ak) return;

    let container = document.getElementById("kontenFasilitas");
    if (!container) return;

    let html       = container.innerHTML;
    let levelAk    = ak.levelAkademi;
    let musimNow   = typeof musimKe !== "undefined" ? musimKe : 1;
    let labelLevel = levelAk >= 2 ? "🌟 ELITE" : "⚡ DASAR";
    let ovrRange   = levelAk >= 2 ? "58–67" : "50–57";
    let potRange   = levelAk >= 2 ? "68–92" : "55–85";
    let biayaOps   = BIAYA_AKADEMI[levelAk] || 15000000;
    let biayaScout = BIAYA_SCOUT_AKTIF[levelAk] || 50000000;
    let slotRoster = typeof rosterKita !== "undefined" ? rosterKita.length : 5;
    let gh         = typeof databaseGH !== "undefined" ? databaseGH[levelGH - 1] : null;
    let maxRoster  = gh ? gh.limitRoster : 5;
    let adaSlot    = slotRoster < maxRoster;

    // Info reputasi
    let rep     = (typeof reputasiTim !== "undefined") ? reputasiTim : 50;
    let repInfo = rep >= 90 ? "🔥 +6 OVR, +5 Pot (Legendaris)"
                : rep >= 70 ? "⭐ +4 OVR, +2 Pot (Tinggi)"
                : rep >= 50 ? "✅ +2 OVR (Baik)"
                : "➖ Perlu ditingkatkan";

    // Info pelatih
    let buffPelatih = 0;
    if (typeof staffKita !== "undefined" && staffKita && staffKita.pelatih) {
        buffPelatih = staffKita.pelatih.buffPower || 0;
    }
    let pelatihInfo = buffPelatih > 0
        ? `+${Math.round(buffPelatih * 5)}% laju perkembangan`
        : "Tidak ada (0% bonus)";

    // Cooldown scout
    let sudahScout = ak.sudahScoutMusim === true;
    let labelScout = sudahScout
        ? `🔭 SCOUT BERBAKAT — Sudah digunakan musim ini`
        : `🔭 SCOUT BERBAKAT — Rp ${(biayaScout/1000000).toFixed(0)} Jt &nbsp;·&nbsp; Potensi Min. 75`;
    let styleScout = sudahScout
        ? `width:100%;background:#F1F3F8;color:#555;border:1px solid #333;padding:10px;border-radius:8px;font-size:12px;font-weight:bold;cursor:not-allowed;font-family:'Oswald',sans-serif;letter-spacing:1px;margin-bottom:8px;`
        : `width:100%;background:linear-gradient(90deg,rgba(0,179,126,0.14),rgba(0,179,126,0.10));color:#00B37E;border:1px solid rgba(0,179,126,0.30);padding:10px;border-radius:8px;font-size:12px;font-weight:bold;cursor:pointer;font-family:'Oswald',sans-serif;letter-spacing:1px;margin-bottom:8px;`;

    // Cooldown bootcamp
    let sudahBC      = ak.bootcampDilakukan === true;
    let sudahBCElite = ak.bootcampEliteDilakukan === true;

    let sectionBaru = `
    <h3 style="color:#5B3DF5;font-size:14px;margin-top:20px;border-bottom:1px dashed var(--border-md);padding-bottom:5px;">🎓 AKADEMI TIM</h3>

    <!-- Status header -->
    <div style="background:rgba(0,179,126,0.10);border:1px solid rgba(0,179,126,0.30);border-radius:8px;padding:14px;margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div>
                <div style="font-size:12px;color:#00B37E;font-weight:bold;letter-spacing:1px;">STATUS: ${labelLevel}</div>
                <div style="font-size:11px;color:#555;margin-top:2px;">OVR: ${ovrRange} | Potensi: ${potRange} | Lulusan: ${ak.totalLulusan}</div>
            </div>
            <div style="font-size:11px;color:#5C6472;text-align:right;">
                Slot: <b style="color:#12151C;">${ak.prospek.length}/5</b><br>
                <span style="color:#E5484D;font-size:10px;">-Rp ${(biayaOps/1000000).toFixed(0)} Jt/musim</span>
            </div>
        </div>
        <div style="font-size:10px;color:#444;border-top:1px dashed rgba(0,179,126,0.30);padding-top:8px;display:flex;flex-direction:column;gap:3px;">
            <span>🏆 Reputasi: <span style="color:#5C6472;">${repInfo}</span></span>
            <span>🧑‍🏫 Pelatih: <span style="color:#5C6472;">${pelatihInfo}</span></span>
            <span style="color:#555;margin-top:2px;">Akademi hasilkan 2 prospek/musim. Prospek bertambah umur & berkembang setiap musim.</span>
        </div>
    </div>

    <!-- Scout Berbakat -->
    <button onclick="window.scoutProspekBerbakat()" ${sudahScout ? "disabled" : ""}
        style="${styleScout}">
        ${labelScout}
    </button>

    <!-- Bootcamp buttons -->
    <div style="display:flex;gap:8px;margin-bottom:10px;">
        <button onclick="window.adakanBootcamp('basic')" ${sudahBC ? "disabled" : ""}
            style="flex:1;background:${sudahBC ? "#F1F3F8" : "linear-gradient(90deg,rgba(0,179,126,0.14),rgba(0,179,126,0.10))"};
            color:${sudahBC ? "#444" : "#00B37E"};
            border:1px solid ${sudahBC ? "#222" : "rgba(0,179,126,0.30)"};
            padding:9px 6px;border-radius:6px;font-size:11px;font-weight:bold;
            cursor:${sudahBC ? "not-allowed" : "pointer"};
            font-family:'Oswald',sans-serif;letter-spacing:1px;">
            🏋️ BOOTCAMP LOKAL<br>
            <span style="font-size:9px;font-weight:normal;color:${sudahBC ? "#333" : "#555"};">
                ${sudahBC ? "Sudah dipakai" : "+1–2 OVR · Rp 25Jt"}
            </span>
        </button>
        <button onclick="window.adakanBootcamp('elite')" ${sudahBCElite ? "disabled" : ""}
            style="flex:1;background:${sudahBCElite ? "#F1F3F8" : "linear-gradient(90deg,rgba(0,179,126,0.10),rgba(201,151,31,0.08))"};
            color:${sudahBCElite ? "#444" : "#5B3DF5"};
            border:1px solid ${sudahBCElite ? "#222" : "rgba(201,151,31,0.30)"};
            padding:9px 6px;border-radius:6px;font-size:11px;font-weight:bold;
            cursor:${sudahBCElite ? "not-allowed" : "pointer"};
            font-family:'Oswald',sans-serif;letter-spacing:1px;">
            ✈️ BOOTCAMP KOREA<br>
            <span style="font-size:9px;font-weight:normal;color:${sudahBCElite ? "#333" : "#555"};">
                ${sudahBCElite ? "Sudah dipakai" : "+2–4 OVR · Rp 60Jt · Coach 2+"}
            </span>
        </button>
    </div>`;

    // Kartu prospek
    if (ak.prospek.length === 0) {
        sectionBaru += `<div style="text-align:center;color:#444;padding:20px;font-size:12px;">Belum ada prospek — selesaikan musim reguler atau gunakan Scout Berbakat.</div>`;
    } else {
        ak.prospek.forEach((p, i) => {
            let masuk         = (p.musimMasukReal !== undefined) ? p.musimMasukReal : (p.musimMasuk || musimNow);
            let usiaDiAkademi = Math.max(1, musimNow - masuk); // [I]
            let warnaUsia     = usiaDiAkademi >= 2 ? "#E5484D" : "#5C6472";
            let potensi       = p.potensi || p.ovr;
            let hargaJual     = hitungHargaProspek(p);
            let sifatWarna    = p.sifat === "Pekerja Keras" ? "#00B37E"
                              : p.sifat === "Ambisius"       ? "#5B3DF5"
                              : p.sifat === "Malas"          ? "#E5484D"
                              : "#5C6472";
            let progPersen    = Math.min(100, Math.round((p.ovr / potensi) * 100));
            let loanBadge     = p.statusLoan
                ? `<span style="background:rgba(37,99,235,0.10);color:#2563EB;border:1px solid rgba(37,99,235,0.12);border-radius:4px;padding:2px 6px;font-size:9px;font-weight:bold;">🌏 LOAN: ${p.statusLoan.tim.split(" ")[0]}</span>`
                : "";

            sectionBaru += `
            <div style="background:#F7F9FC;border:1px solid var(--border);border-radius:8px;padding:12px;margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <div>
                        <div style="font-size:13px;color:#12151C;font-weight:bold;">${p.nama} ${loanBadge}</div>
                        <div style="font-size:11px;color:#5C6472;">${p.role} · Umur ${p.umur} · ${p.negara || "🇮🇩 Indonesia"}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:18px;color:#5B3DF5;font-weight:bold;font-family:'Oswald',sans-serif;">${p.ovr}</div>
                        <div style="font-size:10px;color:#555;">OVR</div>
                    </div>
                </div>
                <div style="display:flex;gap:6px;margin-bottom:6px;font-size:10px;color:#666;">
                    <span>MEK ${p.mekanik}</span><span>·</span>
                    <span>MAK ${p.makro}</span><span>·</span>
                    <span>MNT ${p.mental}</span>
                </div>
                <div style="margin-bottom:6px;">
                    <div style="display:flex;justify-content:space-between;font-size:10px;color:#555;margin-bottom:3px;">
                        <span>Potensi</span>
                        <span style="color:#00B37E;font-weight:bold;">${potensi}</span>
                    </div>
                    <div style="background:#F1F3F8;border-radius:4px;height:5px;">
                        <div style="background:linear-gradient(90deg,#00B37E,#5B3DF5);border-radius:4px;height:5px;width:${progPersen}%;"></div>
                    </div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:8px;">
                    <span style="color:${sifatWarna};">⚡ ${p.sifat || "Normal"}</span>
                    <span style="color:${warnaUsia};">Musim ke-${usiaDiAkademi}${usiaDiAkademi >= 2 ? " ⚠️" : ""}</span>
                </div>
                <div style="font-size:10px;color:#555;margin-bottom:10px;">
                    Nilai pasar: <span style="color:#C9971F;">Rp ${(hargaJual/1000000).toFixed(1)} Jt</span>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;">
                    <button onclick="window.promosiProspek(${i})"
                        ${p.statusLoan ? "disabled" : ""}
                        style="flex:1;min-width:80px;background:${p.statusLoan ? "#F1F3F8" : "#00B37E"};
                        color:${p.statusLoan ? "#5C6472" : "#fff"};border:none;padding:8px;border-radius:6px;
                        font-size:10px;font-weight:bold;cursor:${p.statusLoan ? "not-allowed" : "pointer"};
                        font-family:'Oswald',sans-serif;letter-spacing:1px;">
                        ⬆️ PROMOSIKAN
                    </button>
                    <button onclick="window.pinjamkanProspek(${i})"
                        ${p.statusLoan ? "disabled" : ""}
                        style="flex:1;min-width:80px;background:${p.statusLoan ? "#F1F3F8" : "linear-gradient(90deg,rgba(37,99,235,0.10),rgba(37,99,235,0.08))"};
                        color:${p.statusLoan ? "#333" : "#2563EB"};
                        border:1px solid ${p.statusLoan ? "#F1F3F8" : "rgba(37,99,235,0.12)"};
                        padding:8px;border-radius:6px;font-size:10px;font-weight:bold;
                        cursor:${p.statusLoan ? "not-allowed" : "pointer"};
                        font-family:'Oswald',sans-serif;letter-spacing:1px;">
                        🌏 ${p.statusLoan ? "SEDANG LOAN" : "LOAN"}
                    </button>
                    ${adaSlot && !p.statusLoan ? `
                    <button onclick="window.fastTrackProspek(${i})"
                        style="flex:1;min-width:80px;background:linear-gradient(90deg,rgba(201,151,31,0.16),rgba(201,151,31,0.10));
                        color:#5B3DF5;border:1px solid rgba(201,151,31,0.30);padding:8px;border-radius:6px;
                        font-size:10px;font-weight:bold;cursor:pointer;
                        font-family:'Oswald',sans-serif;letter-spacing:1px;">
                        ⚡ FAST TRACK
                    </button>` : ""}
                    <button onclick="window.lepasProspek(${i})"
                        style="flex:1;min-width:80px;background:#F1F3F8;color:#E5484D;border:1px solid #333;
                        padding:8px;border-radius:6px;font-size:10px;font-weight:bold;cursor:pointer;
                        font-family:'Oswald',sans-serif;letter-spacing:1px;">
                        📤 LEPAS
                    </button>
                </div>
            </div>`;
        });
    }

    // Replace section akademi di DOM
    let markerStart = html.indexOf("🎓 AKADEMI TIM");
    if (markerStart !== -1) {
        let h3Start = html.lastIndexOf("<h3", markerStart);
        if (h3Start !== -1) {
            container.innerHTML = html.substring(0, h3Start) + sectionBaru;
            return;
        }
    }
    container.innerHTML += sectionBaru;
};


// ============================================================
// BAGIAN 10: PATCH loadGame — safety net & migrate save lama
// ============================================================

const _origLoadGame = window.loadGame;
if (typeof _origLoadGame === "function") {
    window.loadGame = function() {
        _origLoadGame();
        setTimeout(() => {
            if (typeof akademiKita === "undefined" || !akademiKita) return;
            // Init field baru jika save lama
            if (akademiKita.bootcampDilakukan === undefined)      akademiKita.bootcampDilakukan = false;
            if (akademiKita.bootcampEliteDilakukan === undefined) akademiKita.bootcampEliteDilakukan = false;

            if (!Array.isArray(akademiKita.prospek)) return;
            let musimNow = typeof musimKe !== "undefined" ? musimKe : 1;
            akademiKita.prospek.forEach(p => {
                if (!p.potensi)    p.potensi    = Math.min(95, p.ovr + 10);
                if (!p.sifat)      p.sifat       = "Normal";
                if (!p.historyOvr) p.historyOvr  = [p.ovr];
                // [F] Set musimMasukReal jika belum ada (save lama)
                if (p.musimMasukReal === undefined) {
                    p.musimMasukReal = p.musimMasuk || musimNow;
                }
                p.harga = hitungHargaProspek(p);
            });
        }, 300);
    };
}


console.log("Akademi v3.0 loaded — Core ✓ | Realism: [R1] Bootcamp ✓ [R2] Loan ✓ [R3] Jam Terbang ✓ [R4] Fast Track ✓ [R5] UI v3 ✓");
