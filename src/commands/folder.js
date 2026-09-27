const state = require('../state');
const { Markup } = require('telegraf');

const addFolder = async (ctx) => {
  if (!state.data.TARGET_GROUP_ID) {
    return ctx.reply('Bot belum di-lock ke grup manapun. Silakan gunakan /lock di dalam grup storage Anda terlebih dahulu.');
  }

  const text = ctx.message.text.trim();
  const args = text.split(' ');
  if (args.length < 2) {
    return ctx.reply('Gunakan format: /add <nama_folder>\nContoh: /add univ');
  }

  const folderName = args.slice(1).join(' ').toLowerCase();

  // Cek apakah topic sudah ada di knownTopics
  if (!state.data.knownTopics[folderName]) {
    try {
      const topic = await ctx.telegram.createForumTopic(state.data.TARGET_GROUP_ID, folderName);
      state.data.knownTopics[folderName] = topic.message_thread_id;
    } catch (err) {
      console.error('Gagal membuat topic:', err.description);
      return ctx.reply(`Gagal membuat folder/topic: ${err.description}`);
    }
  }

  // Masukkan user ke dalam state folder
  const userId = String(ctx.from.id);
  state.data.userTargetTopics[userId] = {
    topicId: state.data.knownTopics[folderName],
    topicName: folderName
  };
  state.save();

  ctx.reply(
    `Mode Folder Aktif: [ ${folderName} ] 📁\nSemua file yang Anda kirim sekarang akan masuk ke topic ini.`,
    Markup.inlineKeyboard([
      Markup.button.callback('❌ Exit Folder', 'exit_folder')
    ])
  );
};

const exitFolder = async (ctx) => {
  const userId = String(ctx.from.id);
  if (state.data.userTargetTopics[userId]) {
    delete state.data.userTargetTopics[userId];
    state.save();
    const msg = 'Anda telah keluar dari Mode Folder. Routing kembali normal (otomatis ke image/video/pdf/mp3).';
    
    // Jika dari callback query (tombol)
    if (ctx.callbackQuery) {
      await ctx.answerCbQuery('Keluar dari folder.').catch(() => {});
      await ctx.editMessageText(msg).catch(() => {});
    } else {
      await ctx.reply(msg).catch(() => {});
    }
  } else {
    if (ctx.callbackQuery) await ctx.answerCbQuery('Tidak sedang dalam mode folder.').catch(() => {});
    else await ctx.reply('Anda sedang tidak berada di Mode Folder manapun.').catch(() => {});
  }
};

module.exports = {
  addFolder,
  exitFolder
};
