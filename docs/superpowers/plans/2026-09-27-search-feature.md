# Search Feature & Delete Folder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan fitur riwayat penyimpanan file (tanpa DB), wizard pencarian bertahap menggunakan tombol inline (`/search`), dan fitur hapus folder (`/rmfolder`), serta memperbaiki tampilan statistik menu utama.

**Architecture:** Menggunakan array of JSON (yang disimpan di file) untuk tracking *file history* dan in-memory Map untuk mengatur flow state percakapan bot pada perintah pencarian.

**Tech Stack:** Node.js, telegraf (v4)

**Spec:** [docs/superpowers/specs/2026-09-27-search-and-delete-folder-design.md](file:///c:/Users/Gheffira/Downloads/FILE%20DHAFA2/kodingan/UNLI-STORAGE/docs/superpowers/specs/2026-09-27-search-and-delete-folder-design.md)

## Global Constraints
- Jangan gunakan database, cukup JSON array di `files.json`.
- State percakapan /search disimpan di memory RAM saja (Map/Object).
- Menjaga grup bersih, perintah /rmfolder dan filter tidak boleh memberatkan read/write di router utama.
- Telegraf versi 4.x digunakan, perhatikan pemanggilan `ctx.telegram` dan Action Handlers.

## Review Focus
- Memory leak di session state: session state pencarian bisa menjadi sampah di RAM jika tidak dihapus setelah selesai. Pastikan saat "Batal" atau "Lihat Hasil", state dihapus.
- File JSON corrupt: Proses penulisan history harus menangkap dan menelan `catch` error agar tidak merusak *bot routing*.
- Pesan terlalu panjang di Telegram: Hasil pencarian bisa sangat panjang. Pastikan dipecah maksimal 4096 karakter.
- Topic ID tidak ada di Telegram: Saat hapus folder, pastikan error API ditangkap jika grup tersebut salah/dihapus secara manual di luar bot.

---

### Task 1: Setup Storage Data (`src/history.js`)

**Files:**
- Create: `src/history.js`

**Interfaces:**
- Produces: `addFile(data)`, `getFiles()`, `deleteByFolder(folder)`

- [ ] **Step 1: Write `src/history.js` skeleton and logic**
```javascript
// Load files.json (jika ada), letakkan array di memory.
// addFile() -> push array, save fs
// getFiles() -> return array
// deleteByFolder(folder) -> filter array hapus yg foldernya match, save fs
```
- [ ] **Step 2: Uji penyimpanan manual dari file lain** (Manual / Unit Test jika ada).
- [ ] **Step 3: Commit**
```bash
git add src/history.js
git commit -m "feat: add history manager for files.json"
```

### Task 2: Integrasi History di `router.js`

**Files:**
- Modify: `src/handlers/router.js`

**Interfaces:**
- Consumes: `history.addFile()` dari Task 1

- [ ] **Step 1: Panggil addFile setelah copyMessage berhasil**
- [ ] **Step 2: Siapkan metadata `name`, `timestamp` (Date.now()), `link` (bisa di-derive via group ID, topic ID, dan message id).**
- [ ] **Step 3: Uji jalankan bot, kirim file, dan lihat apakah masuk ke `files.json`.**
- [ ] **Step 4: Commit**
```bash
git add src/handlers/router.js
git commit -m "feat: record incoming file metadata to history"
```

### Task 3: Wizard `/search` Command (`src/commands/search.js`)

**Files:**
- Create: `src/commands/search.js`
- Modify: `src/index.js` (daftarkan command & regex action handlers).

**Interfaces:**
- Consumes: `history.getFiles()`

- [ ] **Step 1: Buat state manager untuk /search**
```javascript
// const searchSessions = new Map();
// Simpan step dan kriteria search per user.
```
- [ ] **Step 2: Buat entry point `/search` untuk menampilkan tombol Tahun**
- [ ] **Step 3: Buat Action Handlers (Bulan, Tanggal, Tipe, Folder, Skip)**
  Gunakan `bot.action(/search_.+/, ...)` di `index.js`. Update pesan sebelumnya via `ctx.editMessageText()`.
- [ ] **Step 4: Buat fungsi render hasil pencarian dengan pagination (pecah array of link ke array of string per 4000 karakter).**
- [ ] **Step 5: Daftarkan di `index.js`**
- [ ] **Step 6: Jalankan dan pastikan action callback tidak loop/bocor. Uji tombol pembatalan.**
- [ ] **Step 7: Commit**
```bash
git add src/commands/search.js src/index.js
git commit -m "feat: interactive search wizard"
```

### Task 4: Hapus Folder (`/rmfolder`)

**Files:**
- Create: `src/commands/rmfolder.js`
- Modify: `src/index.js`

**Interfaces:**
- Consumes: `history.deleteByFolder()`

- [ ] **Step 1: Tulis logic /rmfolder**
Hapus dari Telegram (`ctx.telegram.deleteForumTopic`), hapus dari `state.knownTopics`, `state.save()`, lalu `history.deleteByFolder()`.
- [ ] **Step 2: Tangani catch jika folder tidak ada atau ID salah.**
- [ ] **Step 3: Daftarkan di `index.js`**
- [ ] **Step 4: Uji dengan membuat folder via `/add` lalu menghapusnya dengan `/rmfolder`.**
- [ ] **Step 5: Commit**
```bash
git add src/commands/rmfolder.js src/index.js
git commit -m "feat: rmfolder command to delete topic and clean history"
```

### Task 5: Perbaikan Statistik di `/menu`

**Files:**
- Modify: `src/commands/menu.js` (dan mungkin `src/commands/stats.js` jika terpisah).

**Interfaces:**
- Consumes: `/search` trigger (action `btn_search`).

- [ ] **Step 1: Update format pesan `/menu` menjadi monospace block untuk tabel.**
```javascript
// Ganti format string stats ke bentuk text table monospace.
```
- [ ] **Step 2: Tambahkan tombol `[ 🔍 Cari File ]` (action: `btn_search`).**
- [ ] **Step 3: Tambahkan action `btn_search` di `index.js` yang memanggil `searchCommand`.**
- [ ] **Step 4: Uji dengan mengetik `/menu` di grup atau PC, perhatikan kerapian.**
- [ ] **Step 5: Commit**
```bash
git add src/commands/menu.js src/commands/stats.js src/index.js
git commit -m "feat: updated menu stats format and added search button"
```
