// ============================================================
// MATCH ENGINE v1.0 — MLBB PRO CIRCUIT MANAGER
// Di-load SETELAH mental_individual_patch.js
//
// SISTEM INI MENAMBAHKAN:
//   [1] HERO POOL — setiap pemain punya pool hero per role
//   [2] DRAFT BONUS — komposisi 5 role + staff drafting
//   [3] STRATEGI BONUS — analis baca lawan & counter
//   [4] META BONUS — apakah roster cocok meta musim ini
//   [5] INTERACTION PENALTY — lawan juga punya strategi
//
// FILOSOFI:
//   Ini sim MANAJER, bukan game engine MLBB.
//   Yang dihitung adalah keputusan level manajemen:
//     - Roster lengkap? (draft fleksibel)
//     - Staff berkualitas? (drafting, strategi, analisis)
//     - Tim dalam kondisi baik? (chemistry, mental)
//     - Cocok meta? (roster adaptif)
//   Bukan duel 1v1, bukan simulasi menit per menit.
//
// PATCH ORDER:
//   database.js → transfer.js → ui.js → script.js
//   → advanced_systems.js → akademi_v3.js → fanbase.js
//   → roster_ai_patch.js → mental_individual_patch.js
//   → [match_engine.js] ← FILE INI
// ============================================================

console.log("Match Engine v1.0 — loading...");

// ============================================================
// [1] HERO POOL PER ROLE
// Dikurasi dari MLBB_Complete_Data.xlsx
// Hanya: nama, difficulty (1-10), specialty (flavor)
// ============================================================
const HERO_POOL = {
    Goldlaner: [
        { nama: "Wanwan",         diff: 7,  specialty: "Mobility/Burst"      },
        { nama: "Granger",        diff: 6,  specialty: "Burst/Poke"          },
        { nama: "Beatrix",        diff: 8,  specialty: "Burst/Poke"          },
        { nama: "Karrie",         diff: 6,  specialty: "Carry/Burst"         },
        { nama: "Brody",          diff: 5,  specialty: "Burst/Long-range"    },
        { nama: "Miya",           diff: 1,  specialty: "Finisher/Damage"     },
        { nama: "Layla",          diff: 1,  specialty: "Long-range/Damage"   },
        { nama: "Bruno",          diff: 3,  specialty: "Damage/Burst"        },
        { nama: "Clint",          diff: 3,  specialty: "Poke/Burst"          },
        { nama: "Lesley",         diff: 5,  specialty: "Burst/Long-range"    },
        { nama: "Moskov",         diff: 5,  specialty: "Damage/CC"           },
        { nama: "Hanabi",         diff: 4,  specialty: "CC/Damage"           },
        { nama: "Popol & Kupa",   diff: 6,  specialty: "CC/Damage"           },
        { nama: "Irithel",        diff: 5,  specialty: "Damage/Mobility"     },
        { nama: "Kimmy",          diff: 7,  specialty: "Damage/Mobility"     },
        { nama: "Natan",          diff: 7,  specialty: "Damage/Mobility"     },
        { nama: "Melissa",        diff: 5,  specialty: "Damage/Guard"        },
        { nama: "Ixia",           diff: 4,  specialty: "Poke/Damage"         },
        { nama: "Obsidia",        diff: 5,  specialty: "Damage/Poke"         },
        { nama: "Yi Sun-shin",    diff: 7,  specialty: "Global/Burst"        },
        { nama: "Edith",          diff: 6,  specialty: "CC/Damage"           }
    ],
    Jungler: [
        { nama: "Fanny",          diff: 10, specialty: "Mobility/Burst"      },
        { nama: "Ling",           diff: 9,  specialty: "Mobility/Burst"      },
        { nama: "Gusion",         diff: 9,  specialty: "Burst/Mobility"      },
        { nama: "Lancelot",       diff: 8,  specialty: "Burst/Mobility"      },
        { nama: "Hayabusa",       diff: 8,  specialty: "Burst/Mobility"      },
        { nama: "Benedetta",      diff: 8,  specialty: "Mobility/Burst"      },
        { nama: "Joy",            diff: 8,  specialty: "Mobility/Burst"      },
        { nama: "Nolan",          diff: 8,  specialty: "Burst/Combo"         },
        { nama: "Suyou",          diff: 8,  specialty: "Burst/Mobility"      },
        { nama: "Saber",          diff: 4,  specialty: "Burst/Chase"         },
        { nama: "Karina",         diff: 3,  specialty: "Burst/Finisher"      },
        { nama: "Helcurt",        diff: 7,  specialty: "Burst/Silence"       },
        { nama: "Natalia",        diff: 7,  specialty: "Stealth/Burst"       },
        { nama: "Hanzo",          diff: 7,  specialty: "Mobility/Burst"      },
        { nama: "Selena",         diff: 8,  specialty: "Burst/CC"            },
        { nama: "Kadita",         diff: 7,  specialty: "Burst/Regen"         },
        { nama: "Harley",         diff: 6,  specialty: "Burst/Mobility"      },
        { nama: "Zilong",         diff: 2,  specialty: "Chase/Damage"        },
        { nama: "Alucard",        diff: 2,  specialty: "Regen/Chase"         },
        { nama: "Chou",           diff: 8,  specialty: "Mobility/CC"         },
        { nama: "Lapu-Lapu",      diff: 5,  specialty: "Burst/Damage"        }
    ],
    Midlaner: [
        { nama: "Kagura",         diff: 8,  specialty: "Burst/Mobility"      },
        { nama: "Lunox",          diff: 7,  specialty: "Burst/Sustain"       },
        { nama: "Harith",         diff: 7,  specialty: "Burst/Mobility"      },
        { nama: "Valentina",      diff: 7,  specialty: "Copy/Burst"          },
        { nama: "Yve",            diff: 5,  specialty: "Poke/CC"             },
        { nama: "Xavier",         diff: 5,  specialty: "Poke/Long-range"     },
        { nama: "Novaria",        diff: 6,  specialty: "Burst/Slow"          },
        { nama: "Cecilion",       diff: 5,  specialty: "Burst/Poke"          },
        { nama: "Chang'e",        diff: 3,  specialty: "Burst/Chase"         },
        { nama: "Eudora",         diff: 2,  specialty: "Burst/CC"            },
        { nama: "Aurora",         diff: 4,  specialty: "Burst/CC"            },
        { nama: "Odette",         diff: 4,  specialty: "Burst/CC"            },
        { nama: "Vexana",         diff: 4,  specialty: "CC/Burst"            },
        { nama: "Luo Yi",         diff: 6,  specialty: "CC/Teleport"         },
        { nama: "Vale",           diff: 5,  specialty: "Burst/CC"            },
        { nama: "Zhask",          diff: 5,  specialty: "Poke/Burst"          },
        { nama: "Lylia",          diff: 6,  specialty: "Burst/Mobility"      },
        { nama: "Pharsa",         diff: 4,  specialty: "Burst/Poke"          },
        { nama: "Gord",           diff: 3,  specialty: "Poke/Damage"         },
        { nama: "Zhuxin",         diff: 6,  specialty: "CC/Burst"            },
        { nama: "Zetian",         diff: 6,  specialty: "CC/Burst"            }
    ],
    "EXP Laner": [
        { nama: "Paquito",        diff: 7,  specialty: "Burst/Damage"        },
        { nama: "Yu Zhong",       diff: 5,  specialty: "Regen/Damage"        },
        { nama: "Cici",           diff: 5,  specialty: "Chase/Damage"        },
        { nama: "Arlott",         diff: 6,  specialty: "Chase/Burst"         },
        { nama: "Sora",           diff: 7,  specialty: "Mobility/Burst"      },
        { nama: "Lukas",          diff: 5,  specialty: "Damage/Sustain"      },
        { nama: "Haya",           diff: 4,  specialty: "Regen/Chase"         },
        { nama: "Julian",         diff: 8,  specialty: "Burst/Combo"         },
        { nama: "Fredrinn",       diff: 5,  specialty: "CC/Burst"            },
        { nama: "Yin",            diff: 6,  specialty: "Burst/Duel"          },
        { nama: "Aulus",          diff: 3,  specialty: "Damage/Sustain"      },
        { nama: "Ruby",           diff: 4,  specialty: "CC/Regen"            },
        { nama: "Aldous",         diff: 5,  specialty: "Damage/Chase"        },
        { nama: "Masha",          diff: 4,  specialty: "Damage/Sustain"      },
        { nama: "Terizla",        diff: 4,  specialty: "CC/Damage"           },
        { nama: "Badang",         diff: 5,  specialty: "CC/Burst"            },
        { nama: "Dyrroth",        diff: 5,  specialty: "Damage/Chase"        },
        { nama: "Martis",         diff: 5,  specialty: "CC/Chase"            },
        { nama: "X.Borg",         diff: 5,  specialty: "Regen/Burst"         },
        { nama: "Khaleed",        diff: 4,  specialty: "Regen/CC"            },
        { nama: "Freya",          diff: 3,  specialty: "Damage/CC"           }
    ],
    Roamer: [
        { nama: "Khufra",         diff: 7,  specialty: "CC/Initiator"        },
        { nama: "Atlas",          diff: 7,  specialty: "CC/Initiator"        },
        { nama: "Franco",         diff: 7,  specialty: "CC/Initiator"        },
        { nama: "Tigreal",        diff: 2,  specialty: "CC/Initiator"        },
        { nama: "Akai",           diff: 3,  specialty: "CC/Initiator"        },
        { nama: "Lolita",         diff: 6,  specialty: "CC/Guard"            },
        { nama: "Grock",          diff: 6,  specialty: "Guard/CC"            },
        { nama: "Hylos",          diff: 4,  specialty: "CC/Regen"            },
        { nama: "Belerick",       diff: 5,  specialty: "CC/Guard"            },
        { nama: "Baxia",          diff: 6,  specialty: "CC/Chase"            },
        { nama: "Barats",         diff: 5,  specialty: "CC/Guard"            },
        { nama: "Gloo",           diff: 5,  specialty: "CC/Guard"            },
        { nama: "Johnson",        diff: 6,  specialty: "Initiator/CC"        },
        { nama: "Gatotkaca",      diff: 5,  specialty: "CC/Regen"            },
        { nama: "Esmeralda",      diff: 6,  specialty: "Shield/Regen"        },
        { nama: "Angela",         diff: 5,  specialty: "Heal/Shield"         },
        { nama: "Estes",          diff: 4,  specialty: "Heal/Poke"           },
        { nama: "Mathilda",       diff: 7,  specialty: "Mobility/CC"         },
        { nama: "Floryn",         diff: 4,  specialty: "Heal/Poke"           },
        { nama: "Chip",           diff: 6,  specialty: "CC/Teleport"         },
        { nama: "Kalea",          diff: 6,  specialty: "CC/Guard"            },
        { nama: "Marcel",         diff: 5,  specialty: "Heal/Utility"        },
        { nama: "Rafaela",        diff: 2,  specialty: "Heal/CC"             },
        { nama: "Diggie",         diff: 7,  specialty: "CC Counter"          },
        { nama: "Carmilla",       diff: 6,  specialty: "Guard/CC"            }
    ]
};

// Expose ke window agar bisa dipakai file lain (animasi, UI, dll)
window.HERO_POOL = HERO_POOL;

// ============================================================
// FUNGSI HELPER: Ambil hero pool pemain berdasarkan role
// Kalau pemain belum punya heroPool, assign otomatis
// ============================================================
function getHeroPoolPemain(pemain) {
    if (pemain.heroPool && pemain.heroPool.length > 0) return pemain.heroPool;

    // Auto-assign berdasarkan role
    let role = pemain.role || "Midlaner";
    let pool = HERO_POOL[role] || HERO_POOL["Midlaner"];

    // Ambil hero sesuai OVR pemain:
    // OVR tinggi → bisa main hero diff tinggi
    // OVR rendah → cenderung ke hero lebih mudah
    let ovrFaktor = (pemain.ovr || 70) / 100;
    let kandidat = pool.filter(h => h.diff <= Math.ceil(ovrFaktor * 10));
    if (kandidat.length < 3) kandidat = pool.slice(0, 5); // fallback

    // Simpan ke pemain supaya konsisten tiap match
    pemain.heroPool = kandidat.map(h => h.nama);
    return pemain.heroPool;
}
window.getHeroPoolPemain = getHeroPoolPemain;

// ============================================================
// [2] DRAFT BONUS
// Dihitung berdasarkan:
//   - Apakah 5 role starter terisi lengkap?
//   - Seberapa bagus staff.pelatih.drafting?
//   - Komposisi hero (high-diff = potensi lebih besar tapi riskier)
// ============================================================

// 5 role wajib di MLBB kompetitif
const ROLE_WAJIB = ["Goldlaner", "Jungler", "Midlaner", "EXP Laner", "Roamer"];

function hitungDraftBonus(starters, staffObj) {
    let bonus = 0;

    // --- A. ROLE BALANCE CHECK ---
    // Setiap role wajib yang ada di starter = +0.5
    // Role kosong = -1.5 (penalti besar, tidak bisa draft fleksibel)
    let roleAda = starters.map(p => p.role || "");
    ROLE_WAJIB.forEach(role => {
        if (roleAda.includes(role)) {
            bonus += 0.5; // max +2.5 kalau semua role ada
        } else {
            bonus -= 1.5; // penalti besar kalau ada role kosong
        }
    });

    // --- B. STAFF DRAFTING BONUS ---
    // pelatih.atribut.drafting (60-95) → bonus 0 sampai +2
    let draftingVal = 0;
    if (staffObj && staffObj.pelatih && staffObj.pelatih.atribut) {
        draftingVal = staffObj.pelatih.atribut.drafting || 0;
    }
    // Skala: drafting 60 = +0, drafting 95 = +2
    bonus += Math.max(0, (draftingVal - 60) / 35) * 2;

    // --- C. HERO POOL DIVERSITY ---
    // Pemain yang bisa main hero diff tinggi = lebih fleksibel drafting
    // Rata-rata max difficulty hero pool starter
    let totalMaxDiff = 0;
    starters.forEach(p => {
        let pool = getHeroPoolPemain(p);
        let role = p.role || "Midlaner";
        let heroData = (HERO_POOL[role] || []).filter(h => pool.includes(h.nama));
        let maxDiff = heroData.length > 0
            ? Math.max(...heroData.map(h => h.diff))
            : 5;
        totalMaxDiff += maxDiff;
    });
    let avgMaxDiff = starters.length > 0 ? totalMaxDiff / starters.length : 5;

    // High-diff hero pool: potensi lebih besar, tapi ada variance
    // Rata diff ≥ 7 → bonus +1, tapi dikurangi sedikit RNG (high skill = high variance)
    if (avgMaxDiff >= 8) {
        bonus += 1.0;
        // High variance: pemain jenius bisa blunder juga
        bonus += (Math.random() - 0.5) * 0.5;
    } else if (avgMaxDiff >= 6) {
        bonus += 0.5;
    } else {
        // Pool hero mudah = stabil, tidak ada penalti tapi tidak ada bonus besar
        bonus += 0.2;
    }

    return bonus;
}
window.hitungDraftBonus = hitungDraftBonus;

// ============================================================
// [3] STRATEGI BONUS
// Dihitung berdasarkan atribut analis:
//   - oppAnalysis  → baca rotasi & habit lawan
//   - strategy     → macro call & objektif timing
//   - metaReading  → apakah paham meta saat ini
// Dikurangi "counter effect" dari lawan (kalau lawan juga kuat)
// ============================================================
function hitungStrategiBonus(staffObj, staffLawan) {
    let bonus = 0;

    // Nilai analis tim sendiri
    let oppAnalysis  = 0;
    let strategy     = 0;
    let metaReading  = 0;
    if (staffObj && staffObj.analis && staffObj.analis.atribut) {
        oppAnalysis = staffObj.analis.atribut.oppAnalysis  || 0;
        strategy    = staffObj.analis.atribut.strategy     || 0;
        metaReading = staffObj.analis.atribut.metaReading  || 0;
    }

    // Konversi ke bonus: baseline 70, max ~95
    // Tiap 5 poin di atas 70 = +0.2 bonus (max sekitar +2 total per atribut)
    bonus += Math.max(0, (oppAnalysis - 70) / 5)  * 0.2; // max +1.0
    bonus += Math.max(0, (strategy    - 70) / 5)  * 0.2; // max +1.0
    bonus += Math.max(0, (metaReading - 70) / 5)  * 0.15; // max +0.75

    // --- COUNTER EFFECT LAWAN ---
    // Kalau lawan juga punya analis kuat, sebagian strategi kita terbaca
    // Ini mencerminkan "opponent reads your draft" di MPL beneran
    let oppOppAnalysis = 0;
    if (staffLawan && staffLawan.analis && staffLawan.analis.atribut) {
        oppOppAnalysis = staffLawan.analis.atribut.oppAnalysis || 0;
    }
    // Lawan yang kuat mengikis sebagian bonus strategi kita
    let counterPenalti = Math.max(0, (oppOppAnalysis - 70) / 5) * 0.1; // max -0.5
    bonus -= counterPenalti;

    return bonus;
}
window.hitungStrategiBonus = hitungStrategiBonus;

// ============================================================
// [4] META BONUS
// Tiap musim ada "meta" yang aktif — roster yang cocok dapat bonus
// Meta di-generate random tiap musim baru dan tersimpan di state
// ============================================================

// Meta yang tersedia — nama + role yang mendapat boost
const DAFTAR_META = [
    {
        nama: "Early Aggression",
        desc: "Jungle early pressure & fast objective control mendominasi.",
        roleBoost: ["Jungler", "Roamer"],
        roleNerf:  ["Goldlaner"],
        icon: "⚡"
    },
    {
        nama: "Protect The Carry",
        desc: "Komposisi double support untuk menjaga Goldlaner late-game.",
        roleBoost: ["Goldlaner", "Roamer"],
        roleNerf:  ["Jungler"],
        icon: "🛡️"
    },
    {
        nama: "Mid Lane Dominance",
        desc: "Midlaner hyper-carry menentukan arah game dari menit pertama.",
        roleBoost: ["Midlaner", "Jungler"],
        roleNerf:  ["EXP Laner"],
        icon: "🔮"
    },
    {
        nama: "Turtle Control",
        desc: "Objektif turtle & vision control jadi kunci kemenangan.",
        roleBoost: ["Roamer", "EXP Laner"],
        roleNerf:  ["Midlaner"],
        icon: "🐢"
    },
    {
        nama: "Split Push",
        desc: "Tekanan 1-3-1 dan split push memecah formasi lawan.",
        roleBoost: ["EXP Laner", "Goldlaner"],
        roleNerf:  ["Roamer"],
        icon: "↔️"
    },
    {
        nama: "Teamfight Comp",
        desc: "Komposisi AoE dan CC chain untuk teamfight massal.",
        roleBoost: ["Midlaner", "Roamer"],
        roleNerf:  ["Jungler"],
        icon: "⚔️"
    }
];

// Meta aktif saat ini — diganti tiap musim
if (typeof window.metaAktif === "undefined") {
    window.metaAktif = DAFTAR_META[Math.floor(Math.random() * DAFTAR_META.length)];
}

// Fungsi untuk ganti meta (dipanggil tiap awal musim baru)
window.gantiMetaMusim = function() {
    let metaLama = window.metaAktif;
    // Tidak boleh meta yang sama 2 musim berturut-turut
    let pilihan = DAFTAR_META.filter(m => m.nama !== (metaLama ? metaLama.nama : ""));
    window.metaAktif = pilihan[Math.floor(Math.random() * pilihan.length)];

    if (typeof tambahBerita === "function") {
        tambahBerita(
            `${window.metaAktif.icon} <b>META Baru Musim INI:</b> <span>${window.metaAktif.nama}</span> — ${window.metaAktif.desc}`
        );
    }
    return window.metaAktif;
};

function hitungMetaBonus(starters, staffObj) {
    let bonus = 0;
    let meta = window.metaAktif;
    if (!meta) return 0;

    // Hitung berapa starter yang role-nya sesuai meta
    let cocok = 0;
    let tidakCocok = 0;
    starters.forEach(p => {
        let role = p.role || "";
        if (meta.roleBoost.includes(role)) cocok++;
        if (meta.roleNerf.includes(role))  tidakCocok++;
    });

    // Setiap role yang cocok meta = +0.4
    bonus += cocok * 0.4;
    // Setiap role yang kena nerf meta = -0.3
    bonus -= tidakCocok * 0.3;

    // --- META READING BONUS ---
    // Analis dengan metaReading tinggi = tim lebih adaptif ke meta
    // Mereka "nerf" penalty berkurang & boost bonus naik
    let metaReadingVal = 0;
    if (staffObj && staffObj.analis && staffObj.analis.atribut) {
        metaReadingVal = staffObj.analis.atribut.metaReading || 0;
    }

    // metaReading > 80: bisa "read meta" — penalty dikurangi setengah
    if (metaReadingVal >= 80) {
        bonus += tidakCocok * 0.15; // recover sebagian penalti
        bonus += 0.5;               // bonus adaptasi meta
    } else if (metaReadingVal >= 70) {
        bonus += tidakCocok * 0.08;
        bonus += 0.2;
    }
    // metaReading rendah = stuck di meta lama, tidak dapat recovery

    return bonus;
}
window.hitungMetaBonus = hitungMetaBonus;

// ============================================================
// [5] PATCH hitungPerformaMatch — INJECT SEMUA BONUS
// Polanya sama dengan advanced_systems.js dan mental_individual_patch.js
// ============================================================

(function() {
    var _origPerforma = window.hitungPerformaMatch;
    if (typeof _origPerforma !== "function") {
        console.warn("Match Engine: hitungPerformaMatch tidak ditemukan!");
        return;
    }

    window.hitungPerformaMatch = function(timObj) {
        // Jalankan semua patch sebelumnya dulu (mental, streak, chemistry, fanbase)
        var base = _origPerforma(timObj);

        var isTimKita = (typeof timPlayer !== "undefined") && timObj.nama === timPlayer;

        // Ambil starter 5
        var roster  = isTimKita ? (typeof rosterKita !== "undefined" ? rosterKita : []) : (timObj.roster || []);
        var starters = isTimKita
            ? roster.filter(function(p) { return p.isStarter; })
            : [...roster].sort(function(a, b) { return (b.ovr || 0) - (a.ovr || 0); }).slice(0, 5);

        if (starters.length < 5) {
            starters = [...roster].sort(function(a, b) { return (b.ovr || 0) - (a.ovr || 0); }).slice(0, 5);
        }

        // Staff yang dipakai
        var staffObj = isTimKita
            ? (typeof staffKita !== "undefined" ? staffKita : {})
            : (timObj.staff || {});

        // Cari staff lawan (untuk counter-effect strategi)
        // Lawan tidak diketahui di sini karena hitungPerformaMatch hanya terima 1 tim,
        // jadi staff lawan kita estimasi dari rata-rata atribut analis di bursa (nilai netral ~70)
        // Ini bisa di-refine lebih lanjut kalau simulasikanSeries diupdate
        var staffLawan = null; // akan di-handle di level simulasikanSeries

        // Hitung bonus tambahan
        var draftBonus    = hitungDraftBonus(starters, staffObj);
        var strategiBonus = hitungStrategiBonus(staffObj, staffLawan);
        var metaBonus     = hitungMetaBonus(starters, staffObj);

        // Gabungkan — bobot lebih kecil dari faktor utama (OVR 75%, staff 20%)
        // Draft + Strategi + Meta: total max sekitar ±5 poin
        var totalBonus = draftBonus + strategiBonus + metaBonus;

        return base + totalBonus;
    };

    console.log("Match Engine: hitungPerformaMatch di-patch — Draft, Strategi & Meta bonus aktif.");
})();

// ============================================================
// [6] PATCH simulasikanSeries — COUNTER-EFFECT ANTAR TIM
// Di sini kita tahu KEDUA tim, jadi bisa hitung counter yang benar
// ============================================================

(function() {
    var _origSeries = window.simulasikanSeries;
    if (typeof _origSeries !== "function") {
        console.warn("Match Engine: simulasikanSeries tidak ditemukan!");
        return;
    }

    window.simulasikanSeries = function(timA, timB, formatBO) {
        // Simpan staff lawan ke window sementara untuk dipakai hitungPerformaMatch
        // (workaround karena hitungPerformaMatch hanya terima 1 argumen)
        window._matchEngineStaffLawanA = timB.staff || {};
        window._matchEngineStaffLawanB = timA.staff || {};

        var hasil = _origSeries(timA, timB, formatBO);

        // Bersihkan
        delete window._matchEngineStaffLawanA;
        delete window._matchEngineStaffLawanB;

        return hasil;
    };
})();

// Patch strategiBonus agar bisa ambil staff lawan dari window sementara
(function() {
    var _origStrategi = window.hitungStrategiBonus;
    window.hitungStrategiBonus = function(staffObj, staffLawan) {
        // Kalau tidak ada staffLawan eksplisit, coba ambil dari window sementara
        if (!staffLawan) {
            staffLawan = window._matchEngineStaffLawanA || window._matchEngineStaffLawanB || null;
        }
        return _origStrategi(staffObj, staffLawan);
    };
})();

// ============================================================
// [7] HOOK MUSIM BARU — Ganti meta tiap season
// Di game ini musim baru ditandai dengan prosesSponsorMusimAI()
// dipanggil, atau bisa dipicu manual lewat window.gantiMetaMusim()
// ============================================================
(function() {
    // Hook prosesSponsorMusimAI — dipanggil di awal tiap musim baru
    var _origSponsorMusim = window.prosesSponsorMusimAI;
    if (typeof _origSponsorMusim === "function") {
        window.prosesSponsorMusimAI = function() {
            _origSponsorMusim.apply(this, arguments);
            window.gantiMetaMusim();
        };
        console.log("Match Engine: prosesSponsorMusimAI di-hook — meta ganti tiap season.");
    } else {
        console.warn("Match Engine: prosesSponsorMusimAI tidak ditemukan — panggil window.gantiMetaMusim() manual tiap musim baru.");
    }
})();

// ============================================================
// [8] FUNGSI UTILITAS PUBLIK
// Dipakai oleh animasi simulasi (match_simulation.js nanti)
// ============================================================

// Ambil hero yang akan di-"pick" untuk highlight/animasi
// Dipilih dari heroPool pemain, prioritas yang diff-nya cocok OVR
window.pickHeroUntukMatch = function(pemain) {
    let pool = getHeroPoolPemain(pemain);
    let role = pemain.role || "Midlaner";
    let heroData = (HERO_POOL[role] || []).filter(h => pool.includes(h.nama));
    if (!heroData.length) return { nama: pemain.nama, diff: 5, specialty: "Damage" };

    // OVR tinggi → lebih sering pick hero sulit (potensi lebih besar)
    let ovr = pemain.ovr || 70;
    let kandidat = ovr >= 85
        ? heroData.filter(h => h.diff >= 7)
        : ovr >= 75
            ? heroData.filter(h => h.diff >= 5)
            : heroData.filter(h => h.diff <= 6);
    if (!kandidat.length) kandidat = heroData;

    return kandidat[Math.floor(Math.random() * kandidat.length)];
};

// Expose info meta aktif untuk UI
window.getMetaAktif = function() {
    return window.metaAktif || DAFTAR_META[0];
};

// Expose draft info untuk debug/UI
window.getDraftInfo = function(starters, staffObj) {
    let roleAda    = starters.map(p => p.role || "");
    let roleLengkap = ROLE_WAJIB.every(r => roleAda.includes(r));
    let draftBonus  = hitungDraftBonus(starters, staffObj);
    let metaBonus   = hitungMetaBonus(starters, staffObj);
    return {
        roleLengkap,
        roleKosong: ROLE_WAJIB.filter(r => !roleAda.includes(r)),
        draftBonus: draftBonus.toFixed(2),
        metaBonus: metaBonus.toFixed(2),
        metaAktif: window.metaAktif
    };
};

console.log("Match Engine v1.0 loaded ✅");
console.log("  → Hero Pool: " + Object.keys(HERO_POOL).map(r => r + " (" + HERO_POOL[r].length + ")").join(", "));
console.log("  → Meta Aktif: " + (window.metaAktif ? window.metaAktif.icon + " " + window.metaAktif.nama : "-"));
