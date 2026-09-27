const state = require('../state');

module.exports = (ctx) => {
  const mem = process.memoryUsage();
  const rssMB = (mem.rss / 1024 / 1024).toFixed(2);
  const heapMB = (mem.heapUsed / 1024 / 1024).toFixed(2);

  // Pastikan data aman untuk di-load
  const totalFiles = state.data.totalFilesProcessed || 0;
  const totalBytes = state.data.totalBytesProcessed || 0;
  
  // Format total bytes ke MB atau GB
  let storageUsed = "";
  if (totalBytes > 1024 * 1024 * 1024) {
    storageUsed = (totalBytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
  } else {
    storageUsed = (totalBytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  const targetGroup = state.data.TARGET_GROUP_ID ? 'Locked 🔒' : 'Not Locked ❌';
  const folders = Object.keys(state.data.knownTopics || {}).length;

  const stats = state.data.statsByCategory || { image: 0, video: 0, pdf: 0, mp3: 0, custom: 0 };

  const msg = 
    `*📊 DASHBOARD UNLI-STORAGE* 📊\n\n` +
    `*Status Bot:* ${targetGroup}\n` +
    `*Total Kapasitas Terpakai:* ${storageUsed}\n` +
    `*Total Dokumen Masuk:* ${totalFiles} File\n` +
    `*Total Topic / Folder:* ${folders} Folder\n\n` +
    
    `*📂 Rincian Tipe File:*\n` +
    `🖼️ Images  : ${stats.image || 0}\n` +
    `🎥 Videos  : ${stats.video || 0}\n` +
    `🎵 Audio/MP3: ${stats.mp3 || 0}\n` +
    `📄 PDF/Docs: ${stats.pdf || 0}\n` +
    `📁 Custom Folder: ${stats.custom || 0}\n\n` +
    
    `*💻 Server Info:*\n` +
    `RAM Dipakai: ${rssMB} MB (Heap: ${heapMB} MB)`;

  ctx.reply(msg, { parse_mode: 'Markdown' });
};
