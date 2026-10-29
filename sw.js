// ==========================================
// [NEW] SERVICE WORKER — cache offline buat seluruh file game.
// Root cause "Anda sedang Offline": WebView APK nyoba fetch ulang file
// dari internet tiap kali dibuka, dan begitu koneksi goyah sedetik aja,
// nampilin halaman offline bawaan Android alih-alih lanjut main pake file
// yang udah pernah ke-load. Game ini 100% jalan di sisi HP (gak butuh
// internet buat main, cuma pas load awal) -- jadi Service Worker paling
// pas buat kasus ini.
//
// Strategi: "stale-while-revalidate" -- selalu balikin dari cache DULU
// (instan, jalan walau offline), TAPI sekalian fetch ulang di background
// kalau ada koneksi buat update cache-nya (jadi update game/patch tetep
// kepasang begitu online lagi, gak nyangkut selamanya di versi lama).
// ==========================================

const CACHE_NAME = "mlbb-manager-cache-v4";

const ASSETS_TO_CACHE = [
    "./",
    "index.html",
    "style.css",
    "ui_patches.css",
    "settings_theme.css",
    "settings_patch.js",
    "lang_en.js",
    "lang_en_dyn.js",
    "lang_patch.js",
    "ai_sponsor_economy_patch.js",
    "akademi_v3.js",
    "calendar_system_patch.js",
    "close_score_patch.js",
    "custom_select_patch.js",
    "database.js",
    "global_power_ranking.js",
    "loan_buyoption_patch.js",
    "m7_engine.js",
    "match_engine.js",
    "mdl_len_engine.js",
    "merchandise_system_v3_patch.js",
    "meta_display_patch.js",
    "msc_ewc_engine.js",
    "msc_prize_patch.js",
    "patches_financial.js",
    "patches_postgame.js",
    "patches_roster.js",
    "script.js",
    "sponsor_negotiation_patch.js",
    "sponsor_pool_expansion_patch.js",
    "staff_trofi_patch.js",
    "transfer.js",
    "trial_system_patch.js",
    "ui.js",
    "ui_patches.js",
    "https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Barlow+Condensed:wght@400;600;700;900&display=swap",
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
];

self.addEventListener("install", (event) => {
    self.skipWaiting(); // langsung aktif, gak nunggu tab lama ketutup
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // [FIX] cache.addAll() bakal gagal TOTAL kalau SATU AJA url
            // gagal di-fetch (misal CDN font lagi down) -- pake
            // Promise.all + .catch per-url biar 1 kegagalan gak
            // ngeblok semua file game yang lain ke-cache.
            return Promise.all(
                ASSETS_TO_CACHE.map((url) =>
                    cache.add(url).catch((err) => {
                        console.error("[SW] Gagal cache:", url, err);
                    })
                )
            );
        })
    );
});

self.addEventListener("activate", (event) => {
    // Bersihin cache versi lama kalau ada (jaga-jaga CACHE_NAME di-bump nanti)
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    // Cuma tangani request GET (POST/dll biarin lewat normal)
    if (event.request.method !== "GET") return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            let fetchDanUpdateCache = fetch(event.request)
                .then((networkResp) => {
                    if (networkResp && networkResp.status === 200) {
                        let responseClone = networkResp.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
                    }
                    return networkResp;
                })
                .catch(() => cached); // network gagal (offline) -- pake cache lama aja, gak masalah

            // Ada di cache -> langsung balikin itu (instan), update cache
            // di background. Belum ada di cache -> tunggu hasil network
            // (atau gagal total kalau offline & belum pernah kebuka).
            return cached || fetchDanUpdateCache;
        })
    );
});
