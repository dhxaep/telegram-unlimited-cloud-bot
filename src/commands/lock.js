const state = require('../state');

module.exports = async (ctx) => {
  // Hanya bisa dijalankan di grup/supergrup
  if (ctx.chat.type !== 'supergroup' && ctx.chat.type !== 'group') {
    return ctx.reply('Perintah /lock hanya bisa digunakan di dalam Grup (Supergroup) dengan fitur Forum (Topics) aktif.');
  }

  // Jika pindah grup, reset topic lama
  if (state.data.TARGET_GROUP_ID && state.data.TARGET_GROUP_ID !== ctx.chat.id) {
    state.data.knownTopics = {};
    state.data.userTargetTopics = {};
  }

  // Simpan Target Group ID ke state
  state.data.TARGET_GROUP_ID = ctx.chat.id;
  state.save();
  
  ctx.reply('Memulai proses penguncian grup dan pembuatan topic default... Mohon tunggu.');

  const defaultTopics = ['image', 'video', 'pdf', 'mp3'];
  let createdCount = 0;

  for (const topicName of defaultTopics) {
    if (!state.data.knownTopics[topicName]) {
      try {
        const topic = await ctx.telegram.createForumTopic(ctx.chat.id, topicName);
        state.data.knownTopics[topicName] = topic.message_thread_id;
        createdCount++;
      } catch (err) {
        console.error(`Gagal membuat topic ${topicName}:`, err.description);
        // Jika gagal karena nama sudah ada tapi ID tidak tercatat di bot,
        // user harus mengirim file secara manual pertama kali atau edit json manual.
        // Telegram API tidak mengizinkan list seluruh topik saat ini, jadi YAGNI:
        // Cukup ignore atau log.
      }
    }
  }

  state.save();

  ctx.reply(`Grup berhasil di-lock! 🔒\nBot sekarang akan mengirim semua file ke grup ini.\nTopic baru dibuat: ${createdCount}`);
};
