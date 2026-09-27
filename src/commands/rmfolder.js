const state = require('../state');
const history = require('../history');

module.exports = async (ctx) => {
  const folderName = ctx.message.text.split(' ').slice(1).join(' ').trim().toLowerCase();
  
  if (!folderName) {
    return ctx.reply('Mohon sertakan nama folder. Contoh: /rmfolder tugas_kuliah');
  }
  
  if (!state.data.knownTopics || !state.data.knownTopics[folderName]) {
    return ctx.reply(`Folder '${folderName}' tidak ditemukan di memori bot.`);
  }

  const topicId = state.data.knownTopics[folderName];

  try {
    // Delete topic on Telegram
    await ctx.telegram.deleteForumTopic(state.data.TARGET_GROUP_ID, topicId);
  } catch (err) {
    console.error(`Gagal menghapus topic ${topicId} di Telegram:`, err.description || err.message);
    await ctx.reply(`Peringatan: Gagal menghapus topic di Telegram (mungkin sudah terhapus manual). Tetap menghapus dari memori bot...`).catch(()=>{});
  }

  // Clean memory
  delete state.data.knownTopics[folderName];
  state.save();

  // Clean history
  history.deleteByFolder(folderName);

  return ctx.reply(`✅ Folder '${folderName}' berhasil dihapus secara permanen beserta riwayat pencariannya.`);
};
