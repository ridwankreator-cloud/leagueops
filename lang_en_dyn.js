// ==========================================
// LANG EN DYN — terjemahan teks yang disusun game dari nama/angka
// (berita, highlight, email, notifikasi), khusus script.js.
// Dimuat SESUDAH lang_en.js. Isinya menambah kamus: kalimat utuh ("exact")
// dan pola dengan lubang {1}, {2}, ... untuk nama/angka ("pola").
// Contoh pola: ["^(.+?) resmi bergabung dengan (.+?)$", "{1} officially joined {2}"]
// ==========================================
(function () {
    var K = window.LANG_EN;
    if (!K) return;
    var EXACT = {
        "Fasilitas pas-pasan. Maksimal 6 pemain & cuma bisa sewa Pelatih Kepala.": "Basic facilities. Max 6 players, and you can only hire a Head Coach.",
        "Mulai dari paling bawah. Tantangan terbesar, kas paling minim.": "Start from the very bottom. The biggest challenge, with the smallest cash reserves.",
        "Level menengah. Tim Independen/Challenger punya kas mandiri, tim Afiliasi dikelola induk MPL.": "Mid-level. Independent/Challenger teams have their own cash, while Affiliated teams are managed by their MPL parent.",
        "Mulai dari puncak. Kas besar, tapi ekspektasi & tekanan juga besar.": "Start from the top. Big cash reserves, but big expectations & pressure too.",
        "Tim Tidak Ditemukan": "Team Not Found",
        "Pemain Tidak Ditemukan": "Player Not Found",
        "Biaya Transfer ke Tim (Juta Rp):": "Transfer Fee to Team (Million Rp):",
        "Musim Berakhir": "Season Ended",
        "Reputasi tim Anda terlalu rendah untuk pelatih sekelas saya. Kecuali Anda berani membayar kompensasi jauh di atas standar (180%), saya tidak tertarik.": "Your team's reputation is too low for a coach of my caliber. Unless you are willing to pay compensation far above the standard (180%), I am not interested.",
        "Target yang masuk akal, proyek roster yang jelas, dan tawaran yang menarik! Saya siap bergabung.": "A reasonable target, a clear roster project, and an attractive offer! I'm ready to join.",
        "Visi tim dan targetnya masuk akal, tapi untuk angka bayarannya mari kita bicarakan ulang.": "The team's vision and targets are reasonable, but let's discuss the pay figure again.",
        "Target yang Anda berikan tidak realistis dengan komposisi roster saat ini. Saya tidak mau mempertaruhkan karir saya.": "The target you gave is unrealistic for the current roster. I am not willing to risk my career.",
        "Saldo kas nggak cukup buat bayar biaya rekrutmen awal!": "Not enough cash to pay the initial recruitment fee!",
        "Tim kamu belum punya Analis. Rekrut Analis terlebih dahulu untuk dapat mengintai potensi pemain.": "Your team has no Analyst yet. Recruit an Analyst first to be able to scout player potential.",
        "Kas tim tidak cukup untuk menyewa pencari bakat.": "The team's cash is not enough to hire a scout.",
        "Bos, masukin nominal gaji dan durasinya dulu!": "Please enter the salary amount and duration first!",
        "Opsi beli telah dicentang namun harga belum diisi.": "The buy option is checked but the price has not been filled in.",
        "Lu mau bayar tim AI pakai daun? Kasih biaya transfer/loan yang bener!": "Planning to pay the AI team with leaves? Enter a proper transfer/loan fee!",
        "Masukkan nominal gaji yang valid!": "Enter a valid salary amount!",
        "PEMAIN DIJUAL 💸": "PLAYER SOLD 💸",
        "Slot Sponsor Utama (Dada) sudah terisi! Tunggu kontrak saat ini habis.": "The Main Sponsor Slot (Chest) is already filled! Wait for the current contract to end.",
        "Kedua Slot Sponsor Minor (Lengan) sudah penuh! Tunggu salah satu habis.": "Both Minor Sponsor Slots (Sleeves) are full! Wait for one to expire.",
        "KONTRAK RESMI DITANDATANGANI! 🤝": "CONTRACT OFFICIALLY SIGNED! 🤝",
        "⚠️ Rumor Tim: Beberapa pemain cadangan mulai frustrasi dan merusak suasana ruang ganti karena kurangnya menit bermain.": "⚠️ Team Rumor: Some substitute players are getting frustrated and spoiling the locker room atmosphere because of a lack of playing time.",
        "✨ Solid. Sinergi pemain berjalan sangat baik.": "✨ Solid. Player synergy is working very well.",
        "🔄 Tim masih mencari ritme bermain...": "🔄 The team is still finding its rhythm...",
        "🔒 Roster Lock MDL aktif. Transfer tim MDL ditutup sampai musim reguler berakhir.": "🔒 MDL Roster Lock is active. MDL team transfers are closed until the regular season ends.",
        "2 tim terbaik LEN telah dikunci untuk memperebutkan slot promosi ke MDL.": "The top 2 LEN teams have been locked in to compete for the promotion slot to MDL.",
        "2 tim terbawah MDL telah dikunci untuk mempertahankan slot dari tantangan LEN.": "The bottom 2 MDL teams have been locked in to defend their slots against LEN challengers.",
        "6 tim terbaik telah dikunci.": "The top 6 teams have been locked in.",
        "🔥 3 hari lagi. Finalisasi strategi dan draft pool sebelum Playoff dimulai.": "🔥 3 days left. Finalize your strategy and draft pool before the Playoffs start.",
        "🏆 Hasil Playoff Promosi/Degradasi Mdl-Len sudah keluar. Cek Klasemen untuk detail bracket lengkap.": "🏆 The MDL-LEN Promotion/Relegation Playoff results are out. Check the Standings for the full bracket details.",
        "Semua liga regional telah berakhir. Roster Lock MSC dalam beberapa hari, lalu Wild Card dimulai 1 Juli!": "All regional leagues have ended. The MSC Roster Lock is in a few days, then the Wild Card starts on July 1!",
        "✈️ Berangkat ke venue MSC x EWC 2026. Wild Card dimulai hari ini.": "✈️ Heading to the MSC x EWC 2026 venue. The Wild Card starts today.",
        "🔥 3 hari lagi Wild Card dimulai. Scrimmage terakhir hari ini.": "🔥 3 days until the Wild Card starts. Final scrimmage today.",
        "📰 Minggu pertama transfer window. Rumor dan negosiasi mulai bermunculan di seluruh region.": "📰 First week of the transfer window. Rumors and negotiations are starting to appear across all regions.",
        "⏳ 2 minggu tersisa di transfer window. Segera selesaikan negosiasi sebelum terlambat.": "⏳ 2 weeks left in the transfer window. Finish your negotiations soon before it's too late.",
        "🔔 Hari Terakhir Transfer. Besok bursa ditutup — ini kesempatan terakhir untuk bergerak.": "🔔 Last Day of Transfers. The market closes tomorrow — this is the last chance to make a move.",
        "Proses akhir musim selesai. Transfer window sudah ditutup — roster dikunci untuk evaluasi & persiapan musim baru.": "The end-of-season process is complete. The transfer window is closed — rosters are locked for evaluation & preparing for the new season.",
        "Tidak Bisa Trial": "Cannot Trial",
        "Tidak Bisa Dijalankan": "Cannot Be Run",
        "Pemain ini tidak sedang dalam trial.": "This player is not currently on trial.",
        "Kontrak Resmi! 🎉": "Official Contract! 🎉",
        "Masukkan angka gaji yang valid.": "Enter a valid salary amount.",
        "⚠️ Gagal Simpan: Penyimpanan Penuh": "⚠️ Save Failed: Storage Full",
        "Progress karir lu berhasil disimpan dengan aman! Lu bisa nutup browser sekarang.": "Your career progress was saved safely! You can close the browser now.",
        "Belum ada data save-an bro! Klik 'Mulai Karir Baru' dulu.": "No save data yet! Click 'Start New Career' first.",
        "Belum ada save data di HP/Browser lu! Bikin karir dan klik Save di dalam game dulu bro.": "There is no save data on your phone/browser yet! Create a career and click Save in the game first.",
        "Kalau muncul notifikasi download di device kamu, cek folder Download. Kalau enggak, langsung aja pake opsi copy manual di bawah ini.": "If a download notification appears on your device, check the Download folder. If not, just use the manual copy option below.",
        "Berhasil disalin! Tempel ke aplikasi Notes/file teks buat disimpan.": "Copied successfully! Paste it into a Notes app or text file to save it.",
        "Belum ada teks yang ditempel!": "No text has been pasted yet!",
        "❌ Gagal Import! Teks/File JSON rusak, salah ketik pas ngedit, atau bukan format save-an game ini.": "❌ Import failed! The JSON text/file is corrupted, was mistyped while editing, or is not a save format for this game.",
        "Data target tidak ditemukan di database!": "Target data was not found in the database!",
        "Nama tidak boleh kosong bro!": "The name cannot be empty!",
        "Data telah diperbarui di database. Jangan lupa klik Save Game agar permanen.": "The data has been updated in the database. Don't forget to click Save Game to make it permanent.",
        "Simpan progress dan balik ke Menu Utama?": "Save progress and go back to the Main Menu?",
        "🏟️ Sorak sorai ribuan penonton memenuhi arena! Ini bukan lagi sekadar pertandingan biasa...": "🏟️ The cheers of thousands of spectators fill the arena! This is no longer just an ordinary match...",
        "🎮 Tidak ada ruang untuk kesalahan. Satu kekalahan bisa jadi tiket pulang selamanya!": "🎮 There is no room for mistakes. One loss could be a ticket home forever!",
        "🌟 4 Tim tersisa. Setiap momen bisa menjadi kenangan abadi atau mimpi buruk!": "🌟 4 teams left. Every moment could become an eternal memory or a nightmare!",
        "⚔️ Hanya yang terkuat yang bisa melangkah ke Grand Final. Ini saatnya!": "⚔️ Only the strongest can step into the Grand Final. This is the moment!",
        "💎 Tiket Grand Final ada di depan mata. Siapa yang paling siap mental hari ini?": "💎 The Grand Final ticket is right in front of you. Who is the most mentally ready today?",
        "🏆 INI DIA! Puncak dari semua perjuangan sepanjang musim. GRAND FINAL!": "🏆 HERE IT IS! The peak of all the struggle throughout the season. GRAND FINAL!",
        "👑 Dua tim terbaik. Satu trofi. Satu nama yang akan dikenang sepanjang masa!": "👑 Two best teams. One trophy. One name that will be remembered for all time!",
        "🔥 Tidak ada yang bisa memprediksikan ini — inilah momen yang ditunggu seluruh komunitas!": "🔥 No one could have predicted this — this is the moment the whole community has been waiting for!",
        "🎉 LUAR BIASA! Tim lu tampil SEMPURNA di momen yang paling penting!": "🎉 AMAZING! Your team played PERFECTLY at the most important moment!",
        "🔥 TIDAK PERCAYA! Lu telah membuktikan bahwa kerja keras selama musim ini tidak sia-sia!": "🔥 UNBELIEVABLE! You proved that your hard work this season was not in vain!",
        "🏆 Ini baru legenda! Tim lu merobohkan semua ekspektasi dan bangkit saat paling dibutuhkan!": "🏆 Now that's a legend! Your team shattered all expectations and rose when it was needed most!",
        "💔 Musim yang luar biasa berakhir dengan pahit. Tapi tidak ada yang bisa merebut semangat ini...": "💔 An incredible season ends bitterly. But no one can take this spirit away...",
        "😔 Kalah itu menyakitkan. Tapi setiap legenda pernah merasakan kekalahan ini sebelum bangkit.": "😔 Losing hurts. But every legend has felt this defeat before rising again.",
        "🙏 Angkat kepala. Tim lu sudah berjuang habis-habisan. Season depan, kita balas dendam!": "🙏 Hold your head up. Your team fought with everything. Next season, we get revenge!",
        "🌍 PANGGUNG INTERNASIONAL TERBUKA! Tim-tim terbaik Asia Tenggara siap bertempur!": "🌍 THE INTERNATIONAL STAGE IS OPEN! The best teams in Southeast Asia are ready to battle!",
        "✈️ Kali ini taruhannya bukan hanya trophy — ini soal nama baik seluruh region!": "✈️ This time the stakes are more than a trophy — it's about the honor of the whole region!",
        "🌐 MSC: Di sinilah perbedaan antara pemain bagus dan LEGENDA dibuktikan!": "🌐 MSC: This is where the difference between good players and LEGENDS is proven!",
        "🌟 Tinggal 4 tim dari seluruh SEA! Pertempuran antar nation dimulai!": "🌟 Only 4 teams left from all of SEA! The battle between nations begins!",
        "⚔️ Regional pride dipertaruhkan! Siapa yang akan mewakili negaranya di final?": "⚔️ Regional pride is at stake! Who will represent their country in the final?",
        "🔥 Di titik ini, semua pemain sudah melewati batas fisik dan mental biasa!": "🔥 At this point, every player has passed ordinary physical and mental limits!",
        "🏆 GRAND FINAL MSC! Dua tim terbaik se-Asia Tenggara beradu di atas panggung dunia!": "🏆 MSC GRAND FINAL! The two best teams in Southeast Asia clash on the world stage!",
        "🌐 Ini bukan hanya kemenangan untuk satu tim — ini kemenangan untuk seluruh region!": "🌐 This is not just a victory for one team — it's a victory for the whole region!",
        "👑 Satu tim akan pulang sebagai raja Asia Tenggara. Siapa yang layak menyandang mahkota itu?": "👑 One team will go home as the king of Southeast Asia. Who deserves to wear that crown?",
        "🥇 JUARA ASIA TENGGARA! Tim lu telah menaklukkan seluruh region dalam satu turnamen!": "🥇 SOUTHEAST ASIA CHAMPIONS! Your team has conquered the entire region in a single tournament!",
        "🌟 SEJARAH TERCIPTA! Kalian datang, bertarung, dan menaklukkan semua. LUAR BIASA!": "🌟 HISTORY IS MADE! You came, you fought, and you conquered everything. INCREDIBLE!",
        "🔥 Dari lokal ke internasional — tim lu membuktikan kalian layak disebut yang TERBAIK!": "🔥 From local to international — your team proved you deserve to be called the BEST!",
        "💔 Perjuangan internasional berakhir di sini. Tapi sudah cukup untuk bikin seluruh Indonesia bangga!": "💔 The international journey ends here. But it was enough to make all of Indonesia proud!",
        "😔 MSC mengakhiri perjalanan kalian kali ini. Tapi dunia sudah melihat kehebatan tim ini.": "😔 MSC ends your journey this time. But the world has seen how great this team is.",
        "🙏 Tidak ada malu pulang dari sini. Kalian sudah membawa nama region dengan gagah!": "🙏 There is no shame in going home from here. You carried the region's name with pride!",
        "🌏 STAGE TERBESAR MLBB DI PLANET INI! M WORLD CHAMPIONSHIP RESMI DIMULAI!": "🌏 THE BIGGEST STAGE IN MLBB ON THIS PLANET! THE M WORLD CHAMPIONSHIP HAS OFFICIALLY BEGUN!",
        "🎆 Tim dari seluruh dunia hadir. Tidak ada yang akan ingat siapa yang datang — hanya siapa yang MENANG!": "🎆 Teams from all over the world are here. No one will remember who showed up — only who WON!",
        "👁️ Mata seluruh dunia tertuju ke sini. Ini adalah hari yang akan dibicarakan bertahun-tahun!": "👁️ The eyes of the whole world are on this place. This is a day that will be talked about for years!",
        "🌟 SEMIFINAL DUNIA! Empat tim terbaik di muka bumi berdiri di sini!": "🌟 WORLD SEMIFINALS! The four best teams on Earth stand here!",
        "⚔️ Setiap game bisa menjadi highlight yang diputar ulang jutaan kali. Berikan yang terbaik!": "⚔️ Every game could become a highlight replayed millions of times. Give your best!",
        "🔥 Tidak ada kata 'tidak siap' di level ini. Ini adalah puncak karir setiap pemain esports!": "🔥 There is no 'not ready' at this level. This is the peak of every esports player's career!",
        "👑 DUA TIM. SATU TROFI. SATU NAMA YANG AKAN DIUKIR DALAM EMAS SELAMANYA!": "👑 TWO TEAMS. ONE TROPHY. ONE NAME TO BE ENGRAVED IN GOLD FOREVER!",
        "💫 Momen ini tidak akan terulang. Setiap detik, setiap keputusan akan menentukan sejarah!": "💫 This moment will never repeat. Every second, every decision will shape history!",
        "🌟👑 JUARA DUNIA!!! Tim lu telah menaklukkan SELURUH PLANET dan mengukir nama di bintang!": "🌟👑 WORLD CHAMPIONS!!! Your team has conquered the ENTIRE PLANET and carved its name among the stars!",
        "🏆🎆 TIDAK BISA DIPERCAYA!!! Dari perjuangan lokal hingga mahkota dunia — KALIAN ADALAH LEGENDA!": "🏆🎆 UNBELIEVABLE!!! From local struggles to the world crown — YOU ARE LEGENDS!",
        "🔥🌍 SEJARAH TERCIPTA HARI INI! Tim lu adalah YANG TERBAIK DI SELURUH DUNIA!!!": "🔥🌍 HISTORY IS MADE TODAY! Your team is THE BEST IN THE WHOLE WORLD!!!",
        "💔 Dunia sudah menyaksikan kehebatan kalian. Runner-up dunia bukan sesuatu yang perlu diratapi...": "💔 The world has witnessed your greatness. Being world runner-up is nothing to mourn...",
        "😔 Satu langkah dari puncak dunia. Rasa sakit ini akan menjadi bahan bakar untuk kebangkitan!": "😔 One step from the top of the world. This pain will become fuel for a comeback!",
        "🙏 Legenda tidak lahir dalam semalam. Kalian sudah membuktikan kalian termasuk yang terbaik di dunia.": "🙏 Legends are not born overnight. You have proven you are among the best in the world.",
        "Lepas pemain dulu atau upgrade GH.": "Release a player first or upgrade the GH.",
        "Selamat datang di": "Welcome to",
        "! Bangun tim impianmu.": "! Build your dream team.",
        "🌍 Kejutan MPL PH: Tim raksasa Filipina": "🌍 MPL PH Shock: Philippine giants",
        "secara mengejutkan gagal mengamankan papan atas.": "surprisingly failed to secure a top spot.",
        "tertangkap kamera sedang melakukan pertemuan rahasia dengan CEO": "was caught on camera holding a secret meeting with CEO",
        "💰 Transfer Gossip: Demi ambisi juara,": "💰 Transfer Gossip: In pursuit of the championship,",
        "dikabarkan siap pecahkan rekor nilai transfer demi mendatangkan": "is rumored to be ready to break the transfer fee record to bring in",
        "dirumorkan bakal melakoni *trial* di luar negeri bersama tim": "is rumored to go on a *trial* abroad with the team",
        "Kamu hanya bisa mengirim surat ketertarikan saat": "You can only send a letter of interest when",
        "atau": "or",
        "Kamu sudah mengirim surat ketertarikan ke": "You have already sent a letter of interest to",
        "musim ini. Tunggu respons mereka di akhir musim.": "this season. Wait for their response at the end of the season.",
        "kamu sudah terisi oleh": "is already filled by",
        ". Lepas mereka dulu sebelum mendekati kandidat baru.": ". Release them first before approaching a new candidate.",
        "Surat ketertarikan resmi kamu kepada": "Your official letter of interest to",
        "Jawaban akan kamu terima di": "You will receive an answer at",
        ". Jika tertarik, mereka akan langsung bergabung tanpa biaya transfer. Jika tidak, kamu perlu mencari kandidat lain di bursa staff.": ". If interested, they will join immediately without a transfer fee. If not, you will need to find another candidate on the staff market.",
        "berhasil dikirim.": "was sent successfully.",
        "Mereka akan memberikan jawaban di awal": "They will give their answer at the start of",
        ". Pantau kotak masuk kamu!": ". Keep an eye on your inbox!",
        "memutuskan untuk bergabung dengan": "decided to join",
        "mulai musim depan.": "starting next season.",
        "Mereka terkesan dengan visi dan reputasi tim kamu. Kontrak 2 musim sudah ditandatangani.": "They were impressed by your team's vision and reputation. A 2-season contract has been signed.",
        "Gaji yang disepakati:": "Agreed salary:",
        "🔔 Rekrutan Baru:": "🔔 New Signing:",
        "resmi bergabung dengan": "officially joined",
        "Setelah pertimbangan matang,": "After careful consideration,",
        "Jangan menyerah — tingkatkan reputasi tim dan coba lagi musim depan, atau cari kandidat lain di bursa staff.": "Don't give up — improve your team's reputation and try again next season, or find another candidate on the staff market.",
        "🧑‍💼 Rekrut Staff:": "🧑‍💼 Staff Signing:",
        "resmi menunjuk": "officially appointed",
        "-nya dengan meminjam": "by loaning",
        "-nya dengan merekrut": "by signing",
        "📝 Perpanjang Kontrak:": "📝 Contract Extension:",
        "dengan kontrak baru.": "with a new contract.",
        "dalam tekanan berat setelah 3 kekalahan beruntun — manajemen rotasi starter.": "is under heavy pressure after 3 straight losses — management is rotating the starters.",
        "📉 Kabar Buruk: Tim pelatih melihat penurunan motivasi pada": "📉 Bad News: The coaching staff has noticed a drop in motivation for",
        "menunjukkan bakat luar biasa di sesi latihan. Batas potensinya meningkat pesat.": "showed extraordinary talent in training sessions. Their potential cap has risen sharply.",
        "merespon proposal lu!": "responded to your proposal!",
        "MENOLAK mentah-mentah proposal lu, dan biaya Buyout": "FLATLY REJECTED your proposal, and the Buyout fee",
        "(gak ada refund)!": "(no refund)!",
        "MENOLAK mentah-mentah proposal lu!": "FLATLY REJECTED your proposal!",
        "MENOLAK proposal (gaji kurang sesuai performa trial-nya). Biaya Buyout": "REJECTED the proposal (the salary does not match their trial performance). The Buyout fee",
        "MARAH dan mem-blacklist tim lu karena tawaran sampah!": "got ANGRY and blacklisted your team over a garbage offer!",
        "Update negosiasi tim:": "Team negotiation update:",
        "🤝 Resmi:": "🤝 Official:",
        "resmi bergabung dengan tim Anda.": "officially joined your team.",
        "resmi direbut dari": "was officially poached from",
        "resmi ditebus dari": "was officially bought out from",
        "mendarat dari": "landed from",
        "Upgrade GH ke": "Upgrade GH to",
        "dulu buat nampung Asisten Pelatih!": "first to fit an Assistant Coach!",
        "✅ Laporan analis sangat akurat (±2). Sifat:": "✅ The analyst's report is very accurate (±2). Trait:",
        "Tawaran lu masuk ke meja manajemen/agen": "Your offer has reached the management/agent's desk",
        "Tawaran lu masuk ke meja agen": "Your offer has reached the agent's desk",
        "dalam 2 hari untuk melihat keputusannya!": "within 2 days to see their decision!",
        "Apakah lu yakin ingin menjual": "Are you sure you want to sell",
        "Lu berhasil menjual": "You successfully sold",
        ". Dana cair sebesar": ". Funds released:",
        "Fasilitas Gaming House lu udah naik ke": "Your Gaming House facilities have been upgraded to",
        "Sekarang lu bisa nampung": "You can now hold",
        "Lu butuh kas minimal": "You need cash of at least",
        "Berdasarkan hasil investigasi resmi, tim Anda terbukti menerima dana dari sponsor ilegal": "Based on the results of an official investigation, your team was proven to have accepted funds from an illegal sponsor",
        "Ini merupakan pelanggaran ke-": "This is violation #",
        "Sanksi yang dijatuhkan:": "Penalties imposed:",
        "• Denda total:": "• Total fine:",
        "• Reputasi tim turun tambahan -10": "• Additional team reputation drop of -10",
        "• Kontrak sponsor": "• Sponsor contract",
        "Keputusan ini bersifat final dan tidak dapat diganggu gugat.": "This decision is final and cannot be contested.",
        "🤝 Kontrak Baru:": "🤝 New Contract:",
        "sangat tertarik dengan potensi": "is very interested in the potential of",
        "dipinjamkan ke": "was loaned to",
        "selama 1 Musim.": "for 1 Season.",
        "resmi dibeli oleh": "was officially bought by",
        "tertarik dengan performa": "is interested in the performance of",
        "bersama tim kami.": "with our team.",
        "tidak akan tersedia untuk lineup kamu. Jika hasil trial memuaskan, kami akan mengajukan tawaran resmi.": "will not be available for your lineup. If the trial results are satisfactory, we will submit an official offer.",
        "telah selesai.": "has finished.",
        ". Tawaran resmi segera datang.": ". An official offer is coming soon.",
        "Setelah masa trial yang memuaskan, manajemen": "After a satisfactory trial period, the management of",
        "berangkat trial ke": "left for a trial at",
        "selama 3 hari. Tidak tersedia untuk lineup.": "for 3 days. Unavailable for the lineup.",
        "Tim lu saat ini tidak punya pemain untuk role:": "Your team currently has no player for the role:",
        "Silahkan rekrut pemain baru di Bursa Transfer!": "Please recruit a new player on the Transfer Market!",
        "😱 Kejutan Besar: Tim raksasa": "😱 Big Shock: The giants",
        "akan dimulai dalam": "will start in",
        ". Gunakan waktu ini untuk persiapan akhir.": ". Use this time for final preparations.",
        "Gunakan jeda ini untuk memperkuat mental dan strategi tim!": "Use this break to strengthen the team's mentality and strategy!",
        "dikabarkan akan mengevaluasi pelatih usai Lose Streak 4x beruntun.": "is rumored to evaluate the coach after a 4-game Lose Streak.",
        "Roster lock aktif — strategi sudah terkunci, saatnya eksekusi.": "Roster lock is active — the strategy is locked in, time to execute.",
        "Jeda transfer mid-season berakhir!": "The mid-season transfer break has ended!",
        "Roster Lock MPL/LEN resmi dimulai hari ini.": "The MPL/LEN Roster Lock officially begins today.",
        "Semua transfer tim MPL, LEN, dan MAL": "All MPL, LEN, and MAL team transfers",
        "ditutup total": "are fully closed",
        "sampai musim reguler berakhir (": "until the regular season ends (",
        "Selamat berjuang di paruh kedua musim!": "Good luck in the second half of the season!",
        "🏟️ Jeda pra-playoff selesai.": "🏟️ The pre-playoff break has ended.",
        "resmi dimulai.": "officially begins.",
        "berhasil lolos ke Upper Bracket.": "successfully advanced to the Upper Bracket.",
        "🏆 Promosi Berhasil.": "🏆 Promotion Successful.",
        "❌ Gagal Promosi.": "❌ Promotion Failed.",
        "maju ke UB Final.": "advances to the UB Final.",
        "jatuh ke Lower Bracket.": "dropped to the Lower Bracket.",
        "melaju ke Grand Final dari Upper Bracket.": "advances to the Grand Final from the Upper Bracket.",
        "masih hidup.": "is still alive.",
        "resmi tereliminasi.": "is officially eliminated.",
        "jatuh dari Upper Bracket tapi masih ada kesempatan dari bawah.": "fell from the Upper Bracket but still has a chance from below.",
        "bangkit dari bawah dan melaju ke Grand Final.": "rose from the bottom and advances to the Grand Final.",
        "harus pulang.": "has to go home.",
        ". Momen yang ditunggu seluruh Indonesia.": ". The moment all of Indonesia has been waiting for.",
        "🏆 Juara.": "🏆 Champion.",
        "Transfer window 30 hari telah berakhir. Roster dikunci untuk evaluasi akhir musim.": "The 30-day transfer window has ended. Rosters are locked for end-of-season evaluation.",
        "Jika setuju, Anda akan mengambil alih kendali penuh dengan anggaran kas awal:": "If you agree, you will take full control with an initial cash budget of:",
        "📋 Bebas Kontrak:": "📋 Free Agent:",
        "🎙️ Rekrutan Staff:": "🎙️ Staff Signing:",
        "berhasil mendaratkan bintang besar": "successfully landed the big star",
        "🚨 Mega Transfer Pelatih: Demi gelar juara,": "🚨 Coach Mega Transfer: In pursuit of the title,",
        "resmi membajak": "officially poached",
        "untuk musim depan.": "for next season.",
        "Tagihan Gaji Pemain:": "Player Salary Bill:",
        "Kamu akan mengakuisisi slot MPL milik": "You will acquire the MPL slot owned by",
        "Selamat! Tim kamu kini resmi bermain sebagai": "Congratulations! Your team now officially plays as",
        "di MPL!": "in the MPL!",
        "Kamu akan mengajukan proposal merger ke": "You will submit a merger proposal to",
        "Selamat! Tim kamu resmi merger dan kini tampil di MPL sebagai": "Congratulations! Your team has officially merged and now plays in the MPL as",
        "Kamu akan mengklaim slot MPL kosong bekas": "You will claim the vacant MPL slot formerly held by",
        "(biaya administrasi).": "(administration fee).",
        "Kamu akan menjadikan": "You will make",
        "sebagai tim afiliasi resmi.": "your official affiliate team.",
        "sekarang resmi menjadi tim afiliasi": "is now officially an affiliate team",
        "dari": "of",
        ". Catatan: jika hasil trial memuaskan dan kamu putuskan kontrak, proses Buyout tetap diperlukan.": ". Note: if the trial results are satisfactory and you decide to sign a contract, the Buyout process is still required.",
        "di Bursa Transfer untuk menjalankan scrim dan melihat hasilnya. Atribut pemain sudah terungkap!": "on the Transfer Market to run scrims and see the results. The player's attributes have been revealed!",
        "Ada error teknis pas mulai trial:": "A technical error occurred when starting the trial:",
        "Screenshot pesan ini dan laporkan ke developer.": "Take a screenshot of this message and report it to the developer.",
        "Belum ada pemain yang sedang trial. Klik tombol \"TRIAL\" di Bursa Transfer untuk memulai.": "No players are on trial yet. Click the \"TRIAL\" button on the Transfer Market to start.",
        "dilanjutkan. Jalankan scrim lagi untuk data lebih lengkap.": "continued. Run another scrim for more complete data.",
        ", tapi hasilnya acak — bisa dapat pemain biasa, bisa juga nemu": ", but the result is random — you might get an ordinary player, or you might find",
        "dengan potensi tinggi!": "with high potential!",
        "Jadilah CEO, bangun dinasti juara, dan buktikan taktikmu di panggung global!": "Become the CEO, build a championship dynasty, and prove your tactics on the global stage!",
        "resmi ditunjuk sebagai CEO baru": "was officially appointed as the new CEO of",
        "Yang Terhormat Bapak/Ibu": "Dear Mr./Ms.",
        "Dewan Direksi sangat bangga meresmikan Anda sebagai CEO": "The Board of Directors is very proud to officially appoint you as CEO of",
        ". Skuad utama telah kami siapkan, namun Anda bebas melakukan perombakan di Bursa Transfer.": ". We have prepared the main squad, but you are free to make changes on the Transfer Market.",
        "Target kami musim ini sangat jelas:": "Our target this season is very clear:",
        "Selamat datang kembali di markas, CEO": "Welcome back to the base, CEO",
        "secara mengejutkan membelot ke": "surprisingly defected to",
        "musim ini.": "this season.",
        "! Fasilitas GH lu tidak cukup. Deposit dikembalikan.": "! Your GH facilities are not enough. Deposit returned.",
        "! Kas lu kurang buat bayar Release Clause agen. Deposit dikembalikan.": "! You don't have enough cash to pay the agent's Release Clause. Deposit returned.",
        "🤝 Resmi: Coach": "🤝 Official: Coach",
        "bergabung dengan tim anda.": "joined your team.",
        "tersisih oleh": "was eliminated by",
        "menghasilkan prospek baru —": "produced a new prospect —",
        "Prospek baru dari akademi siap dievaluasi:": "A new prospect from the academy is ready to be evaluated:",
        "untuk mempromosikannya ke tim utama.": "to promote them to the main team.",
        "resmi naik dari akademi ke skuad utama": "was officially promoted from the academy to the main squad of"
};
    var POLA = [
        [
                "^sangat terkesan dengan rekam jejak juara Anda bersama (.+?)\\. Kami sedang membangun proyek besar \\(Rebuild\\) dan ingin menawarkan posisi CEO/Head Manager kepada Anda untuk musim depan\\.$",
                "was very impressed with your championship track record with {1}. We are building a big project (Rebuild) and would like to offer the CEO/Head Manager position to",
                ". Kami sedang membangun proyek besar (Rebuild) dan ingin menawarkan posisi CEO/Head Manager kepada Anda untuk musim depan."
        ],
        [
                "^Slot ini kosong total \\-\\- roster \\& staff kamu akan langsung dipindah ke sini\\. Tim kamu akan resmi bermain di MPL (.+?) musim depan\\. Lanjutkan\\?$",
                "This slot is completely empty -- your roster & staff will be moved here immediately. Your team will officially play in MPL {1} next season. Continue?",
                "Slot ini kosong total -- roster & staff kamu akan langsung dipindah ke sini. Tim kamu akan resmi bermain di MPL"
        ],
        [
                "^\"Reputasi tim lu saat ini \\((.+?)\\) terlalu kecil\\. Pemain meminta bayaran minimal 180% dari harga normal sebagai jaminan resiko karir!\"$",
                "\"Your team's reputation right now ({1}) is too small. The player demands at least 180% of the normal price as a guarantee against career risk!\"",
                ") terlalu kecil. Pemain meminta bayaran minimal 180% dari harga normal sebagai jaminan resiko karir!\""
        ],
        [
                "^⚠️ REPUTASI TURUN \\-(.+?)! Komunitas E\\-sports mengecam keputusan Anda menerima dana dari sponsor kontroversial\\.$",
                "⚠️ REPUTATION DOWN -{1}! The E-sports community condemns your decision to accept funds from a controversial sponsor.",
                "! Komunitas E-sports mengecam keputusan Anda menerima dana dari sponsor kontroversial."
        ],
        [
                "^Semua liga regional telah berakhir\\. Roster Lock M(.+?) dalam beberapa hari, lalu Wild Card dimulai 3 Januari!$",
                "All regional leagues have ended. The M{1} Roster Lock is in a few days, then the Wild Card starts on January 3!",
                "dalam beberapa hari, lalu Wild Card dimulai 3 Januari!"
        ],
        [
                "^⚠️ Terjadi gangguan teknis saat menyiapkan Grand Final MPL ID S(.+?)\\. Bracket dilewati otomatis musim ini\\.$",
                "⚠️ A technical issue occurred while preparing the MPL ID S{1} Grand Final. The bracket was skipped automatically this season.",
                "⚠️ Terjadi gangguan teknis saat menyiapkan Grand Final MPL ID S"
        ],
        [
                "^🔥 Pertarungan HIDUP MATI! Kedua tim saling balas damage, (.+?) menutupnya dengan decisive play untuk (.+?)!$",
                "🔥 A LIFE-OR-DEATH fight! Both teams traded damage, and {1} closed it out with a decisive play for {2}!",
                "🔥 Pertarungan HIDUP MATI! Kedua tim saling balas damage,"
        ],
        [
                "^🚀 STOMPING SESSION! (.+?) bikin musuh frustrasi sejak menit pertama — (.+?) main di level berbeda hari ini!$",
                "🚀 STOMPING SESSION! {1} frustrated the enemy from the first minute — {2} played at a different level today!",
                "bikin musuh frustrasi sejak menit pertama —"
        ],
        [
                "^⚠️ (.+?) baru saja bergabung dengan (.+?) musim ini\\. Regulasi melarang pemain pindah tim 2x dalam semusim!$",
                "⚠️ {1} just joined {2} this season. Regulations prohibit players from moving teams twice in one season!",
                "musim ini. Regulasi melarang pemain pindah tim 2x dalam semusim!"
        ],
        [
                "^(.+?) sedang mempertimbangkan tawaran ini\\. Kontrak mereka dengan (.+?) akan berakhir di akhir musim ini\\.$",
                "{1} is considering this offer. Their contract with {2} will end at the end of this season.",
                "sedang mempertimbangkan tawaran ini. Kontrak mereka dengan"
        ],
        [
                "^⚔️ CLUTCH PLAY! (.+?) \\((.+?)\\) solo win fight saat tim dalam kondisi disadvantage — (.+?) mencuri kemenangan!$",
                "⚔️ CLUTCH PLAY! {1} ({2}) won a solo fight while the team was at a disadvantage — {3} stole the victory!",
                ") solo win fight saat tim dalam kondisi disadvantage —"
        ],
        [
                "^👑 TIDAK ADA PERLAWANAN! (.+?) mengeksekusi strategi dengan sempurna, (.+?) menjadi mesin destruction!$",
                "👑 NO RESISTANCE! {1} executed the strategy perfectly, and {2} became a destruction machine!",
                "mengeksekusi strategi dengan sempurna,"
        ],
        [
                "^⚠️ PERINGATAN: Yakin pindah ke (.+?)\\? Lu bakal ninggalin roster dan uang kas (.+?) secara permanen!$",
                "⚠️ WARNING: Are you sure you want to move to {1}? You will permanently leave behind your roster and the {2} cash!",
                "? Lu bakal ninggalin roster dan uang kas"
        ],
        [
                "^Hasil trial untuk (.+?) kandidat sudah keluar\\. Cek laporan masing\\-masing kandidat di bawah\\.$",
                "The trial results for {1} candidates are out. Check each candidate's report below.",
                "kandidat sudah keluar. Cek laporan masing-masing kandidat di bawah."
        ],
        [
                "^😰 Jantung berdegup kencang! (.+?) hampir kolaps tapi (.+?) tampil bak dewa di momen paling kritis!$",
                "😰 Hearts pounding! {1} almost collapsed, but {2} played like a god in the most critical moment!",
                "tampil bak dewa di momen paling kritis!"
        ],
        [
                "^Tidak ada tim tier\\-2 yang tersedia untuk diklaim sebagai afiliasi di region (.+?) saat ini\\.$",
                "There are no tier-2 teams available to claim as an affiliate in the {1} region right now.",
                "Tidak ada tim tier-2 yang tersedia untuk diklaim sebagai afiliasi di region"
        ],
        [
                "^⚔️ Game super sengit! (.+?) \\((.+?)\\) bikin clutch decisive teamfight di menit\\-menit akhir untuk (.+?)!$",
                "⚔️ A super intense game! {1} ({2}) made a decisive clutch teamfight in the final minutes for {3}!",
                ") bikin clutch decisive teamfight di menit-menit akhir untuk"
        ],
        [
                "^🔥 Nail\\-biter! Kedua tim baku hantam ketat, tapi (.+?) unggul di momen paling krusial buat (.+?)\\.$",
                "🔥 Nail-biter! Both teams fought tightly, but {1} came out ahead in the most crucial moment for {2}.",
                "🔥 Nail-biter! Kedua tim baku hantam ketat, tapi"
        ],
        [
                "^💪 (.+?) menguasai map dari early game\\. (.+?) \\((.+?)\\) sempurna memimpin rotasi dan memberi kemenangan!$",
                "💪 {1} controlled the map from the early game. {2} ({3}) led the rotations perfectly and delivered the win!",
                ") sempurna memimpin rotasi dan memberi kemenangan!"
        ],
        [
                "^😱 DRAMA sampai akhir! Comeback tipis dari (.+?), (.+?) jadi penentu lewat solo kill krusial!$",
                "😱 Drama until the end! A narrow comeback from {1}, with {2} deciding it through a crucial solo kill!",
                "😱 DRAMA sampai akhir! Comeback tipis dari"
        ],
        [
                "^🎯 Drafting genius dari (.+?)! (.+?) \\((.+?)\\) jadi pisau bedah yang membantai lawan dengan presisi\\.$",
                "🎯 Genius drafting from {1}! {2} ({3}) became a surgeon's blade that cut down the opponent with precision.",
                ") jadi pisau bedah yang membantai lawan dengan presisi."
        ],
        [
                "^📈 Momentum (.+?) tidak terbendung! (.+?) mendominasi mid game dan menutup laga dengan megah\\.$",
                "📈 {1}'s momentum is unstoppable! {2} dominated the mid game and closed out the match in style.",
                "mendominasi mid game dan menutup laga dengan megah."
        ],
        [
                "^💀 PEMBANTAIAN! (.+?) bermain setingkat lebih tinggi dari lawan\\. (.+?) \\((.+?)\\) hampir untouchable!$",
                "💀 SLAUGHTER! {1} played a level above the opponent. {2} ({3}) was almost untouchable!",
                "bermain setingkat lebih tinggi dari lawan."
        ],
        [
                "^MPL S(.+?) — minggu terakhir sebelum jeda mid\\-season\\. Krusial untuk posisi klasemen\\.$",
                "MPL S{1} — the last week before the mid-season break. Crucial for standings position.",
                "— minggu terakhir sebelum jeda mid-season. Krusial untuk posisi klasemen."
        ],
        [
                "^selama (.+?) musim\\. Pastikan kas cukup tiap akhir musim, atau bunga akan membengkak!$",
                "over {1} seasons. Make sure you have enough cash at the end of each season, or the interest will balloon!",
                "musim. Pastikan kas cukup tiap akhir musim, atau bunga akan membengkak!"
        ],
        [
                "^🚀 DOMINASI TOTAL! (.+?) menghancurkan lawan dengan mudah, (.+?) bermain hampir tanpa cela!$",
                "🚀 TOTAL DOMINATION! {1} crushed the opponent with ease, and {2} played almost flawlessly!",
                "menghancurkan lawan dengan mudah,"
        ],
        [
                "^9 tim terbaik Indonesia unjuk gigi mulai (.+?)\\. Siapa yang akan mengangkat trofi\\?$",
                "Indonesia's 9 best teams show their strength starting {1}. Who will lift the trophy?",
                "9 tim terbaik Indonesia unjuk gigi mulai"
        ],
        [
                "^\\((.+?), OVR (.+?)\\) siap dikontrak\\. Ajukan tawaran gaji \\& durasi untuk mulai negosiasi\\.$",
                "({1}, OVR {2}) is ready to be signed. Submit a salary offer & duration to start negotiations.",
                ") siap dikontrak. Ajukan tawaran gaji & durasi untuk mulai negosiasi."
        ],
        [
                "^MPL S(.+?): pertarungan tiket Playoff makin ketat\\. Setiap poin sangat berharga\\.$",
                "MPL S{1}: the fight for Playoff tickets is getting tighter. Every point is very valuable.",
                ": pertarungan tiket Playoff makin ketat. Setiap poin sangat berharga."
        ],
        [
                "^💥 GAME PENUH DRAMA! (.+?) \\((.+?)\\) menjadi pahlawan (.+?) lewat teamfight maut di Turtle pit!$",
                "💥 A GAME FULL OF DRAMA! {1} ({2}) became the hero of {3} with a deadly teamfight at the Turtle pit!",
                "lewat teamfight maut di Turtle pit!"
        ],
        [
                "^MPL S(.+?): peta kekuatan mulai jelas\\. Siapa yang masih punya peluang Playoff\\?$",
                "MPL S{1}: the balance of power is becoming clear. Who still has a chance at the Playoffs?",
                ": peta kekuatan mulai jelas. Siapa yang masih punya peluang Playoff?"
        ],
        [
                "^(.+?) gak ketemu di roster (.+?) \\(kemungkinan udah pindah tim\\)\\. Transaksi dibatalkan\\.$",
                "{1} was not found in the {2} roster (they may have already moved teams). Transaction canceled.",
                "(kemungkinan udah pindah tim). Transaksi dibatalkan."
        ],
        [
                "^⚠️ (.+?) tidak bisa dipinjam karena dia baru saja melakukan transfer musim ini!$",
                "⚠️ {1} cannot be loaned because they just made a transfer this season!",
                "tidak bisa dipinjam karena dia baru saja melakukan transfer musim ini!"
        ],
        [
                "^MPL S(.+?)\\. Regular season berakhir (.+?) — Playoff dimulai (.+?)\\. Pertarungan hidup\\-mati\\.$",
                "MPL S{1}. The regular season ends {2} — the Playoffs start {3}. A life-or-death fight.",
                ". Regular season berakhir"
        ],
        [
                "^\"Reputasi tim lu saat ini \\((.+?)\\) terlalu kecil\\. Gue balik ke tim lama aja\\.\"$",
                "\"Your team's reputation right now ({1}) is too small. I'll just go back to my old team.\"",
                ") terlalu kecil. Gue balik ke tim lama aja.\""
        ],
        [
                "^mengalahkan (.+?) \\((.+?)\\) di Playoff Promosi/Degradasi dan naik ke MDL musim depan\\.$",
                "defeated {1} ({2}) in the Promotion/Relegation Playoff and moves up to MDL next season.",
                ") di Playoff Promosi/Degradasi dan naik ke MDL musim depan."
        ],
        [
                "^💀 One\\-sided! (.+?) dan rekan setim overpower musuh sejak menit pertama untuk (.+?)\\.$",
                "💀 One-sided! {1} and teammates overpowered the enemy from the first minute for {2}.",
                "dan rekan setim overpower musuh sejak menit pertama untuk"
        ],
        [
                "^✈️ Berangkat ke venue M(.+?) World Championship\\. Wild Card dimulai hari ini\\.$",
                "✈️ Heading to the M{1} World Championship venue. The Wild Card starts today.",
                "World Championship. Wild Card dimulai hari ini."
        ],
        [
                "^MPL S(.+?)\\. Klasemen awal mulai terbentuk — siapa yang tampil konsisten\\?$",
                "MPL S{1}. The early standings are taking shape — who is performing consistently?",
                ". Klasemen awal mulai terbentuk — siapa yang tampil konsisten?"
        ],
        [
                "^Kas kurang! Lu butuh tambahan Rp (.+?) Jt buat nutupin Counter Offer ini\\.$",
                "Not enough cash! You need an extra Rp {1} Jt to cover this Counter Offer.",
                "Jt buat nutupin Counter Offer ini."
        ],
        [
                "^MPL S(.+?): 2 minggu terakhir regular season\\. Persaingan Top 6 memanas\\.$",
                "MPL S{1}: the last 2 weeks of the regular season. The Top 6 race is heating up.",
                ": 2 minggu terakhir regular season. Persaingan Top 6 memanas."
        ],
        [
                "^💪 (.+?) \\((.+?)\\) tampil dominan dan mengarahkan (.+?) meraih kemenangan dengan solid\\.$",
                "💪 {1} ({2}) was dominant and led {3} to a solid victory.",
                ") tampil dominan dan mengarahkan"
        ],
        [
                "^📈 (.+?) mengontrol tempo permainan sejak early game, (.+?) jadi kunci utamanya\\.$",
                "📈 {1} controlled the tempo from the early game, with {2} as the key player.",
                "mengontrol tempo permainan sejak early game,"
        ],
        [
                "^tersingkir di Lower Bracket Final S(.+?)\\. Perjuangan yang luar biasa\\.$",
                "was knocked out in the S{1} Lower Bracket Final. An incredible fight.",
                "tersingkir di Lower Bracket Final S"
        ],
        [
                "^(.+?) resmi mengakhiri kerja sama\\. Cari sponsor baru di menu Keuangan!$",
                "{1} has officially ended the partnership. Find a new sponsor in the Finance menu!",
                "resmi mengakhiri kerja sama. Cari sponsor baru di menu Keuangan!"
        ],
        [
                "^🎯 Rotasi rapi dari (.+?), (.+?) jadi pembeda di teamfight\\-teamfight penting\\.$",
                "🎯 Clean rotations from {1}, with {2} making the difference in the important teamfights.",
                "jadi pembeda di teamfight-teamfight penting."
        ],
        [
                "^🏆 Comfortable win buat (.+?), (.+?) tampil sangat impresif sepanjang game\\.$",
                "🏆 A comfortable win for {1}, and {2} was very impressive throughout the game.",
                "tampil sangat impresif sepanjang game."
        ],
        [
                "^MPL S(.+?): derbi dan laga bergengsi siap tersaji akhir pekan ini\\.$",
                "MPL S{1}: derbies and prestigious matches are set to be served this weekend.",
                ": derbi dan laga bergengsi siap tersaji akhir pekan ini."
        ],
        [
                "^dipastikan Absen dari panggung M(.+?) World Championship tahun ini\\.$",
                "is confirmed to be absent from the M{1} World Championship stage this year.",
                "dipastikan Absen dari panggung M"
        ],
        [
                "^MENOLAK proposal\\. Tawaran terlalu rendah! \\(Sisa Toleransi: (.+?)x\\)$",
                "REJECTED the proposal. The offer is too low! (Tolerance Left: {1}x)",
                "MENOLAK proposal. Tawaran terlalu rendah! (Sisa Toleransi:"
        ],
        [
                "^! Lu udah punya (.+?)\\. Pecat yang lama dulu\\. Deposit dikembalikan\\.$",
                "! Your {1} slot is already filled. Fire the current one first. Deposit returned.",
                ". Pecat yang lama dulu. Deposit dikembalikan."
        ],
        [
                "^Tim kamu akan resmi bermain di MPL (.+?) musim depan\\. Lanjutkan\\?$",
                "Your team will officially play in MPL {1} next season. Continue?",
                "Tim kamu akan resmi bermain di MPL"
        ],
        [
                "^Lu gak bisa jual (.+?)! Tim butuh minimal 1 pemain untuk role (.+?)\\.$",
                "You can't sell {1}! The team needs at least 1 player for the {2} role.",
                "! Tim butuh minimal 1 pemain untuk role"
        ],
        [
                "^memenangkan MPL ID Season (.+?) dengan skor (.+?)\\-(.+?)\\. Sejarah tercipta\\.$",
                "won MPL ID Season {1} with a score of {2}-{3}. History is made.",
                "memenangkan MPL ID Season"
        ],
        [
                "^\\(avg (.+?)\\) tidak dilanjutkan oleh (.+?)\\. Pemain kembali ke roster\\.$",
                "(avg {1}) was not continued by {2}. The player returns to the roster.",
                ". Pemain kembali ke roster."
        ],
        [
                "^Kosongkan / biarkan default untuk tetap pakai nama \"(.+?)\"\\.$",
                "Leave blank / keep the default to keep using the name \"{1}\".",
                "Kosongkan / biarkan default untuk tetap pakai nama \""
        ],
        [
                "^Data tim (.+?) gak ketemu di database\\. Transaksi dibatalkan\\.$",
                "Data for team {1} was not found in the database. Transaction canceled.",
                "gak ketemu di database. Transaksi dibatalkan."
        ],
        [
                "^Lu udah punya (.+?)! Pecat dulu yang lama kalau mau ganti\\.$",
                "Your {1} slot is already filled! Fire the current one first if you want to replace them.",
                "! Pecat dulu yang lama kalau mau ganti."
        ],
        [
                "^keluar dari akademi (.+?) dan kini bebas di bursa transfer\\.$",
                "left the {1} academy and is now free on the transfer market.",
                "dan kini bebas di bursa transfer."
        ],
        [
                "^gagal mengamankan tiket menuju M(.+?) World Championship\\.$",
                "failed to secure a ticket to the M{1} World Championship.",
                "gagal mengamankan tiket menuju M"
        ],
        [
                "^di Playoff S(.+?) berakhir di Lower Bracket Semi Final\\.$",
                "in the S{1} Playoffs ended in the Lower Bracket Semi Final.",
                "berakhir di Lower Bracket Semi Final."
        ],
        [
                "^resmi bebas dari (.+?) dan kini tersedia di bursa staff\\.$",
                "is officially free from {1} and is now available on the staff market.",
                "dan kini tersedia di bursa staff."
        ],
        [
                "^(.+?) resmi bergabung sebagai (.+?)! Power tim lu meningkat\\.$",
                "{1} has officially joined as {2}! Your team's power increased.",
                "! Power tim lu meningkat."
        ],
        [
                "^memutuskan untuk tidak bergabung dengan (.+?) saat ini\\.$",
                "decided not to join {1} at this time.",
                "memutuskan untuk tidak bergabung dengan"
        ],
        [
                "^✅ TRIAL DIIZINKAN — (.+?) tidak tersedia selama 3 hari\\.$",
                "✅ TRIAL ALLOWED — {1} is unavailable for 3 days.",
                "tidak tersedia selama 3 hari."
        ],
        [
                "^\\((.+?), OVR (.+?)\\)\\. Kami mengundang beliau untuk menjalani$",
                "({1}, OVR {2}). We invite them to undergo",
                "). Kami mengundang beliau untuk menjalani"
        ],
        [
                "^\\((.+?), OVR (.+?)\\) kini resmi jadi bagian dari tim utama!$",
                "({1}, OVR {2}) is now officially part of the main team!",
                ") kini resmi jadi bagian dari tim utama!"
        ],
        [
                "^Gagal! Tim butuh minimal 1 pemain di role (.+?)\\.$",
                "Failed! The team needs at least 1 player in the {1} role.",
                "Gagal! Tim butuh minimal 1 pemain di role"
        ],
        [
                "^kalah dari (.+?) \\((.+?)\\) di Playoff Promosi/Degradasi\\.$",
                "lost to {1} ({2}) in the Promotion/Relegation Playoff.",
                ") di Playoff Promosi/Degradasi."
        ],
        [
                "^resmi Gagal lolos ke Playoffs MPL ID S(.+?)\\.$",
                "officially FAILED to qualify for the MPL ID S{1} Playoffs.",
                "resmi Gagal lolos ke Playoffs MPL ID S"
        ],
        [
                "^Counter offer dari kandidat \\(ronde (.+?)/(.+?)\\):$",
                "Counter offer from the candidate (round {1}/{2}):",
                "Counter offer dari kandidat (ronde"
        ],
        [
                "^dengan skor (.+?)\\-(.+?) dan melangkah lebih jauh\\.$",
                "with a score of {1}-{2} and goes further.",
                "dan melangkah lebih jauh."
        ],
        [
                "^terpuruk di peringkat (.+?) Regular Season\\.$",
                "slumped to rank {1} in the Regular Season.",
                "terpuruk di peringkat"
        ],
        [
                "^Selamat datang di keluarga besar (.+?), (.+?)! 💪$",
                "Welcome to the {1} family, {2}! 💪",
                "Selamat datang di keluarga besar"
        ],
        [
                "^sepakat menjadi Sponsor (.+?) dengan durasi$",
                "agreed to become {1} Sponsor with a duration of",
                "sepakat menjadi Sponsor"
        ],
        [
                "^tampil impresif \\(avg (.+?)\\) saat trial di$",
                "performed impressively (avg {1}) during the trial at",
                "tampil impresif (avg"
        ],
        [
                "^⚠️ (.+?) merasa tawaran lu masih kurang!$",
                "⚠️ {1} feels your offer is still not enough!",
                "merasa tawaran lu masih kurang!"
        ],
        [
                "^RESMI bergabung dengan gaji Rp (.+?) Jt!$",
                "OFFICIALLY joined with a salary of Rp {1} Jt!",
                "RESMI bergabung dengan gaji Rp"
        ],
        [
                "^\\((.+?)\\) yang terdeteksi dari tim Anda\\.$",
                "({1}) detected from your team.",
                ") yang terdeteksi dari tim Anda."
        ],
        [
                "^resmi menggandeng (.+?) sebagai Sponsor (.+?)\\.$",
                "officially partnered with {1} as {2} Sponsor.",
                "resmi menggandeng"
        ],
        [
                "^adalah Raja MPL ID S(.+?) dengan skor (.+?)\\-(.+?)\\.$",
                "is the King of MPL ID S{1} with a score of {2}-{3}.",
                "adalah Raja MPL ID S"
        ],
        [
                "^Musim di MPL: (.+?) \\| Kas: Rp (.+?) \\| Reputasi: (.+?)$",
                "Seasons in MPL: {1} | Cash: Rp {2} | Reputation: {3}",
                "Musim di MPL:"
        ],
        [
                "^(.+?)\\-(.+?) dan melaju ke babak berikutnya\\.$",
                "{1}-{2} and advances to the next round.",
                "dan melaju ke babak berikutnya."
        ],
        [
                "^Data tim (.+?) gak ketemu di database\\.$",
                "Data for team {1} was not found in the database.",
                "gak ketemu di database."
        ],
        [
                "^Pertarungan reguler berakhir! (.+?)$",
                "The regular season battle is over! {1}",
                "Pertarungan reguler berakhir!"
        ],
        [
                "^(.+?) pemain amatir baru mendaftar!$",
                "{1} new amateur players signed up!",
                "pemain amatir baru mendaftar!"
        ],
        [
                "^resmi DIPINJAM \\(Fee: Rp (.+?) Jt\\)!$",
                "was officially LOANED (Fee: Rp {1} Jt)!",
                "resmi DIPINJAM (Fee: Rp"
        ],
        [
                "^\\(dicicil (.+?) musim, \\~Rp (.+?) Jt/musim\\)$",
                "(paid in installments over {1} seasons, ~Rp {2} Jt/season)",
                "musim, ~Rp"
        ],
        [
                "^📅 Reguler Season S(.+?) selesai\\.$",
                "📅 Regular Season S{1} has ended.",
                "📅 Reguler Season S"
        ],
        [
                "^Harga yang dibayarkan: Rp (.+?)\\.$",
                "Price paid: Rp {1}.",
                "Harga yang dibayarkan: Rp"
        ],
        [
                "^Biaya yang dibayarkan: Rp (.+?)\\.$",
                "Cost paid: Rp {1}.",
                "Biaya yang dibayarkan: Rp"
        ],
        [
                "^RESMI bergabung sebagai (.+?)!$",
                "OFFICIALLY joined as {1}!",
                "RESMI bergabung sebagai"
        ],
        [
                "^OVR: (.+?) \\| Harga Pasar: Rp (.+?) Jt$",
                "OVR: {1} | Market Price: Rp {2} Jt",
                "| Harga Pasar: Rp"
        ],
        [
                "^Reputasi tim saat ini: (.+?)\\.$",
                "Current team reputation: {1}.",
                "Reputasi tim saat ini:"
        ],
        [
                "^🤝 Bentuk Afiliasi Baru: (.+?)$",
                "🤝 Form a New Affiliation: {1}",
                "🤝 Bentuk Afiliasi Baru:"
        ],
        [
                "^resmi bergabung dengan (.+?)!$",
                "officially joined {1}!",
                "resmi bergabung dengan"
        ],
        [
                "^OVR: (.+?) \\| Est\\. Harga: Rp (.+?) Jt$",
                "OVR: {1} | Est. Price: Rp {2} Jt",
                "| Est. Harga: Rp"
        ],
        [
                "^(.+?) \\(Pulang dari Pinjaman\\)$",
                "{1} (Returning from Loan)",
                "(Pulang dari Pinjaman)"
        ],
        [
                "^Tagihan Gaji Pemain S(.+?)$",
                "Player Salary Bill S{1}",
                "Tagihan Gaji Pemain S"
        ],
        [
                "^\\((.+?) — (.+?)\\) telah dikirimkan\\.$",
                "({1} — {2}) has been sent.",
                ") telah dikirimkan."
        ],
        [
                "^resmi mengajukan (.+?) untuk$",
                "officially submitted {1} for",
                "resmi mengajukan"
        ],
        [
                "^sebagai (.+?) baru mereka\\.$",
                "as their new {1}.",
                "baru mereka."
        ],
        [
                "^MPL S(.+?) Resmi DIMULAI!$",
                "MPL S{1} Officially STARTS!",
                "Resmi DIMULAI!"
        ],
        [
                "^\\(Sisa toleransi: (.+?)x\\)$",
                "(Tolerance left: {1}x)",
                "(Sisa toleransi:"
        ],
        [
                "^(.+?) dimulai dalam (.+?) hari\\.$",
                "{1} starts in {2} days.",
                "dimulai dalam"
        ],
        [
                "^Harga Buyout: Rp (.+?) Jt$",
                "Buyout Price: Rp {1} Jt",
                "Harga Buyout: Rp"
        ],
        [
                "^Gaji: Rp (.+?) Jt · (.+?) Musim$",
                "Salary: Rp {1} Jt · {2} Season(s)",
                "Gaji: Rp"
        ],
        [
                "^seharga Rp (.+?) Jt dari$",
                "for Rp {1} Jt from",
                "seharga Rp"
        ],
        [
                "^🇵 Juara MPL PH S(.+?):$",
                "🇵 MPL PH S{1} Champion:",
                "🇵 Juara MPL PH S"
        ],
        [
                "^🇲 Juara MPL MY S(.+?):$",
                "🇲 MPL MY S{1} Champion:",
                "🇲 Juara MPL MY S"
        ],
        [
                "^🇸 Juara MPL SG S(.+?):$",
                "🇸 MPL SG S{1} Champion:",
                "🇸 Juara MPL SG S"
        ],
        [
                "^Kontrak (.+?) Musim: (.+?) \\((.+?)\\)$",
                "{1} Season Contract: {2} ({3})",
                "Kontrak"
        ],
        [
                "^, dia balik ke (.+?)\\.$",
                ", they go back to {1}.",
                ", dia balik ke"
        ],
        [
                "^NILAI PROPOSAL (.+?):$",
                "PROPOSAL VALUE {1}:",
                "NILAI PROPOSAL"
        ],
        [
                "^dengan tenor (.+?)\\.$",
                "with a term of {1}.",
                "dengan tenor"
        ],
        [
                "^dengan skor (.+?)\\-(.+?)\\.$",
                "with a score of {1}-{2}.",
                "dengan skor"
        ],
        [
                "^(.+?) \\(Kembali ke (.+?)\\)$",
                "{1} (Returns to {2})",
                "(Kembali ke"
        ],
        [
                "^\\| Umur: (.+?) tahun$",
                "| Age: {1} years",
                "| Umur:"
        ],
        [
                "^🧳 PINJAM: (.+?) \\((.+?)\\)$",
                "🧳 LOAN: {1} ({2})",
                "🧳 PINJAM:"
        ],
        [
                "^\\(OVR (.+?)\\) dari$",
                "(OVR {1}) from",
                ") dari"
        ],
        [
                "^Rp (.+?)/musim$",
                "Rp {1}/season",
                "/musim"
        ],
        [
                "^(.+?) \\| Sisa:$",
                "{1} | Remaining:",
                "| Sisa:"
        ],
        [
                "^(.+?) Pemain$",
                "{1} Players",
                "Pemain"
        ],
        [
                "^(.+?) Gaji:$",
                "{1} Salary:",
                "Gaji:"
        ],
        [
                "^(.+?) Staff$",
                "{1} Staff",
                "Staff"
        ],
        [
                "^(.+?) musim$",
                "{1} season(s)",
                "musim"
        ],
        [
                "^(.+?) hari$",
                "{1} days",
                "hari"
        ]
];
    for (var k in EXACT) if (!(k in K.exact)) K.exact[k] = EXACT[k];
    function buat(src, tpl, anchor) {
        var rx = new RegExp(src);
        return [
            { exec: function (t) { return t.indexOf(anchor) < 0 ? null : rx.exec(t); } },
            function (m) { return tpl.replace(/\{(\d+)\}/g, function (_, i) {
                if (m[i] === undefined) return "";
                var t = typeof window.terjemahLang === "function" ? window.terjemahLang(m[i]) : null;
                return t === null ? m[i] : t;
            }); }
        ];
    }
    for (var i = 0; i < POLA.length; i++) K.regex.push(buat(POLA[i][0], POLA[i][1], POLA[i][2]));
})();
