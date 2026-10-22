// ==========================================
// FILE TRANSFER.JS - BURSA TRANSFER & STAFF
// ==========================================

// DATABASE BURSA TRANSFER (PEMAIN KOSONG/DIJUAL)
let pemainTransfer = [
    {
        nama: "Donkey",
        role: "Roamer",
        sifat: "Normal",
        harga: 100000000,
        umur: 30,
        mekanik: 60,
        makro: 75,
        mental: 85,
        spesialis: 80,
        potensi: 80,
        scouted: false,
        gaji: 15000000,
        sisaKontrak: 2,
        negara: "🇮🇩 Indonesia",
        karir: [{ tahun: "2018-2021", tim: "EVOS Legends" }]
    },
    {
        nama: "Wann",
        role: "Jungler",
        sifat: "Normal",
        harga: 104000000,
        umur: 24,
        mekanik: 80,
        makro: 70,
        mental: 65,
        spesialis: 75,
        potensi: 88,
        scouted: false,
        gaji: 18000000,
        sisaKontrak: 2,
        negara: "🇮🇩 Indonesia",
        karir: [{ tahun: "2019-2022", tim: "EVOS Legends" }]
    },
    {
        nama: "Oura",
        role: "EXP Laner",
        sifat: "Normal",
        harga: 106000000,
        umur: 26,
        mekanik: 75,
        makro: 80,
        mental: 80,
        spesialis: 85,
        potensi: 85,
        scouted: false,
        gaji: 17000000,
        sisaKontrak: 2,
        negara: "🇮🇩 Indonesia",
        karir: [{ tahun: "2017-2020", tim: "EVOS Legends" }]
    },
    {
        nama: "REKT",
        role: "Goldlaner",
        sifat: "Normal",
        harga: 105000000,
        umur: 25,
        mekanik: 70,
        makro: 75,
        mental: 90,
        spesialis: 70,
        potensi: 85,
        scouted: false,
        gaji: 18000000,
        sisaKontrak: 2,
        negara: "🇮🇩 Indonesia",
        karir: [
            { tahun: "2018-2022", tim: "EVOS Legends" },
            { tahun: "2023-2024", tim: "Alter Ego" }
        ]
    },
    {
        nama: "Luminaire",
        role: "Midlaner",
        sifat: "Normal",
        harga: 104000000,
        umur: 23,
        mekanik: 75,
        makro: 85,
        mental: 80,
        spesialis: 80,
        potensi: 92,
        scouted: false,
        gaji: 16000000,
        sisaKontrak: 2,
        negara: "🇮🇩 Indonesia",
        karir: [{ tahun: "2019-2022", tim: "EVOS Legends" }]
    }
];

// FUNGSI NGITUNG OVR
pemainTransfer.forEach(p => {
    p.ovr = hitungOVRDatabase(p);
    p.historyOvr = [p.ovr];
});

// [FIX] Nempelin eksplisit ke window -- `let` top-level gak otomatis jadi
// properti window (beda sama `var`/function), jadi kalau environment
// reload/re-inject script.js dengan cara non-standar, referensi bare
// `pemainTransfer` di file lain masih tetap bisa ke-resolve lewat window.
window.pemainTransfer = pemainTransfer;

// DATABASE BURSA STAFF
let bursaStaff = [
    {
        nama: "Zeys",
        role: "Pelatih",
        negara: "🇸🇬 Singapura",
        buffPower: 4,
        gaji: 14700000,
        harga: 20000000,
        kepribadian: "Ambisius", // Tambahan
        ekspektasiGaji: 14700000 // Tambahan (disamakan dengan gaji awal)
    },
    {
        nama: "Master",
        role: "Pelatih",
        negara: "🇵🇭 Filipina",
        buffPower: 3,
        gaji: 13200000,
        harga: 15000000,
        kepribadian: "Veteran", // Tambahan
        ekspektasiGaji: 13200000 // Tambahan
    },
    {
        nama: "Age",
        role: "Pelatih",
        negara: "🇮🇩 Indonesia",
        buffPower: 1,
        gaji: 8000000,
        harga: 10000000,
        kepribadian: "Muda", // Tambahan
        ekspektasiGaji: 8000000 // Tambahan
    },
    {
        nama: "TaxStump",
        role: "Analis",
        negara: "🇮🇩 Indonesia",
        buffPower: 2,
        gaji: 8900000,
        harga: 13000000,
        kepribadian: "Santai", // Tambahan
        ekspektasiGaji: 8900000 // Tambahan
    },
    {
        nama: "Caleb",
        role: "Analis",
        negara: "🇮🇩 Indonesia",
        buffPower: 1,
        gaji: 7300000,
        harga: 9000000,
        kepribadian: "Muda", // Tambahan
        ekspektasiGaji: 7300000 // Tambahan
    },
    {
        nama: "Ronaldo",
        role: "Asisten Pelatih",
        negara: "🇮🇩 Indonesia",
        buffPower: 1,
        gaji: 7500000,
        harga: 9500000,
        kepribadian: "Santai", // Tambahan
        ekspektasiGaji: 7500000 // Tambahan
    },
    {
        nama: "Pae",
        role: "Asisten Pelatih",
        negara: "🇮🇩 Indonesia",
        buffPower: 1,
        gaji: 7800000,
        harga: 7000000,
        kepribadian: "Veteran", // Tambahan
        ekspektasiGaji: 7800000 // Tambahan
    }
];

// [FIX] Sama kayak pemainTransfer -- nempelin eksplisit ke window biar
// tetap ke-resolve dari file lain gimanapun cara environment reload-nya.
window.bursaStaff = bursaStaff;

// ==========================================
// SISTEM GENERATOR NICKNAME ESPORTS (PEMAIN & STAFF)
// ==========================================
// 50 prefix x 50 suffix = 2.500 kombinasi unik. Dipilih & disusun supaya
// hasil gabungannya kedengeran natural kayak nickname pro player, bukan
// random huruf yang aneh dibaca.
const NICKNAME_PREFIX = [
    "Kai","Sky","Rex","Zen","Vex","Nyx","Drak","Fen","Jax","Kry",
    "Zar","Vor","Lux","Thal","Bry","Cyr","Dex","Ely","Gry","Hal",
    "Iro","Jov","Kel","Lor","Mor","Nex","Orn","Pyr","Quin","Ral",
    "Syl","Tor","Uma","Val","Wyn","Xan","Yor","Zed","Ash","Bel",
    "Cor","Dyn","Ezr","Fyr","Gal","Hex","Ivo","Jun","Kor","Nova"
];
const NICKNAME_SUFFIX = [
    "zen","lar","ton","dor","ric","nix","mos","len","wick","rok",
    "van","lyn","gard","mir","cade","sen","thos","rin","vane","gon",
    "mund","rex","dane","lus","kar","tin","vor","sar","dyn","cyn",
    "rath","mon","lief","gan","tir","wyn","drin","zar","holt","ren",
    "kai","lok","myn","dris","thor","vius","nar","quin","xel","bron"
];
// [FIX] Nempelin ke window -- konsisten sama fix pemainTransfer/bursaStaff
// sebelumnya, jaga-jaga kalau ada file lain yang butuh akses array-nya
// langsung (bukan cuma lewat generateNicknameEsports()).
window.NICKNAME_PREFIX = NICKNAME_PREFIX;
window.NICKNAME_SUFFIX = NICKNAME_SUFFIX;

// Kumpulin semua nickname yang lagi aktif dipakai (pemain & staff, player
// maupun seluruh tim AI di semua region/liga) buat dicek keunikannya.
function semuaNicknameAktifSaatIni() {
    let dipakai = new Set();

    let tambahDariArray = (arr) => {
        if (!arr || !Array.isArray(arr)) return;
        arr.forEach(p => { if (p && p.nama) dipakai.add(p.nama); });
    };
    let tambahSatu = (obj) => {
        if (obj && obj.nama) dipakai.add(obj.nama);
    };

    // Roster & bursa milik player
    tambahDariArray(typeof rosterKita !== "undefined" ? rosterKita : null);
    tambahDariArray(typeof pemainTransfer !== "undefined" ? pemainTransfer : null);
    tambahDariArray(typeof bursaStaff !== "undefined" ? bursaStaff : null);
    if (typeof staffKita !== "undefined" && staffKita) {
        tambahSatu(staffKita.pelatih);
        tambahSatu(staffKita.asisten);
        tambahSatu(staffKita.analis);
    }

    // Roster seluruh tim AI di semua region & liga (kalau udah dibentuk
    // organik oleh Roster AI Patch)
    // [FIX] Sebelumnya cuma 4 region lama (ID/PH/MY/SG) + MDL/LEN/MAL yang
    // di-scan -- 9 region baru (KH/MM/MENA/TR/EECA/EA/AM/IN/WEU) kelewat,
    // padahal sekarang region2 itu juga generate nickname sendiri lewat
    // akademi AI-nya. Tanpa ini nama yang udah dipakai di region baru bisa
    // ke-generate ulang buat individu lain (duplikat nickname).
    let semuaRegionTim = [
        typeof daftarTim !== "undefined" ? daftarTim : null,
        typeof daftarTimPH !== "undefined" ? daftarTimPH : null,
        typeof daftarTimMY !== "undefined" ? daftarTimMY : null,
        typeof daftarTimSG !== "undefined" ? daftarTimSG : null,
        typeof daftarTimKH !== "undefined" ? daftarTimKH : null,
        typeof daftarTimMM !== "undefined" ? daftarTimMM : null,
        typeof daftarTimMENA !== "undefined" ? daftarTimMENA : null,
        typeof daftarTimTR !== "undefined" ? daftarTimTR : null,
        typeof daftarTimEECA !== "undefined" ? daftarTimEECA : null,
        typeof daftarTimEA !== "undefined" ? daftarTimEA : null,
        typeof daftarTimAM !== "undefined" ? daftarTimAM : null,
        typeof daftarTimIN !== "undefined" ? daftarTimIN : null,
        typeof daftarTimWEU !== "undefined" ? daftarTimWEU : null,
        typeof daftarTimMDL_ID !== "undefined" ? daftarTimMDL_ID : null,
        typeof daftarTimLEN !== "undefined" ? daftarTimLEN : null,
        typeof daftarTimMDL_PH !== "undefined" ? daftarTimMDL_PH : null,
        typeof daftarTimMAL_Affiliated_MY !== "undefined" ? daftarTimMAL_Affiliated_MY : null,
        typeof daftarTimMAL_Challenger_MY !== "undefined" ? daftarTimMAL_Challenger_MY : null
    ];
    semuaRegionTim.forEach(region => {
        if (!region) return;
        region.forEach(tim => {
            tambahDariArray(tim.roster);
            // [FIX] Staff AI (pelatih/asisten/analis) belum ikut dicek --
            // tanpa ini, nickname staff yang lagi aktif kerja di tim AI
            // bisa ke-reuse buat individu baru (lolos dari uniqueness check).
            if (tim.staff) {
                tambahSatu(tim.staff.pelatih);
                tambahSatu(tim.staff.asisten);
                tambahSatu(tim.staff.analis);
            }
            if (tim.akademi) {
                tambahDariArray(tim.akademi.prospek);
            }
        });
    });

    // Kandidat yang lagi trial (biar gak ke-generate ganda pas Open
    // Recruitment/Akademi bikin kandidat baru berbarengan trial berjalan)
    if (typeof window.trialAktif !== "undefined" && Array.isArray(window.trialAktif)) {
        window.trialAktif.forEach(t => tambahSatu(t.pemain));
    }
    // Prospek akademi milik player yang belum di-promosikan
    // (akses via window.akademiKita, BUKAN identifier `akademiKita` langsung --
    // itu di-deklarasikan pakai `let` jauh di bawah di script.js, jadi kalau
    // fungsi ini kepanggil lebih awal, `typeof akademiKita` bisa throw TDZ error)
    if (typeof window.akademiKita !== "undefined" && window.akademiKita) {
        tambahDariArray(window.akademiKita.prospek);
    }

    return dipakai;
}

// Generate 1 nickname baru yang dijamin belum dipakai siapapun yang aktif.
// Dipakai bareng buat pemain MAUPUN staff (satu pool yang sama, sesuai spek).
function generateNicknameEsports() {
    let dipakai = semuaNicknameAktifSaatIni();
    let maxCoba = 500; // jaga-jaga, jauh di bawah kapasitas 2.500 kombinasi

    for (let i = 0; i < maxCoba; i++) {
        let prefix = NICKNAME_PREFIX[Math.floor(Math.random() * NICKNAME_PREFIX.length)];
        let suffix = NICKNAME_SUFFIX[Math.floor(Math.random() * NICKNAME_SUFFIX.length)];
        let nickname = prefix + suffix;
        if (!dipakai.has(nickname)) return nickname;
    }

    // Fallback ekstrem (praktis mustahil kejadian -- butuh 2.500 individu
    // aktif bersamaan). Tetep gak pakai angka/simbol, cuma terima resiko
    // duplikat drpd infinite loop.
    console.warn("generateNicknameEsports: pool nickname penuh, terpaksa duplikat.");
    return NICKNAME_PREFIX[Math.floor(Math.random() * NICKNAME_PREFIX.length)] +
           NICKNAME_SUFFIX[Math.floor(Math.random() * NICKNAME_SUFFIX.length)];
}
window.generateNicknameEsports = generateNicknameEsports;

// FUNGSI 1: UNTUK MENAMBAH PEMAIN & STAFF ACAK TIAP GANTI SEASON
function generatePemainDanStaffBaru(jumlahPemain = 10, jumlahStaff = 5) {
    const bankRolePemain = [
        "Roamer",
        "Jungler",
        "Midlaner",
        "Goldlaner",
        "EXP Laner"
    ];
    const bankSifat = ["Normal", "Pekerja Keras", "Malas"];
    const bankRoleStaff = ["Pelatih", "Asisten Pelatih", "Analis"];
    // Semua kode region yang ada di game -- dipakai buat nentuin bendera
    // pemain baru bursa transfer secara acak (lewat benderaAkademiUntukRegion,
    // yang otomatis nangenin region satu-negara vs region multi-negara).
    const bankKodeRegion = [
        "ID", "PH", "MY", "SG", "TR", "IN", "KH", "MM",
        "MENA", "EECA", "EA", "AM", "WEU"
    ];

    // 1. GENERAT PEMAIN BARU
    for (let i = 0; i < jumlahPemain; i++) {
        let namaAcak = generateNicknameEsports();
        let roleAcak =
            bankRolePemain[Math.floor(Math.random() * bankRolePemain.length)];
        let sifatAcak = bankSifat[Math.floor(Math.random() * bankSifat.length)];
        let negaraAcak = (typeof benderaAkademiUntukRegion === "function")
            ? benderaAkademiUntukRegion(bankKodeRegion[Math.floor(Math.random() * bankKodeRegion.length)])
            : "🇮🇩 Indonesia";

        let mekanik = Math.floor(Math.random() * 20) + 35;
        let makro = Math.floor(Math.random() * 20) + 35;
        let mental = Math.floor(Math.random() * 20) + 35;
        let spesialis = Math.floor(Math.random() * 20) + 35;
        let potensi = Math.floor(Math.random() * 25) + 70;

        let pemainBaru = {
            nama: namaAcak,
            role: roleAcak,
            sifat: sifatAcak,
            umur: Math.floor(Math.random() * 5) + 16,
            mekanik: mekanik,
            makro: makro,
            mental: mental,
            spesialis: spesialis,
            potensi: potensi,
            scouted: false,
            sisaKontrak: 2,
            negara: negaraAcak,
            karir: []
        };

        pemainBaru.ovr = Math.floor(
            (pemainBaru.mekanik +
                pemainBaru.makro +
                pemainBaru.mental +
                pemainBaru.spesialis) /
                4
        );
        pemainBaru.historyOvr = [pemainBaru.ovr];
        pemainBaru.gaji =
            pemainBaru.ovr * 60000 + Math.floor(Math.random() * 500000);
        pemainBaru.harga = Math.floor(pemainBaru.gaji * 1.8) + 5000000;

        pemainTransfer.push(pemainBaru);
    }

    // 2. GENERAT STAFF BARU
    for (let j = 0; j < jumlahStaff; j++) {
        let namaStaffAcak = generateNicknameEsports();
        let roleStaffAcak =
            bankRoleStaff[Math.floor(Math.random() * bankRoleStaff.length)];
        let buffPowerAcak = Math.floor(Math.random() * 4) + 1;

        let gajiStaff =
            buffPowerAcak * 3000000 + Math.floor(Math.random() * 2000000);
        let hargaStaff = gajiStaff * 1.2;

        // [FIX] Staff baru sebelumnya gak pernah dikasih field `negara` sama
        // sekali, jadi selalu jatuh ke fallback "🌐 Global" di mana pun
        // dibaca (tabel bursa, profil, dsb). Pakai generator region yang
        // sama kayak pemain biar konsisten & bervariasi.
        let negaraStaffAcak = (typeof benderaAkademiUntukRegion === "function")
            ? benderaAkademiUntukRegion(bankKodeRegion[Math.floor(Math.random() * bankKodeRegion.length)])
            : "🇮🇩 Indonesia";

        // --- TAMBAHAN NOMOR 1 MULAI DARI SINI ---
        const bankKepribadianPelatih = [
            "Ambisius",
            "Santai",
            "Muda",
            "Veteran"
        ];
        let kepribadianAcak =
            bankKepribadianPelatih[
                Math.floor(Math.random() * bankKepribadianPelatih.length)
            ];
        // --- BATAS TAMBAHAN ---

        let staffBaru = {
            nama: namaStaffAcak,
            role: roleStaffAcak,
            buffPower: buffPowerAcak,
            gaji: gajiStaff,
            harga: hargaStaff,
            umur: Math.floor(Math.random() * 20) + 25,
            negara: negaraStaffAcak,

            // --- TAMBAHAN NOMOR 1 DI DALAM OBJEK ---
            kepribadian: kepribadianAcak,
            ekspektasiGaji: gajiStaff // Gaji ini jadi patokan dasar (100%) ekspektasi pelatih
            // --- BATAS TAMBAHAN ---
        };

        bursaStaff.push(staffBaru);
    }
}

// FUNGSI 2: UNTUK MEMBERSIHKAN PEMAIN & STAFF TUA DARI BURSA (BERDIRI SENDIRI DI LUAR)
function bersihkanBursaTransfer(tahunBerganti) {
    // 1. Filter Pemain (Maksimal umur 34)
    let pemainSisa = [];
    pemainTransfer.forEach(p => {
        if (tahunBerganti) p.umur += 1;
        if (p.umur <= 34) {
            pemainSisa.push(p);
        }
    });
    pemainTransfer = pemainSisa;

    // 2. Filter Staff (Maksimal umur 50)
    let staffSisa = [];
    bursaStaff.forEach(s => {
        if (tahunBerganti && s.umur) s.umur += 1;
        if (!s.umur || s.umur <= 50) {
            staffSisa.push(s);
        }
    });
    bursaStaff = staffSisa;
}

// ==========================================
// --- TAMBAHAN NOMOR 3 & 4 MULAI DARI SINI ---
// ==========================================

// LAKAH 3: FUNGSI KALKULASI MINAT PELATIH
function evaluasiProposalPelatih(pelatih, proposal) {
    let ovrTim = getOvrRosterKita(); // Ngambil fungsi dari database.js
    let targetData = DATABASE_TARGET[proposal.target];

    // 1. KECOCOKAN GAJI (35%)
    let valuasiBonus = proposal.bonus / (proposal.durasi * 12);
    let skorGaji =
        ((proposal.gaji + valuasiBonus) / pelatih.ekspektasiGaji) * 100;

    // Pelatih Veteran sangat peduli pada gaji
    if (pelatih.kepribadian === "Veteran") skorGaji *= 1.2;

    // 2. KEKUATAN ROSTER (25%)
    let gapOvr = ovrTim - targetData.expOVR;
    let skorRoster = 100 + gapOvr * 2;

    // 3. KEREALISTISAN TARGET (20%)
    let skorTarget = 100;
    if (gapOvr < -5) {
        // Target terlalu tinggi untuk roster saat ini (Tidak Realistis)
        skorTarget = 50;
        if (pelatih.kepribadian === "Santai") skorTarget -= 30;
    } else if (gapOvr > 5) {
        skorTarget = 110;
    }

    // Pelatih Ambisius menyukai target sulit
    if (pelatih.kepribadian === "Ambisius" && targetData.bobot >= 4)
        skorTarget += 20;

    // 4. REPUTASI TIM (10%)
    let skorReputasi = Math.min(100, (reputasiManajer / 100) * 100);

    // 5. DURASI KONTRAK & JOB SECURITY (10%)
    let skorDurasi = 100;
    if (proposal.durasi === 1 && targetData.bobot >= 4) {
        skorDurasi = 40;
    } else if (proposal.durasi >= 3) {
        skorDurasi = 120;
    }

    // Pelatih Muda mencari keamanan karir jangka panjang
    if (pelatih.kepribadian === "Muda" && proposal.durasi >= 3)
        skorDurasi *= 1.3;

    // KALKULASI FINAL
    let totalMinat =
        skorGaji * 0.35 +
        skorRoster * 0.25 +
        skorTarget * 0.2 +
        skorReputasi * 0.1 +
        skorDurasi * 0.1;

    return Math.floor(totalMinat);
}

// LANGKAH 4: FUNGSI MEJA NEGOSIASI DAN RESPON PELATIH
function ajukanProposalPelatih(pelatih, proposal) {
    let minat = evaluasiProposalPelatih(pelatih, proposal);

    if (minat >= 90) {
        // DEAL LANGSUNG
        return {
            status: "DEAL",
            pesan: `🤝 Sempurna! Saya suka proyek ini. Saya terima tawaran Anda sebagai pelatih.`
        };
    } else if (minat >= 65 && minat < 90) {
        // COUNTER OFFER
        let counterGaji = Math.floor(proposal.gaji * 1.15); // AI Pelatih minta naik 15%
        let counterDurasi =
            pelatih.kepribadian === "Muda"
                ? Math.max(3, proposal.durasi + 1)
                : proposal.durasi;

        let pesanCounter = `Tawaran Anda cukup menarik, tapi saya butuh jaminan lebih. `;
        if (pelatih.kepribadian === "Ambisius") {
            pesanCounter += `Naikkan gaji saya menjadi Rp ${(counterGaji / 1000000).toFixed(1)} Jt/Bulan dan saya akan bawa tim ini juara!`;
        } else if (pelatih.kepribadian === "Santai") {
            pesanCounter += `Bisa kita turunkan targetnya satu tingkat, atau setidaknya perpanjang kontrak saya menjadi ${counterDurasi} musim?`;
        } else {
            pesanCounter += `Saya minta gaji dinaikkan menjadi Rp ${(counterGaji / 1000000).toFixed(1)} Jt.`;
        }

        return {
            status: "COUNTER",
            counterGaji: counterGaji,
            counterDurasi: counterDurasi,
            pesan: pesanCounter
        };
    } else {
        // REJECT (TOLAK MENTAH-MENTAH)
        return {
            status: "REJECT",
            pesan: `🚫 Maaf, target yang Anda minta tidak sebanding dengan kualitas roster dan kompensasi yang ditawarkan. Saya menolak proposal ini.`
        };
    }
}
// --- BATAS TAMBAHAN NOMOR 3 & 4 ---
