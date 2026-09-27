# Telegram Unli-Storage Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Node.js Telegram bot that routes uploaded files into specific forum topics (acting as unlimited storage) with zero database dependencies, strictly serving a single owner.

**Architecture:** A monolithic Node.js script using `telegraf`. State is stored in a local `data.json` file to persist across panel restarts. A global Telegraf middleware enforces the `OWNER_ID` lock. Handlers are split by responsibility (commands, routing, stats).

**Tech Stack:** Node.js, `telegraf` (v4+), `dotenv`

**Spec:** `docs/superpowers/specs/2026-09-26-telegram-unli-storage-bot-design.md`

## Global Constraints
- **Zero Database:** No SQLite, Mongo, or local DB servers. Rely entirely on Telegram as DB and a local `data.json` file for ephemeral state persistence.
- **Node.js Panel Compatibility:** Code must run via a simple `node index.js` without transpilers (pure CommonJS or ES modules). Compatible with standard Pterodactyl/cPanel Node.js hosting.
- **Owner Isolation:** Every incoming request must be gated by `ctx.from.id === process.env.OWNER_ID`.

## Review Focus
- **Non-Owner Messages:** A user who is not the owner tries to send a file to the bot in PC. Expectation: Ignored silently.
- **State Persistence:** Server restarts. Expectation: `data.json` is read on boot, retaining `/lock` group and custom `/add` topics.
- **API Deletion Limits in PC:** Owner sends a file in PC. Expectation: File is forwarded to group, bot catches the API error when trying to delete the Owner's PC message, and execution continues smoothly.

---

### Task 1: Project Setup & State Initialization

**Files:**
- Create: `package.json`
- Create: `.env.example`
- Create: `src/config.js`
- Create: `src/state.js`

**Interfaces:**
- Produces: `config` object with `BOT_TOKEN` and `OWNER_ID`.
- Produces: `state` object holding `TARGET_GROUP_ID`, `totalFilesProcessed`, `userTargetTopics`, `knownTopics`.

- [ ] **Step 1: Initialize project and dependencies**
```bash
npm init -y
npm install telegraf dotenv
```

- [ ] **Step 2: Create `.env.example`**
```env
BOT_TOKEN=your_bot_token_here
OWNER_ID=123456789
```

- [ ] **Step 3: Implement `src/config.js`**
Parse `dotenv` and export `config`. Exit process if variables are missing.

- [ ] **Step 4: Implement `src/state.js`**
Implement read/write utility for `data.json`.
```javascript
const fs = require('fs');
const statePath = './data.json';
const defaultState = { TARGET_GROUP_ID: null, totalFilesProcessed: 0, userTargetTopics: {}, knownTopics: {} };

module.exports = {
  data: defaultState,
  load() { 
    if (fs.existsSync(statePath)) this.data = JSON.parse(fs.readFileSync(statePath));
    else this.save();
  },
  save() { fs.writeFileSync(statePath, JSON.stringify(this.data, null, 2)); }
};
```

---

### Task 2: Core Bot & Auth Middleware

**Files:**
- Create: `src/index.js`
- Create: `src/middleware/auth.js`
- Create: `src/commands/menu.js`

**Interfaces:**
- Consumes: `config` from Task 1.
- Produces: Running bot instance that ignores non-owner messages.

- [ ] **Step 1: Implement `src/middleware/auth.js`**
Export a Telegraf middleware function that calls `next()` only if `ctx.from && String(ctx.from.id) === String(config.OWNER_ID)`.

- [ ] **Step 2: Implement `src/commands/menu.js`**
Export a command handler for `/start`, `/help`, and `/menu` that replies with the list of commands.

- [ ] **Step 3: Implement `src/index.js`**
Initialize Telegraf, attach `auth.js` middleware via `bot.use()`, register `/menu` command, and call `bot.launch()`.

- [ ] **Step 4: Verify Auth**
Run `node src/index.js` and verify it ignores messages from a secondary account and responds to the owner's `/menu`.

---

### Task 3: Group Lock & Topic Initialization (`/lock`)

**Files:**
- Create: `src/commands/lock.js`
- Modify: `src/index.js`

**Interfaces:**
- Consumes: `state` from Task 1.
- Produces: `/lock` command handler.

- [ ] **Step 1: Implement `src/commands/lock.js`**
When `/lock` is called:
1. Ensure `ctx.chat.type` is 'supergroup'.
2. Set `state.data.TARGET_GROUP_ID = ctx.chat.id`.
3. For each default topic ("image", "video", "pdf", "mp3"): 
   Call `ctx.telegram.createForumTopic(ctx.chat.id, name)`. If it succeeds, save the `message_thread_id` to `state.data.knownTopics`. Handle `400 Bad Request` if topic already exists.
4. Call `state.save()`.

- [ ] **Step 2: Register in `src/index.js`**
Register `bot.command('lock', lockHandler)`.

---

### Task 4: Dynamic Folder Routing (`/add`, `/exit`)

**Files:**
- Create: `src/commands/folder.js`
- Modify: `src/index.js`

**Interfaces:**
- Consumes: `state` from Task 1.
- Produces: `/add` and `/exit` command handlers.

- [ ] **Step 1: Implement `/add` handler in `src/commands/folder.js`**
Parse the folder name from `ctx.message.text`. 
Check `state.data.TARGET_GROUP_ID`. If null, reply asking to `/lock` first.
Check if folder exists in `state.data.knownTopics`. If not, call `createForumTopic` and save it.
Set `state.data.userTargetTopics[ctx.from.id] = { topicId, topicName }`. Call `state.save()`. Reply with confirmation and an inline button to `/exit`.

- [ ] **Step 2: Implement `/exit` handler in `src/commands/folder.js`**
Delete `state.data.userTargetTopics[ctx.from.id]`. Call `state.save()`. Reply with "Folder mode exited." (Handle both command and callback_query).

- [ ] **Step 3: Register in `src/index.js`**
Register `/add`, `/exit` and action handlers.

---

### Task 5: File Routing Logic

**Files:**
- Create: `src/handlers/router.js`
- Modify: `src/index.js`

**Interfaces:**
- Consumes: `state` from Task 1.
- Produces: `bot.on(['document', 'photo', 'video', 'audio'])` handler.

- [ ] **Step 1: Implement router logic in `src/handlers/router.js`**
Determine destination `topicId`:
1. Check `state.data.userTargetTopics[ctx.from.id]`. If exists, use it.
2. Else, check mime-type / message properties. (photo -> 'image', video -> 'video', document.pdf -> 'pdf', audio -> 'mp3'). Lookup ID in `state.data.knownTopics`.

- [ ] **Step 2: Implement message copying and deletion**
Execute `ctx.telegram.copyMessage(state.data.TARGET_GROUP_ID, ctx.chat.id, ctx.message.message_id, { message_thread_id: topicId })`.
Execute `ctx.deleteMessage().catch(() => {})` (catch ignores failure in PC).
Increment `state.data.totalFilesProcessed++` and call `state.save()`.

- [ ] **Step 3: Register in `src/index.js`**
Register the handler for media events.

---

### Task 6: Dashboard (`/stats`)

**Files:**
- Create: `src/commands/stats.js`
- Modify: `src/index.js`

**Interfaces:**
- Consumes: `state` from Task 1.
- Produces: `/stats` command handler.

- [ ] **Step 1: Implement `src/commands/stats.js`**
Read `state.data.totalFilesProcessed`.
Call `process.memoryUsage()`, convert `rss` and `heapUsed` to MB.
Format reply message: "Total Dokumen: X | RAM: Y MB".

- [ ] **Step 2: Register in `src/index.js`**
Register `bot.command(['stats', 'dashboard'], statsHandler)`.
