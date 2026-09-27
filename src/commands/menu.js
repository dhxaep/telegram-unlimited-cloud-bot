const { Markup } = require('telegraf');
const state = require('../state');

module.exports = (ctx) => {
  const name = ctx.from.first_name || 'Bosku';
  const mem = process.memoryUsage();
  const rssMB = (mem.rss / 1024 / 1024).toFixed(2);

  const totalFiles = state.data.totalFilesProcessed || 0;
  const totalBytes = state.data.totalBytesProcessed || 0;
  
  const storageUsed = totalBytes > 1024 * 1024 * 1024 
    ? (totalBytes / (1024 * 1024 * 1024)).toFixed(2) + " GB"
    : (totalBytes / (1024 * 1024)).toFixed(2) + " MB";

  const targetGroup = state.data.TARGET_GROUP_ID ? 'Terkunci 🔒' : 'Belum di-Set ❌';
  const folders = Object.keys(state.data.knownTopics || {}).length;
  const stats = state.data.statsByCategory || { image: 0, video: 0, pdf: 0, mp3: 0, custom: 0 };

  const menuText = 
    `✨ *Halo ${name}! Selamat datang di Chasire Bot UNLIMITED TELEGRAM CLOUD* ✨\n` +
    `Bot ini siap membantumu menyimpan file terorganisir di Telegram Group Topics! 🚀\n\n` +
    `📊 *STATISTIK*\n` +
    `💠 *Status Grup* : ${targetGroup}\n` +
    `💾 *Kapasitas* : ${storageUsed}\n` +
    `🗂️ *File* : ${totalFiles} | 📁 *Folder* : ${folders}\n\n` +
    `🖼️ Img: ${stats.image || 0} | 🎥 Vid: ${stats.video || 0} | 🎵 Aud: ${stats.mp3 || 0}\n` +
    `📄 PDF: ${stats.pdf || 0} | 🗃️ Cst: ${stats.custom || 0}\n\n` +
    `⚙️ *RAM*: ${rssMB} MB`;

  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🔒 Lock Grup', 'btn_lock'), Markup.button.callback('🔍 Cari File', 'btn_search')],
    [Markup.button.callback('📁 Buat Folder', 'btn_help_add'), Markup.button.callback('🗑 Hapus Folder', 'btn_help_rmfolder')],
    [Markup.button.callback('❌ Keluar Folder', 'exit_folder')]
  ]);

  const opts = { parse_mode: 'Markdown', ...keyboard };

  if (ctx.callbackQuery) {
    return ctx.editMessageCaption(menuText, opts).catch(() => {});
  }
  return ctx.replyWithPhoto({ source: './banner.png' }, { caption: menuText, ...opts });
};
