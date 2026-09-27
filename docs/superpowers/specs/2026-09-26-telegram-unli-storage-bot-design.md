# Design Specification: Telegram Unlimited Storage Bot

## Overview
A Telegram bot built with Node.js and `telegraf` that acts as a router for unlimited file storage using Telegram Group Forum Topics. It automatically categorizes incoming files into specific topics, creates new topics on demand, and relies on Telegram's native search capabilities (zero-database approach).

## Tech Stack
- **Runtime**: Node.js
- **Library**: `telegraf`
- **Database**: None (Ponytail approach: relies entirely on Telegram Group Topics and in-memory state).

## Core Workflows

### 1. Auto-Routing File (Group & Private Chat)
- **Triggers**: User (Owner) mengirim dokumen (PDF, dll), gambar, video, atau audio.
- **Logic**:
  - **Global Check**: Bot hanya memproses file jika ID pengirim adalah `OWNER_ID`.
  - Jika pesan dikirim di **Grup**: Bot akan **menghapus** pesan asli (agar grup tetap bersih).
  - Jika pesan dikirim via **Private Chat (PC)**: Bot menerima file tersebut, dan berusaha menghapusnya (Catatan Limitasi: Telegram API melarang bot menghapus pesan milik user di PC, jadi pesan di PC akan tetap terlihat, namun tetap diforward).
  - Bot menyalin (*copyMessage*) file tersebut ke dalam **Topic (Thread)** yang sesuai di dalam grup storage.
- **Kategori Default**:
  - `Image` (jpg, png, webp) -> Masuk ke topic Image
  - `Video` (mp4, hevc, mov) -> Masuk ke topic Video
  - `PDF` (pdf) -> Masuk ke topic PDF
  - `MP3/Audio` (mp3, ogg) -> Masuk ke topic MP3
- **Pencarian (Search)**:
  - Bot selalu mempertahankan *caption* dari file yang dikirim user.
  - User dapat mencari file dengan menggunakan fitur **Search** bawaan Telegram di dalam grup (berdasarkan nama file atau caption).

### 2. Dynamic Folder (Pembuatan Topic Otomatis)
- **Triggers**: Command `/add <nama_folder>` (contoh: `/add univ`).
- **Logic**:
  - Bot mengecek apakah topic "univ" sudah ada. Jika belum, bot memanggil API `createForumTopic` untuk membuat topic baru.
  - Bot menyimpan *state* sementara di memori (RAM) bahwa user sedang berada di mode "folder univ".
  - Setiap file yang dikirim oleh user tersebut setelahnya, akan masuk ke topic "univ", bukan ke kategori default (Image/PDF/dll).
- **Exit Mode**:
  - Bot menyertakan tombol inline `[ ❌ Exit ]` pada pesan konfirmasi, atau user bisa mengetik `/exit` untuk mereset *state* dan kembali ke routing default.

### 3. Penguncian Grup (Group Lock) & Owner ID
- **Triggers**: Command `/lock` dipanggil di dalam grup.
- **Logic**: 
  - Bot mengecek apakah ID pengirim adalah `OWNER_ID` (diatur di `.env`). **Hanya Owner yang dilayani oleh bot ini.**
  - Bot akan mengunci (`lock`) dirinya ke grup tersebut (menyimpan `GROUP_ID` ke memori).
  - Bot secara otomatis akan membuat 4 topic wajib jika belum ada: `image`, `video`, `pdf`, `mp3`.
  - Bot hanya akan merespon perintah dan menerima file jika dikirim ke grup yang sudah di-*lock* ini (atau PC dari Owner yang akan di-forward ke grup ini).

### 4. Dashboard Pemantauan
- **Triggers**: Command `/stats` atau `/dashboard` (hanya bisa diakses Owner).
- **Logic**:
  - Bot menampilkan status in-memory saat ini.
  - Menampilkan **Total Dokumen Masuk** (menggunakan counter sederhana di variabel).
  - Menampilkan **Memory Usage** (menggunakan `process.memoryUsage()` bawaan Node.js, 0 overhead).
  - Format: "Stats - Total file: 124 | RAM: 24 MB".

### 5. Menu Utama (/menu)
- **Triggers**: Command `/menu`, `/start`, atau `/help`.
- **Logic**:
  - Bot menampilkan daftar perintah jika pengirim adalah `OWNER_ID`.
  - Daftar menu:
    - `/add <folder>` - Mengarahkan file ke folder/topic tertentu.
    - `/exit` - Keluar dari mode folder.
    - `/lock` - Mengunci grup saat ini sebagai storage dan membuat 4 topic default.
    - `/stats` - Melihat statistik bot (RAM & total file).
  - Bot bisa juga merespon dalam bentuk *Inline Keyboard* untuk mempercantik UI.

## Data Structure (Local JSON)
Untuk menyimpan state (agar tidak hilang saat panel direstart), bot akan membaca dan menulis ke file `data.json` lokal. Pendekatan ini aman dan pasti berjalan di panel hosting Node.js tanpa perlu database SQL:

```javascript
// Struktur data.json
{
  "TARGET_GROUP_ID": 123456789,
  "totalFilesProcessed": 150,
  "userTargetTopics": {
    "987654321": { "topicId": 45, "topicName": "univ" }
  },
  "knownTopics": {
    "image": 12, "video": 14, "pdf": 16, "mp3": 18, "univ": 45
  }
}
```

## Setup Requirements (Lingkungan)
- Bot harus ditambahkan ke Grup yang fitur **Topics / Forum**-nya sudah diaktifkan.
- Bot harus diberi hak akses sebagai **Admin** di grup (khususnya hak *Delete Messages* dan *Manage Topics*).
- `OWNER_ID` akan dimasukkan ke dalam `.env` untuk keamanan mutlak (**Semua command dan proses file hanya akan berjalan jika `ctx.from.id === OWNER_ID`**).

## Trade-offs & Limitations (YAGNI / Ponytail Note)
1. **Pencarian**: Karena menggunakan search bawaan Telegram dan caption, jika file dikirim *tanpa* caption, file harus dicari manual.
2. **Penyimpanan State Sederhana**: Data disimpan dalam format file `.json` lokal. Jika file terhapus secara manual di panel, bot akan mereset konfigurasinya. Namun aman untuk kasus restart panel standar.
3. **Limitasi Hapus Pesan di PC**: API Telegram tidak mengizinkan bot menghapus pesan yang dikirim oleh user di Private Chat. Pesan user di PC akan tetap terlihat, meski bot sudah memindahkannya ke Grup.
