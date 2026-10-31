# Requirements Document

## Expense & Budget Visualizer

## Introduction

Expense & Budget Visualizer adalah aplikasi web single-page untuk tracking pengeluaran pribadi dengan fitur visualisasi pie chart, monthly summary, dan spending limit alerts. Aplikasi ini membantu pengguna mengelola budget mereka dengan interface yang user-friendly, data visualization yang jelas, dan persistent storage menggunakan Local Storage browser.

## Glossary

- **Application**: Expense & Budget Visualizer web application
- **Transaction**: Satu entri pengeluaran yang terdiri dari Item Name, Amount, Category, dan Date
- **Category**: Klasifikasi pengeluaran (default: Food, Transport, Fun; atau custom)
- **Total Spending**: Jumlah kumulatif dari SEMUA recorded transactions di aplikasi (global total)
- **Monthly Spending**: Total pengeluaran untuk bulan dan tahun yang dipilih di Monthly Summary (distinct dari Total Spending global)
- **Monthly Summary**: Ringkasan pengeluaran untuk bulan dan tahun tertentu
- **Spending Limit**: Batas maksimal pengeluaran yang user tetapkan per bulan
- **Local Storage**: Browser's client-side persistent storage mechanism
- **Pie Chart**: Visualisasi grafik circular yang menunjukkan distribusi spending per kategori
- **IDR Format**: Rupiah dengan pemisah ribuan (Rp X.XXX atau Rp X.XXX.XXX)
- **Acceptance Criteria**: Kondisi terukur yang harus dipenuhi untuk requirement dianggap selesai
- **Timestamp**: Kombinasi tanggal dan waktu otomatis saat transaksi dibuat

---

## Requirements

### Requirement 1: Input Form dengan Validasi

**User Story:** Sebagai pengguna, saya ingin memasukkan data pengeluaran melalui form yang mudah digunakan dengan validasi yang jelas, sehingga saya bisa tracking pengeluaran dengan akurat.

#### Acceptance Criteria

1. THE Application SHALL menampilkan input form dengan 3 field wajib: Item Name, Amount, Category
2. WHEN pengguna klik dropdown Category, THE Application SHALL menampilkan opsi: Food, Transport, Fun (default), plus custom categories jika ada
3. WHEN pengguna isi ketiga field dan klik Submit button, THE Application SHALL menambahkan transaksi baru dengan timestamp otomatis
4. WHEN salah satu field tidak diisi, THE Application SHALL tampilkan error message spesifik per field (e.g., "Item Name wajib diisi")
5. WHEN Amount bukan angka positif atau Amount <= 0, THE Application SHALL tampilkan error message: "Jumlah harus angka positif"
6. WHEN transaksi berhasil ditambahkan, THE Application SHALL kosongkan semua field form dan set focus kembali ke Item Name field
7. WHEN Item Name panjangnya > 50 karakter, THE Application SHALL handle dengan menampilkan item dengan cara yang sesuai
8. THE Application SHALL capture transaction date dan time secara otomatis saat form disubmit
9. WHEN user klik tombol Submit dengan form kosong, THE Application SHALL tidak membuat transaksi dan tampilkan validation error

---

### Requirement 2: Transaction List dengan Tanggal

**User Story:** Sebagai pengguna, saya ingin melihat semua transaksi saya dalam list yang terorganisir dengan informasi lengkap dan mudah dibaca.

#### Acceptance Criteria

1. WHEN transaksi ditambahkan, THE Application SHALL tampilkan di transaction list dengan: Item Name, Amount (dalam format IDR), Category, dan Date
2. WHEN transaction list height melebihi 1 viewport height, THE Application SHALL membuat section ini scrollable independen (tidak affect header)
3. WHILE user scrolling transaction list, THE Application SHALL keep header section (form, total spending indicator) tetap terlihat dan tidak tertutup
4. WHEN transaksi ditambahkan atau dihapus, THE Application SHALL otomatis sort dengan transaksi terbaru di posisi teratas (descending date order)
5. WHEN transaction list kosong, THE Application SHALL tampilkan empty state message "Belum ada transaksi" dengan visual indicator (icon)
6. WHEN user hover pada transaksi item, THE Application SHALL tampilkan highlight effect dan tampilkan delete button untuk transaksi tersebut
7. THE Application SHALL menampilkan kategori dengan warna yang sesuai untuk memudahkan visual identification

---

### Requirement 3: Delete Transactions

**User Story:** Sebagai pengguna, saya ingin menghapus transaksi yang salah atau tidak diperlukan dengan mudah.

#### Acceptance Criteria

1. WHEN user klik delete button pada transaksi, THE Application SHALL hapus transaksi tersebut dari list
2. WHEN transaksi dihapus, THE Application SHALL update: Total Spending, Monthly Summary, Spending Limit Alert status, dan Pie Chart visualization
3. WHEN menghapus transaksi terakhir (list jadi kosong), THE Application SHALL tampilkan empty state dan clear semua chart/summary data
4. WHEN transaksi dihapus, THE Application SHALL otomatis save perubahan ke Local Storage
5. WHEN user melakukan delete action, THE Application SHALL tampilkan success message confirmation

---

### Requirement 4: Total Spending Display (IDR Format)

**User Story:** Sebagai pengguna, saya ingin melihat total pengeluaran saya dengan jelas di bagian paling atas aplikasi.

#### Acceptance Criteria

1. THE Application SHALL menampilkan Total Spending di area top/prominent dengan visual emphasis (ukuran besar, warna kontras, bold font)
2. WHEN transaksi ditambahkan atau dihapus, THE Application SHALL update total spending value dengan cepat
3. WHEN tidak ada transaksi, THE Application SHALL menampilkan Total Spending sebagai "Rp 0"
4. WHEN tampilkan amount value, THE Application SHALL gunakan format: "Rp X.XXX" dengan separator ribuan (contoh: "Rp 150.000")
5. WHEN amount >= 1 juta, THE Application SHALL format dengan separator jutaan: "Rp X.XXX.XXX" (contoh: "Rp 1.250.000")
6. THE Application SHALL menampilkan Total Spending sebagai total dari SEMUA recorded transactions di aplikasi (bukan hanya bulan terpilih)

---

### Requirement 5: Pie Chart Visualization

**User Story:** Sebagai pengguna, saya ingin melihat pie chart yang menunjukkan distribusi spending per kategori, sehingga saya bisa menganalisa pengeluaran saya.

#### Acceptance Criteria

1. WHEN ada minimal 1 transaksi, THE Application SHALL menampilkan pie chart yang visualisasi distribusi spending by kategori (Food, Transport, Fun, dan custom categories)
2. WHEN transaksi ditambahkan, dihapus, atau diubah, THE Application SHALL update pie chart visualization secara real-time
3. WHEN user hover pada pie chart slice, THE Application SHALL tampilkan tooltip berisi: "Category Name: Rp X.XXX (Y%)"
4. WHEN tidak ada transaksi, THE Application SHALL tampilkan message "Belum ada data" di area pie chart (tidak ada chart visual)
5. THE Application SHALL menggunakan Chart.js library untuk rendering pie chart dengan kualitas tinggi
6. THE Application SHALL assign warna unik per kategori (Food: merah/#FF6B6B, Transport: biru/#4ECDC4, Fun: kuning/#FFE66D, custom categories: unique colors)
7. WHEN pie chart data berubah, THE Application SHALL update visualization dengan clear

---

### Requirement 6: Custom Categories Management

**User Story:** Sebagai power user, saya ingin membuat kategori custom selain Food, Transport, Fun untuk mengorganisir pengeluaran sesuai kebutuhan saya.

#### Acceptance Criteria

1. THE Application SHALL keep Food, Transport, Fun sebagai permanent default categories (tidak bisa dihapus oleh user)
2. WHEN user klik "Add Category" button, THE Application SHALL tampilkan form dengan: input field untuk nama kategori dan opsi untuk assign warna kategori
3. WHEN user submit kategori baru, THE Application SHALL validate: nama tidak empty, tidak duplicate dengan existing categories (case-insensitive)
4. IF validation gagal, THE Application SHALL tampilkan error message spesifik (e.g., "Kategori sudah ada")
5. IF validation sukses, THE Application SHALL add kategori baru ke dropdown di form, tampilkan di pie chart, dan save ke Local Storage
6. WHEN user select custom category dalam input form, THE Application SHALL gunakan kategori tersebut untuk transaksi baru
7. WHEN user klik delete button pada custom category, IF kategori sudah dipakai oleh >= 1 transaksi:
   - THE Application SHALL tampilkan warning dialog: "Kategori ini sudah dipakai X transaksi. Pilih aksi: Reassign ke kategori lain atau Cancel delete"
   - User MUST choose: reassign transaksi ke kategori lain OR cancel delete operation
8. IF kategori tidak dipakai oleh transaksi manapun, THE Application SHALL hapus langsung setelah user confirm di dialog
9. WHEN custom category dihapus, THE Application SHALL otomatis update pie chart, monthly summary, dan semua referensi di UI

---

### Requirement 7: Monthly Summary

**User Story:** Sebagai pengguna, saya ingin melihat ringkasan pengeluaran per bulan dan analisis tren bulanan.

#### Acceptance Criteria

1. THE Application SHALL menampilkan Monthly Summary section dengan:
   - Month/Year selector (dropdown atau navigation arrow buttons untuk prev/next month)
   - Total spending untuk bulan terpilih (dalam IDR format)
   - Jumlah transaksi (transaction count) di bulan itu
   - Mini pie chart menunjukkan kategori distribution untuk bulan terpilih
2. WHEN user select bulan dan tahun berbeda via selector, THE Application SHALL update semua summary data untuk bulan itu
3. WHEN tidak ada transaksi di bulan terpilih, THE Application SHALL tampilkan message "Belum ada transaksi di bulan ini" dan kosongkan chart area
4. WHEN user add atau delete transaksi, THE Application SHALL update monthly summary real-time untuk bulan yang relevan
5. WHEN user hover pada mini pie chart di monthly summary, THE Application SHALL tampilkan tooltip: "Category Name: Rp X.XXX (Y%)"
6. THE Application SHALL default menampilkan current month (bulan dan tahun sekarang) saat aplikasi pertama kali dibuka
7. WHEN user navigate ke bulan berbeda, THE Application SHALL juga update Spending Limit Alert status untuk bulan itu
8. THE Application SHALL membuat mini pie chart dengan ukuran lebih kecil dari main pie chart tapi tetap readable

---

### Requirement 8: Spending Limit Alert

**User Story:** Sebagai pengguna, saya ingin set spending limit bulanan dan receive alert jika pengeluaran mendekati atau exceed limit.

#### Acceptance Criteria

1. THE Application SHALL menampilkan "Set Spending Limit" option/button di UI (dapat di settings area atau near Monthly Summary section)
2. WHEN user klik "Set Limit" button, THE Application SHALL tampilkan modal form dengan:
   - Input field untuk monthly limit amount (dalam rupiah)
   - Save button dan Cancel button
3. WHEN user submit limit amount, THE Application SHALL validate: amount harus angka positif > 0
4. IF validation gagal, THE Application SHALL tampilkan error message
5. IF validation sukses, THE Application SHALL store limit ke Local Storage dan tampilkan limit amount di Monthly Summary section
6. WHEN user dapat edit/update limit kapan saja dengan klik edit button di Monthly Summary
7. THE Application SHALL compare bulan terpilih's Monthly Spending vs limit dan tampilkan status dengan warna dan message:
   - NORMAL STATE: spending 0-79% dari limit â†’ GREEN color â†’ "Rp X tersisa dari limit Rp Y"
   - WARNING STATE: spending 80-99% dari limit â†’ ORANGE/YELLOW color â†’ "Perhatian! Sudah 80% dari limit"
   - EXCEEDED STATE: spending >= 100% dari limit â†’ RED color â†’ "Limit terlampaui Rp X"
8. WHEN transaksi ditambahkan atau dihapus di selected month, THE Application SHALL update limit status dengan responsif
9. WHEN user navigate ke bulan berbeda, THE Application SHALL show correct limit status untuk bulan itu
10. IF tidak ada limit set untuk selected month, THE Application SHALL tampilkan "Limit belum diatur" message dan allow user set limit

---

### Requirement 9: Persistent Data Storage

**User Story:** Sebagai pengguna, saya ingin semua data saya tersimpan otomatis dan tidak hilang saat menutup atau refresh browser.

#### Acceptance Criteria

1. WHEN user add, update, atau delete transaksi, THE Application SHALL auto-save perubahan ke Browser Local Storage
2. WHEN aplikasi dibuka atau di-refresh, THE Application SHALL otomatis load semua data dari Local Storage dan restore UI state
3. THE Application SHALL store di Local Storage:
   - Semua transactions (Item Name, Amount, Category, Date/Timestamp)
   - Custom categories dengan nama dan warna mereka
   - Monthly spending limit per bulan
4. WHEN user close browser tab/window dan buka aplikasi lagi, THE Application SHALL persist semua data (transactions tetap ada, categories tetap ada, limit tetap ada)
5. WHEN Local Storage penuh atau gagal (quota exceeded), THE Application SHALL tampilkan error message: "Storage penuh. Silakan clear data lama atau gunakan device berbeda."

---

### Requirement 10: Fully Responsive Multi-Device Design

**User Story:** Sebagai pengguna, saya ingin aplikasi bekerja dengan sempurna di semua device (mobile, tablet, desktop) tanpa layout issues.

#### Acceptance Criteria

Mobile Layout (â‰¤480px):

1. THE Application SHALL gunakan single column layout untuk semua sections
2. THE Application SHALL menampilkan form fields full width dengan stacked vertical arrangement
3. THE Application SHALL menampilkan transaction list cards full width, compact format, readable di mobile screen
4. WHEN pie chart ditampilkan, THE Application SHALL adapt width ke screen width minus padding (responsive width)
5. THE Application SHALL menampilkan monthly summary sections dalam stacked vertical arrangement
6. THE Application SHALL menampilkan spending limit card dalam compact card format
7. THE Application SHALL TIDAK ada horizontal scrolling dalam main content (hanya transaction list scrolls vertical)
8. THE Application SHALL gunakan touch-friendly interactive elements dengan minimum height 44px untuk buttons

Tablet Layout (481-1024px):

9. THE Application SHALL gunakan 2 column layout dimana appropriate
10. THE Application SHALL menampilkan: Left column (form + monthly summary stacked), Right column (transaction list jika space allows)
11. THE Application SHALL size charts appropriately untuk tablet screen
12. THE Application SHALL maintain readable spacing dan visual balance antar columns

Desktop Layout (>1024px):

13. THE Application SHALL gunakan dashboard/grid layout untuk optimal use of space
14. THE Application SHALL menampilkan: Top area (form + total spending prominent), Middle row (monthly summary + pie chart side-by-side), Bottom area (transaction list full width)
15. THE Application SHALL provide good spacing, balanced visual hierarchy, dan professional appearance
16. THE Application SHALL allow efficient use of large screens untuk menampilkan lebih banyak informasi

General Responsive Rules:

17. THE Application SHALL gunakan CSS Flexbox dan CSS Grid untuk layout (tidak fixed pixel widths)
18. THE Application SHALL gunakan responsive units (em, rem, %) untuk sizing (bukan px)
19. THE Application SHALL implement media queries dengan breakpoints: 480px (mobile), 1024px (tablet-to-desktop)
20. THE Application SHALL ensure smooth transitions antar breakpoints tanpa jarring layout changes
21. THE Application SHALL TIDAK ada overlapping elements, horizontal overflow, atau layout shift
22. THE Application SHALL ensure charts resize correctly within container constraints
23. THE Application SHALL scale typography dengan screen size: minimum 12px body text, maximum 32px heading
24. THE Application SHALL ensure semua interactive elements accessible dan touch-friendly di mobile

---

### Requirement 11: Clean, Professional Visual Design

**User Story:** Sebagai pengguna, saya ingin aplikasi terlihat modern, profesional, dan menyenangkan digunakan.

#### Acceptance Criteria

1. THE Application SHALL gunakan konsisten color scheme:
   - Default categories: Food (merah/#FF6B6B), Transport (biru/#4ECDC4), Fun (kuning/#FFE66D)
   - custom categories: unique colors
   - Primary accent colors untuk buttons, highlights, alerts
2. THE Application SHALL mengggunakan card-based layout design untuk sections (input form, monthly summary, chart area, transaction list)
3. WHEN user hover pada elemen interaktif (buttons, cards, charts), THE Application SHALL tampilkan subtle visual effect (opacity change, shadow, atau color shift)
4. THE Application SHALL maintain clear visual hierarchy: Heading 1 (largest, emphasis) > Heading 2 > Heading 3 > Body text
5. THE Application SHALL gunakan readable fonts dengan minimum size 12px untuk body text, minimum 16px untuk headings
6. THE Application SHALL gunakan konsisten spacing yang sesuai untuk layout yang clean dan professional
7. WHEN menampilkan success/error messages, THE Application SHALL gunakan visual distinction dengan warna berbeda (green untuk success, red untuk error)
8. WHEN data berubah, THE Application SHALL tampilkan visual update yang clear
9. THE Application SHALL default support light mode (dapat tambah dark mode di future enhancement)
10. WHEN form has validation error pada field, THE Application SHALL highlight field dengan red border atau background color untuk indicate error status

---

### Requirement 12: Strict Technical Requirements dan Constraints

**User Story:** Sebagai developer, saya ingin aplikasi dibangun dengan teknologi yang sesuai spec: Vanilla JavaScript, HTML, CSS, dan mengikuti folder structure yang tepat.

#### Acceptance Criteria

1. THE Application SHALL build menggunakan: HTML5, CSS3, Vanilla JavaScript (ES6+)
2. THE Application SHALL gunakan Chart.js library untuk rendering pie charts
3. THE Application SHALL NOT use: React, Vue, Angular, atau JavaScript frameworks apapun
4. THE Application SHALL NOT have: backend server, database, authentication system, atau API endpoints
5. THE Application SHALL gunakan Browser Local Storage API untuk client-side persistent data storage
6. THE Application SHALL follow folder structure:
   - index.html di root directory
   - Exactly 1 CSS file di css/ folder (e.g., css/style.css)
   - Exactly 1 JavaScript file di js/ folder (e.g., js/app.js)
   - Chart.js library dapat di-include via CDN atau local file
7. THE Application SHALL support dan tested di browsers: Chrome (latest), Firefox (latest), Edge (latest), Safari (latest)
8. THE Application SHALL NOT include: browser extensions, income tracking features, bank integrations, cloud sync, atau authentication
9. THE Application SHALL maintain clean, readable, well-commented, dan maintainable code structure
10. THE Application SHALL memiliki minimal dependencies (Chart.js only external library)

---

## Acceptance Criteria Summary Table

| Requirement | Count | Key Testable Properties |
|---|---|---|
| Req 1: Input Form | 9 | Validation, Format, Auto-save |
| Req 2: Transaction List | 7 | Display, Sort, Scroll behavior |
| Req 3: Delete Transactions | 5 | Delete action, Update cascade |
| Req 4: Total Spending | 5 | Format, Real-time update |
| Req 5: Pie Chart | 7 | Visualization, Animation, Tooltip |
| Req 6: Custom Categories | 9 | CRUD operations, Validation |
| Req 7: Monthly Summary | 8 | Filter, Display, Real-time |
| Req 8: Spending Limit | 10 | Set, Edit, Alert status |
| Req 9: Persistent Storage | 5 | Save, Load, Clear data |
| Req 10: Responsive Design | 18 | Multi-device, Breakpoints |
| Req 11: Visual Design | 10 | Colors, Layout, Effects |
| Req 12: Technical Specs | 10 | Tech stack, Folder structure |
| **TOTAL** | **111** | **All EARS patterns, testable** |

---

## Notes untuk Implementation

- Semua acceptance criteria menggunakan EARS patterns (Ubiquitous, Event-driven, State-driven, Unwanted event, Optional, Complex)
- Setiap requirement memiliki clear user story dengan benefit statement
- Acceptance criteria dirancang untuk be testable, verifiable, dan measurable
- Format IDR (Rp) dan responsive design adalah critical untuk user experience
- Data persistence menggunakan Local Storage harus reliable dan error-handled
- Visual design harus professional namun simple (no complex animations)
- Technical constraints enforce vanilla JS (no frameworks) untuk educational purpose

