// ==========================================================================
// STAFF_TROFI_PATCH.JS
// Sistem riwayat pencapaian staff (Pelatih, Asisten Pelatih, Analis).
// Mirror dari pola trofi pemain (lihat catatTrofiPemain() di script.js),
// tapi dengan 3 track terpisah biar gak snowball:
//   1) buffPower (mekanis, ngaruh langsung ke hasil match) -> CAP KERAS 5,
//      diminishing return begitu udah >= 4, growth kecil per tier.
//   2) Harga staff (fame/nilai transfer) -> ADDITIVE dari harga dasar
//      (bukan compounding ke harga terkini), biar gak meledak walau
//      staff-nya juara berkali-kali sepanjang karir.
//   3) Gaji -> permintaan AKTIF via email tiap akhir musim (staff yang
//      dapet trofi tertinggi musim itu), player bisa Terima/Tolak.
//      Ini BOLEH compounding dari gaji sekarang (bukan gaji awal) karena
//      sifatnya opt-in per event, bukan hitungan pasif otomatis.
//
// TIDAK menyentuh atribut drafting/oppAnalysis/strategy/metaReading --
// itu udah py dampak lebih besar per-poin di match_engine.js, sengaja
// dibiarkan di luar sistem trofi ini biar gak ekstrem (sesuai request).
//
// Berlaku SAMA untuk tim player (staffKita) dan SEMUA tim AI (tim.staff)
// di seluruh region/liga -- MDL/MAL/LEN/MPL/MSC/M-Series/M7/EWC.
// ==========================================================================

(function () {

// --------------------------------------------------------------------
// [0] KONSTANTA
// --------------------------------------------------------------------

// Growth buffPower per tier trofi (poin buffPower, sebelum diminishing)
const TIER_BUFFPOWER = { len: 0.15, mdl: 0.25, mpl: 0.5, msc: 0.75, mSeries: 1.0 };

// Persentase harga (additive, dari harga DASAR staff, bukan harga terkini)
const TIER_HARGA_PERSEN = { len: 0.25, mdl: 0.50, mpl: 1.00, msc: 1.50, mSeries: 2.00 };

// Persentase kenaikan gaji yang DIMINTA staff (dari gaji SEKARANG, compounding OK
// karena ini permintaan aktif per event, bukan hitungan pasif)
const TIER_GAJI_PERSEN = { len: 0.10, mdl: 0.15, mpl: 0.25, msc: 0.35, mSeries: 0.50 };

// Prioritas tier, dipakai buat nentuin "trofi tertinggi musim ini"
const TIER_PRIORITAS = { len: 1, mdl: 2, mpl: 3, msc: 4, mSeries: 5 };

const TIER_LABEL = { len: "LEN", mdl: "MDL/MAL", mpl: "MPL", msc: "MSC", mSeries: "M-Series" };

const BUFFPOWER_CAP = 5;
const BUFFPOWER_AMBANG_DIMINISHING = 4;

// Bonus tambahan (additive) buat back-to-back champion, berdasarkan
// STREAK EFEKTIF (streak musim lalu + 1, karena trofi musim ini
// memperpanjang streak-nya)
function bonusStreakHarga(streakEfektif) {
    if (streakEfektif >= 4) return 0.30;
    if (streakEfektif === 3) return 0.20;
    if (streakEfektif === 2) return 0.10;
    return 0;
}
function bonusStreakGaji(streakEfektif) {
    if (streakEfektif >= 4) return 0.15;
    if (streakEfektif === 3) return 0.10;
    if (streakEfektif === 2) return 0.05;
    return 0;
}

const ROLE_LABEL = { pelatih: "Pelatih", asisten: "Asisten Pelatih", analis: "Analis" };

// --------------------------------------------------------------------
// [1] HELPER: kumpulin staff dari SEMUA tim di game (player + AI,
// semua region/liga) -- dipakai buat stempel eligibility & proses
// akhir musim. Pola daftar region disamain persis sama yang dipakai
// script.js sendiri di blok akhir musim, biar gak ada region ketinggalan.
// --------------------------------------------------------------------
function kumpulkanSemuaTimStaffUntukTrofi() {
    let hasil = [{ staffObj: (typeof staffKita !== "undefined" ? staffKita : null), isPlayer: true }];

    let semuaRegionAI = [
        (typeof daftarTim !== "undefined") ? daftarTim : [],
        (typeof daftarTimPH !== "undefined") ? daftarTimPH : [],
        (typeof daftarTimMY !== "undefined") ? daftarTimMY : [],
        (typeof daftarTimSG !== "undefined") ? daftarTimSG : [],
        (typeof daftarTimMDL_Afiliasi_ID !== "undefined") ? daftarTimMDL_Afiliasi_ID : [],
        (typeof daftarTimMDL_Independen_ID !== "undefined") ? daftarTimMDL_Independen_ID : [],
        (typeof daftarTimMDL_Afiliasi_PH !== "undefined") ? daftarTimMDL_Afiliasi_PH : [],
        (typeof daftarTimMDL_Independen_PH !== "undefined") ? daftarTimMDL_Independen_PH : [],
        (typeof daftarTimMAL_Affiliated_MY !== "undefined") ? daftarTimMAL_Affiliated_MY : [],
        (typeof daftarTimMAL_Challenger_MY !== "undefined") ? daftarTimMAL_Challenger_MY : [],
        (typeof daftarTimLEN !== "undefined") ? daftarTimLEN : []
    ];
    ["daftarTimKH", "daftarTimMM", "daftarTimMENA", "daftarTimTR", "daftarTimEECA",
     "daftarTimEA", "daftarTimAM", "daftarTimIN", "daftarTimWEU"].forEach(nm => {
        if (typeof window[nm] !== "undefined") semuaRegionAI.push(window[nm]);
    });

    semuaRegionAI.forEach(region => {
        (region || []).forEach(tim => {
            if (!tim || (typeof timPlayer !== "undefined" && tim.nama === timPlayer)) return; // player udah masuk lewat staffKita
            if (tim.staff) hasil.push({ staffObj: tim.staff, isPlayer: false });
        });
    });

    return hasil;
}
window.kumpulkanSemuaTimStaffUntukTrofi = kumpulkanSemuaTimStaffUntukTrofi;

// --------------------------------------------------------------------
// [2] ELIGIBILITY: staff cuma dapet kredit trofi kalau dia udah
// "tercatat hadir" sejak AWAL musim ini (distempel di season-transition,
// lihat bagian [5]). Staff yang baru direkrut di tengah musim (misal
// beli analis 1 hari sebelum final) -- _trofiMusimStamp dia masih dari
// musim SEBELUMNYA / belum ada sama sekali, jadi otomatis gak eligible
// sampai musim depan.
// --------------------------------------------------------------------
function staffEligibleTrofiMusimIni(s) {
    if (!s) return false;
    let musimNow = (typeof musimKe !== "undefined") ? musimKe : 0;
    return s._trofiMusimStamp === musimNow;
}

// --------------------------------------------------------------------
// [3] APLIKASI KENAIKAN buffPower & harga (dipanggil LANGSUNG saat
// trofi diraih, biar kerasa seketika -- beda sama gaji yang sengaja
// ditunda ke akhir musim, lihat bagian [5]).
// --------------------------------------------------------------------
function terapkanKenaikanBuffPowerStaff(s, tier) {
    let inc = TIER_BUFFPOWER[tier] || 0;
    let bp = (typeof s.buffPower === "number") ? s.buffPower : 1;
    if (bp >= BUFFPOWER_AMBANG_DIMINISHING) inc = inc / 2; // diminishing return
    bp = Math.min(BUFFPOWER_CAP, bp + inc);
    s.buffPower = Math.round(bp * 10) / 10; // rapiin ke 1 desimal buat tampilan UI
}

function terapkanKenaikanHargaStaff(s, tier, streakEfektif) {
    if (typeof s.hargaDasar !== "number") {
        s.hargaDasar = s.harga || 0; // snapshot harga dasar sekali doang, pertama kali kena trofi
    }
    if (typeof s._trofiHargaMultiplier !== "number") s._trofiHargaMultiplier = 1;

    let bonus = (TIER_HARGA_PERSEN[tier] || 0) + bonusStreakHarga(streakEfektif);
    s._trofiHargaMultiplier += bonus;
    s.harga = Math.floor(s.hargaDasar * s._trofiHargaMultiplier);
}

// --------------------------------------------------------------------
// [4] CATAT TROFI STAFF -- dipanggil tiap kali sebuah tim resmi juara
// (dihook otomatis dari catatTrofiPemain, lihat bagian [7]).
// --------------------------------------------------------------------
function catatTrofiStaff(timJuara, jenisTrofi, regionKode) {
    if (!timJuara || !TIER_PRIORITAS[jenisTrofi]) return;

    let isPlayerTeam = (typeof timPlayer !== "undefined" && timJuara.nama === timPlayer);
    let staffObj = isPlayerTeam ? (typeof staffKita !== "undefined" ? staffKita : null) : (timJuara.staff || null);
    if (!staffObj) return;

    ["pelatih", "asisten", "analis"].forEach(role => {
        let s = staffObj[role];
        if (!s) return;
        if (!staffEligibleTrofiMusimIni(s)) return; // baru gabung tengah musim -> skip

        tambahTrofiKeStaff(s, jenisTrofi, timJuara, regionKode);

        let streakEfektif = (s._trofiStreakCount || 0) + 1;

        terapkanKenaikanBuffPowerStaff(s, jenisTrofi);
        terapkanKenaikanHargaStaff(s, jenisTrofi, streakEfektif);

        // Simpen trofi tertinggi musim ini (dipakai buat permintaan gaji di akhir musim)
        if (!s._trofiTertinggiMusimIni || TIER_PRIORITAS[jenisTrofi] > TIER_PRIORITAS[s._trofiTertinggiMusimIni]) {
            s._trofiTertinggiMusimIni = jenisTrofi;
        }

        if (isPlayerTeam && typeof tambahBerita === "function") {
            let labelBerita = labelTrofiBaris(jenisTrofi, regionKode || cariRegionTimUntukTrofi(timJuara));
            tambahBerita(
                `🏆 ${s.nama} (${ROLE_LABEL[role]}) ikut mengangkat trofi ${labelBerita} bareng ${timJuara.nama}! ` +
                `Reputasinya naik, dan power kontribusinya ke tim ikut bertambah.`
            );
        }
    });
}
window.catatTrofiStaff = catatTrofiStaff;

// --------------------------------------------------------------------
// [4b] RESOLUSI REGION -- MPL (via regionKode param, udah reliable dari
// caller) dan MDL/MAL (regionKode-nya SELALU undefined dari caller, jadi
// kita cari sendiri lewat KEANGGOTAAN ARRAY tim -- pola yang sama persis
// dipakai script.js sendiri buat nentuin region tim (bukan cuma percaya
// field .region mentah yang gak selalu keisi di semua jalur pembuatan tim).
// --------------------------------------------------------------------
function cariRegionTimUntukTrofi(tim) {
    if (!tim) return null;
    let grup = [
        { region: "ID", arr: (typeof daftarTim !== "undefined") ? daftarTim : [] },
        { region: "PH", arr: (typeof daftarTimPH !== "undefined") ? daftarTimPH : [] },
        { region: "MY", arr: (typeof daftarTimMY !== "undefined") ? daftarTimMY : [] },
        { region: "SG", arr: (typeof daftarTimSG !== "undefined") ? daftarTimSG : [] },
        { region: "ID", arr: (typeof daftarTimMDL_Afiliasi_ID !== "undefined") ? daftarTimMDL_Afiliasi_ID : [] },
        { region: "ID", arr: (typeof daftarTimMDL_Independen_ID !== "undefined") ? daftarTimMDL_Independen_ID : [] },
        { region: "PH", arr: (typeof daftarTimMDL_Afiliasi_PH !== "undefined") ? daftarTimMDL_Afiliasi_PH : [] },
        { region: "PH", arr: (typeof daftarTimMDL_Independen_PH !== "undefined") ? daftarTimMDL_Independen_PH : [] },
        { region: "MY", arr: (typeof daftarTimMAL_Affiliated_MY !== "undefined") ? daftarTimMAL_Affiliated_MY : [] },
        { region: "MY", arr: (typeof daftarTimMAL_Challenger_MY !== "undefined") ? daftarTimMAL_Challenger_MY : [] },
        { region: "ID", arr: (typeof daftarTimLEN !== "undefined") ? daftarTimLEN : [] }
    ];
    ["KH", "MM", "MENA", "TR", "EECA", "EA", "AM", "IN", "WEU"].forEach(kode => {
        let nm = "daftarTim" + kode;
        if (typeof window[nm] !== "undefined") grup.push({ region: kode, arr: window[nm] });
    });
    for (let g of grup) {
        if ((g.arr || []).some(t => t && t.nama === tim.nama)) return g.region;
    }
    return tim.region || null; // fallback terakhir ke field .region kalau gak ketemu di array manapun
}

// Label tampilan per baris trofi. Bucket "mdl" + region "MY" khusus
// ditampilin "MAL MY" (bukan "MDL MY") karena MAL MY emang liga
// pengembangan MY, disatuin ke bucket "mdl" buat keperluan cap/growth,
// tapi identitasnya beda dari MDL ID/PH.
function labelTrofiBaris(tierBucket, region) {
    if (tierBucket === "mSeries") return "M-Series";
    if (tierBucket === "msc") return "MSC";
    if (tierBucket === "len") return "LEN";
    if (tierBucket === "mdl") return (region === "MY") ? "MAL MY" : ("MDL " + (region || "?"));
    if (tierBucket === "mpl") return "MPL " + (region || "?");
    return tierBucket;
}

// Nyimpen trofi. mSeries/msc/len tetep angka polos. mpl/mdl disimpen
// per-region (object), biar bisa ditampilin "MPL PH", "MPL ID", "MDL PH",
// dst -- bukan cuma dilebur jadi 1 angka gabungan kayak versi sebelumnya.
function tambahTrofiKeStaff(s, jenisTrofi, timJuara, regionKode) {
    if (!s.trofi) s.trofi = { mSeries: 0, msc: 0, mpl: {}, mdl: {}, len: 0 };

    if (jenisTrofi === "mpl" || jenisTrofi === "mdl") {
        // Migrasi data lama dari versi patch sebelum ini (waktu itu masih
        // angka polos, belum per-region) -- gak boleh ilang datanya,
        // dipindahin ke bucket "?" (region gak diketahui dari data lama).
        if (typeof s.trofi[jenisTrofi] !== "object" || s.trofi[jenisTrofi] === null) {
            let angkaLama = s.trofi[jenisTrofi] || 0;
            s.trofi[jenisTrofi] = angkaLama > 0 ? { "?": angkaLama } : {};
        }
        let region = regionKode || cariRegionTimUntukTrofi(timJuara) || "?";
        s.trofi[jenisTrofi][region] = (s.trofi[jenisTrofi][region] || 0) + 1;
    } else {
        s.trofi[jenisTrofi] = (s.trofi[jenisTrofi] || 0) + 1;
    }
}


// --------------------------------------------------------------------
// [5] PROSES AKHIR MUSIM: stempel eligibility musim baru, update streak,
// dan kirim permintaan kenaikan gaji (staff player lewat email, staff
// AI otomatis diam-diam) berdasarkan trofi TERTINGGI yang diraih musim
// yang baru aja selesai.
// --------------------------------------------------------------------
function prosesAkhirMusimTrofiStaff() {
    let semuaEntitas = kumpulkanSemuaTimStaffUntukTrofi();
    let musimNow = (typeof musimKe !== "undefined") ? musimKe : 0;

    semuaEntitas.forEach(({ staffObj, isPlayer }) => {
        if (!staffObj) return;
        ["pelatih", "asisten", "analis"].forEach(role => {
            let s = staffObj[role];
            if (!s) return;

            if (s._trofiTertinggiMusimIni) {
                s._trofiStreakCount = (s._trofiStreakCount || 0) + 1;
                let streakEfektif = s._trofiStreakCount;
                if (isPlayer) {
                    ajukanKenaikanGajiStaff(s, role, s._trofiTertinggiMusimIni, streakEfektif);
                } else {
                    terapkanKenaikanGajiStaffAI(s, s._trofiTertinggiMusimIni, streakEfektif);
                }
            } else {
                s._trofiStreakCount = 0; // gak dapet trofi apapun musim ini -> streak putus
            }
            s._trofiTertinggiMusimIni = null; // reset buat musim berikutnya

            // Stempel "hadir sejak awal musim baru" -- staff yang direkrut
            // SETELAH titik ini (di tengah musim baru) gak akan kestempel
            // sampai transisi musim berikutnya, otomatis ineligible sampai saat itu.
            s._trofiMusimStamp = musimNow;
        });
    });
}
window.prosesAkhirMusimTrofiStaff = prosesAkhirMusimTrofiStaff;

// --------------------------------------------------------------------
// [6] PERMINTAAN KENAIKAN GAJI (khusus staff PLAYER, via email Terima/Tolak)
// dan versi senyap buat staff AI (gak perlu UI, biar ekonomi AI juga kerasa
// efeknya -- fairness sama seperti yang diminta).
// --------------------------------------------------------------------
function terapkanKenaikanGajiStaffAI(s, tier, streakEfektif) {
    let persen = (TIER_GAJI_PERSEN[tier] || 0) + bonusStreakGaji(streakEfektif);
    s.gaji = Math.floor((s.gaji || 8000000) * (1 + persen));
}

function cariStaffKitaByNama(nama) {
    if (typeof staffKita === "undefined") return null;
    for (let role of ["pelatih", "asisten", "analis"]) {
        if (staffKita[role] && staffKita[role].nama === nama) return { s: staffKita[role], role };
    }
    return null;
}

function ajukanKenaikanGajiStaff(s, role, tier, streakEfektif) {
    // Kalau dia udah 2x ditolak berturut-turut, ada kans dia nyerah &
    // resign daripada minta lagi -- konsekuensi ringan tapi nyata buat nolak.
    if ((s._trofiKecewa || 0) >= 2 && Math.random() < 0.20) {
        kirimEmailStaffResign(s, role);
        return;
    }

    let persenBase = TIER_GAJI_PERSEN[tier] || 0;
    let bonus = bonusStreakGaji(streakEfektif);
    let totalPersen = persenBase + bonus;
    let gajiSekarang = s.gaji || 5000000;
    let gajiDiminta = Math.floor(gajiSekarang * (1 + totalPersen));
    let offerId = "raisestaff_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
    let namaTierTampil = TIER_LABEL[tier];
    let teksStreak = streakEfektif >= 2 ? ` (${streakEfektif}x beruntun!)` : "";

    let isiEmail = `
        <div style="font-size:12px; color:#5C6472; line-height:1.6; margin-bottom:15px;">
            Halo, ini <b>${s.nama}</b> (${ROLE_LABEL[role]}). Berkat pencapaian kita musim ini —
            <b>Juara ${namaTierTampil}</b>${teksStreak} — saya rasa kontribusi saya layak
            dihargai lebih. Saya mengajukan kenaikan gaji musim depan.
        </div>
        <div style="background:#F1F3F8; padding:15px; border-radius:6px; text-align:center; border:1px solid #333; margin-bottom:15px;">
            <div style="font-size:11px; color:#888;">PERMINTAAN GAJI BARU (per musim):</div>
            <div style="font-size:20px; color:#C9971F; font-weight:bold; font-family:'Oswald', sans-serif;">
                Rp ${(gajiDiminta / 1000000).toFixed(1)} Jt
            </div>
            <div style="font-size:10px; color:#666; margin-top:4px;">
                (naik ${(totalPersen * 100).toFixed(0)}% dari Rp ${(gajiSekarang / 1000000).toFixed(1)} Jt)
            </div>
        </div>
        <div id="${offerId}" style="display: flex; gap: 10px;">
            <button class="modal-btn" style="background:#E5484D; color:#fff; flex:1; font-size:11px; padding:8px;" onclick="tolakKenaikanGajiStaff('${offerId}', '${s.nama}')">TOLAK</button>
            <button class="modal-btn" style="background:#00B37E; color:#fff; flex:1; font-size:11px; padding:8px;" onclick="terimaKenaikanGajiStaff('${offerId}', '${s.nama}', ${gajiDiminta})">SETUJUI</button>
        </div>
    `;

    if (typeof tambahEmail === "function") {
        tambahEmail(`Permintaan Kenaikan Gaji: ${s.nama}`, `${s.nama} (${ROLE_LABEL[role]})`, isiEmail);
    }
}

function kirimEmailStaffResign(s, role) {
    let isiEmail = `
        <div style="font-size:12px; color:#5C6472; line-height:1.6;">
            <b>${s.nama}</b> kecewa karena permintaan kenaikan gajinya berulang kali ditolak,
            dan memutuskan untuk mengundurkan diri musim depan. Dia sekarang tersedia lagi
            di bursa staff kalau suatu saat lo mau merekrutnya kembali.
        </div>
    `;
    if (typeof tambahEmail === "function") {
        tambahEmail(`${s.nama} Mengundurkan Diri`, `${s.nama} (${ROLE_LABEL[role]})`, isiEmail);
    }
    if (typeof staffKita !== "undefined") staffKita[role] = null;
    if (typeof bursaStaff !== "undefined") {
        bursaStaff.push({
            nama: s.nama,
            role: s.role || ROLE_LABEL[role],
            buffPower: s.buffPower || 1,
            gaji: s.gaji || 8000000,
            harga: s.harga || 15000000,
            umur: s.umur || 32,
            sisaKontrak: 0,
            negara: s.negara || "🌐 Global",
            kepribadian: s.kepribadian || "Normal",
            ekspektasiGaji: s.gaji || 8000000
        });
    }
    if (typeof tambahBerita === "function") {
        tambahBerita(`📋 ${s.nama} resmi mengundurkan diri karena tuntutan gajinya tak kunjung dipenuhi.`);
    }
}

window.terimaKenaikanGajiStaff = function (offerId, namaStaff, gajiBaru) {
    let cari = cariStaffKitaByNama(namaStaff);
    if (cari) {
        cari.s.gaji = gajiBaru;
        cari.s._trofiKecewa = 0;
    }
    let el = getEl(offerId);
    if (el) el.innerHTML = `<div style="background:#F7F9FC; border-left:4px solid #00B37E; padding:10px; color:#00B37E; text-align:center; font-weight:bold; font-size:12px; width:100%;">✅ KENAIKAN GAJI DISETUJUI.</div>`;
    let emTarget = (typeof inboxEmail !== "undefined") ? inboxEmail.find(em => em.isi && em.isi.includes(offerId)) : null;
    if (emTarget && getEl("bacaEmailIsi")) emTarget.isi = getEl("bacaEmailIsi").innerHTML;
    if (typeof updateDashboard === "function") updateDashboard();
};

window.tolakKenaikanGajiStaff = function (offerId, namaStaff) {
    let cari = cariStaffKitaByNama(namaStaff);
    if (cari) cari.s._trofiKecewa = (cari.s._trofiKecewa || 0) + 1;
    let el = getEl(offerId);
    if (el) el.innerHTML = `<div style="background:#F7F9FC; border-left:4px solid #E5484D; padding:10px; color:#E5484D; text-align:center; font-weight:bold; font-size:12px; width:100%;">❌ PERMINTAAN DITOLAK.</div>`;
    let emTarget = (typeof inboxEmail !== "undefined") ? inboxEmail.find(em => em.isi && em.isi.includes(offerId)) : null;
    if (emTarget && getEl("bacaEmailIsi")) emTarget.isi = getEl("bacaEmailIsi").innerHTML;
};

// --------------------------------------------------------------------
// [7] HOOK OTOMATIS -- nempel ke SATU titik pusat yang udah ada
// (catatTrofiPemain), jadi otomatis kepanggil di SEMUA tempat trofi
// dibagiin (M-Series/MSC/MPL semua region/MDL/LEN/MAL) tanpa perlu
// nyentuh m7_engine.js / msc_ewc_engine.js / mdl_len_engine.js / script.js
// satu-satu.
// --------------------------------------------------------------------
if (typeof window.catatTrofiPemain === "function" && !window._catatTrofiPemainAsliSebelumStaffPatch) {
    window._catatTrofiPemainAsliSebelumStaffPatch = window.catatTrofiPemain;
    window.catatTrofiPemain = function (timJuara, jenisTrofi, regionKode) {
        window._catatTrofiPemainAsliSebelumStaffPatch(timJuara, jenisTrofi, regionKode);
        catatTrofiStaff(timJuara, jenisTrofi, regionKode);
    };
}

// --------------------------------------------------------------------
// [8] HOOK TRANSISI MUSIM -- deteksi musimKe naik dengan wrap
// klikTombolUtama (fungsi utama "maju hari/minggu"), TANPA nyentuh
// script.js sama sekali. Begitu kedeteksi musim baru mulai, jalanin
// proses akhir musim staff (bagian [5]).
// --------------------------------------------------------------------
if (typeof window.klikTombolUtama === "function" && !window._klikTombolUtamaAsliSebelumStaffPatch) {
    window._klikTombolUtamaAsliSebelumStaffPatch = window.klikTombolUtama;
    window.klikTombolUtama = function () {
        let musimSebelum = (typeof musimKe !== "undefined") ? musimKe : null;
        let hasil = window._klikTombolUtamaAsliSebelumStaffPatch.apply(this, arguments);
        let musimSesudah = (typeof musimKe !== "undefined") ? musimKe : null;
        if (musimSebelum !== null && musimSesudah !== null && musimSesudah > musimSebelum) {
            prosesAkhirMusimTrofiStaff();
        }
        return hasil;
    };
}

// --------------------------------------------------------------------
// [8b] RENDER "DAFTAR TROFI" DI MODAL PROFIL STAFF -- nempel ke card
// #profilStaffTrofi yang ditambahin ke index.html (posisinya persis di
// bawah "ATRIBUT STAFF"). Style & struktur DOM sengaja disamain persis
// sama "DAFTAR TROFI" punya pemain (class .profil-karir-list, warna &
// spacing yang sama) biar konsisten secara visual di seluruh game.
// --------------------------------------------------------------------
const URUTAN_PRIORITAS_TAMPIL = { mSeries: 5, msc: 4, mpl: 3, mdl: 2, len: 1 };

function renderTrofiStaffKeModal(tipe, val) {
    let container = getEl("profilStaffTrofi");
    if (!container) return;

    let s = null;
    if (tipe === "TIM" && typeof staffKita !== "undefined") s = staffKita[val];
    else if (tipe === "BURSA" && typeof bursaStaff !== "undefined") s = bursaStaff[val];
    if (!s) { container.innerHTML = ""; return; }

    let daftarBaris = [];
    if (s.trofi) {
        if (s.trofi.mSeries > 0) daftarBaris.push({ label: "M-Series", jumlah: s.trofi.mSeries, prioritas: 5 });
        if (s.trofi.msc > 0) daftarBaris.push({ label: "MSC", jumlah: s.trofi.msc, prioritas: 4 });
        if (s.trofi.mpl && typeof s.trofi.mpl === "object") {
            Object.keys(s.trofi.mpl).sort().forEach(region => {
                if (s.trofi.mpl[region] > 0) {
                    daftarBaris.push({ label: labelTrofiBaris("mpl", region), jumlah: s.trofi.mpl[region], prioritas: 3 });
                }
            });
        }
        if (s.trofi.mdl && typeof s.trofi.mdl === "object") {
            Object.keys(s.trofi.mdl).sort().forEach(region => {
                if (s.trofi.mdl[region] > 0) {
                    daftarBaris.push({ label: labelTrofiBaris("mdl", region), jumlah: s.trofi.mdl[region], prioritas: 2 });
                }
            });
        }
        if (s.trofi.len > 0) daftarBaris.push({ label: "LEN", jumlah: s.trofi.len, prioritas: 1 });
    }
    daftarBaris.sort((a, b) => b.prioritas - a.prioritas);

    container.innerHTML = "";
    if (daftarBaris.length > 0) {
        let fragmentTrofi = document.createDocumentFragment();
        daftarBaris.forEach(t => {
            let itemTrofi = document.createElement("div");
            itemTrofi.style.cssText =
                "display: flex; justify-content: space-between; border-bottom: 1px dashed var(--border-md); padding: 6px 0; font-size: 11px;";
            itemTrofi.innerHTML = `
                <span style="color:#5C6472;">${t.label}</span>
                <span style="color:#C9971F; font-weight:bold;">${t.jumlah}x</span>
            `;
            fragmentTrofi.appendChild(itemTrofi);
        });
        container.appendChild(fragmentTrofi);
    } else {
        container.innerHTML = `<div style="color:#666; font-style:italic; padding: 5px 0; font-size: 11px;">Belum pernah juara turnamen.</div>`;
    }
}

if (typeof window.bukaProfilStaff === "function" && !window._bukaProfilStaffAsliSebelumStaffPatch) {
    window._bukaProfilStaffAsliSebelumStaffPatch = window.bukaProfilStaff;
    window.bukaProfilStaff = function (tipe, val) {
        window._bukaProfilStaffAsliSebelumStaffPatch(tipe, val);
        renderTrofiStaffKeModal(tipe, val);
    };
}

// --------------------------------------------------------------------
// [8c] BIKIN STAFF TIM AI BISA DIKLIK -- di layar "Detail Tim"
// (bukaInfoTim, yang muncul pas klik nama tim dari klasemen/scouting),
// card staff dari game aslinya sengaja dibikin cursor:default tanpa
// onclick, jadi gak ada cara liat profil/trofi staff musuh sama sekali.
//
// Caranya: abis bukaInfoTim asli selesai render, kita cari 3 card
// staff-nya di dalam #detailTimStaff, terus tempel onclick yang buka
// MODAL PROFIL YANG SAMA PERSIS kayak punya staff sendiri -- caranya
// dengan nuker sementara staffKita ke staff milik tim itu, panggil
// bukaProfilStaff('TIM', roleKey) asli (jadi SEMUA rendering -- nama,
// atribut per role, buff, DAN daftar trofi kita di atas -- otomatis
// ikut kepake tanpa perlu ditulis ulang), baru staffKita dibalikin lagi
// SEBELUM baris berikutnya (aman karena semuanya sinkron).
//
// Tombol PECAT STAFF disembunyiin waktu lagi liat staff tim lain --
// itu bukan staff kita, gak boleh ada cara mecatnya dari sini.
// --------------------------------------------------------------------
function daftarSemuaRegionTimUntukProfil() {
    let semuaRegion = [
        (typeof daftarTim !== "undefined") ? daftarTim : [],
        (typeof daftarTimPH !== "undefined") ? daftarTimPH : [],
        (typeof daftarTimMY !== "undefined") ? daftarTimMY : [],
        (typeof daftarTimSG !== "undefined") ? daftarTimSG : [],
        (typeof daftarTimMDL_Afiliasi_ID !== "undefined") ? daftarTimMDL_Afiliasi_ID : [],
        (typeof daftarTimMDL_Independen_ID !== "undefined") ? daftarTimMDL_Independen_ID : [],
        (typeof daftarTimMDL_Afiliasi_PH !== "undefined") ? daftarTimMDL_Afiliasi_PH : [],
        (typeof daftarTimMDL_Independen_PH !== "undefined") ? daftarTimMDL_Independen_PH : [],
        (typeof daftarTimMAL_Affiliated_MY !== "undefined") ? daftarTimMAL_Affiliated_MY : [],
        (typeof daftarTimMAL_Challenger_MY !== "undefined") ? daftarTimMAL_Challenger_MY : [],
        (typeof daftarTimLEN !== "undefined") ? daftarTimLEN : []
    ];
    ["daftarTimKH", "daftarTimMM", "daftarTimMENA", "daftarTimTR", "daftarTimEECA",
     "daftarTimEA", "daftarTimAM", "daftarTimIN", "daftarTimWEU"].forEach(nm => {
        if (typeof window[nm] !== "undefined") semuaRegion.push(window[nm]);
    });
    return semuaRegion;
}

function cariTimUntukProfilStaff(namaTim) {
    if (typeof cariTimAsliDiDatabase === "function") {
        let hasil = cariTimAsliDiDatabase(namaTim);
        if (hasil) return hasil;
    }
    for (let region of daftarSemuaRegionTimUntukProfil()) {
        let found = (region || []).find(t => t && t.nama === namaTim);
        if (found) return found;
    }
    return null;
}

function bukaProfilStaffAI(namaTim, roleKey) {
    let tim = cariTimUntukProfilStaff(namaTim);
    if (!tim || !tim.staff || !tim.staff[roleKey]) return;
    if (typeof staffKita === "undefined") return;

    let staffAsli = staffKita;
    staffKita = tim.staff; // nuker sementara, biar bukaProfilStaff('TIM', ...) asli mikir ini staff kita
    try {
        window.bukaProfilStaff("TIM", roleKey);
    } finally {
        staffKita = staffAsli; // WAJIB balik sebelum baris apapun berikutnya jalan (semuanya sinkron, aman)
    }

    // Read-only -- ini staff tim lain, sembunyiin tombol PECAT biar
    // gak kepencet ke staff kita sendiri gara-gara closure onclick-nya.
    let btn = getEl("btnProfilRekrutStaff");
    if (btn) btn.style.display = "none";
}
window.bukaProfilStaffAI = bukaProfilStaffAI;

function pasangKlikStaffDiDetailTim(namaTim) {
    let container = getEl("detailTimStaff");
    if (!container) return;

    let isTimKita = (typeof timPlayer !== "undefined" && namaTim === timPlayer);
    let timTarget = isTimKita ? null : cariTimUntukProfilStaff(namaTim);
    let staffDataUntukCek = isTimKita
        ? (typeof staffKita !== "undefined" ? staffKita : {})
        : ((timTarget && timTarget.staff) ? timTarget.staff : {});

    let cardEls = container.querySelectorAll(".roster-card");
    let roleOrder = ["pelatih", "asisten", "analis"];

    roleOrder.forEach((roleKey, i) => {
        let el = cardEls[i];
        if (!el) return;
        if (!staffDataUntukCek[roleKey]) return; // posisi kosong, biarin non-klik

        el.style.cursor = "pointer";
        el.onclick = isTimKita
            ? function () { window.bukaProfilStaff("TIM", roleKey); }
            : function () { window.bukaProfilStaffAI(namaTim, roleKey); };
    });
}

if (typeof window.bukaInfoTim === "function" && !window._bukaInfoTimAsliSebelumStaffPatch) {
    window._bukaInfoTimAsliSebelumStaffPatch = window.bukaInfoTim;
    window.bukaInfoTim = function (namaTim) {
        window._bukaInfoTimAsliSebelumStaffPatch(namaTim);
        pasangKlikStaffDiDetailTim(namaTim);
    };
}

// --------------------------------------------------------------------
// [9] STEMPEL AWAL (grandfather clause) -- jalan SEKALI pas patch ini
// pertama kali dimuat, biar staff yang UDAH ADA di save (termasuk staff
// awal game baru) langsung eligible dari musim berjalan saat ini,
// gak perlu nunggu 1 musim penuh dulu buat mulai kehitung trofinya.
// --------------------------------------------------------------------
function stempelAwalSemuaStaff() {
    let musimNow = (typeof musimKe !== "undefined") ? musimKe : 0;
    kumpulkanSemuaTimStaffUntukTrofi().forEach(({ staffObj }) => {
        if (!staffObj) return;
        ["pelatih", "asisten", "analis"].forEach(role => {
            let s = staffObj[role];
            if (s && s._trofiMusimStamp === undefined) s._trofiMusimStamp = musimNow;
        });
    });
}
stempelAwalSemuaStaff();

})();
