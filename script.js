// ==========================================
// 1. INISIALISASI & KONFIGURASI KUNCI
// ==========================================

// Inisialisasi ikon Lucide
lucide.createIcons();

// Konfigurasi API Pemrosesan AI Cloud Run
const API_URL = "https://predict-6ab2d25a6bb9b3c983aaa3e3-dproatj77a-et.a.run.app/predict";
const API_KEY = "ul_9d98f447b472dd3e8c04fc355b30638a02caf6c5";

// Pemetaan ID/Nama Class dari Model ke Nama Resmi Sistem
const CLASS_NAMES_MAP = {
    0: "Jamur Embun Jelaga",
    "JAMUR DAUN": "Jamur Embun Jelaga",
    1: "KUTU PUTIH",
    2: "Bacterial_Spot (BERCAK DAUN)",
    3: "LALAT BUAH",
    4: "tungau",
    5: "PENGGEREK BATANG",
    6: "Antraknosa",
    "JAMUR UPAS": "Antraknosa"
};

// Skema Warna Terang untuk Diagram Donut Dashboard
const DONUT_COLORS = [
    "#00e5ff", "#ff4b5c", "#ff66cc", "#1e50ff", 
    "#1e2b6a", "#ccff00", "#ffa500", "#a855f7", 
    "#10b981", "#f43f5e"
];

// Database Penanganan & Dosis Obat Hama
const PEST_DATABASE = {
    "KUTU PUTIH": {
        name: "Kutu Putih",
        penanganan: "Pangkas bagian tanaman yang terserang parah, atau semprot dengan air bertekanan tinggi untuk merontokkan kutu.",
        obat: "Insektisida Imidakloprid / Minyak Nimba (Organik)",
        takaran: "Imidakloprid: 0.5 - 1 ml per liter air | Minyak Nimba: 5 ml + 2 ml sabun cair per liter air."
    },
    "JAMUR EMBUN JELAGA": {
        name: "Jamur Embun Jelaga",
        penanganan: "Jaga sirkulasi udara di sekitar tajuk pohon dengan pemangkasan dan buang daun-daun yang gugur infeksius.",
        obat: "Fungisida Mankozeb atau Tembaga Hidroksida",
        takaran: "Mankozeb: 2 gram per liter air, semprotkan merata seminggu sekali."
    },
    "LALAT BUAH": {
        name: "Lalat Buah",
        penanganan: "Pasang perangkap lalat buah (Petrogenol) dan lakukan pembungkusan pada buah duku yang muda.",
        obat: "Atraktan Petrogenol / Insektisida Sipermetrin",
        takaran: "Petrogenol: 2-3 tetes pada kapas perangkap | Sipermetrin: 1 - 2 ml per liter air."
    },
    "BACTERIAL_SPOT (BERCAK DAUN)": {
        name: "Bacterial Spot (Bercak Daun)",
        penanganan: "Hindari penyiraman berlebih pada daun (gunakan sistem irigasi tetes) dan sanitasi lingkungan kebun.",
        obat: "Bakterisida / Fungisida Bahan Aktif Tembaga (Oksiklorida Tembaga)",
        takaran: "2 - 3 gram per liter air, disemprotkan pada pagi hari."
    },
    "TUNGAU": {
        name: "Tungau",
        penanganan: "Tingkatkan kelembaban udara dan semprot dengan aliran air kuat untuk merusak sarang tungau.",
        obat: "Akarisida (Bahan Aktif Abamektin)",
        takaran: "0.5 - 0.75 ml per liter air."
    },
    "ANTRAKNOSA": {
        name: "Antraknosa",
        penanganan: `
            <ul class="list-disc list-inside space-y-1">
                <li><strong>Waktu Penyemprotan:</strong> Pagi hari (sebelum 09.00) atau sore hari (setelah 15.00) saat cuaca cerah.</li>
                <li><strong>Interval Pencegahan:</strong> 7 - 10 hari sekali.</li>
                <li><strong>Interval Pengobatan (Serangan Parah):</strong> 3 - 5 hari sekali hingga gejala berkurang.</li>
                <li><strong>Perekat Sticker:</strong> Tambahkan perekat/penembus 1-2 ml/liter air terutama di musim hujan atau permukaan buah yang licin.</li>
                <li><strong>Pencegahan Resistensi:</strong> Rotasi penggunaan fungisida sistemik dan kontak setiap 2 kali aplikasi.</li>
            </ul>
        `,
        obat: "Fungisida Kontak/Sistemik (Bahan Aktif Azoksistrobin, Difenokonazol, atau Mankozeb)",
        takaran: "1 - 2 gram atau 0.5 - 1 ml per liter air disemprot secara merata pada area terinfeksi."
    },
    "PENGGEREK BATANG": {
        name: "Penggerek Batang",
        penanganan: "Bersihkan lubang gerekan pada batang menggunakan kawat kecil, buang ulat secara manual jika terlihat.",
        obat: "Insektisida Sistemik (Karbofuran / Karbosulfan)",
        takaran: "Sumbat lubang batang dengan kapas yang dibasahi larutan Karbosulfan (2 ml/liter) lalu tutup lubang dengan tanah liat."
    }
};

// State Data Dashboard (Client-Side Storage)
let totalImagesAnalyzed = 0;
let totalPestsFound = 0;
let pestCounts = {};
let donutChartInstance = null;
let currentFile = null;

// DOM Elements
const imageInput = document.getElementById('imageInput');
const uploadPreviewContainer = document.getElementById('uploadPreviewContainer');
const sourcePreview = document.getElementById('sourcePreview');
const btnAnalyze = document.getElementById('btnAnalyze');
const placeholderText = document.getElementById('placeholderText');
const loadingSpinner = document.getElementById('loadingSpinner');
const outputCanvas = document.getElementById('outputCanvas');
const resultsContainer = document.getElementById('resultsContainer');

// Dashboard Elements
const dashTotalImages = document.getElementById('dashTotalImages');
const dashTotalPests = document.getElementById('dashTotalPests');
const dashPestTypes = document.getElementById('dashPestTypes');
const allPestsContainer = document.getElementById('allPestsContainer');
const topClassesSubtext = document.getElementById('topClassesSubtext');
const topClassesLegend = document.getElementById('topClassesLegend');
const emptyChartOverlay = document.getElementById('emptyChartOverlay');
const btnExportPDF = document.getElementById('btnExportPDF');
const btnResetStats = document.getElementById('btnResetStats');


// ==========================================
// 2. EVENT LISTENERS & LOCALSTORAGE
// ==========================================

// Muat data tersimpan dari LocalStorage saat halaman pertama kali dibuka
window.addEventListener('DOMContentLoaded', () => {
    const savedImages = localStorage.getItem('dukuguard_total_images');
    const savedPests = localStorage.getItem('dukuguard_total_pests');
    const savedCounts = localStorage.getItem('dukuguard_pest_counts');

    if (savedImages) totalImagesAnalyzed = parseInt(savedImages, 10);
    if (savedPests) totalPestsFound = parseInt(savedPests, 10);
    if (savedCounts) pestCounts = JSON.parse(savedCounts);

    dashTotalImages.innerText = totalImagesAnalyzed;
    updateDashboardStats();
});

// Handler saat file gambar dipilih oleh pengguna
imageInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
        currentFile = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (evt) => {
            sourcePreview.src = evt.target.result;
            uploadPreviewContainer.classList.remove('hidden');
        };
        reader.readAsDataURL(currentFile);
    }
});

// Handler tombol Analisis Hama
btnAnalyze.addEventListener('click', async () => {
    if (!currentFile) return;

    placeholderText.classList.add('hidden');
    outputCanvas.classList.add('hidden');
    loadingSpinner.classList.remove('hidden');
    resultsContainer.innerHTML = '';

    try {
        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('conf', 0.15); 
        formData.append('iou', 0.7);
        formData.append('imgsz', 640);

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Server API HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        
        // Tambah penghitung total gambar
        totalImagesAnalyzed++;
        dashTotalImages.innerText = totalImagesAnalyzed;

        processDetectionResult(data);

    } catch (err) {
        console.error("API Error:", err);
        loadingSpinner.classList.add('hidden');
        placeholderText.classList.remove('hidden');
        resultsContainer.innerHTML = `
            <div class="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                <p class="font-bold">Gagal Menganalisis Gambar</p>
                <p class="text-xs mt-1">${err.message || 'Terjadi kesalahan koneksi ke server API.'}</p>
            </div>
        `;
    }
});

// Cetak Laporan PDF (Perbaikan Masalah Kertas Putih Polos)
if (btnExportPDF) {
    btnExportPDF.addEventListener('click', async () => {
        const element = document.getElementById('dashboardPrintContainer');

        // Indikator loading sementara
        const originalText = btnExportPDF.innerHTML;
        btnExportPDF.innerHTML = `<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Memproses PDF...`;
        lucide.createIcons();
        btnExportPDF.disabled = true;

        // Beri jeda agar rendering Chart.js canvas benar-benar stabil
        await new Promise(resolve => setTimeout(resolve, 500));

        const opt = {
            margin:       [0.3, 0.3, 0.3, 0.3],
            filename:     'Laporan_Deteksi_Hama_DukuGuard.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { 
                scale: 2, 
                useCORS: true, 
                logging: false,
                allowTaint: true,
                scrollX: 0,
                scrollY: 0
            },
            jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            btnExportPDF.innerHTML = originalText;
            btnExportPDF.disabled = false;
            lucide.createIcons();
        }).catch(err => {
            console.error("Gagal cetak PDF:", err);
            alert("Gagal mengunduh laporan PDF. Silakan coba lagi.");
            btnExportPDF.innerHTML = originalText;
            btnExportPDF.disabled = false;
            lucide.createIcons();
        });
    });
}

// Reset Data Statistik
if (btnResetStats) {
    btnResetStats.addEventListener('click', () => {
        if (confirm("Apakah Anda yakin ingin menghapus seluruh data statistik dashboard?")) {
            localStorage.removeItem('dukuguard_total_images');
            localStorage.removeItem('dukuguard_total_pests');
            localStorage.removeItem('dukuguard_pest_counts');

            totalImagesAnalyzed = 0;
            totalPestsFound = 0;
            pestCounts = {};

            dashTotalImages.innerText = "0";
            updateDashboardStats();
        }
    });
}


// ==========================================
// 3. FUNGSI PEMROSESAN & RENDERING CANVAS
// ==========================================

function processDetectionResult(data) {
    loadingSpinner.classList.add('hidden');

    const img = new Image();
    img.onload = () => {
        outputCanvas.width = img.width;
        outputCanvas.height = img.height;
        const ctx = outputCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        let rawDetections = [];
        if (Array.isArray(data)) {
            rawDetections = data;
        } else if (data.predictions && Array.isArray(data.predictions)) {
            rawDetections = data.predictions;
        } else if (data.results && Array.isArray(data.results)) {
            rawDetections = data.results;
        } else if (data.images && data.images[0] && data.images[0].results) {
            rawDetections = data.images[0].results;
        }

        const detectedClasses = new Set();

        rawDetections.forEach(det => {
            let rawLabel = det.name || det.label || det.class;
            let label = CLASS_NAMES_MAP[rawLabel] || CLASS_NAMES_MAP[det.class] || rawLabel;
            
            if (typeof label === 'string') {
                const checkLabel = label.toUpperCase().trim();
                if (checkLabel === "JAMUR DAUN") label = "Jamur Embun Jelaga";
                if (checkLabel === "JAMUR UPAS") label = "Antraknosa";
            }
            if (!label) label = "Hama";

            const conf = det.confidence || det.score || 0;
            detectedClasses.add(label.toString());

            // Catat Statistik ke Dashboard State
            totalPestsFound++;
            pestCounts[label] = (pestCounts[label] || 0) + 1;

            let x1, y1, x2, y2;

            if (det.box) {
                x1 = det.box.x1 !== undefined ? det.box.x1 : det.box[0];
                y1 = det.box.y1 !== undefined ? det.box.y1 : det.box[1];
                x2 = det.box.x2 !== undefined ? det.box.x2 : det.box[2];
                y2 = det.box.y2 !== undefined ? det.box.y2 : det.box[3];
            } else if (det.x !== undefined && det.width !== undefined) {
                x1 = det.x - det.width / 2;
                y1 = det.y - det.height / 2;
                x2 = det.x + det.width / 2;
                y2 = det.y + det.height / 2;
            }

            if (x1 !== undefined) {
                // Gambar Bounding Box
                ctx.strokeStyle = '#00e676';
                ctx.lineWidth = Math.max(3, Math.round(img.width / 200));
                ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);

                // Gambar Background Label
                ctx.fillStyle = '#00e676';
                const fontSize = Math.max(14, Math.round(img.width / 40));
                ctx.font = `bold ${fontSize}px sans-serif`;
                const text = `${label} (${(conf * 100).toFixed(0)}%)`;
                const textWidth = ctx.measureText(text).width;
                
                ctx.fillRect(x1, y1 > fontSize + 10 ? y1 - fontSize - 8 : y1, textWidth + 12, fontSize + 8);

                // Tulis Teks Nama Class
                ctx.fillStyle = '#1b4d3e';
                ctx.fillText(text, x1 + 6, y1 > fontSize + 10 ? y1 - 6 : y1 + fontSize);
            }
        });

        outputCanvas.classList.remove('hidden');
        
        // Perbarui tampilan Dashboard & Rekomendasi
        updateDashboardStats();
        renderPestRecommendations(Array.from(detectedClasses));
    };

    img.src = sourcePreview.src;
}


// ==========================================
// 4. FUNGSI LOGIKA DASHBOARD & CHART.JS
// ==========================================

function updateDashboardStats() {
    dashTotalPests.innerText = totalPestsFound;
    const uniqueTypes = Object.keys(pestCounts).length;
    dashPestTypes.innerText = uniqueTypes;

    // Simpan data terbaru ke LocalStorage
    localStorage.setItem('dukuguard_total_images', totalImagesAnalyzed);
    localStorage.setItem('dukuguard_total_pests', totalPestsFound);
    localStorage.setItem('dukuguard_pest_counts', JSON.stringify(pestCounts));

    // Render Panel Kiri (Progress Bars Semua Hama)
    const sortedPests = Object.entries(pestCounts).sort((a, b) => b[1] - a[1]);
    
    if (sortedPests.length > 0) {
        allPestsContainer.innerHTML = sortedPests.map(([name, count]) => {
            const percentage = totalPestsFound > 0 ? ((count / totalPestsFound) * 100).toFixed(1) : 0;
            return `
                <div class="space-y-1">
                    <div class="flex justify-between text-xs font-bold text-slate-700">
                        <span>${name}</span>
                        <span>${count} (${percentage}%)</span>
                    </div>
                    <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div class="bg-[#2e7d32] h-full rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    } else {
        allPestsContainer.innerHTML = `<p class="text-xs text-slate-400 py-12 text-center italic">Belum ada data deteksi. Lakukan analisis gambar di atas untuk melihat statistik.</p>`;
    }

    // Render Panel Kanan (Subteks Top Classes)
    topClassesSubtext.innerText = `${uniqueTypes} classes · ${totalPestsFound} predictions`;

    if (uniqueTypes > 0) {
        emptyChartOverlay.classList.add('hidden');

        const labels = sortedPests.map(item => item[0]);
        const counts = sortedPests.map(item => item[1]);
        const colors = labels.map((_, idx) => DONUT_COLORS[idx % DONUT_COLORS.length]);

        const chartCanvas = document.getElementById('topClassesChart');
        if (donutChartInstance) {
            donutChartInstance.destroy();
        }

        // Generate Chart.js Donut
        donutChartInstance = new Chart(chartCanvas, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: counts,
                    backgroundColor: colors,
                    borderWidth: 3,
                    borderColor: '#121417',
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '68%',
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const val = context.raw;
                                const pct = ((val / totalPestsFound) * 100).toFixed(1);
                                return ` ${context.label}: ${val} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Render Legenda Kanan Diagram
        topClassesLegend.innerHTML = sortedPests.map(([name, count], idx) => {
            const percentage = ((count / totalPestsFound) * 100).toFixed(1);
            const color = colors[idx % colors.length];
            return `
                <div class="flex items-center justify-between gap-3 text-xs py-0.5">
                    <div class="flex items-center gap-2 overflow-hidden">
                        <span class="w-3 h-3 rounded-md flex-shrink-0" style="background-color: ${color}"></span>
                        <span class="font-bold text-slate-100 truncate">${name}</span>
                    </div>
                    <span class="font-mono text-slate-300 flex-shrink-0">${count} · ${percentage}%</span>
                </div>
            `;
        }).join('');
    } else {
        emptyChartOverlay.classList.remove('hidden');
        topClassesLegend.innerHTML = `<p class="text-slate-500 text-center sm:text-left py-8 italic">Lakukan analisis gambar untuk melihat diagram prediksi.</p>`;
        if (donutChartInstance) {
            donutChartInstance.destroy();
            donutChartInstance = null;
        }
    }
}


// ==========================================
// 5. RENDERING KARTU REKOMENDASI OBAT
// ==========================================

function renderPestRecommendations(classList) {
    resultsContainer.innerHTML = '';

    if (!classList || classList.length === 0) {
        resultsContainer.innerHTML = `
            <div class="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-center">
                <i data-lucide="check-circle-2" class="w-10 h-10 mx-auto text-emerald-600 mb-2"></i>
                <p class="font-bold text-base">Tidak Terdeteksi Hama / Penyakit</p>
                <p class="text-xs text-emerald-700 mt-1">Tanaman duku terlihat sehat berdasarkan pengamatan model AI.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    classList.forEach(rawClassName => {
        let cleanRaw = rawClassName.trim().toUpperCase().replace(/_/g, " ");
        if (cleanRaw === "JAMUR DAUN") cleanRaw = "JAMUR EMBUN JELAGA";
        if (cleanRaw === "JAMUR UPAS") cleanRaw = "ANTRAKNOSA";

        let info = null;

        for (let key in PEST_DATABASE) {
            const cleanKey = key.trim().toUpperCase().replace(/_/g, " ");
            if (cleanRaw === cleanKey) {
                info = PEST_DATABASE[key];
                break;
            }
        }

        if (!info) {
            for (let key in PEST_DATABASE) {
                const cleanKey = key.trim().toUpperCase().replace(/_/g, " ");
                if (cleanRaw.includes(cleanKey) || cleanKey.includes(cleanRaw)) {
                    info = PEST_DATABASE[key];
                    break;
                }
            }
        }

        if (!info) {
            info = {
                name: rawClassName,
                penanganan: "Lakukan pemangkasan atau isolasi pada bagian tanaman yang terserang agar infeksi tidak merambat.",
                obat: "Gunakan pestisida/fungisida spektrum luas yang direkomendasikan untuk tanaman buah.",
                takaran: "Ikuti petunjuk dosis dan aturan pakai yang tertera pada kemasan produk."
            };
        }

        const cardHtml = `
            <div class="bg-white border-2 border-emerald-100 rounded-2xl p-5 shadow-sm space-y-3">
                <div class="flex items-center justify-between bg-emerald-50 -mx-5 -mt-5 p-4 rounded-t-2xl border-b border-emerald-100">
                    <div class="flex items-center gap-2 text-[#1b4d3e]">
                        <i data-lucide="bug" class="w-5 h-5 text-[#2e7d32]"></i>
                        <span class="font-bold text-base">${info.name}</span>
                    </div>
                    <span class="bg-[#ccff00] text-[#1b4d3e] text-xs font-black px-2.5 py-1 rounded-full uppercase">Terdeteksi</span>
                </div>

                <div class="text-sm space-y-2 pt-1">
                    <div>
                        <p class="font-bold text-slate-800 flex items-center gap-1.5 text-xs text-slate-500 uppercase tracking-wider mb-1">
                            <i data-lucide="wrench" class="w-3.5 h-3.5 text-emerald-600"></i> Rekomendasi Penanganan
                        </p>
                        <div class="text-slate-700 leading-relaxed text-xs sm:text-sm">${info.penanganan}</div>
                    </div>

                    <div>
                        <p class="font-bold text-slate-800 flex items-center gap-1.5 text-xs text-slate-500 uppercase tracking-wider">
                            <i data-lucide="pill" class="w-3.5 h-3.5 text-emerald-600"></i> Obat / Pestisida
                        </p>
                        <p class="text-slate-700 mt-0.5 font-semibold text-emerald-900 text-xs sm:text-sm">${info.obat}</p>
                    </div>

                    <div>
                        <p class="font-bold text-slate-800 flex items-center gap-1.5 text-xs text-slate-500 uppercase tracking-wider">
                            <i data-lucide="gauge" class="w-3.5 h-3.5 text-emerald-600"></i> Takaran & Dosis
                        </p>
                        <div class="mt-1 inline-block bg-amber-50 border border-amber-200 text-amber-900 px-3 py-1.5 rounded-lg text-xs font-bold">
                            ${info.takaran}
                        </div>
                    </div>
                </div>
            </div>
        `;

        resultsContainer.insertAdjacentHTML('beforeend', cardHtml);
    });

    lucide.createIcons();
}