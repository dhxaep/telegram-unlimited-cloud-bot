# Design Specification: /search Wizard, Delete Folder, & Menu Updates

## 1. Overview
Penambahan fitur pencarian interaktif (wizard) menggunakan inline keyboard, manajemen riwayat file (history), fitur hapus folder, serta perbaikan tampilan statistik pada menu utama bot Telegram Unlimited Storage.

## 2. Storage System: `files.json`
Karena sebelumnya bot tidak menyimpan rekam jejak (hanya melakukan forward/copy), kita menambahkan mekanisme penyimpanan history ke file lokal baru bernama `files.json`.
- **Lokasi**: Sama dengan `data.json` di root folder.
- **Tujuan**: Terpisah dari `data.json` agar operasi read/write stats tidak melambat jika jumlah history mencapai ribuan.
- **Struktur Data**:
  Array of object berisi metadata setiap file:
  ```json
  [
    {
      "id": "uniq_id_or_msg_id",
      "timestamp": 1700000000000,
      "type": "image",
      "folder": "univ",
      "link": "https://t.me/c/123456789/45/678",
      "name": "nama_file.pdf"
    }
  ]
  ```
- **Integrasi**: Di `src/handlers/router.js`, setelah perintah `copyMessage` berhasil dijalankan, push metadata file ke dalam memori array dan simpan ke `files.json`.

## 3. Fitur `/search` (Interactive Wizard)
Dipicu melalui command `/search` atau tombol **[ 🔍 Cari File ]** di `/menu`.

**Alur State Machine (Wizard):**
State sementara akan disimpan di memori (Map/Object) dengan ID user.
1. **Tahun**: Membaca unik tahun dari `files.json`.
   - UI: Tombol [2024], [2025], [2026], dll.
   - Opsi tambahan: [Lanjut (Pilih Semua)].
2. **Bulan**:
   - UI: Tombol [Januari], [Februari], dll (berdasarkan data yang ada).
   - Opsi tambahan: [Lihat Hasil (Skip)], [Lanjut ke Tanggal], [Batal].
3. **Tanggal**:
   - UI: Tombol [1], [2] ... [31].
   - Opsi tambahan: [Lihat Hasil (Skip)], [Lanjut ke Tipe File].
4. **Tipe**:
   - UI: Tombol [Image], [Video], [PDF], [MP3].
   - Opsi tambahan: [Lihat Hasil], [Semua Tipe].
5. **Folder**:
   - UI: Tombol list folder (topic) yang match.
6. **Eksekusi Akhir (Lihat Hasil)**:
   - Memfilter array history berdasarkan state.
   - Mengurutkan dari terbaru.
   - Mem-format ke string markdown: `[2026-09-27] pdf - univ - [Klik Disini](url)`
   - Karena limit Telegram (4096 char per pesan), pecah pesan menjadi array of text lalu kirimkan berurutan jika hasilnya sangat banyak.

## 4. Fitur Hapus Folder
- **Command**: `/rmfolder <nama_folder>` atau `/hapusfolder <nama_folder>`
- **Logic**:
  1. Cek apakah folder ada di `state.knownTopics`. Jika tidak, return error.
  2. Panggil API Telegram: `ctx.telegram.deleteForumTopic(GROUP_ID, thread_id)`.
  3. Hapus entri dari `state.knownTopics` lalu `state.save()`.
  4. Hapus semua riwayat file di `files.json` yang foldernya sesuai, simpan `files.json` agar pencarian tidak mengembalikan link rusak (topic sudah dihapus).

## 5. Pembaruan `/menu` dan Statistik
- **UI Menu**: Menambahkan tombol inline baru **[ 🔍 Cari File ]** di bawah daftar tombol yang sudah ada, yang men-trigger alur `/search`.
- **Tabel Statistik**:
  Pembaruan pada teks yang menampilkan statistik di command `/menu`.
  Karena Telegram tidak mendukung tabel HTML secara penuh, tabel akan dibentuk menggunakan blok monospaced ````text```` (via `parse_mode: 'Markdown'` atau `HTML`) agar spasinya konsisten dan rata.
  
  *Contoh format mock:*
  ```text
  STATISTIK STORAGE:
  +---------+------------+
  | TIPE    | JUMLAH     |
  +---------+------------+
  | Image   | 1,234      |
  | Video   | 500        |
  | PDF     | 32         |
  | MP3     | 10         |
  | Custom  | 4,020      |
  +---------+------------+
  TOTAL: 5,796 File
  RAM: 28.5 MB
  ```
