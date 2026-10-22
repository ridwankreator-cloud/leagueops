// ==========================================
// ROSTER_SYSTEM_PATCH.JS
// FASE 16 — FREE AGENT POOL & INTEGRASI AKADEMI KE MDL/MAL AFILIASI
// ==========================================
//
// Latar belakang (gap yang ditemukan saat audit):
// 1. Sistem Akademi yang sudah ada (akademi_v3.js) ditulis SEBELUM
//    struktur liga tier-2 (MDL/MAL) dibangun. Lulusan akademi (baik
//    player maupun AI) langsung masuk ROSTER UTAMA MPL, padahal sesuai
//    rangkuman desain seharusnya lewat MDL/MAL Afiliasi dulu (uji coba
//    di kompetisi nyata sebelum naik ke roster utama).
// 2. Free Agent pool (pemainTransfer di transfer.js) sudah punya
//    pembersihan umur (bersihkanBursaTransfer), TAPI belum ada:
//    - Depresiasi harga & gaji -20%/musim nganggur
//    - Penurunan mental -5/musim nganggur
//    - Pensiun paksa setelah 2 musim nganggur (bukan cuma umur>34)
//    - Auto-masuk Akademi untuk Free Agent umur <22 yang nganggur
//
// File ini dimuat SETELAH akademi_v3.js & transfer.js, SEBELUM script.js.
// ==========================================

// ------------------------------------------------------------------
// [16.1] REDIRECT PROMOSI AKADEMI PLAYER KE MDL/MAL AFILIASI
// Override promosiProspek() yang sudah ada (akademi_v3.js) supaya
// cek dulu apakah tim player punya afiliasi tier-2 sebelum langsung
// push ke rosterKita. Kalau punya afiliasi -> masuk ke roster afiliasi.
// Kalau tidak -> fallback ke roster utama (behavior asli/lama).
// ------------------------------------------------------------------
function cariAfiliasiMilikTim(namaTimMPL) {
    let kandidatDb = [
        typeof daftarTimMDL_Afiliasi_ID !== "undefined" ? daftarTimMDL_Afiliasi_ID : [],
        typeof daftarTimMDL_Afiliasi_PH !== "undefined" ? daftarTimMDL_Afiliasi_PH : [],
        typeof daftarTimMAL_Affiliated_MY !== "undefined" ? daftarTimMAL_Affiliated_MY : []
    ];
    for (let db of kandidatDb) {
        let found = db.find(t => t.indukMPL === namaTimMPL);
        if (found) return found;
    }
    return null;
}

// Simpan referensi fungsi promosiProspek ASLI (dari akademi_v3.js) supaya
// bisa dipakai sbg fallback kalau tim tidak punya afiliasi.
window._promosiProspekAsli = window.promosiProspek;

window.promosiProspek = function (index) {
    let p = akademiKita.prospek[index];
    if (!p) return;

    if (p.statusLoan) {
        // Biarkan validasi loan ditangani oleh logika asli
        return window._promosiProspekAsli(index);
    }

    // FASE 16: cek apakah tim player (kalau di MPL) punya afiliasi
    let timPlayerObj = (typeof cariTimAsliDiDatabase === "function") ? cariTimAsliDiDatabase(timPlayer) : null;
    let afiliasiMilikKita = (timPlayerObj && timPlayerObj.liga === "MPL")
        ? cariAfiliasiMilikTim(timPlayer)
        : null;

    if (!afiliasiMilikKita) {
        // Tidak punya afiliasi (atau player tidak di MPL sama sekali) ->
        // fallback ke perilaku asli (langsung masuk roster utama)
        return window._promosiProspekAsli(index);
    }

    // Punya afiliasi -> kirim ke roster afiliasi, BUKAN roster utama
    if (!afiliasiMilikKita.roster) afiliasiMilikKita.roster = [];

    let kapasitasAfiliasi = 8; // kapasitas wajar roster tier-2
    if (afiliasiMilikKita.roster.length >= kapasitasAfiliasi) {
        bukaModal(
            "ROSTER AFILIASI PENUH 🚫",
            `Roster afiliasi <b>${afiliasiMilikKita.nama}</b> sudah penuh (${kapasitasAfiliasi} pemain). Lepas pemain dari sana dulu, atau promosikan salah satu pemain afiliasi ke roster utama untuk membuat slot.`,
            "#E5484D"
        );
        return;
    }

    if (!p.historyOvr || p.historyOvr.length === 0) {
        let musimNow = typeof musimKe !== "undefined" ? musimKe : 1;
        let masuk = (p.musimMasukReal !== undefined) ? p.musimMasukReal : (p.musimMasuk || musimNow);
        let usia = Math.max(1, musimNow - masuk);
        let ovrAwal = Math.max(50, p.ovr - usia * 2);
        p.historyOvr = [];
        for (let s = 0; s <= usia; s++) {
            p.historyOvr.push(Math.min(p.ovr, Math.round(ovrAwal + (s / usia) * (p.ovr - ovrAwal))));
        }
    }
    p.trendText = "📈 Naik (Lulusan Akademi)";
    p.trendColor = "#00B37E";

    if (typeof hitungHargaPasar === "function") {
        p.harga = hitungHargaPasar(p);
        p.gaji = Math.floor(p.harga * 0.15);
    }

    p._dariAkademi = true;
    p._matchDiRoster = 0;
    p._statusTier2 = "MENUNGGU_UJI_COBA"; // penanda: baru masuk afiliasi, belum tampil

    afiliasiMilikKita.roster.push({ ...p });
    akademiKita.prospek.splice(index, 1);
    akademiKita.totalLulusan++;

    // Sinkronkan power afiliasi (transfer-only trigger, konsisten Fase 15)
    if (typeof hitungPowerTim === "function") {
        afiliasiMilikKita.power = hitungPowerTim(afiliasiMilikKita);
    }

    if (typeof catatKas === "function") catatKas("MASUK", 0, `Promosi akademi ke afiliasi: ${p.nama}`);
    if (typeof tambahBerita === "function") {
        tambahBerita(
            `⬆️ Promosi Ke Afiliasi: <span>${p.nama}</span> (OVR ${p.ovr}, Potensi ${p.potensi || "?"}) ` +
 `naik ke <span>${afiliasiMilikKita.nama}</span> untuk uji coba di kompetisi tier-2 sebelum siap ke skuad utama.`
        );
    }
    bukaModal(
        "PROMOSI KE AFILIASI! 🎉",
        `<b>${p.nama}</b> (${p.role}, OVR ${p.ovr}) kini bermain untuk <b>${afiliasiMilikKita.nama}</b>!<br>` +
        `<span style="font-size:11px;color:#5C6472;">Tampil bagus di kompetisi tier-2 akan membuka jalan naik ke skuad utama ${timPlayer}.</span>`,
        "#00B37E"
    );
    if (typeof renderFasilitas === "function") renderFasilitas();
};

// ------------------------------------------------------------------
// [16.2] REDIRECT PROMOSI AKADEMI AI KE MDL/MAL AFILIASI
// Override prosesAkademiAI() supaya tim AI yang punya afiliasi
// mengirim lulusan ke roster afiliasi, bukan langsung roster utama.
// ------------------------------------------------------------------
window._prosesAkademiAIAsli = window.prosesAkademiAI;

window.prosesAkademiAI = function () {
    // [FIX] Sebelumnya cuma 4 region lama (ID/PH/MY/SG) yang diproses di
    // sini -- 9 region baru (KH/MM/MENA/TR/EECA/EA/AM/IN/WEU, ~72 tim) sama
    // sekali gak punya produksi akademi sendiri, jadi gantung 100% ke pool
    // bursa transfer global. Sekarang semua 13 region diproses sama rata.
    let semuaRegion = [
        ...(typeof daftarTim !== "undefined" ? daftarTim : []),
        ...(typeof daftarTimPH !== "undefined" ? daftarTimPH : []),
        ...(typeof daftarTimMY !== "undefined" ? daftarTimMY : []),
        ...(typeof daftarTimSG !== "undefined" ? daftarTimSG : []),
        ...(typeof daftarTimKH !== "undefined" ? daftarTimKH : []),
        ...(typeof daftarTimMM !== "undefined" ? daftarTimMM : []),
        ...(typeof daftarTimMENA !== "undefined" ? daftarTimMENA : []),
        ...(typeof daftarTimTR !== "undefined" ? daftarTimTR : []),
        ...(typeof daftarTimEECA !== "undefined" ? daftarTimEECA : []),
        ...(typeof daftarTimEA !== "undefined" ? daftarTimEA : []),
        ...(typeof daftarTimAM !== "undefined" ? daftarTimAM : []),
        ...(typeof daftarTimIN !== "undefined" ? daftarTimIN : []),
        ...(typeof daftarTimWEU !== "undefined" ? daftarTimWEU : [])
    ];
    let musimNow = typeof musimKe !== "undefined" ? musimKe : 1;
    let tahunBerganti = musimNow % 2 === 0;
    const ROLE_LIST_LOC = ["Roamer", "Jungler", "Midlaner", "Goldlaner", "EXP Laner"];

    semuaRegion.forEach(tim => {
        if (tim.nama === (typeof timPlayer !== "undefined" ? timPlayer : "")) return;
        if ((tim.levelGH || 1) < 2) return;

        if (!tim.akademi) tim.akademi = { prospek: [] };

        if (tahunBerganti) {
            tim.akademi.prospek.forEach(p => { if (typeof p.umur !== "undefined") p.umur += 1; });
        }
        tim.akademi.prospek.forEach(p => {
            if (typeof p.sisaKontrak === "number") p.sisaKontrak = Math.max(0, p.sisaKontrak - 1);
        });

        tim.akademi.prospek.forEach(p => {
            if (!p.potensi) p.potensi = Math.min(95, p.ovr + 10);
            let gap = p.potensi - p.ovr;
            if (gap <= 0) return;
            if (Math.random() <= 0.55) {
                let poin = gap >= 5 ? Math.floor(Math.random() * 2) + 1 : 1;
                let stats = ["mekanik", "makro", "mental", "spesialis"];
                for (let i = 0; i < poin; i++) {
                    let s = stats[Math.floor(Math.random() * stats.length)];
                    if (p[s] !== undefined) { p[s]++; p[s] = Math.min(p[s], p.potensi); }
                }
                p.ovr = (typeof hitungOVRDatabase === "function")
                    ? hitungOVRDatabase(p)
                    : Math.round((p.mekanik + p.makro + p.mental + p.spesialis) / 4);
                p.ovr = Math.min(p.ovr, p.potensi);
            }
        });

        let lvlAkAI = (tim.levelGH || 1) >= 3 ? 2 : 1;
        let biayaAI = (typeof BIAYA_AKADEMI !== "undefined" ? BIAYA_AKADEMI[lvlAkAI] : null) || 15000000;
        if (typeof tim.kas === "number") tim.kas = Math.max(0, tim.kas - biayaAI);

        for (let i = 0; i < 2; i++) {
            if (tim.akademi.prospek.length >= 5) break;
            tim.akademi.prospek.push(window.generateProspek(lvlAkAI, false, tim.region, tim.reputasi));
        }

        // === FASE 16: redirect promosi ke afiliasi kalau ada ===
        let afiliasiTim = cariAfiliasiMilikTim(tim.nama);
        let targetRosterObj = afiliasiTim || tim; // fallback ke roster utama kalau tidak ada afiliasi
        if (!targetRosterObj.roster) targetRosterObj.roster = [];

        let kapasitasTarget = afiliasiTim ? 8 : 5; // afiliasi lebih longgar (tier-2), MPL utama tetap 5 starter inti
        let roleKosong = ROLE_LIST_LOC.filter(r => !targetRosterObj.roster.some(p => p.role === r));

        if (roleKosong.length > 0 && tim.akademi.prospek.length > 0 && targetRosterObj.roster.length < kapasitasTarget) {
            let cocok = tim.akademi.prospek.findIndex(p => roleKosong.includes(p.role));
            let idx = cocok !== -1 ? cocok : 0;
            let dp = tim.akademi.prospek.splice(idx, 1)[0];
            if (!dp.historyOvr) dp.historyOvr = [dp.ovr];
            targetRosterObj.roster.push({ ...dp });

            if (afiliasiTim && typeof hitungPowerTim === "function") {
                afiliasiTim.power = hitungPowerTim(afiliasiTim);
            }
        }

        // Terlantar >= 3 musim -> bursa (logika asli dipertahankan)
        tim.akademi.prospek = tim.akademi.prospek.filter(p => {
            let masuk = (p.musimMasukReal !== undefined) ? p.musimMasukReal : (p.musimMasuk || musimNow);
            if ((musimNow - masuk) >= 3) {
                let hargaAdil = (typeof hitungHargaProspek === "function") ? hitungHargaProspek(p) : (p.harga || 10000000);
                if (typeof pemainTransfer !== "undefined") {
                    pemainTransfer.push({ ...p, dariAkademi: false, harga: hargaAdil });
                }
                return false;
            }
            return true;
        });
    });
};

// ==========================================
// [16.3] DEPRESIASI & SIKLUS FREE AGENT
// Sesuai rangkuman desain bagian 12 (SISTEM FREE AGENT):
//   - Harga & gaji turun -20% per musim nganggur
//   - Mental turun -5 per musim nganggur
//   - Nganggur 2 musim -> Pensiun paksa
//   - Umur <22 + nganggur -> masuk Akademi MPL (kalau ada akademi yg muat)
// ==========================================

function prosesDepresiasiFreeAgent() {
    if (typeof pemainTransfer === "undefined") return [];

    let pensiunList = [];
    let masukAkademiList = [];
    let pemainBertahan = [];

    pemainTransfer.forEach(p => {
        // Tracking musim nganggur (field baru, default 0 kalau baru masuk pool)
        p._musimNganggur = (p._musimNganggur || 0) + 1;

        // Depresiasi harga & gaji -20%
        p.harga = Math.max(1000000, Math.floor((p.harga || 10000000) * 0.8));
        p.gaji = Math.max(1000000, Math.floor((p.gaji || 5000000) * 0.8));

        // Mental turun -5 (floor di 0)
        if (typeof p.mental === "number") {
            p.mental = Math.max(0, p.mental - 5);
        }

        // Pensiun paksa setelah 2 musim nganggur
        if (p._musimNganggur >= 2) {
            pensiunList.push(p);
            return; // tidak masuk pemainBertahan
        }

        // Umur <22 + nganggur -> kandidat masuk akademi (cuma masuk daftar,
        // eksekusi sebenarnya butuh slot akademi tersedia, ditangani terpisah)
        if ((p.umur || 99) < 22) {
            masukAkademiList.push(p);
            return; // tidak masuk pemainBertahan (sudah "diserap" akademi)
        }

        pemainBertahan.push(p);
    });

    pemainTransfer = pemainBertahan;

    // Proses pensiun
    pensiunList.forEach(p => {
        if (typeof tambahBerita === "function") {
            tambahBerita(`👋 Pensiun: <span>${p.nama}</span> resmi pensiun setelah 2 musim tanpa klub.`);
        }
    });

    // Proses masuk akademi (cuma berlaku utk akademi PLAYER -- akademi AI
    // sudah generate prospek sendiri lewat generateProspek, tidak perlu
    // "menyerap" dari free agent pool)
    masukAkademiList.forEach(p => {
        if (typeof akademiKita !== "undefined" && akademiKita.prospek && akademiKita.prospek.length < 5) {
            let prospekBaru = {
                ...p,
                potensi: p.potensi || Math.min(95, (p.ovr || 50) + 10),
                musimMasuk: typeof musimKe !== "undefined" ? musimKe : 1,
                musimMasukReal: typeof musimKe !== "undefined" ? musimKe : 1,
                dariAkademi: true,
                _eksFreeAgent: true
            };
            akademiKita.prospek.push(prospekBaru);
        }
        // Kalau akademi penuh/tidak ada, pemain ini cukup hilang dari pool
        // (representasi: pensiun dini krn tidak ada yg mau ambil risiko)
    });

    return { pensiun: pensiunList.length, masukAkademi: masukAkademiList.length, bertahan: pemainBertahan.length };
}

// ==========================================
// CATATAN INTEGRASI FASE 16:
// - prosesDepresiasiFreeAgent() dipanggil di script.js tiap akhir musim,
//   SEBELUM atau SESUDAH bersihkanBursaTransfer() (saling melengkapi:
//   bersihkanBursaTransfer menangani umur >34, prosesDepresiasiFreeAgent
//   menangani depresiasi nilai & pensiun krn nganggur 2 musim).
// - promosiProspek() & prosesAkademiAI() sudah di-override di atas,
//   TIDAK PERLU patch tambahan di script.js untuk bagian ini (override
//   terjadi otomatis selama file ini dimuat SETELAH akademi_v3.js).
// ==========================================


// ============================================================
// ROSTER AI PATCH v1.0 — MLBB PRO CIRCUIT MANAGER
// Di-load PALING TERAKHIR, setelah semua script lain.
//
// MASALAH YANG DIPERBAIKI:
//   Roster tim AI tidak bergerak organik antar musim karena
//   prosesTransferAI() (sistem cerdas di script.js:741) dipanggil
//   SEBELUM pemain kontrak habis dilepas ke bursa — sehingga
//   bursa kosong saat sistem cerdas mau rekrut.
//
// SOLUSI:
//   [1] SUBSTAT PATCH — Pemain AI tanpa mekanik/makro/mental/
//       spesialis/potensi diberi nilai otomatis dari OVR-nya.
//
//   [2] FASE RILIS TERPISAH — rilisKontrakHabisAI() melepas
//       pemain kontrak habis ke bursa SEBELUM prosesTransferAI()
//       jalan, dengan cara patch prosesEkosistemAI().
//
//   [4] SAFETY AKADEMI — Role yang masih kosong setelah semua
//       proses selesai diisi pemain akademi fallback.
//
// PENTING — Tidak ada double-decrement/double-gaji:
//   rilisKontrakHabisAI() hanya MEMBACA sisaKontrak/umur untuk
//   mendeteksi siapa yang harus dilepas, lalu memindahkan mereka
//   keluar dari tim.roster SEBELUM blok lama iterasi.
//   Blok lama hanya melihat pemain yang masih bertahan — mereka
//   dibayar gajinya dan dikurangi kontraknya sekali saja.
// ============================================================

console.log("Roster AI Patch v1.0 — loading...");

// ============================================================
// [1] HELPER: Tambal sub-stat pemain AI yang kosong
// ============================================================
function tambalSubStatAI(p, kodeRegion) {
    var baseOvr = p.ovr || 60;
    function rand() { return baseOvr + Math.floor(Math.random() * 10) - 5; }

    if (!p.mekanik)    p.mekanik    = Math.max(30, Math.min(99, rand()));
    if (!p.makro)      p.makro      = Math.max(30, Math.min(99, rand()));
    if (!p.mental)     p.mental     = Math.max(30, Math.min(99, rand()));
    if (!p.spesialis)  p.spesialis  = Math.max(30, Math.min(99, rand()));
    if (!p.potensi)    p.potensi    = Math.min(99, baseOvr + Math.floor(Math.random() * 8));
    if (!p.historyOvr) p.historyOvr = [baseOvr];
    if (!p.sifat)      p.sifat      = "Normal";
    if (!p.negara || p.negara === "Global" || p.negara.indexOf("Global") !== -1) {
        p.negara = (typeof benderaAkademiUntukRegion === "function")
            ? benderaAkademiUntukRegion(kodeRegion)
            : "Global";
    }

    if (typeof hitungOVRDatabase === "function") {
        p.ovr = hitungOVRDatabase(p);
    }
    return p;
}
window.tambalSubStatAI = tambalSubStatAI;

// ============================================================
// [2] FASE RILIS — Deteksi dan lepaskan pemain kontrak habis
// ke bursa SEBELUM prosesTransferAI() dieksekusi.
//
// Fungsi ini hanya MEMBACA p.sisaKontrak dan p.umur (tidak
// mengubahnya) untuk menentukan siapa yang harus dilepas.
// Pemain yang dilepas dikeluarkan dari tim.roster sebelum
// blok lama di script.js iterasi — sehingga blok lama tidak
// memproses mereka sama sekali (tidak ada double-decrement
// maupun double-bayar gaji).
// ============================================================
function rilisKontrakHabisAI(tahunBerganti) {
    var semuaRegion = [];
    if (typeof daftarTim   !== "undefined") semuaRegion.push(daftarTim);
    if (typeof daftarTimPH !== "undefined") semuaRegion.push(daftarTimPH);
    if (typeof daftarTimMY !== "undefined") semuaRegion.push(daftarTimMY);
    if (typeof daftarTimSG !== "undefined") semuaRegion.push(daftarTimSG);

    var namaPlayer = (typeof timPlayer !== "undefined") ? timPlayer : "";

    semuaRegion.forEach(function(region) {
        region.forEach(function(tim) {
            if (tim.nama === namaPlayer) return;
            if (!tim.roster) return;

            var rosterBertahan = [];

            tim.roster.forEach(function(p) {
                // Pemain pinjaman dari tim player — biarkan blok lama yang urus
                if (p.isLoan && p.timAsli === namaPlayer) {
                    rosterBertahan.push(p);
                    return;
                }

                // Simulasi nilai setelah offseason untuk deteksi rilis
                // (tidak mengubah nilai asli — blok lama yang akan update)
                var sisaKontrakNanti = (p.sisaKontrak !== undefined ? p.sisaKontrak : 1) - 1;
                var umurNanti = (tahunBerganti && p.umur) ? (p.umur + 1) : (p.umur || 22);

                // Pensiun: umur 34+
                if (umurNanti >= 34) {
                    if (typeof tambahBerita === "function") {
                        tambahBerita("🪦 Pensiun: <b>" + p.nama + "</b> mengakhiri karir dari <span>" + tim.nama + "</span>.");
                    }
                    // Jangan masukkan ke rosterBertahan — selesai
                    return;
                }

                // Kontrak habis: masuk bursa transfer
                if (sisaKontrakNanti <= 0) {
                    // Tambal sub-stat supaya prosesTransferAI() bisa nilai mereka
                    tambalSubStatAI(p, tim.region);
                    if (typeof hitungHargaPasar === "function" && p.ovr && p.umur) {
                        p.harga = hitungHargaPasar(p);
                        p.gaji  = Math.floor(p.harga * 0.15);
                    }

                    // Set sisaKontrak aktual ke 0 supaya blok lama tahu dia sudah habis
                    // Blok lama akan decrement lagi (-1) → jadi -1, lalu push ke pemainTransfer lagi.
                    // MASALAH: double-push ke pemainTransfer!
                    // SOLUSI: Set flag agar blok lama skip pemain ini.
                    p._sudahDirilisOlehPatch = true;
                    // Set sisaKontrak ke 2 (reset) agar blok lama menganggap dia aman,
                    // tidak akan melepasnya lagi. Rilis sudah kita tangani di sini.
                    p.sisaKontrak = 2;

                    var sudahDiBursa = (typeof pemainTransfer !== "undefined") &&
                                       pemainTransfer.some(function(x) { return x.nama === p.nama; });
                    if (!sudahDiBursa && typeof pemainTransfer !== "undefined") {
                        pemainTransfer.push(p);
                    }
                    // Tidak push ke rosterBertahan — pemain keluar dari tim
                    return;
                }

                // Pemain masih kontrak — masuk rosterBertahan untuk diproses blok lama
                rosterBertahan.push(p);
            });

            tim.roster = rosterBertahan;
        });
    });
}
window.rilisKontrakHabisAI = rilisKontrakHabisAI;

// ============================================================
// [4] SAFETY AKADEMI — Isi role kosong yang belum terisi
// ============================================================
function safetyAkademiAI() {
    var ROLES = ["Roamer", "Jungler", "Midlaner", "Goldlaner", "EXP Laner"];
    var semuaRegion = [];
    if (typeof daftarTim   !== "undefined") semuaRegion.push(daftarTim);
    if (typeof daftarTimPH !== "undefined") semuaRegion.push(daftarTimPH);
    if (typeof daftarTimMY !== "undefined") semuaRegion.push(daftarTimMY);
    if (typeof daftarTimSG !== "undefined") semuaRegion.push(daftarTimSG);

    var namaPlayer = (typeof timPlayer !== "undefined") ? timPlayer : "";

    semuaRegion.forEach(function(region) {
        region.forEach(function(tim) {
            if (tim.nama === namaPlayer) return;
            if (!tim.roster) tim.roster = [];

            ROLES.forEach(function(role) {
                var adaDiRole = tim.roster.some(function(p) { return p.role === role; });
                if (adaDiRole) return;

                // Coba dari bursa dulu
                if (typeof pemainTransfer !== "undefined") {
                    var idxBursa = pemainTransfer.findIndex(function(p) { return p.role === role; });
                    if (idxBursa !== -1) {
                        var rekrutan = pemainTransfer.splice(idxBursa, 1)[0];
                        rekrutan.sisaKontrak = Math.floor(Math.random() * 2) + 2;
                        tim.roster.push(rekrutan);
                        if (typeof catatTransferRealTime === "function") {
                            catatTransferRealTime(rekrutan, tim.nama, false);
                        }
                        if (typeof tambahBerita === "function") {
                            tambahBerita("🆘 Darurat: <span>" + tim.nama + "</span> mengisi posisi " + role + " dengan <b>" + rekrutan.nama + "</b>.");
                        }
                        return;
                    }
                }

                // Fallback: pemain akademi
                var baseOvr = Math.max(40, (tim.power || 65) - 8);
                var pAkademi = {
                    nama:        (typeof generateNicknameEsports === "function") ? generateNicknameEsports() : ("Akademi " + tim.nama.split(" ")[0] + " " + role.split(" ")[0]),
                    role:        role,
                    ovr:         baseOvr,
                    umur:        17 + Math.floor(Math.random() * 3),
                    sisaKontrak: 3,
                    gaji:        3000000,
                    harga:       8000000,
                    negara:      (typeof benderaAkademiUntukRegion === "function")
                                    ? benderaAkademiUntukRegion(tim.region)
                                    : "Global",
                    sifat:       "Normal",
                    mekanik:     Math.max(35, baseOvr - 3),
                    makro:       Math.max(35, baseOvr - 3),
                    mental:      Math.max(35, baseOvr - 3),
                    spesialis:   Math.max(35, baseOvr - 3),
                    potensi:     Math.min(99, baseOvr + 10),
                    historyOvr:  [baseOvr]
                };
                tim.roster.push(pAkademi);
                if (typeof catatTransferRealTime === "function") {
                    catatTransferRealTime(pAkademi, tim.nama, false);
                }
            });

            // Sinkronkan power tim
            if (tim.roster.length > 0) {
                var tot = tim.roster.reduce(function(s, p) { return s + (p.ovr || tim.power || 65); }, 0);
                tim.power = Math.floor(tot / tim.roster.length);
            }
        });
    });
}
window.safetyAkademiAI = safetyAkademiAI;

// ============================================================
// [3] PATCH prosesEkosistemAI — Sisipkan fase rilis SEBELUM
// prosesTransferAI() agar bursa penuh saat rekrut dimulai.
// ============================================================
(function() {
    var _orig = window.prosesEkosistemAI;
    if (typeof _orig !== "function") {
        console.warn("Roster AI Patch: prosesEkosistemAI tidak ditemukan!");
        return;
    }

    window.prosesEkosistemAI = function(dataPlayoffID, dataPlayoffPH, dataPlayoffMY, dataPlayoffSG) {
        var tahunBrg = (typeof musimKe !== "undefined") ? (musimKe % 2 === 0) : false;

        // FASE 1: Rilis pemain kontrak habis ke bursa
        rilisKontrakHabisAI(tahunBrg);

        // FASE 2: Jalankan ekosistem AI (termasuk prosesTransferAI yang rekrut dari bursa)
        _orig(dataPlayoffID, dataPlayoffPH, dataPlayoffMY, dataPlayoffSG);

        // FASE 3: Isi role yang masih kosong (safety net)
        safetyAkademiAI();
    };

    console.log("Roster AI Patch: prosesEkosistemAI berhasil di-patch.");
})();

// ============================================================
// PATCH LOAD: Tambal sub-stat semua pemain AI saat game dibuka
// ============================================================
function tambalSubStatSemuaAI() {
    var semuaRegion = [];
    if (typeof daftarTim   !== "undefined") semuaRegion.push(daftarTim);
    if (typeof daftarTimPH !== "undefined") semuaRegion.push(daftarTimPH);
    if (typeof daftarTimMY !== "undefined") semuaRegion.push(daftarTimMY);
    if (typeof daftarTimSG !== "undefined") semuaRegion.push(daftarTimSG);

    semuaRegion.forEach(function(region) {
        region.forEach(function(tim) {
            if (!tim.roster) return;
            tim.roster.forEach(function(p) { tambalSubStatAI(p, tim.region); });
        });
    });
    console.log("Roster AI Patch: sub-stat semua pemain AI ditambal.");
}

setTimeout(tambalSubStatSemuaAI, 1500);

console.log("Roster AI Patch v1.0 loaded — roster AI akan bergerak organik setiap offseason.");

