const state = require('../state');
const history = require('../history');


// Simple Queue for Rate Limiting (Minimal 2 detik antar proses)
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let queuePromise = Promise.resolve();

module.exports = async (ctx) => {
  if (!state.data.TARGET_GROUP_ID) {
    return ctx.reply('Bot belum di-lock ke grup manapun. Gunakan /lock di grup tujuan.');
  }

  const userId = String(ctx.from.id);
  let targetTopicId = null;
  let category = null; // Pindahkan ke sini agar bisa diakses global

  // 1. Cek apakah user sedang dalam mode folder (/add univ)
  if (state.data.userTargetTopics[userId]) {
    targetTopicId = state.data.userTargetTopics[userId].topicId;
  } else {
    // 2. Jika tidak, route berdasarkan tipe pesan
    if (ctx.message.photo) category = 'image';
    else if (ctx.message.video) category = 'video';
    else if (ctx.message.audio || ctx.message.voice) category = 'mp3';
    else if (ctx.message.document) {
      // Sederhananya, anggap document adalah pdf/lainnya, route ke pdf
      if (ctx.message.document.mime_type && ctx.message.document.mime_type.includes('image')) {
        category = 'image';
      } else if (ctx.message.document.mime_type && ctx.message.document.mime_type.includes('video')) {
        category = 'video';
      } else {
        category = 'pdf'; 
      }
    }

    if (category && state.data.knownTopics[category]) {
      targetTopicId = state.data.knownTopics[category];
    }
  }

  // Jika tidak tahu harus ke mana (misal: text biasa atau file tidak dikenali), 
  // jangan dikirim ke General. Cukup hapus saja pesannya agar grup tetap bersih.
  if (!targetTopicId) {
    return ctx.deleteMessage().catch(() => {});
  }

  // Menghitung ukuran file
  let fileSize = 0;
  if (ctx.message.photo) {
    const photos = ctx.message.photo;
    fileSize = photos[photos.length - 1].file_size || 0;
  } else if (ctx.message.video) fileSize = ctx.message.video.file_size || 0;
  else if (ctx.message.document) fileSize = ctx.message.document.file_size || 0;
  else if (ctx.message.audio) fileSize = ctx.message.audio.file_size || 0;
  else if (ctx.message.voice) fileSize = ctx.message.voice.file_size || 0;

  // Track nama kategori stat
  const statCategory = state.data.userTargetTopics[userId] ? 'custom' : (category || 'custom');

  // Masukkan ke dalam antrean (Queue) agar Telegram tidak Flood Wait (Minimal 2 detik)
  queuePromise = queuePromise.then(async () => {
    try {
      // Pastikan state aman jika baru update
      if (!state.data.totalBytesProcessed) state.data.totalBytesProcessed = 0;
      if (!state.data.statsByCategory) state.data.statsByCategory = { image: 0, video: 0, pdf: 0, mp3: 0, custom: 0 };

      // Copy pesan ke target grup & topic
      const copiedMsg = await ctx.telegram.copyMessage(
        state.data.TARGET_GROUP_ID, 
        ctx.chat.id, 
        ctx.message.message_id, 
        { message_thread_id: targetTopicId }
      );

      // Simpan ke history
      let fileName = 'File';
      if (ctx.message.document) fileName = ctx.message.document.file_name || ctx.message.caption || 'Document';
      else if (ctx.message.photo) fileName = ctx.message.caption || 'Photo';
      else if (ctx.message.video) fileName = ctx.message.caption || 'Video';
      else if (ctx.message.audio) fileName = ctx.message.caption || ctx.message.audio.file_name || 'Audio';

      const rawGroupId = String(state.data.TARGET_GROUP_ID).replace('-100', '');
      const link = `https://t.me/c/${rawGroupId}/${targetTopicId}/${copiedMsg.message_id}`;

      history.addFile({
        id: copiedMsg.message_id,
        timestamp: Date.now(),
        type: statCategory,
        folder: state.data.userTargetTopics[userId] ? state.data.userTargetTopics[userId].topicName : (category || 'custom'),
        link: link,
        name: fileName
      });

      // Increment statistik
      state.data.totalFilesProcessed++;
      state.data.totalBytesProcessed += fileSize;
      if (state.data.statsByCategory[statCategory] !== undefined) {
        state.data.statsByCategory[statCategory]++;
      } else {
        state.data.statsByCategory.custom++;
      }
      state.save();
    } catch (err) {
      console.error('Gagal merouting file:', err.description);
    }

    // Hapus pesan asli user (jika di grup akan berhasil, jika di PC akan gagal)
    await ctx.deleteMessage().catch(() => {});

    // Beri jeda 2 detik sebelum file berikutnya boleh diproses
    await delay(2000);
  }).catch((err) => {
    console.error('Error pada queue limiter:', err);
  });
};
