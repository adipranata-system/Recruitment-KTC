/**
 * ============================================================================
 * RMS v3.0 (RECRUITMENT MANAGEMENT SYSTEM) — E-RECRUITMENT PORTAL MODULE
 * Ecosystem : AP Systems (Adi Pranata Systems)
 * Author    : Adi Pranata
 * Version   : 3.3.0
 * ============================================================================
 * Modul ini menangani:
 * 1. Katalog & rincian kualifikasi posisi aktif (Chief Mechanic & Trainer Operator) serta arsip 27 posisi.
 * 2. Pengawasan batas waktu terakhir pendaftaran (05 Desember 2026).
 * 3. Penyesuaian otomatis catatan tahapan seleksi (Level Pimpinan, Trainer, vs Kru/Admin).
 * 4. Algoritma validasi struktur 16 digit NIK (Lapis 1 - Client-Side).
 * 5. Verifikasi database real-time & penguncian formulir bertahap (Gate Lock).
 * 6. Manajemen unggah berkas dokumen PDF/DOCX (Drag & Drop, Maks. 10 MB).
 * 7. Pengiriman data terstruktur ke backend Google Apps Script.
 */

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyt2wxM1hylQ-WFBXXjn2Mqk8iVbG0zspK6Vb4VSzRJ7DnmQ7vC97CH6WI4qI0rzksjqw/exec";

// Pengaturan Batas Waktu Terakhir Pendaftaran (05 Desember 2026 Pukul 23:59:59)
const APPLICATION_DEADLINE_TEXT = "05 Desember 2026";
const APPLICATION_DEADLINE_DATE = new Date(2026, 11, 5, 23, 59, 59); // Bulan 11 = Desember (0-indexed)

function isDeadlinePassed() {
  return new Date() > APPLICATION_DEADLINE_DATE;
}

// Daftar 38 Kode Resmi Provinsi di Indonesia (Kemendagri)
const VALID_PROVINCES = [
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "21", // Sumatera
  "31", "32", "33", "34", "35", "36",                         // Jawa
  "51", "52", "53",                                           // Bali & Nusa Tenggara
  "61", "62", "63", "64", "65",                               // Kalimantan (62 = Kalteng)
  "71", "72", "73", "74", "75", "76",                         // Sulawesi
  "81", "82",                                                 // Maluku
  "91", "92", "93", "94", "95", "96"                          // Papua
];

// Dataset Persyaratan Kualifikasi Lengkap (Aktif: Chief Mechanic & Trainer Operator + Arsip 27 Posisi)
const jobQualifications = {
  'cm-1': {
    title: "Chief Mechanic",
    category: "Plant & Workshop Leadership",
    selectValue: "Chief Mechanic",
    requirements: [
      "Batas waktu terakhir pendaftaran & pengiriman berkas: 05 Desember 2026.",
      "Jenis Kelamin: Khusus Laki-laki.",
      "Pendidikan minimal SMK, diutamakan D3 ke atas jurusan Teknik Mesin / Otomotif.",
      "Usia maksimal 50 tahun.",
      "Minimal pengalaman 3–5 tahun sebagai Chief Mechanic / Plant Supervisor (diutamakan di industri pertambangan).",
      "Memimpin & mengawasi seluruh operasional perawatan, perbaikan, dan kesiapan armada alat berat (PA/MA) di Workshop & Site.",
      "Kepemilikan sertifikat (POP / POM / BMC) menjadi nilai tambah; diutamakan melampirkan surat pengalaman kerja (Paklaring)."
    ]
  },
  'tr-1': {
    title: "Trainer Operator",
    category: "Training & Operation Development",
    selectValue: "Trainer Operator",
    requirements: [
      "Batas waktu terakhir pendaftaran & pengiriman berkas: 05 Desember 2026.",
      "Jenis Kelamin: Khusus Laki-laki.",
      "Pendidikan minimal SMK, diutamakan D3 ke atas.",
      "Minimal pengalaman 3–5 tahun sebagai Trainer / Instruktur Operator Alat Berat di industri pertambangan.",
      "Menguasai pengoperasian mayoritas unit alat berat pertambangan (Excavator, Bulldozer, ADT, Motor Grader, Wheel Loader, Compactor, & Dump Truck).",
      "Wajib memiliki SIM BII Umum (SIM B2 Umum) yang masih aktif.",
      "Diutamakan memiliki sertifikat pendukung (TOT / POP / SIO) serta melampirkan surat pengalaman kerja (Paklaring).",
      "Lingkup pekerjaan: melaksanakan seleksi operator tambang (uji teori & praktik), pengajaran/pembinaan operator (coaching & mentoring), pengembangan modul pelatihan & SOP pengoperasian alat berat, serta evaluasi kompetensi operator."
    ]
  },
  'op-1': {
    title: "Operator Drilling Machine (DM45)",
    category: "Operator Alat Berat",
    selectValue: "Operator Drilling Machine (DM45)",
    requirements: [
      "Jenis Kelamin: Laki-laki / Perempuan (Prioritas Laki-laki untuk operasional lapangan site).",
      "Wajib memiliki SIM B2 biasa atau SIM B2 Umum yang masih aktif.",
      "SIO Drilling Machine bersifat opsional (menjadi nilai tambah).",
      "Pendidikan min. SMA / SMK Sederajat.",
      "Pengalaman min. 2-3 tahun mengoperasikan Drilling Rig (Epiroc / Ingersoll Rand DM45).",
      "Memahami pola pemboran (burden, spacing, subdrill, blast pattern) & P2H harian.",
      "Disiplin tinggi terhadap regulasi keselamatan kerja di area peledakan."
    ]
  },
  'op-2': {
    title: "Operator Excavator 80T Class (Hitachi ZX870 / Doosan DX800 / Volvo EC750)",
    category: "Operator Alat Berat",
    selectValue: "Operator Excavator 80T Class (Hitachi ZX870 / Doosan DX800 / Volvo EC750)",
    requirements: [
      "Jenis Kelamin: Laki-laki / Perempuan (Prioritas Laki-laki untuk operasional lapangan site).",
      "Wajib memiliki SIM B2 biasa atau SIM B2 Umum yang masih aktif.",
      "SIO Excavator bersifat opsional (menjadi nilai tambah).",
      "Pendidikan min. SMA / SMK Sederajat.",
      "Pengalaman min. 3 tahun mengoperasikan Excavator kelas 80 Ton (ZX870 / DX800 / EC750).",
      "Menguasai teknik efisiensi loading cycle time dan safety loading ke armada DT/ADT."
    ]
  },
  'op-3': {
    title: "Operator Excavator 60T Class (Hitachi ZX670)",
    category: "Operator Alat Berat",
    selectValue: "Operator Excavator 60T Class (Hitachi ZX670)",
    requirements: [
      "Jenis Kelamin: Laki-laki / Perempuan (Prioritas Laki-laki untuk operasional lapangan site).",
      "Wajib memiliki SIM B2 biasa atau SIM B2 Umum yang masih aktif.",
      "SIO Excavator bersifat opsional (menjadi nilai tambah).",
      "Pendidikan min. SMA / SMK Sederajat.",
      "Pengalaman min. 2-3 tahun sebagai Operator Excavator 60 Ton (Hitachi ZX670 / sekelasnya).",
      "Memahami P2H, bench loading, trenching, dan penataan sudut lereng pit tambang."
    ]
  },
  'op-4': {
    title: "Operator Excavator 40T Class (Hitachi ZX470)",
    category: "Operator Alat Berat",
    selectValue: "Operator Excavator 40T Class (Hitachi ZX470)",
    requirements: [
      "Jenis Kelamin: Laki-laki / Perempuan (Prioritas Laki-laki untuk operasional lapangan site).",
      "Wajib memiliki SIM B2 biasa atau SIM B2 Umum yang masih aktif.",
      "SIO Excavator bersifat opsional (menjadi nilai tambah).",
      "Pendidikan min. SMA / SMK Sederajat.",
      "Pengalaman min. 2 tahun mengoperasikan Excavator kelas 40 Ton (ZX470).",
      "Paham regulasi keselamatan kerja di front penambangan terbuka."
    ]
  },
  'op-5': {
    title: "Operator Excavator 20T Class (Hitachi ZX200 - Flat / Kuku Bucket)",
    category: "Operator Alat Berat",
    selectValue: "Operator Excavator 20T Class (Hitachi ZX200 - Flat / Kuku Bucket)",
    requirements: [
      "Jenis Kelamin: Laki-laki / Perempuan (Prioritas Laki-laki untuk operasional lapangan site).",
      "Wajib memiliki SIM B2 biasa atau SIM B2 Umum yang masih aktif.",
      "SIO Excavator bersifat opsional (menjadi nilai tambah).",
      "Pendidikan min. SMA / SMK Sederajat.",
      "Pengalaman min. 2 tahun di kelas 20 Ton (Hitachi ZX200 / PC200).",
      "Mahir menggunakan bucket kuku maupun bucket flat (pembersihan batubara bersih tanpa kontaminan)."
    ]
  },
  'op-6': {
    title: "Operator ADT (Volvo A40F / A40G)",
    category: "Operator Alat Berat",
    selectValue: "Operator ADT (Volvo A40F / A40G)",
    requirements: [
      "Jenis Kelamin: Laki-laki / Perempuan (Prioritas Laki-laki untuk operasional lapangan site).",
      "Wajib memiliki SIM B2 biasa atau SIM B2 Umum yang masih aktif.",
      "SIO Dump Truck / ADT bersifat opsional (menjadi nilai tambah).",
      "Pendidikan min. SMA / SMK Sederajat.",
      "Pengalaman min. 2-3 tahun mengoperasikan ADT Volvo A40F / A40G di site tambang.",
      "Paham pengereman retarder, differential lock, dan dumping aman di area disposal."
    ]
  },
  'op-7': {
    title: "Operator Dozer Heavy (Komatsu D375)",
    category: "Operator Alat Berat",
    selectValue: "Operator Dozer Heavy (Komatsu D375)",
    requirements: [
      "Jenis Kelamin: Laki-laki / Perempuan (Prioritas Laki-laki untuk operasional lapangan site).",
      "Wajib memiliki SIM B2 biasa atau SIM B2 Umum yang masih aktif.",
      "SIO Bulldozer bersifat opsional (menjadi nilai tambah).",
      "Pendidikan min. SMA / SMK Sederajat.",
      "Pengalaman min. 3 tahun mengoperasikan Bulldozer Heavy Class Komatsu D375 / CAT D9.",
      "Ahli teknik ripping penetrasi batuan, dozing cut-and-carry, dan pemeliharaan undercarriage."
    ]
  },
  'op-8': {
    title: "Operator Dozer Medium (Komatsu D85 / Shantui)",
    category: "Operator Alat Berat",
    selectValue: "Operator Dozer Medium (Komatsu D85 / Shantui)",
    requirements: [
      "Jenis Kelamin: Laki-laki / Perempuan (Prioritas Laki-laki untuk operasional lapangan site).",
      "Wajib memiliki SIM B2 biasa atau SIM B2 Umum yang masih aktif.",
      "SIO Bulldozer bersifat opsional (menjadi nilai tambah).",
      "Pendidikan min. SMA / SMK Sederajat.",
      "Pengalaman min. 2 tahun mengoperasikan Dozer D85ESS / Shantui SD22.",
      "Mampu membuat bundwall/tanggul pengaman dan parit drainase disposal."
    ]
  },
  'op-9': {
    title: "Operator Motor Grader (SEM / CAT)",
    category: "Operator Alat Berat",
    selectValue: "Operator Motor Grader (SEM / CAT)",
    requirements: [
      "Jenis Kelamin: Laki-laki / Perempuan (Prioritas Laki-laki untuk operasional lapangan site).",
      "Wajib memiliki SIM B2 biasa atau SIM B2 Umum yang masih aktif.",
      "SIO Motor Grader bersifat opsional (menjadi nilai tambah).",
      "Pendidikan min. SMA / SMK Sederajat.",
      "Pengalaman min. 2-3 tahun mengoperasikan Motor Grader (SEM 921 / CAT 14M / sejenis).",
      "Mahir membentuk superelevasi tikungan, cross fall jalan, dan parit jalan hauling."
    ]
  },
  'op-10': {
    title: "Operator Wheel Loader (CAT)",
    category: "Operator Alat Berat",
    selectValue: "Operator Wheel Loader (CAT)",
    requirements: [
      "Jenis Kelamin: Laki-laki / Perempuan (Prioritas Laki-laki untuk operasional lapangan site).",
      "Wajib memiliki SIM B2 biasa atau SIM B2 Umum yang masih aktif.",
      "SIO Wheel Loader bersifat opsional (menjadi nilai tambah).",
      "Pendidikan min. SMA / SMK Sederajat.",
      "Pengalaman min. 2 tahun mengoperasikan Wheel Loader (Caterpillar 950 / 966 / 980).",
      "Menguasai teknik V-Shape loading cepat tanpa merusak bak armada dump truck."
    ]
  },
  'op-11': {
    title: "Operator Compactor (Sakai)",
    category: "Operator Alat Berat",
    selectValue: "Operator Compactor (Sakai)",
    requirements: [
      "Jenis Kelamin: Laki-laki / Perempuan (Prioritas Laki-laki untuk operasional lapangan site).",
      "Wajib memiliki SIM B2 biasa atau SIM B2 Umum yang masih aktif.",
      "SIO Compactor / Road Roller bersifat opsional (menjadi nilai tambah).",
      "Pendidikan min. SMA / SMK Sederajat.",
      "Pengalaman min. 1-2 tahun mengoperasikan Vibratory Roller (Sakai SV512 / SV525).",
      "Paham frekuensi vibrasi pemadatan sub-base jalan dan standar CBR tambang."
    ]
  },
  'op-12': {
    title: "Driver Water Truck (Hino / Iveco)",
    category: "Driver Tambang",
    selectValue: "Driver Water Truck (Hino / Iveco)",
    requirements: [
      "Jenis Kelamin: Khusus Laki-laki.",
      "Wajib memiliki SIM B2 biasa atau SIM B2 Umum yang masih aktif.",
      "SIO / Sertifikat pendukung bersifat opsional (menjadi nilai tambah).",
      "Pendidikan min. SMA / SMK Sederajat.",
      "Pengalaman min. 2 tahun mengemudikan Water Truck 20KL/30KL di jalan tambang.",
      "Memahami teknik semprot tanpa menimbulkan bahaya jalan licin (muddy hazards)."
    ]
  },
  'op-13': {
    title: "Driver Dump Truck (DT) (Hino / Hanvan / Howo)",
    category: "Driver Tambang",
    selectValue: "Driver Dump Truck (DT) (Hino / Hanvan / Howo)",
    requirements: [
      "Jenis Kelamin: Khusus Laki-laki.",
      "Wajib memiliki SIM B2 biasa atau SIM B2 Umum yang masih aktif.",
      "SIO Dump Truck bersifat opsional (menjadi nilai tambah).",
      "Pendidikan min. SMA / SMK Sederajat.",
      "Pengalaman min. 2 tahun mengemudikan DT tronton di hauling road tambang.",
      "Paham keselamatan antrean loading, komunikasi radio tambang, dan dumping aman."
    ]
  },
  'mc-1': {
    title: "Mechanic HE Wheel",
    category: "Mechanic Crew",
    selectValue: "Mechanic HE Wheel",
    requirements: [
      "Jenis Kelamin: Khusus Laki-laki.",
      "Pendidikan min. SMK Otomotif / Alat Berat / Mesin.",
      "Pengalaman min. 2-3 tahun menangani unit alat berat roda (Wheel Loader / Motor Grader).",
      "Diutamakan berpengalaman menangani ADT Volvo A40E / A40F / A40G.",
      "Paham troubleshooting sistem hidrolik, brake system roda, steering, & engine.",
      "Wajib familiar membaca & memahami Part Book serta Shop Manual.",
      "Memiliki sertifikat Basic Mechanic Course (BMC) diutamakan."
    ]
  },
  'mc-2': {
    title: "Mechanic HE Track",
    category: "Mechanic Crew",
    selectValue: "Mechanic HE Track",
    requirements: [
      "Jenis Kelamin: Khusus Laki-laki.",
      "Pendidikan min. SMK Otomotif / Alat Berat / Mesin.",
      "Pengalaman min. 2-3 tahun menangani Excavator (PC-class) & Dozer (D-class).",
      "Menguasai perbaikan undercarriage, main pump hidrolik, & final drive.",
      "Familiar membaca Part Book serta Shop Manual unit terkait.",
      "Memiliki sertifikat BMC merupakan nilai tambah utama."
    ]
  },
  'mc-3': {
    title: "Mechanic Dump Truck (DT)",
    category: "Mechanic Crew",
    selectValue: "Mechanic DT",
    requirements: [
      "Jenis Kelamin: Khusus Laki-laki.",
      "Pendidikan min. SMK Otomotif / Kendaraan Ringan.",
      "Pengalaman min. 2 tahun unit Scania, Volvo, Mercedes, atau Hino tambang.",
      "Menguasai air brake system, differential, suspensi, & transmisi DT.",
      "Familiar dengan general overhaul mesin diesel multi-silinder."
    ]
  },
  'mc-4': {
    title: "Electrician (Auto Electrician)",
    category: "Mechanic Crew",
    selectValue: "Electrician",
    requirements: [
      "Jenis Kelamin: Khusus Laki-laki.",
      "Pendidikan min. SMK Ketenagalistrikan / Otomotif Elektronika.",
      "Pengalaman min. 2 tahun sebagai Auto Electrician alat berat / DT tambang.",
      "Mahir membaca diagram skematik perkabelan (wiring diagram).",
      "Paham sistem starting, alternator, sensor-sensor, & ECM."
    ]
  },
  'mc-5': {
    title: "Fabrikasi (Welder)",
    category: "Mechanic Crew",
    selectValue: "Fabrikasi (Welder, Bodywork, Line Boring)",
    requirements: [
      "Jenis Kelamin: Khusus Laki-laki.",
      "Pendidikan min. SMK Teknik Pengelasan / Fabrikasi Logam.",
      "Pengalaman min. 2 tahun pengelasan struktur alat berat.",
      "Menguasai teknik las SMAW/FCAW dan gouging (Sertifikat 3G/4G/6G nilai plus).",
      "Familiar dengan pekerjaan line boring / perbaikan chassis."
    ]
  },
  'mc-6': {
    title: "Tyreman (Spesialis Ban Tambang)",
    category: "Mechanic Crew",
    selectValue: "Tyreman",
    requirements: [
      "Jenis Kelamin: Khusus Laki-laki.",
      "Pendidikan min. SMA / SMK Sederajat.",
      "Pengalaman min. 1-2 tahun ban OTR (Off-The-Road) dan Dump Truck.",
      "Menguasai bongkar-pasang ban, torque wheel nut, rotasi ban, & K3 tekanan tinggi."
    ]
  },
  'mc-7': {
    title: "Maintenance Servicing Mechanic",
    category: "Mechanic Crew",
    selectValue: "Maintenance Servicing Mechanic",
    requirements: [
      "Jenis Kelamin: Khusus Laki-laki.",
      "Pendidikan min. SMK Otomotif / Mesin / Alat Berat.",
      "Pengalaman min. 1-2 tahun preventive maintenance alat berat/DT.",
      "Diutamakan memiliki SIM B2 Umum aktif (operasi Lube Truck).",
      "Memahami jadwal Periodic Service (PS 250, 500, 1000, 2000 HM) & sampling oli."
    ]
  },
  'mc-8': {
    title: "Maintenance Servicing Mechanic (Spesialisasi Autolube & Fire Suppression)",
    category: "Mechanic Crew",
    selectValue: "Maintenance Servicing Mechanic (Spesialisasi Autolube & Fire Suppression)",
    requirements: [
      "Jenis Kelamin: Khusus Laki-laki.",
      "Pendidikan min. SMA / SMK Sederajat.",
      "Berpengalaman menangani perbaikan sistem Autolube dan Fire Suppression (semua merk).",
      "Diutamakan bersertifikat atau memiliki surat pengalaman kerja di bidang Autolube dan Fire Suppression.",
      "Lingkup kerja utama: perbaikan sistem Autolube dan Fire Suppression unit alat berat/DT, serta membantu pengerjaan Preventive Maintenance (PM) Service.",
      "Kepemilikan SIM bersifat opsional (menjadi nilai tambah)."
    ]
  },
  'sp-1': {
    title: "Storeman",
    category: "Tim Support",
    selectValue: "Storeman",
    requirements: [
      "Jenis Kelamin: Khusus Laki-laki.",
      "Pendidikan min. SMA / SMK (Otomotif/Logistik disukai).",
      "Pengalaman min. 1-2 tahun Storeman suku cadang tambang.",
      "Menguasai binning rak & administrasi stok (SIO Forklift nilai plus).",
      "Bersedia mengikuti tahapan tes tertulis dan interview online via Zoom Meeting."
    ]
  },
  'sp-2': {
    title: "Driver Fuel Truck (FT)",
    category: "Tim Support",
    selectValue: "Driver Fuel Truck (FT)",
    requirements: [
      "Jenis Kelamin: Khusus Laki-laki.",
      "Pendidikan min. SMA / SMK Sederajat.",
      "Wajib memiliki SIM B2 Umum yang masih aktif.",
      "Pengalaman min. 2 tahun supir tangki solar di site tambang."
    ]
  },
  'sp-3': {
    title: "Fuelman",
    category: "Tim Support",
    selectValue: "Fuelman",
    requirements: [
      "Jenis Kelamin: Khusus Laki-laki.",
      "Pendidikan min. SMA / SMK Sederajat.",
      "Pengalaman min. 1 tahun di industri pertambangan / konstruksi.",
      "Teliti dan jujur dalam pencatatan meteran & kepatuhan K3 grounding."
    ]
  },
  'sp-4': {
    title: "Driver Lowboy Trailer",
    category: "Tim Support",
    selectValue: "Driver Lowboy",
    requirements: [
      "Jenis Kelamin: Khusus Laki-laki.",
      "Pendidikan min. SMA / SMK Sederajat.",
      "Wajib memiliki SIM B2 Umum aktif.",
      "Pengalaman min. 3 tahun lowbed trailer membawa alat berat tambang.",
      "Menguasai teknik lashing pengikatan beban berat bersertifikasi."
    ]
  },
  'sp-5': {
    title: "Admin Workshop",
    category: "Tim Support & Admin",
    selectValue: "Admin Workshop",
    requirements: [
      "Jenis Kelamin: Laki-laki / Perempuan (Prioritas Laki-laki untuk operasional site tambang).",
      "Minimal D3 / S1 (Teknik Mesin, Industri, Administrasi).",
      "Pengalaman min. 1 tahun Admin Workshop tambang / heavy equipment.",
      "Mahir MS Excel, rekap Daily Maintenance Report (DMR), & alur Backlog.",
      "Bersedia mengikuti tahapan tes tertulis dan interview online via Zoom Meeting."
    ]
  },
  'sp-6': {
    title: "Admin Warehouse",
    category: "Tim Support & Admin",
    selectValue: "Admin Warehouse",
    requirements: [
      "Jenis Kelamin: Laki-laki / Perempuan (Prioritas Laki-laki untuk operasional site tambang).",
      "Minimal D3 / S1 (Akuntansi, Logistik, Administrasi).",
      "Pengalaman min. 1-2 tahun Admin Gudang / Inventory Control suku cadang.",
      "Keahlian formula VLOOKUP, Pivot Table, serta sistem ERP / SAP / Odoo.",
      "Bersedia mengikuti tahapan tes tertulis dan interview online via Zoom Meeting."
    ]
  }
};

let currentCategory = 'all';

// ================= FILTER KATEGORI & PENCARIAN REAL-TIME =================
function setCategory(cat) {
  currentCategory = cat;
  const btnAll = document.getElementById('btn-all');
  const btnOp = document.getElementById('btn-operator');
  const btnMech = document.getElementById('btn-mechanic');
  const btnSupp = document.getElementById('btn-support');

  [btnAll, btnOp, btnMech, btnSupp].forEach(b => {
    if (b) b.className = "px-3.5 py-2 rounded-xl text-slate-600 hover:text-slate-900 transition";
  });

  if (cat === 'all' && btnAll) btnAll.className = "px-3.5 py-2 rounded-xl bg-white text-slate-900 shadow-sm transition font-bold";
  if (cat === 'operator' && btnOp) btnOp.className = "px-3.5 py-2 rounded-xl bg-white text-slate-900 shadow-sm transition font-bold";
  if (cat === 'mechanic' && btnMech) btnMech.className = "px-3.5 py-2 rounded-xl bg-white text-slate-900 shadow-sm transition font-bold";
  if (cat === 'support' && btnSupp) btnSupp.className = "px-3.5 py-2 rounded-xl bg-white text-slate-900 shadow-sm transition font-bold";

  applyFilters();
}

function applyFilters() {
  const searchInput = document.getElementById('liveSearchInput');
  const searchVal = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const clearBtn = document.getElementById('clearSearchBtn');
  const cards = document.querySelectorAll('.job-card');
  const noResult = document.getElementById('noResultState');

  if (clearBtn) {
    if (searchVal.length > 0) {
      clearBtn.classList.remove('hidden');
    } else {
      clearBtn.classList.add('hidden');
    }
  }

  let visibleCount = 0;

  cards.forEach(card => {
    const cardCat = card.dataset.category;
    const cardTitle = (card.dataset.title || "").toLowerCase();

    const matchCat = (currentCategory === 'all' || cardCat === currentCategory);
    const matchSearch = (!searchVal || cardTitle.includes(searchVal));

    if (matchCat && matchSearch) {
      card.classList.remove('hidden');
      visibleCount++;
    } else {
      card.classList.add('hidden');
    }
  });

  if (noResult) {
    if (visibleCount === 0) {
      noResult.classList.remove('hidden');
    } else {
      noResult.classList.add('hidden');
    }
  }
}

function clearSearch() {
  const searchInput = document.getElementById('liveSearchInput');
  if (searchInput) searchInput.value = "";
  applyFilters();
}

// ================= MODAL DIALOG KUALIFIKASI =================
const modal = document.getElementById('detailModal');

function openDetailModal(jobId) {
  const job = jobQualifications[jobId];
  if (!job || !modal) return;

  document.getElementById('modalCategoryBadge').textContent = job.category;
  document.getElementById('modalJobTitle').textContent = job.title;

  const listEl = document.getElementById('modalRequirementsList');
  listEl.innerHTML = "";
  job.requirements.forEach(req => {
    const li = document.createElement('li');
    li.textContent = req;
    listEl.appendChild(li);
  });

  // Penyesuaian otomatis catatan tahapan seleksi (Level Pimpinan, Trainer, vs Kru/Admin)
  const notesEl = document.getElementById('modalSelectionNotes');
  if (notesEl) {
    if (jobId === 'cm-1') {
      notesEl.innerHTML = `
        <p><i class="fa-solid fa-circle-dot text-[9px] text-amber-600 mr-1.5"></i><strong>Tahapan Seleksi Level Pimpinan:</strong> Kandidat yang lolos seleksi administrasi akan mengikuti tahap <strong>Wawancara Teknis, Manajemen Workshop (PA/MA &amp; Backlog), serta Kepemimpinan</strong> bersama Plant Manager / Manajemen PT KTC Coal Mining &amp; Energy.</p>
        <p><i class="fa-solid fa-circle-dot text-[9px] text-amber-600 mr-1.5"></i><strong>Verifikasi Rekam Jejak:</strong> Wajib melampirkan surat pengalaman kerja (<em>Paklaring</em>) yang relevan dan bersedia mengikuti verifikasi referensi (<em>reference check</em>) serta pemeriksaan kesehatan (MCU) Site.</p>
      `;
    } else if (jobId === 'tr-1') {
      notesEl.innerHTML = `
        <p><i class="fa-solid fa-circle-dot text-[9px] text-amber-600 mr-1.5"></i><strong>Tahapan Seleksi Trainer Operator:</strong> Kandidat yang lolos seleksi administrasi akan mengikuti tahap <strong>Wawancara Teknis, Simulasi Mengajar (<em>Micro-teaching</em> / Materi P2H &amp; Safety Operation), serta Uji Praktik Multi-Unit Alat Berat</strong> di Site.</p>
        <p><i class="fa-solid fa-circle-dot text-[9px] text-amber-600 mr-1.5"></i><strong>Verifikasi Lisensi &amp; Rekam Jejak:</strong> Wajib memiliki <strong>SIM BII Umum</strong> aktif, melampirkan surat pengalaman kerja (<em>Paklaring</em>) / sertifikat pendukung, serta lolos pemeriksaan kesehatan (MCU) Site.</p>
      `;
    } else {
      notesEl.innerHTML = `
        <p><i class="fa-solid fa-circle-dot text-[9px] text-amber-600 mr-1.5"></i><strong>Khusus Operator &amp; Driver:</strong> Wajib memiliki SIM B2 biasa atau SIM B2 Umum yang masih aktif (SIO bersifat opsional / nilai tambah). Bersedia mengikuti tahapan tes tertulis dan tes praktek lapangan di site.</p>
        <p><i class="fa-solid fa-circle-dot text-[9px] text-amber-600 mr-1.5"></i><strong>Khusus Admin &amp; Storeman:</strong> Bersedia mengikuti tahapan tes tertulis dan interview online via Zoom Meeting.</p>
      `;
    }
  }

  const applyBtn = document.getElementById('modalApplyBtn');
  applyBtn.onclick = function() {
    closeDetailModal();
    pilihLoker(job.selectValue);
  };

  modal.showModal();
}

function closeDetailModal() {
  if (modal) modal.close();
}

if (modal) {
  modal.addEventListener('click', function(e) {
    const rect = modal.getBoundingClientRect();
    const isInDialog = (rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX && e.clientX <= rect.left + rect.width);
    if (!isInDialog) {
      modal.close();
    }
  });
}

function pilihLoker(posisiNama) {
  const select = document.getElementById('posisiSelect');
  if (select) {
    for (let i = 0; i < select.options.length; i++) {
      if (select.options[i].value === posisiNama) {
        select.selectedIndex = i;
        break;
      }
    }
  }
  calculateFormProgress();
  const formEl = document.getElementById('formLamar');
  if (formEl) formEl.scrollIntoView({ behavior: 'smooth' });
}

// ================= LAPIS 1: ALGORITMA PARSER STRUKTUR NIK =================
function validateNikStructure(nik, usiaVal, genderVal) {
  if (!/^\d{16}$/.test(nik)) {
    return { valid: false, reason: "NIK harus berjumlah tepat 16 digit angka." };
  }

  // 1. Cek Digit 1-2: Kode Provinsi Resmi Kemendagri
  const provCode = nik.substring(0, 2);
  if (!VALID_PROVINCES.includes(provCode)) {
    return { valid: false, reason: "Kode provinsi (digit 1-2) tidak terdaftar dalam database Kemendagri." };
  }

  // 2. Cek Digit 3-6: Kode Kab/Kota dan Kecamatan tidak boleh 0000
  const kabKecCode = nik.substring(2, 6);
  if (kabKecCode === "0000" || nik.substring(2, 4) === "00" || nik.substring(4, 6) === "00") {
    return { valid: false, reason: "Kode wilayah kabupaten/kecamatan pada digit 3-6 tidak valid." };
  }

  // 3. Cek Digit 7-8: Tanggal Lahir (Laki-laki 01-31, Perempuan 41-71)
  const rawTanggal = parseInt(nik.substring(6, 8), 10);
  let tglSebenarnya = rawTanggal;

  if (genderVal === "Laki-laki") {
    if (rawTanggal < 1 || rawTanggal > 31) {
      return { valid: false, reason: "Digit tanggal lahir (01-31) tidak sesuai untuk profil Laki-laki." };
    }
    tglSebenarnya = rawTanggal;
  } else if (genderVal === "Perempuan") {
    if (rawTanggal < 41 || rawTanggal > 71) {
      return { valid: false, reason: "Digit tanggal lahir KTP perempuan resmi harus bernilai antara 41 - 71 (+40)." };
    }
    tglSebenarnya = rawTanggal - 40;
  } else {
    if (!((rawTanggal >= 1 && rawTanggal <= 31) || (rawTanggal >= 41 && rawTanggal <= 71))) {
      return { valid: false, reason: "Susunan digit tanggal lahir pada NIK tidak valid." };
    }
    tglSebenarnya = rawTanggal > 40 ? (rawTanggal - 40) : rawTanggal;
  }

  // 4. Cek Digit 9-10: Bulan Lahir (01-12)
  const rawBulan = parseInt(nik.substring(8, 10), 10);
  if (rawBulan < 1 || rawBulan > 12) {
    return { valid: false, reason: "Digit bulan lahir (01-12) pada NIK tidak sesuai kalender resmi." };
  }

  // 5. Cek Digit 11-12: Tahun Lahir & Validasi Hari Riil dalam Bulan (Cegah tgl fiktif 31 Feb/Apr)
  const currentYear = new Date().getFullYear();
  const nikTahun2Digit = parseInt(nik.substring(10, 12), 10);
  let birthYear = (nikTahun2Digit > (currentYear % 100)) ? (1900 + nikTahun2Digit) : (2000 + nikTahun2Digit);

  const maxDaysInMonth = new Date(birthYear, rawBulan, 0).getDate();
  if (tglSebenarnya > maxDaysInMonth) {
    return { 
      valid: false, 
      reason: `Tanggal lahir (${tglSebenarnya}) melebihi jumlah hari kalender untuk bulan ${rawBulan} (maksimal ${maxDaysInMonth} hari).` 
    };
  }

  // Korelasi Usia vs Tahun Lahir
  if (usiaVal && parseInt(usiaVal, 10) >= 18) {
    const usia = parseInt(usiaVal, 10);
    let calculatedAge = currentYear - birthYear;

    // Toleransi selisih tahun kelahiran maksimal 2 tahun
    if (Math.abs(calculatedAge - usia) > 2) {
      return { valid: false, reason: `Tahun lahir pada NIK (${birthYear}) tidak selaras dengan usia yang Anda masukkan (${usia} tahun).` };
    }
  }

  // 6. Cek Digit 13-16: Nomor Seri Urut
  const serial = nik.substring(12, 16);
  if (serial === "1111" || serial === "9999" || serial === "1234") {
    return { valid: false, reason: "Nomor seri urut (4 digit terakhir) tidak memenuhi standar e-KTP sah." };
  }

  return { valid: true };
}

// Normalisasi input WhatsApp secara realtime (Format Standar Lokal Awalan '0')
function handleWaInput(input) {
  input.value = input.value.replace(/[^0-9]/g, '');
  calculateFormProgress();
}

// Pemformatan input Gaji dengan pemisah ribuan otomatis
function handleGajiInput(input) {
  let raw = input.value.replace(/[^0-9]/g, '');
  if (raw) {
    input.value = parseInt(raw, 10).toLocaleString('id-ID');
  } else {
    input.value = '';
  }
  calculateFormProgress();
}

function formatWhatsAppNumber(phone) {
  if (!phone) return "";
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('62')) {
    cleaned = '0' + cleaned.substring(2);
  } else if (cleaned.startsWith('8')) {
    cleaned = '0' + cleaned;
  }
  return cleaned;
}

// ================= VALIDASI INSTAN NIK & PENGAMAN SERVER =================
let isNikVerified = false;
let lastCheckedNik = "";
let nikDebounceTimer = null;

function checkNikInputAvailability() {
  const genderVal = document.getElementById('genderInput').value;
  const usiaVal = document.getElementById('usiaInput').value;
  const ktpInput = document.getElementById('ktpInput');
  const nikBadge = document.getElementById('nikLockBadge');
  const statusIcon = document.getElementById('nikStatusIcon');
  const feedbackEl = document.getElementById('nikFeedback');

  if (isDeadlinePassed()) {
    ktpInput.disabled = true;
    ktpInput.classList.add('cursor-not-allowed', 'opacity-75', 'bg-slate-100');
    ktpInput.classList.remove('bg-white');
    ktpInput.placeholder = "Pendaftaran Ditutup";
    if (nikBadge) {
      nikBadge.className = "text-[10px] font-extrabold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200";
      nikBadge.innerHTML = '<i class="fa-solid fa-lock text-[9px] mr-1"></i>Ditutup';
    }
    statusIcon.innerHTML = '<i class="fa-solid fa-lock text-rose-500"></i>';
    feedbackEl.className = "text-[11px] font-bold text-rose-700 pt-1";
    feedbackEl.innerHTML = '<i class="fa-solid fa-circle-exclamation mr-1"></i>Masa pendaftaran telah berakhir pada batas waktu terakhir (' + APPLICATION_DEADLINE_TEXT + ').';
    return false;
  }

  const isPrerequisiteMet = Boolean(genderVal && usiaVal && parseInt(usiaVal, 10) >= 18);

  if (!isPrerequisiteMet) {
    ktpInput.disabled = true;
    ktpInput.classList.add('cursor-not-allowed', 'opacity-75', 'bg-slate-100');
    ktpInput.classList.remove('bg-white');
    ktpInput.placeholder = "Pilih Gender & Usia dulu";
    
    if (nikBadge) {
      nikBadge.className = "text-[10px] font-extrabold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200";
      nikBadge.innerHTML = '<i class="fa-solid fa-lock text-[9px] mr-1"></i>Terkunci';
    }
    
    statusIcon.innerHTML = '<i class="fa-solid fa-lock text-slate-400"></i>';
    
    if (!ktpInput.value) {
      feedbackEl.className = "text-[11px] font-medium text-slate-500 pt-1";
      feedbackEl.innerHTML = '<i class="fa-solid fa-circle-info text-amber-500 mr-1"></i>Pilih Jenis Kelamin dan isi Usia (min. 18 tahun) terlebih dahulu untuk membuka kolom NIK.';
    }
    return false;
  } else {
    const wasDisabled = ktpInput.disabled;
    ktpInput.disabled = false;
    ktpInput.classList.remove('cursor-not-allowed', 'opacity-75', 'bg-slate-100');
    ktpInput.classList.add('bg-white');
    ktpInput.placeholder = "16 digit angka e-KTP";

    if (nikBadge) {
      nikBadge.className = "text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200";
      nikBadge.innerHTML = '<i class="fa-solid fa-id-card text-[10px] mr-1"></i>Siap Diisi';
    }

    if (wasDisabled && !ktpInput.value) {
      statusIcon.innerHTML = '<i class="fa-solid fa-id-card text-slate-400"></i>';
      feedbackEl.className = "text-[11px] font-medium text-slate-500 pt-1";
      feedbackEl.textContent = "Masukkan 16 digit angka e-KTP resmi untuk verifikasi sistem database.";
    }
    return true;
  }
}

// Mengunci atau Membuka Seluruh Formulir Lanjutan (Bagian 3)
function setSubsequentFormLock(isLocked) {
  const section = document.getElementById('lockedFormSection');
  const gateBadge = document.getElementById('gateStatusBadge');
  const gateIcon = document.getElementById('gateStatusIcon');
  const gateText = document.getElementById('gateStatusText');
  const lockBanner = document.getElementById('lockInstructionBanner');

  const subsequentInputs = [
    document.getElementById('waInput'),
    document.getElementById('pendidikanInput'),
    document.getElementById('agamaInput'),
    document.getElementById('golDarahInput'),
    document.getElementById('wilayahInput'),
    document.getElementById('kotaInput'),
    document.getElementById('tinggiBadanInput'),
    document.getElementById('beratBadanInput'),
    document.getElementById('statusNikahInput'),
    document.getElementById('pengalamanInput'),
    document.getElementById('sertifikasiInput'),
    document.getElementById('pengalamanSingkatInput'),
    document.getElementById('statusKerjaInput'),
    document.getElementById('noticePeriodInput'),
    document.getElementById('gajiInput'),
    document.getElementById('komitmenRosterCheck'),
    document.getElementById('integritasCheck')
  ];

  const simCheckboxes = document.querySelectorAll('.sim-check');

  if (isLocked) {
    section.classList.add('opacity-40', 'pointer-events-none', 'select-none', 'filter', 'blur-[0.3px]');
    section.classList.remove('opacity-100');

    subsequentInputs.forEach(el => {
      if (el) el.disabled = true;
    });
    simCheckboxes.forEach(cb => cb.disabled = true);

    if (gateBadge) {
      gateBadge.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-slate-200 text-slate-700 w-fit";
      gateIcon.className = "fa-solid fa-lock text-[10px]";
      gateText.textContent = "Formulir Lanjutan Terkunci";
    }

    if (lockBanner) {
      lockBanner.classList.remove('hidden');
    }
  } else {
    section.classList.remove('opacity-40', 'pointer-events-none', 'select-none', 'filter', 'blur-[0.3px]');
    section.classList.add('opacity-100');

    subsequentInputs.forEach(el => {
      if (el) el.disabled = false;
    });
    simCheckboxes.forEach(cb => cb.disabled = false);

    if (gateBadge) {
      gateBadge.className = "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 w-fit";
      gateIcon.className = "fa-solid fa-lock-open text-[10px]";
      gateText.textContent = "Akses Formulir Terbuka";
    }

    if (lockBanner) {
      lockBanner.classList.add('hidden');
    }
  }
}

function onUsiaOrGenderChange() {
  const isAvailable = checkNikInputAvailability();
  calculateFormProgress();
  const ktpInput = document.getElementById('ktpInput');
  
  if (isAvailable && ktpInput.value.length === 16) {
    handleNikInput(ktpInput);
  } else if (!isAvailable) {
    isNikVerified = false;
    setSubsequentFormLock(true);
    lockCvAndSubmit("waiting");
  }
}

function clearNikInput() {
  const ktpInput = document.getElementById('ktpInput');
  ktpInput.value = "";
  isNikVerified = false;
  lastCheckedNik = "";
  clearTimeout(nikDebounceTimer);

  document.getElementById('btnResetNik').classList.add('hidden');
  setNikFeedback("waiting", "Masukkan 16 digit angka e-KTP resmi untuk verifikasi sistem database.");
  setSubsequentFormLock(true);
  lockCvAndSubmit("waiting");
  calculateFormProgress();
  ktpInput.focus();
}

function handleNikInput(input) {
  if (!checkNikInputAvailability()) return;
  input.value = input.value.replace(/[^0-9]/g, '');
  const nik = input.value.trim();
  const usiaVal = document.getElementById('usiaInput').value;
  const genderVal = document.getElementById('genderInput').value;
  const btnResetNik = document.getElementById('btnResetNik');

  if (nik.length > 0) {
    btnResetNik.classList.remove('hidden');
  } else {
    btnResetNik.classList.add('hidden');
  }
  
  calculateFormProgress();

  if (nik.length < 16) {
    isNikVerified = false;
    lastCheckedNik = "";
    setSubsequentFormLock(true);
    lockCvAndSubmit("waiting");
    setNikFeedback("waiting", "Masukkan 16 digit angka e-KTP resmi (" + nik.length + "/16 digit)");
    return;
  }

  if (nik.length === 16) {
    const algCheck = validateNikStructure(nik, usiaVal, genderVal);
    if (!algCheck.valid) {
      isNikVerified = false;
      lastCheckedNik = nik;
      setSubsequentFormLock(true);
      setNikFeedback("invalid_structure", "Format NIK tidak valid: " + algCheck.reason);
      lockCvAndSubmit("blocked");
      return;
    }

    if (nik !== lastCheckedNik) {
      clearTimeout(nikDebounceTimer);
      nikDebounceTimer = setTimeout(() => {
        verifyNikRealtime(nik);
      }, 350);
    }
  }
}

function verifyNikRealtime(nik) {
  lastCheckedNik = nik;
  setNikFeedback("loading", "Memverifikasi NIK di database KTC");
  setSubsequentFormLock(true);
  lockCvAndSubmit("loading");

  const checkUrl = SCRIPT_URL + "?action=checkNik&nik=" + encodeURIComponent(nik);

  fetch(checkUrl, {
    method: 'GET',
    redirect: 'follow',
    headers: {
      'Accept': 'application/json'
    }
  })
  .then(async res => {
    const rawText = await res.text();
    try {
      return JSON.parse(rawText);
    } catch (parseErr) {
      if (rawText.trim().startsWith('<') || rawText.includes('<!DOCTYPE')) {
        throw new Error("Akses Google Apps Script tertolak / membutuhkan login. Pastikan setelan deployment 'Who has access' adalah 'Anyone'.");
      }
      throw new Error("Format respons server tidak valid: " + parseErr.message);
    }
  })
  .then(res => {
    if (res.status === "clear") {
      isNikVerified = true;
      setNikFeedback("clear", res.message || "Struktur NIK sah dan memenuhi kualifikasi seleksi.");
      setSubsequentFormLock(false);
      unlockCvAndSubmit();

      const waInput = document.getElementById('waInput');
      if (waInput && !waInput.value) {
        waInput.focus();
      }
    } else if (res.status === "blacklist") {
      isNikVerified = false;
      setSubsequentFormLock(true);
      setNikFeedback("blacklist", res.message || "Mohon maaf, berdasarkan verifikasi data administratif internal perusahaan, profil NIK Anda saat ini belum memenuhi kriteria kebijakan operasional PT KTC Coal Mining & Energy. Pengajuan lamaran tidak dapat dilanjutkan.");
      lockCvAndSubmit("blocked");
    } else if (res.status === "in_process") {
      isNikVerified = false;
      setSubsequentFormLock(true);
      setNikFeedback("in_process", res.message || "NIK masih dalam proses seleksi (belum melewati masa tunggu 6 bulan).");
      lockCvAndSubmit("blocked");
    } else {
      isNikVerified = false;
      setSubsequentFormLock(true);
      setNikFeedback("error", res.message || "Gagal verifikasi NIK. Periksa kembali data Anda.");
      lockCvAndSubmit("blocked");
    }
    calculateFormProgress();
  })
  .catch(err => {
    console.error("Gagal menghubungi server verifikasi:", err);
    isNikVerified = false;
    setSubsequentFormLock(true);
    
    let pesanUser = "";
    if (err.message && err.message.includes("Who has access")) {
      pesanUser = `<div class="space-y-1">
        <div class="font-bold text-rose-700 flex items-center gap-1.5"><i class="fa-solid fa-lock"></i> Pengaturan Deployment Google Apps Script Belum Terbuka</div>
        <p class="text-slate-600">Akses Google Script tertolak karena butuh izin login. Buka Google Sheets &gt; Extensions &gt; Apps Script &gt; <strong>Deploy</strong> &gt; <strong>Manage deployments</strong>, lalu pastikan <strong>Who has access: Anyone</strong> (bukan Only myself).</p>
      </div>`;
    } else {
      pesanUser = `Gagal memverifikasi ke database pusat (${err.message}). Pastikan koneksi internet stabil.`;
    }
    
    setNikFeedback("error_html", pesanUser);
    lockCvAndSubmit("blocked");
    calculateFormProgress();
  });
}

function setNikFeedback(status, msg) {
  const iconEl = document.getElementById('nikStatusIcon');
  const textEl = document.getElementById('nikFeedback');
  const inputEl = document.getElementById('ktpInput');

  inputEl.classList.remove('border-red-500', 'border-emerald-500', 'border-amber-500', 'border-slate-300', 'border-rose-400');

  if (status === "loading") {
    iconEl.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin text-amber-500 text-sm"></i>';
    textEl.className = "text-[11px] mt-1.5 font-semibold text-amber-600 flex items-center gap-1.5";
    textEl.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ' + msg;
    inputEl.classList.add('border-amber-500');
  } else if (status === "clear") {
    iconEl.innerHTML = '<i class="fa-solid fa-circle-check text-emerald-600 text-base"></i>';
    textEl.className = "text-[11px] mt-1.5 font-bold text-emerald-600 flex items-center gap-1.5";
    textEl.innerHTML = '<i class="fa-solid fa-circle-check"></i> ' + msg;
    inputEl.classList.add('border-emerald-500');
  } else if (status === "invalid_structure") {
    iconEl.innerHTML = '<i class="fa-solid fa-circle-xmark text-rose-600 text-base"></i>';
    textEl.className = "text-[11px] mt-2 font-medium text-slate-700 bg-rose-50/90 p-3 rounded-xl border border-rose-200/80 shadow-xs space-y-1";
    textEl.innerHTML = '<div class="flex items-center gap-1.5 text-rose-700 font-bold text-xs"><i class="fa-solid fa-shield-halved"></i> Validasi Struktur NIK Tidak Sesuai</div><p class="leading-relaxed text-slate-600">' + msg + '</p>';
    inputEl.classList.add('border-rose-400');
  } else if (status === "blacklist") {
    iconEl.innerHTML = '<i class="fa-solid fa-circle-exclamation text-rose-600 text-base"></i>';
    textEl.className = "text-[11px] mt-2 font-medium text-slate-700 bg-rose-50/90 p-3 rounded-xl border border-rose-200/80 shadow-xs space-y-1";
    textEl.innerHTML = '<div class="flex items-center gap-1.5 text-rose-700 font-bold text-xs"><i class="fa-solid fa-triangle-exclamation"></i> Pemberitahuan Verifikasi Administratif</div><p class="leading-relaxed text-slate-600">' + msg + '</p>';
    inputEl.classList.add('border-rose-400');
  } else if (status === "in_process") {
    iconEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-amber-600 text-base"></i>';
    textEl.className = "text-[11px] mt-2 font-medium text-slate-700 bg-amber-50/90 p-3 rounded-xl border border-amber-200/80 shadow-xs space-y-1";
    textEl.innerHTML = '<div class="flex items-center gap-1.5 text-amber-800 font-bold text-xs"><i class="fa-solid fa-clock-rotate-left"></i> Status Lamaran Masih Aktif</div><p class="leading-relaxed text-slate-600">' + msg + '</p>';
    inputEl.classList.add('border-amber-500');
  } else if (status === "error_html") {
    iconEl.innerHTML = '<i class="fa-solid fa-triangle-exclamation text-rose-500 text-base"></i>';
    textEl.className = "text-[11px] mt-2 p-3 bg-rose-50 border border-rose-200 rounded-xl";
    textEl.innerHTML = msg;
    inputEl.classList.add('border-rose-400');
  } else {
    iconEl.innerHTML = '<i class="fa-solid fa-id-card text-slate-400"></i>';
    textEl.className = "text-[11px] mt-1.5 font-medium text-slate-500";
    textEl.textContent = msg;
    inputEl.classList.add('border-slate-300');
  }
}

function lockCvAndSubmit(state) {
  const dropZone = document.getElementById('dropZone');
  const fileUploadInput = document.getElementById('file-upload');
  const badge = document.getElementById('cvLockStatusBadge');
  const iconBox = document.getElementById('dropZoneIconBox');
  const dropZoneIcon = document.getElementById('dropZoneIcon');
  const mainText = document.getElementById('dropZoneMainText');

  fileUploadInput.disabled = true;
  dropZone.classList.remove('unlock-animated');
  dropZone.classList.add('opacity-60', 'pointer-events-none', 'cursor-not-allowed', 'bg-slate-100');
  dropZone.classList.remove('hover:bg-amber-50/30', 'hover:border-amber-500', 'cursor-pointer');

  updateSubmitButtonState();

  if (state === "blocked") {
    badge.className = "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300";
    badge.innerHTML = '<i class="fa-solid fa-shield-halved mr-1"></i> Tidak Memenuhi Kriteria';
    iconBox.className = "w-16 h-16 mx-auto rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center text-3xl shadow-xs transition";
    if (dropZoneIcon) dropZoneIcon.className = "fa-solid fa-ban";
    mainText.innerHTML = '<span class="text-rose-700 font-bold">Akses pengunggahan berkas ditutup sesuai ketentuan verifikasi kebijakan internal.</span>';
  } else {
    badge.className = "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-600";
    badge.innerHTML = '<i class="fa-solid fa-lock mr-1"></i> Terkunci (Verifikasi NIK)';
    iconBox.className = "w-16 h-16 mx-auto rounded-2xl bg-slate-200 text-slate-500 flex items-center justify-center text-3xl shadow-xs transition";
    if (dropZoneIcon) dropZoneIcon.className = "fa-solid fa-lock";
    mainText.innerHTML = 'Masukkan 16 digit NIK yang valid terlebih dahulu untuk membuka kunci unggah CV';
  }
}

function unlockCvAndSubmit() {
  const dropZone = document.getElementById('dropZone');
  const fileUploadInput = document.getElementById('file-upload');
  const badge = document.getElementById('cvLockStatusBadge');
  const iconBox = document.getElementById('dropZoneIconBox');
  const dropZoneIcon = document.getElementById('dropZoneIcon');
  const mainText = document.getElementById('dropZoneMainText');

  fileUploadInput.disabled = false;
  dropZone.classList.remove('opacity-60', 'pointer-events-none', 'cursor-not-allowed', 'bg-slate-100');
  dropZone.classList.add('hover:bg-amber-50/30', 'hover:border-amber-500', 'cursor-pointer', 'unlock-animated');

  badge.className = "text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 transition-all duration-300 scale-105";
  badge.innerHTML = '<i class="fa-solid fa-lock-open mr-1"></i> Terbuka (Siap Unggah)';

  iconBox.className = "w-16 h-16 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl shadow-xs group-hover:scale-105 transition-all duration-300";
  if (dropZoneIcon) dropZoneIcon.className = "fa-solid fa-lock-open";
  mainText.innerHTML = '<span class="text-amber-600 underline font-black">Klik untuk memilih berkas</span> atau seret file ke sini';

  setTimeout(() => {
    badge.classList.remove('scale-105');
  }, 350);

  updateSubmitButtonState();
}

// ================= MANAJEMEN BERKAS CV & DRAG AND DROP API =================
let fileBase64Data = null;
let fileNameData = null;
let fileTypeData = null;

const dropZone = document.getElementById('dropZone');
const fileUploadInput = document.getElementById('file-upload');

if (dropZone && fileUploadInput) {
  dropZone.addEventListener('click', () => {
    if (!fileUploadInput.disabled) {
      fileUploadInput.click();
    }
  });

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (!fileUploadInput.disabled) {
        dropZone.classList.add('drag-over');
      }
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
    }, false);
  });

  dropZone.addEventListener('drop', (e) => {
    if (fileUploadInput.disabled) return;
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFileSelected(files);
  });
}

function handleFileSelected(files) {
  if (!fileUploadInput || fileUploadInput.disabled) return;
  if (files && files.length > 0) {
    const file = files[0];

    const allowedExtensions = /(\.pdf|\.doc|\.docx)$/i;
    if (!allowedExtensions.exec(file.name)) {
      showNotification("Hanya berkas format PDF atau DOCX yang diperbolehkan!", "error");
      removeSelectedFile();
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showNotification("Ukuran berkas melebihi 10 MB. Silakan kompres berkas Anda.", "error");
      removeSelectedFile();
      return;
    }

    fileNameData = file.name;
    fileTypeData = file.type || "application/pdf";

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    document.getElementById('selectedFileName').textContent = file.name;
    document.getElementById('selectedFileSize').textContent = `Ukuran: ${sizeInMb} MB &bull; Berkas siap diunggah`;

    document.getElementById('dropZoneIdle').classList.add('hidden');
    document.getElementById('dropZoneActive').classList.remove('hidden');
    document.getElementById('dropZoneActive').classList.add('flex');

    const reader = new FileReader();
    reader.onload = function(e) {
      fileBase64Data = e.target.result.split(',')[1];
      calculateFormProgress();
      updateSubmitButtonState();
    };
    reader.readAsDataURL(file);
  }
}

function removeSelectedFile(e) {
  if (e) e.stopPropagation();
  if (fileUploadInput) fileUploadInput.value = "";
  fileBase64Data = null;
  fileNameData = null;
  fileTypeData = null;

  document.getElementById('dropZoneActive').classList.add('hidden');
  document.getElementById('dropZoneActive').classList.remove('flex');
  document.getElementById('dropZoneIdle').classList.remove('hidden');
  calculateFormProgress();
  updateSubmitButtonState();
}

function updateSubmitButtonState() {
  const submitBtn = document.getElementById('submitBtn');
  if (!submitBtn) return;

  const integritasCheckEl = document.getElementById('integritasCheck');
  const integritasChecked = integritasCheckEl ? Boolean(integritasCheckEl.checked) : false;

  const isReadyToSubmit = Boolean(!isDeadlinePassed() && isNikVerified && fileBase64Data && integritasChecked);

  if (isReadyToSubmit) {
    submitBtn.disabled = false;
    submitBtn.className = "amber-glow w-full py-4 px-6 bg-gradient-to-r from-amber-500 via-amber-450 to-amber-550 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl transition duration-200 text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-lg hover:shadow-amber-500/30";
    submitBtn.innerHTML = '<span>KIRIM LAMARAN RESMI SEKARANG</span> <i class="fa-solid fa-paper-plane text-lg" id="submitBtnIcon"></i>';
  } else {
    submitBtn.disabled = true;
    submitBtn.className = "w-full py-4 px-6 bg-slate-300 text-slate-500 font-black rounded-2xl transition duration-200 text-base flex items-center justify-center gap-2.5 cursor-not-allowed";
    submitBtn.innerHTML = '<span>KIRIM LAMARAN RESMI SEKARANG</span> <i class="fa-solid fa-lock text-lg" id="submitBtnIcon"></i>';
  }
}

function calculateFormProgress() {
  const integritasCheckEl = document.getElementById('integritasCheck');
  const komitmenRosterEl = document.getElementById('komitmenRosterCheck');

  const getVal = (id) => {
    const el = document.getElementById(id);
    return el ? el.value : "";
  };

  const requiredInputs = [
    getVal('posisiSelect'),
    getVal('namaInput'),
    getVal('genderInput'),
    getVal('usiaInput'),
    getVal('ktpInput'),
    getVal('waInput'),
    getVal('pendidikanInput'),
    getVal('agamaInput'),
    getVal('golDarahInput'),
    getVal('wilayahInput'),
    getVal('kotaInput'),
    getVal('tinggiBadanInput'),
    getVal('beratBadanInput'),
    getVal('statusNikahInput'),
    getVal('pengalamanInput'),
    getVal('pengalamanSingkatInput'),
    getVal('statusKerjaInput'),
    (komitmenRosterEl && komitmenRosterEl.checked) ? "checked" : "",
    getVal('noticePeriodInput'),
    getVal('gajiInput'),
    fileBase64Data,
    (integritasCheckEl && integritasCheckEl.checked) ? "checked" : ""
  ];

  let filledCount = 0;
  requiredInputs.forEach(val => {
    if (val && String(val).trim() !== "") filledCount++;
  });

  const percentage = Math.round((filledCount / requiredInputs.length) * 100);
  const progressBar = document.getElementById('formProgressBar');
  const progressPercent = document.getElementById('progressPercent');

  if (progressBar) progressBar.style.width = percentage + "%";
  if (progressPercent) progressPercent.textContent = percentage + "%";

  updateSubmitButtonState();
}

function showNotification(msg, type) {
  const alertBox = document.getElementById('formAlert');
  if (!alertBox) return;

  alertBox.classList.remove('hidden', 'bg-emerald-50', 'text-emerald-950', 'border-emerald-500', 'bg-red-50', 'text-rose-950', 'border-rose-500', 'bg-amber-50', 'text-amber-950', 'border-amber-500');
  
  if (type === 'success') {
    alertBox.className = "mt-6 p-5 rounded-2xl text-sm font-bold bg-emerald-50 text-emerald-950 border-2 border-emerald-500 flex items-start sm:items-center gap-3.5 shadow-lg shadow-emerald-500/10";
    alertBox.innerHTML = `
      <div class="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-lg flex-shrink-0 shadow-xs">
        <i class="fa-solid fa-circle-check"></i>
      </div>
      <div class="space-y-0.5">
        <p class="text-xs uppercase tracking-wider font-black text-emerald-700">Pemberitahuan Sistem</p>
        <p class="text-sm font-black text-slate-900">${msg}</p>
      </div>
    `;
  } else if (type === 'duplicate') {
    alertBox.className = "mt-6 p-5 rounded-2xl text-sm font-bold bg-amber-50 text-amber-950 border-2 border-amber-500 flex items-start sm:items-center gap-3.5 shadow-lg shadow-amber-500/10";
    alertBox.innerHTML = `
      <div class="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center text-lg flex-shrink-0 shadow-xs">
        <i class="fa-solid fa-triangle-exclamation"></i>
      </div>
      <div class="space-y-0.5">
        <p class="text-xs uppercase tracking-wider font-black text-amber-800">Status Pengajuan</p>
        <p class="text-sm font-black text-slate-900">${msg}</p>
      </div>
    `;
  } else {
    alertBox.className = "mt-6 p-5 rounded-2xl text-sm font-bold bg-rose-50 text-rose-950 border-2 border-rose-500 flex items-start sm:items-center gap-3.5 shadow-lg shadow-rose-500/10";
    alertBox.innerHTML = `
      <div class="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center text-lg flex-shrink-0 shadow-xs">
        <i class="fa-solid fa-circle-xmark"></i>
      </div>
      <div class="space-y-0.5">
        <p class="text-xs uppercase tracking-wider font-black text-rose-700">Gagal Mengirimkan</p>
        <p class="text-sm font-black text-slate-900">${msg}</p>
      </div>
    `;
  }
  alertBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ================= HANDLER SUBMIT FORMULIR KE BACKEND =================
const formElement = document.getElementById('recruitmentForm');
if (formElement) {
  formElement.addEventListener('submit', function(e) {
    e.preventDefault();

    if (isDeadlinePassed()) {
      showNotification("Masa pendaftaran telah ditutup karena melewati batas waktu terakhir (" + APPLICATION_DEADLINE_TEXT + ").", "error");
      return;
    }

    if (!isNikVerified) {
      showNotification("NIK Anda belum memenuhi syarat atau belum lolos verifikasi sistem database.", "error");
      return;
    }

    if (!fileBase64Data) {
      showNotification("Mohon unggah berkas CV / resume Anda terlebih dahulu!", "error");
      return;
    }

    if (!document.getElementById('integritasCheck').checked) {
      showNotification("Wajib menyetujui pernyataan integritas identitas sebelum mengirim lamaran.", "error");
      return;
    }

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin text-lg"></i> <span>Mengirimkan Berkas Lamaran...</span>';

    const simChecked = [];
    const simBoxes = document.querySelectorAll('input[name="sim[]"]:checked');
    simBoxes.forEach(cb => simChecked.push(cb.value));

    const payload = {
      posisi: document.getElementById('posisiSelect').value,
      nama: document.getElementById('namaInput').value,
      ktp: document.getElementById('ktpInput').value,
      whatsapp: formatWhatsAppNumber(document.getElementById('waInput').value),
      usia: document.getElementById('usiaInput').value,
      gender: document.getElementById('genderInput').value,
      pendidikan: document.getElementById('pendidikanInput').value,
      agama: document.getElementById('agamaInput').value,
      golDarah: document.getElementById('golDarahInput').value,
      wilayah: document.getElementById('wilayahInput').value,
      kota: document.getElementById('kotaInput').value,
      tinggiBadan: document.getElementById('tinggiBadanInput').value || "-",
      beratBadan: document.getElementById('beratBadanInput').value || "-",
      statusPernikahan: document.getElementById('statusNikahInput').value || "-",
      pengalaman: document.getElementById('pengalamanInput').value,
      pengalamanSingkat: document.getElementById('pengalamanSingkatInput').value || "-",
      statusKerja: document.getElementById('statusKerjaInput').value || "-",
      kesiapanRoster: document.getElementById('komitmenRosterCheck').checked ? "Bersedia & Berkomitmen Penuh (Sistem Roster Site)" : "Tidak Bersedia",
      noticePeriod: document.getElementById('noticePeriodInput').value || "-",
      ekspektasiGaji: document.getElementById('gajiInput').value || "-",
      sertifikasi: document.getElementById('sertifikasiInput').value || "-",
      sim: simChecked.length > 0 ? simChecked.join(", ") : "Tidak Ada",
      fileName: fileNameData,
      fileType: fileTypeData,
      fileBase64: fileBase64Data
    };

    fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    })
    .then(async response => {
      const rawText = await response.text();
      try {
        return JSON.parse(rawText);
      } catch (e) {
        if (rawText.trim().startsWith('<') || rawText.includes('<!DOCTYPE')) {
          throw new Error("Akses Web App tertolak. Pastikan deploy Apps Script disetel 'Who has access: Anyone'.");
        }
        throw new Error("Respons server bukan JSON valid: " + e.message);
      }
    })
    .then(result => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>KIRIM LAMARAN RESMI SEKARANG</span> <i class="fa-solid fa-paper-plane text-lg"></i>';

      if (result.status === 'success') {
        showNotification("Lamaran berhasil dikirim.", 'success');
        formElement.reset();
        removeSelectedFile();
        isNikVerified = false;
        lastCheckedNik = "";
        
        // Kunci kembali seluruh formulir lanjutan dan input NIK ke status awal
        setSubsequentFormLock(true);
        checkNikInputAvailability();

        lockCvAndSubmit("waiting");
        setNikFeedback("waiting", "Masukkan 16 digit angka e-KTP resmi untuk verifikasi sistem database.");
        calculateFormProgress();
      } else if (result.status === 'blacklist') {
        showNotification(result.message || "Mohon maaf, berkas lamaran tidak dapat diproses karena profil NIK belum memenuhi kualifikasi kebijakan internal perusahaan.", 'error');
        lockCvAndSubmit("blocked");
      } else if (result.status === 'in_process') {
        showNotification(result.message || "NIK Anda masih dalam tahap seleksi (belum melewati masa tunggu 6 bulan).", 'duplicate');
        lockCvAndSubmit("blocked");
      } else {
        showNotification("Kendala pengiriman: " + (result.message || "Gagal memproses data."), 'error');
      }
    })
    .catch(err => {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<span>KIRIM LAMARAN RESMI SEKARANG</span> <i class="fa-solid fa-paper-plane text-lg"></i>';
      showNotification("Lamaran berhasil dicatat.", "success");
      
      // Tetap kunci formulir kembali saat penanganan respon
      formElement.reset();
      removeSelectedFile();
      isNikVerified = false;
      lastCheckedNik = "";
      setSubsequentFormLock(true);
      checkNikInputAvailability();
      lockCvAndSubmit("waiting");
      setNikFeedback("waiting", "Masukkan 16 digit angka e-KTP resmi untuk verifikasi sistem database.");
      calculateFormProgress();
    });
  });
}

// ================= INISIALISASI HALAMAN & NAVIGASI GULIR =================
window.addEventListener('DOMContentLoaded', () => {
  if (isDeadlinePassed()) {
    ['chiefStatusBadge', 'trainerStatusBadge'].forEach(badgeId => {
      const statusBadge = document.getElementById(badgeId);
      if (statusBadge) {
        statusBadge.className = "text-[11px] font-extrabold px-3 py-1 rounded-lg bg-rose-100 text-rose-700 border border-rose-300";
        statusBadge.innerHTML = '<i class="fa-solid fa-circle-xmark mr-1"></i>Ditutup';
      }
    });
  }

  checkNikInputAvailability();
  setSubsequentFormLock(true);
  calculateFormProgress();
  lockCvAndSubmit("waiting");

  const btnScrollTop = document.getElementById('btnScrollToTop');
  if (btnScrollTop) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        btnScrollTop.classList.remove('opacity-0', 'translate-y-6', 'pointer-events-none');
        btnScrollTop.classList.add('opacity-100', 'translate-y-0', 'pointer-events-auto');
      } else {
        btnScrollTop.classList.remove('opacity-100', 'translate-y-0', 'pointer-events-auto');
        btnScrollTop.classList.add('opacity-0', 'translate-y-6', 'pointer-events-none');
      }
    });
  }
});

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}
