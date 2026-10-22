// ==========================================================================
// SPONSOR_POOL_EXPANSION_PATCH.JS
// Nambahin 91 sponsor baru ke pool daftarSponsor -- biar variasi tawaran
// (baik buat player lewat sponsor_negotiation_patch.js, maupun buat AI
// lewat ai_sponsor_economy_patch.js) gak monoton ngulang itu-itu aja.
//
// Distribusi penambahan (kesepakatan): DARK+2, S+28, A+23, B+19, C+19
// Total pool naik dari 10 jadi 101 sponsor.
//
// Nominal per tier didistribusikan (bukan flat) dalam rentang yang sesuai
// tier aslinya, biar tetep ada variasi di dalam satu tier juga:
//   DARK  : bayar 350jt-900jt, minimalPower/Reputasi 0, kpi NONE
//   S     : bayar 150-280jt, minimalPower 76-90, minimalReputasi 78-96,
//           kpi campuran GRAND_FINAL/JUARA_MPL/TOP_4
//   A     : bayar 60-120jt, minimalPower 60-75, minimalReputasi 45-65,
//           kpi campuran LOLOS_PLAYOFF/TOP_4/NONE
//   B     : bayar 25-50jt, minimalPower 45-58, minimalReputasi 25-40,
//           kpi mayoritas NONE (sedikit LOLOS_PLAYOFF)
//   C     : bayar 8-20jt, minimalPower/Reputasi 0, kpi NONE
//
// Cara kerja: daftarSponsor itu array yang di-declare pakai "let" di
// database.js -- reference array-nya bisa langsung di-push dari file
// terpisah ini (gak perlu edit database.js sama sekali), karena semua
// script classic di halaman yang sama berbagi environment global yang
// sama buat top-level let/const.
// ==========================================================================

(function () {

if (typeof daftarSponsor === "undefined") {
    console.warn("Sponsor Pool Expansion Patch: daftarSponsor belum kebentuk, dibatalkan.");
    return;
}

const SPONSOR_BARU = [
    { nama: "Investasi Bodong Sejahtera", bayar: 350000000, bonusJuara: 0, minimalPower: 0, minimalReputasi: 0, tier: "DARK", kpi: "NONE" },
    { nama: "Kartel Skin Ilegal", bayar: 900000000, bonusJuara: 0, minimalPower: 0, minimalReputasi: 0, tier: "DARK", kpi: "NONE" },
    { nama: "Alienware", bayar: 250000000, bonusJuara: 125000000, minimalPower: 77, minimalReputasi: 78, tier: "S", kpi: "JUARA_MPL" },
    { nama: "Razer", bayar: 185000000, bonusJuara: 92500000, minimalPower: 79, minimalReputasi: 82, tier: "S", kpi: "GRAND_FINAL" },
    { nama: "Logitech G", bayar: 255000000, bonusJuara: 102000000, minimalPower: 87, minimalReputasi: 95, tier: "S", kpi: "TOP_4" },
    { nama: "NVIDIA GeForce", bayar: 155000000, bonusJuara: 62000000, minimalPower: 76, minimalReputasi: 80, tier: "S", kpi: "GRAND_FINAL" },
    { nama: "ASUS ROG", bayar: 230000000, bonusJuara: 115000000, minimalPower: 85, minimalReputasi: 78, tier: "S", kpi: "GRAND_FINAL" },
    { nama: "MSI Gaming", bayar: 260000000, bonusJuara: 117000000, minimalPower: 86, minimalReputasi: 95, tier: "S", kpi: "GRAND_FINAL" },
    { nama: "HyperX", bayar: 220000000, bonusJuara: 88000000, minimalPower: 85, minimalReputasi: 86, tier: "S", kpi: "GRAND_FINAL" },
    { nama: "SteelSeries", bayar: 260000000, bonusJuara: 117000000, minimalPower: 82, minimalReputasi: 88, tier: "S", kpi: "GRAND_FINAL" },
    { nama: "Monster Energy", bayar: 180000000, bonusJuara: 72000000, minimalPower: 88, minimalReputasi: 88, tier: "S", kpi: "GRAND_FINAL" },
    { nama: "Coca-Cola", bayar: 210000000, bonusJuara: 94500000, minimalPower: 77, minimalReputasi: 89, tier: "S", kpi: "JUARA_MPL" },
    { nama: "Samsung Galaxy", bayar: 275000000, bonusJuara: 137500000, minimalPower: 76, minimalReputasi: 92, tier: "S", kpi: "GRAND_FINAL" },
    { nama: "OPPO", bayar: 210000000, bonusJuara: 94500000, minimalPower: 77, minimalReputasi: 95, tier: "S", kpi: "JUARA_MPL" },
    { nama: "Vivo", bayar: 240000000, bonusJuara: 96000000, minimalPower: 79, minimalReputasi: 80, tier: "S", kpi: "GRAND_FINAL" },
    { nama: "Xiaomi", bayar: 270000000, bonusJuara: 108000000, minimalPower: 80, minimalReputasi: 80, tier: "S", kpi: "GRAND_FINAL" },
    { nama: "Garuda Indonesia", bayar: 210000000, bonusJuara: 105000000, minimalPower: 80, minimalReputasi: 92, tier: "S", kpi: "JUARA_MPL" },
    { nama: "Bank Mandiri", bayar: 175000000, bonusJuara: 70000000, minimalPower: 81, minimalReputasi: 89, tier: "S", kpi: "JUARA_MPL" },
    { nama: "BCA", bayar: 260000000, bonusJuara: 130000000, minimalPower: 90, minimalReputasi: 80, tier: "S", kpi: "GRAND_FINAL" },
    { nama: "Telkomsel", bayar: 235000000, bonusJuara: 94000000, minimalPower: 87, minimalReputasi: 85, tier: "S", kpi: "TOP_4" },
    { nama: "Indosat Ooredoo", bayar: 210000000, bonusJuara: 84000000, minimalPower: 80, minimalReputasi: 95, tier: "S", kpi: "JUARA_MPL" },
    { nama: "XL Axiata", bayar: 280000000, bonusJuara: 112000000, minimalPower: 88, minimalReputasi: 79, tier: "S", kpi: "GRAND_FINAL" },
    { nama: "Gojek", bayar: 275000000, bonusJuara: 123750000, minimalPower: 81, minimalReputasi: 90, tier: "S", kpi: "GRAND_FINAL" },
    { nama: "Grab", bayar: 180000000, bonusJuara: 90000000, minimalPower: 90, minimalReputasi: 96, tier: "S", kpi: "JUARA_MPL" },
    { nama: "Shopee", bayar: 180000000, bonusJuara: 81000000, minimalPower: 86, minimalReputasi: 93, tier: "S", kpi: "TOP_4" },
    { nama: "Traveloka", bayar: 170000000, bonusJuara: 68000000, minimalPower: 80, minimalReputasi: 82, tier: "S", kpi: "JUARA_MPL" },
    { nama: "Bukalapak", bayar: 265000000, bonusJuara: 132500000, minimalPower: 85, minimalReputasi: 91, tier: "S", kpi: "TOP_4" },
    { nama: "Pertamina", bayar: 205000000, bonusJuara: 102500000, minimalPower: 79, minimalReputasi: 82, tier: "S", kpi: "TOP_4" },
    { nama: "Djarum", bayar: 160000000, bonusJuara: 64000000, minimalPower: 88, minimalReputasi: 79, tier: "S", kpi: "GRAND_FINAL" },
    { nama: "Wings Group", bayar: 250000000, bonusJuara: 125000000, minimalPower: 78, minimalReputasi: 91, tier: "S", kpi: "GRAND_FINAL" },
    { nama: "Erigo", bayar: 90000000, bonusJuara: 36000000, minimalPower: 72, minimalReputasi: 64, tier: "A", kpi: "TOP_4" },
    { nama: "Eiger", bayar: 100000000, bonusJuara: 50000000, minimalPower: 60, minimalReputasi: 48, tier: "A", kpi: "TOP_4" },
    { nama: "J&T Express", bayar: 120000000, bonusJuara: 48000000, minimalPower: 70, minimalReputasi: 48, tier: "A", kpi: "NONE" },
    { nama: "SiCepat", bayar: 70000000, bonusJuara: 35000000, minimalPower: 74, minimalReputasi: 45, tier: "A", kpi: "TOP_4" },
    { nama: "Pos Indonesia", bayar: 100000000, bonusJuara: 35000000, minimalPower: 65, minimalReputasi: 61, tier: "A", kpi: "TOP_4" },
    { nama: "Alfamart", bayar: 110000000, bonusJuara: 44000000, minimalPower: 66, minimalReputasi: 49, tier: "A", kpi: "TOP_4" },
    { nama: "Indomaret", bayar: 100000000, bonusJuara: 40000000, minimalPower: 60, minimalReputasi: 64, tier: "A", kpi: "NONE" },
    { nama: "Wardah", bayar: 60000000, bonusJuara: 24000000, minimalPower: 63, minimalReputasi: 56, tier: "A", kpi: "TOP_4" },
    { nama: "Mie Sedaap", bayar: 60000000, bonusJuara: 21000000, minimalPower: 67, minimalReputasi: 63, tier: "A", kpi: "LOLOS_PLAYOFF" },
    { nama: "Indomie", bayar: 115000000, bonusJuara: 57500000, minimalPower: 75, minimalReputasi: 47, tier: "A", kpi: "TOP_4" },
    { nama: "Teh Botol Sosro", bayar: 70000000, bonusJuara: 24500000, minimalPower: 75, minimalReputasi: 62, tier: "A", kpi: "TOP_4" },
    { nama: "Mayora", bayar: 100000000, bonusJuara: 50000000, minimalPower: 73, minimalReputasi: 51, tier: "A", kpi: "TOP_4" },
    { nama: "ABC", bayar: 115000000, bonusJuara: 57500000, minimalPower: 69, minimalReputasi: 57, tier: "A", kpi: "TOP_4" },
    { nama: "Nutrisari", bayar: 95000000, bonusJuara: 33249999, minimalPower: 74, minimalReputasi: 48, tier: "A", kpi: "TOP_4" },
    { nama: "Larutan Cap Kaki Tiga", bayar: 65000000, bonusJuara: 32500000, minimalPower: 70, minimalReputasi: 45, tier: "A", kpi: "TOP_4" },
    { nama: "Pocari Sweat", bayar: 105000000, bonusJuara: 36750000, minimalPower: 67, minimalReputasi: 45, tier: "A", kpi: "LOLOS_PLAYOFF" },
    { nama: "Aqua", bayar: 75000000, bonusJuara: 30000000, minimalPower: 62, minimalReputasi: 46, tier: "A", kpi: "LOLOS_PLAYOFF" },
    { nama: "Le Minerale", bayar: 100000000, bonusJuara: 50000000, minimalPower: 67, minimalReputasi: 53, tier: "A", kpi: "NONE" },
    { nama: "Yamaha", bayar: 75000000, bonusJuara: 37500000, minimalPower: 64, minimalReputasi: 63, tier: "A", kpi: "NONE" },
    { nama: "Honda", bayar: 75000000, bonusJuara: 26250000, minimalPower: 75, minimalReputasi: 58, tier: "A", kpi: "LOLOS_PLAYOFF" },
    { nama: "Suzuki", bayar: 65000000, bonusJuara: 26000000, minimalPower: 73, minimalReputasi: 56, tier: "A", kpi: "NONE" },
    { nama: "Daihatsu", bayar: 95000000, bonusJuara: 47500000, minimalPower: 61, minimalReputasi: 65, tier: "A", kpi: "LOLOS_PLAYOFF" },
    { nama: "Toyota", bayar: 60000000, bonusJuara: 21000000, minimalPower: 72, minimalReputasi: 55, tier: "A", kpi: "TOP_4" },
    { nama: "Janji Jiwa", bayar: 30000000, bonusJuara: 9000000, minimalPower: 48, minimalReputasi: 39, tier: "B", kpi: "LOLOS_PLAYOFF" },
    { nama: "Kopi Soe", bayar: 30000000, bonusJuara: 9000000, minimalPower: 49, minimalReputasi: 39, tier: "B", kpi: "NONE" },
    { nama: "Fore Coffee", bayar: 40000000, bonusJuara: 12000000, minimalPower: 57, minimalReputasi: 28, tier: "B", kpi: "NONE" },
    { nama: "Kebab Turki Baba Rafi", bayar: 25000000, bonusJuara: 7500000, minimalPower: 57, minimalReputasi: 32, tier: "B", kpi: "LOLOS_PLAYOFF" },
    { nama: "Es Teh Indonesia", bayar: 40000000, bonusJuara: 14000000, minimalPower: 52, minimalReputasi: 31, tier: "B", kpi: "NONE" },
    { nama: "Warunk Upnormal", bayar: 30000000, bonusJuara: 10500000, minimalPower: 51, minimalReputasi: 25, tier: "B", kpi: "NONE" },
    { nama: "Geprek Bensu", bayar: 40000000, bonusJuara: 16000000, minimalPower: 49, minimalReputasi: 38, tier: "B", kpi: "LOLOS_PLAYOFF" },
    { nama: "Richeese Factory", bayar: 30000000, bonusJuara: 9000000, minimalPower: 48, minimalReputasi: 34, tier: "B", kpi: "NONE" },
    { nama: "Martabak Pecenongan", bayar: 45000000, bonusJuara: 18000000, minimalPower: 56, minimalReputasi: 26, tier: "B", kpi: "NONE" },
    { nama: "Sate Taichan Goreng", bayar: 25000000, bonusJuara: 10000000, minimalPower: 45, minimalReputasi: 40, tier: "B", kpi: "NONE" },
    { nama: "Bakso Boedjangan", bayar: 25000000, bonusJuara: 7500000, minimalPower: 53, minimalReputasi: 27, tier: "B", kpi: "NONE" },
    { nama: "Warung Padang Sederhana", bayar: 45000000, bonusJuara: 15749999, minimalPower: 46, minimalReputasi: 32, tier: "B", kpi: "NONE" },
    { nama: "Ayam Geprek Juara", bayar: 45000000, bonusJuara: 18000000, minimalPower: 48, minimalReputasi: 26, tier: "B", kpi: "NONE" },
    { nama: "Cireng Cuanki", bayar: 40000000, bonusJuara: 14000000, minimalPower: 55, minimalReputasi: 35, tier: "B", kpi: "NONE" },
    { nama: "Batagor Kingsley", bayar: 50000000, bonusJuara: 15000000, minimalPower: 56, minimalReputasi: 35, tier: "B", kpi: "NONE" },
    { nama: "Roti Bakar Edys", bayar: 40000000, bonusJuara: 14000000, minimalPower: 47, minimalReputasi: 34, tier: "B", kpi: "NONE" },
    { nama: "Es Kelapa Muda Segar", bayar: 25000000, bonusJuara: 10000000, minimalPower: 45, minimalReputasi: 39, tier: "B", kpi: "NONE" },
    { nama: "Nasi Uduk Bang Jaka", bayar: 25000000, bonusJuara: 10000000, minimalPower: 53, minimalReputasi: 31, tier: "B", kpi: "NONE" },
    { nama: "Soto Betawi Haji Mamat", bayar: 30000000, bonusJuara: 9000000, minimalPower: 50, minimalReputasi: 27, tier: "B", kpi: "NONE" },
    { nama: "Warung Kelontong Bu Siti", bayar: 12000000, bonusJuara: 3000000, minimalPower: 0, minimalReputasi: 0, tier: "C", kpi: "NONE" },
    { nama: "Bengkel Motor Jaya Abadi", bayar: 15000000, bonusJuara: 5250000, minimalPower: 0, minimalReputasi: 0, tier: "C", kpi: "NONE" },
    { nama: "Laundry Kilat 24 Jam", bayar: 19000000, bonusJuara: 5700000, minimalPower: 0, minimalReputasi: 0, tier: "C", kpi: "NONE" },
    { nama: "Toko Bangunan Makmur", bayar: 17000000, bonusJuara: 5950000, minimalPower: 0, minimalReputasi: 0, tier: "C", kpi: "NONE" },
    { nama: "Konter HP Second Berkah", bayar: 16000000, bonusJuara: 4000000, minimalPower: 0, minimalReputasi: 0, tier: "C", kpi: "NONE" },
    { nama: "Fotokopi Cerdas", bayar: 18000000, bonusJuara: 6300000, minimalPower: 0, minimalReputasi: 0, tier: "C", kpi: "NONE" },
    { nama: "Depot Air Isi Ulang Sehat", bayar: 12000000, bonusJuara: 4200000, minimalPower: 0, minimalReputasi: 0, tier: "C", kpi: "NONE" },
    { nama: "Warteg Bahari", bayar: 9000000, bonusJuara: 2250000, minimalPower: 0, minimalReputasi: 0, tier: "C", kpi: "NONE" },
    { nama: "Percetakan Undangan Murah", bayar: 12000000, bonusJuara: 3000000, minimalPower: 0, minimalReputasi: 0, tier: "C", kpi: "NONE" },
    { nama: "Cuci Motor Kinclong", bayar: 9000000, bonusJuara: 3150000, minimalPower: 0, minimalReputasi: 0, tier: "C", kpi: "NONE" },
    { nama: "Pangkas Rambut Pak RT", bayar: 16000000, bonusJuara: 4000000, minimalPower: 0, minimalReputasi: 0, tier: "C", kpi: "NONE" },
    { nama: "Tambal Ban 24 Jam", bayar: 12000000, bonusJuara: 3600000, minimalPower: 0, minimalReputasi: 0, tier: "C", kpi: "NONE" },
    { nama: "Toko Kelontong Sumber Rejeki", bayar: 17000000, bonusJuara: 4250000, minimalPower: 0, minimalReputasi: 0, tier: "C", kpi: "NONE" },
    { nama: "Konveksi Kaos Sablon Jaya", bayar: 19000000, bonusJuara: 5700000, minimalPower: 0, minimalReputasi: 0, tier: "C", kpi: "NONE" },
    { nama: "Warung Nasi Padang Uni", bayar: 11000000, bonusJuara: 3849999, minimalPower: 0, minimalReputasi: 0, tier: "C", kpi: "NONE" },
    { nama: "Bengkel Las Karya Mandiri", bayar: 18000000, bonusJuara: 5400000, minimalPower: 0, minimalReputasi: 0, tier: "C", kpi: "NONE" },
    { nama: "Toko Sembako Berkah Tani", bayar: 16000000, bonusJuara: 4800000, minimalPower: 0, minimalReputasi: 0, tier: "C", kpi: "NONE" },
    { nama: "Rental PS Gaming Zone", bayar: 12000000, bonusJuara: 3000000, minimalPower: 0, minimalReputasi: 0, tier: "C", kpi: "NONE" },
    { nama: "Warung Kopi Pojok Jalan", bayar: 9000000, bonusJuara: 3150000, minimalPower: 0, minimalReputasi: 0, tier: "C", kpi: "NONE" }
];

let namaSudahAda = new Set(daftarSponsor.map(s => s.nama));
let jumlahDitambah = 0;
SPONSOR_BARU.forEach(sp => {
    if (namaSudahAda.has(sp.nama)) return; // jaga2 kalau ternyata udah ada (misal patch dimuat 2x)
    daftarSponsor.push(sp);
    namaSudahAda.add(sp.nama);
    jumlahDitambah++;
});

console.log(`Sponsor Pool Expansion Patch: ${jumlahDitambah} sponsor baru ditambahkan. Total pool sekarang: ${daftarSponsor.length}.`);

})();
