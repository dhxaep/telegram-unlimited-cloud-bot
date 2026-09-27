const { Markup } = require('telegraf');
const history = require('../history');

const searchSessions = new Map();

function getSession(ctx) {
  const userId = ctx.from.id;
  if (!searchSessions.has(userId)) {
    searchSessions.set(userId, {});
  }
  return searchSessions.get(userId);
}

function getParts(ts) {
  const d = new Date(ts);
  return { y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() };
}

function filterFiles(session) {
  let files = history.getFiles();
  if (session.y) files = files.filter(f => getParts(f.timestamp).y === session.y);
  if (session.m) files = files.filter(f => getParts(f.timestamp).m === session.m);
  if (session.d) files = files.filter(f => getParts(f.timestamp).d === session.d);
  if (session.t) files = files.filter(f => f.type === session.t);
  if (session.f) files = files.filter(f => f.folder === session.f);
  return files;
}

// 1. Awal (Pilih Tahun)
async function startSearch(ctx) {
  searchSessions.set(ctx.from.id, {}); // reset
  const files = history.getFiles();
  
  if (files.length === 0) {
    return ctx.reply('Belum ada history file tersimpan.');
  }
  
  const years = [...new Set(files.map(f => getParts(f.timestamp).y))].sort((a,b) => b-a);
  const buttons = years.map(y => [Markup.button.callback(String(y), `src_y_${y}`)]);
  buttons.push([Markup.button.callback('Lanjut (Semua Tahun)', 'src_skip_y')]);
  buttons.push([Markup.button.callback('❌ Batal', 'src_cancel')]);
  
  const text = 'Pilih Tahun:';
  if (ctx.callbackQuery) {
    ctx.deleteMessage().catch(()=>{});
    ctx.answerCbQuery().catch(()=>{});
  }
  return ctx.reply(text, Markup.inlineKeyboard(buttons));
}

// 2. Pilih Bulan
async function askMonth(ctx) {
  const session = getSession(ctx);
  const files = filterFiles(session);
  const months = [...new Set(files.map(f => getParts(f.timestamp).m))].sort((a,b) => a-b);
  
  let buttons = [];
  let row = [];
  const monthNames = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  months.forEach(m => {
    row.push(Markup.button.callback(monthNames[m-1], `src_m_${m}`));
    if(row.length === 3) { buttons.push(row); row = []; }
  });
  if(row.length > 0) buttons.push(row);
  
  buttons.push([Markup.button.callback('Lihat Hasil', 'src_result')]);
  buttons.push([Markup.button.callback('Lanjut (Pilih Semua Bulan)', 'src_skip_m')]);
  buttons.push([Markup.button.callback('❌ Batal', 'src_cancel')]);
  
  await ctx.editMessageText(`Tahun terpilih: ${session.y || 'Semua'}\nPilih Bulan:`, Markup.inlineKeyboard(buttons)).catch(()=>{});
  return ctx.answerCbQuery().catch(()=>{});
}

// 3. Pilih Tanggal
async function askDate(ctx) {
  const session = getSession(ctx);
  const files = filterFiles(session);
  const dates = [...new Set(files.map(f => getParts(f.timestamp).d))].sort((a,b) => a-b);
  
  let buttons = [];
  let row = [];
  dates.forEach(d => {
    row.push(Markup.button.callback(String(d), `src_d_${d}`));
    if(row.length === 5) { buttons.push(row); row = []; }
  });
  if(row.length > 0) buttons.push(row);
  
  buttons.push([Markup.button.callback('Lihat Hasil', 'src_result')]);
  buttons.push([Markup.button.callback('Lanjut (Pilih Semua Tanggal)', 'src_skip_d')]);
  buttons.push([Markup.button.callback('❌ Batal', 'src_cancel')]);
  
  await ctx.editMessageText(`Bulan terpilih: ${session.m || 'Semua'}\nPilih Tanggal:`, Markup.inlineKeyboard(buttons)).catch(()=>{});
  return ctx.answerCbQuery().catch(()=>{});
}

// 4. Pilih Tipe
async function askType(ctx) {
  const session = getSession(ctx);
  const files = filterFiles(session);
  const types = [...new Set(files.map(f => f.type))];
  
  let buttons = [];
  types.forEach(t => {
    buttons.push([Markup.button.callback(String(t).toUpperCase(), `src_t_${t}`)]);
  });
  
  buttons.push([Markup.button.callback('Lihat Hasil', 'src_result')]);
  buttons.push([Markup.button.callback('Lanjut (Pilih Semua Tipe)', 'src_skip_t')]);
  buttons.push([Markup.button.callback('❌ Batal', 'src_cancel')]);
  
  await ctx.editMessageText(`Tanggal terpilih: ${session.d || 'Semua'}\nPilih Tipe File:`, Markup.inlineKeyboard(buttons)).catch(()=>{});
  return ctx.answerCbQuery().catch(()=>{});
}

// 5. Pilih Folder
async function askFolder(ctx) {
  const session = getSession(ctx);
  const files = filterFiles(session);
  const folders = [...new Set(files.map(f => f.folder))];
  
  let buttons = [];
  folders.forEach(f => {
    buttons.push([Markup.button.callback(`📂 ${f}`, `src_f_${f}`)]);
  });
  
  buttons.push([Markup.button.callback('Lihat Hasil', 'src_result')]);
  buttons.push([Markup.button.callback('Lanjut (Semua Folder)', 'src_skip_f')]);
  buttons.push([Markup.button.callback('❌ Batal', 'src_cancel')]);
  
  await ctx.editMessageText(`Tipe terpilih: ${session.t || 'Semua'}\nPilih Folder:`, Markup.inlineKeyboard(buttons)).catch(()=>{});
  return ctx.answerCbQuery().catch(()=>{});
}

// Tampilkan Hasil
async function showResult(ctx) {
  const session = getSession(ctx);
  let files = filterFiles(session);
  searchSessions.delete(ctx.from.id); // Clear memory
  
  if (files.length === 0) {
    await ctx.editMessageText('Tidak ditemukan file dengan filter tersebut.').catch(()=>{});
    return ctx.answerCbQuery().catch(()=>{});
  }

  // Sort dari yang terbaru
  files.sort((a,b) => b.timestamp - a.timestamp);
  
  // Hapus menu inline
  await ctx.editMessageText('Memproses hasil pencarian...').catch(()=>{});
  await ctx.answerCbQuery().catch(()=>{});

  let messageChunks = [];
  let currentChunk = `**Hasil Pencarian (${files.length} file):**\n\n`;

  files.forEach((f, idx) => {
    const d = new Date(f.timestamp);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const line = `${idx+1}. [${dateStr}] [${f.type.toUpperCase()}] 📂${f.folder} - [${f.name.replace(/\[|\]/g, '')}](${f.link})\n`;
    
    if (currentChunk.length + line.length > 4000) {
      messageChunks.push(currentChunk);
      currentChunk = line;
    } else {
      currentChunk += line;
    }
  });
  
  if (currentChunk.trim().length > 0) messageChunks.push(currentChunk);

  for (const chunk of messageChunks) {
    await ctx.reply(chunk, { parse_mode: 'Markdown', disable_web_page_preview: true }).catch((e)=> console.error('Error reply search:', e));
  }
}

// Action Handlers
const actionHandlers = [
  { match: /^src_y_(.+)$/, handle: async (ctx, match) => { getSession(ctx).y = parseInt(match[1]); return askMonth(ctx); } },
  { match: /^src_skip_y$/, handle: async (ctx) => { return askMonth(ctx); } },
  
  { match: /^src_m_(.+)$/, handle: async (ctx, match) => { getSession(ctx).m = parseInt(match[1]); return askDate(ctx); } },
  { match: /^src_skip_m$/, handle: async (ctx) => { return askDate(ctx); } },
  
  { match: /^src_d_(.+)$/, handle: async (ctx, match) => { getSession(ctx).d = parseInt(match[1]); return askType(ctx); } },
  { match: /^src_skip_d$/, handle: async (ctx) => { return askType(ctx); } },
  
  { match: /^src_t_(.+)$/, handle: async (ctx, match) => { getSession(ctx).t = match[1]; return askFolder(ctx); } },
  { match: /^src_skip_t$/, handle: async (ctx) => { return askFolder(ctx); } },
  
  { match: /^src_f_(.+)$/, handle: async (ctx, match) => { getSession(ctx).f = match[1]; return showResult(ctx); } },
  { match: /^src_skip_f$/, handle: async (ctx) => { return showResult(ctx); } },
  
  { match: /^src_result$/, handle: async (ctx) => { return showResult(ctx); } },
  { match: /^src_cancel$/, handle: async (ctx) => {
      searchSessions.delete(ctx.from.id);
      await ctx.editMessageText('Pencarian dibatalkan.').catch(()=>{});
      return ctx.answerCbQuery().catch(()=>{});
  }}
];

module.exports = { startSearch, actionHandlers };
