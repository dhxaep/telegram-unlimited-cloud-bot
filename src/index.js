const { Telegraf, Markup } = require('telegraf');
const config = require('./config');
const state = require('./state');
const authMiddleware = require('./middleware/auth');
const menuCommand = require('./commands/menu');

// Load state dari data.json (jika ada)
state.load();

const bot = new Telegraf(config.BOT_TOKEN);

// Global Middleware: Hanya layani Owner
bot.use(authMiddleware);

const lockCommand = require('./commands/lock');
const { addFolder, exitFolder } = require('./commands/folder');
const rmFolder = require('./commands/rmfolder');
const statsCommand = require('./commands/stats');
const { startSearch, actionHandlers } = require('./commands/search');
const routerHandler = require('./handlers/router');

bot.command(['start', 'help', 'menu', 'stats', 'dashboard'], menuCommand);

bot.command('lock', lockCommand);
bot.command('add', addFolder);
bot.command('exit', exitFolder);
bot.command(['rmfolder', 'hapusfolder'], rmFolder);
bot.command('search', startSearch);

bot.action('exit_folder', exitFolder);
bot.action('btn_back', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  return menuCommand(ctx);
});

bot.action('btn_lock', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  return lockCommand(ctx);
});

bot.action('btn_help_add', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  const text = 'Ketik `/add <nama_folder>` di kolom obrolan untuk mengaktifkan mode folder.\nContoh: `/add tugas_kuliah`';
  return ctx.editMessageCaption(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('« Back', 'btn_back')]]) }).catch(() => {});
});

bot.action('btn_help_rmfolder', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  const text = 'Ketik `/rmfolder <nama_folder>` di kolom obrolan untuk menghapus folder secara permanen.\nContoh: `/rmfolder tugas_kuliah`';
  return ctx.editMessageCaption(text, { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('« Back', 'btn_back')]]) }).catch(() => {});
});

bot.action('btn_search', async (ctx) => {
  await ctx.answerCbQuery().catch(() => {});
  return startSearch(ctx);
});

actionHandlers.forEach(handler => {
  bot.action(handler.match, (ctx) => handler.handle(ctx, ctx.match));
});

bot.on('forum_topic_created', (ctx) => {
  const topicName = ctx.message.forum_topic_created.name.toLowerCase();
  const topicId = ctx.message.message_thread_id;
  state.data.knownTopics[topicName] = topicId;
  state.save();
  ctx.reply(`[Auto-Detect] Topic '${topicName}' berhasil dicatat bot!`);
});

bot.on('forum_topic_edited', (ctx) => {
  const newName = ctx.message.forum_topic_edited.name;
  if (newName) {
    const topicName = newName.toLowerCase();
    const topicId = ctx.message.message_thread_id;
    state.data.knownTopics[topicName] = topicId;
    state.save();
    ctx.reply(`[Auto-Detect] Nama topic diperbarui menjadi '${topicName}' dan dicatat bot!`);
  }
});

bot.on(['document', 'photo', 'video', 'audio', 'voice'], routerHandler);

bot.catch((err, ctx) => {
  console.error(`Error for ${ctx.updateType}`, err);
});

bot.launch().then(() => {
  console.log('Bot is up and running!');
}).catch(err => {
  console.error('Failed to start bot:', err);
});

process.once('SIGINT', () => { state.save(); bot.stop('SIGINT'); });
process.once('SIGTERM', () => { state.save(); bot.stop('SIGTERM'); });
