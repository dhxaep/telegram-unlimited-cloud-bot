# 📦 Chasire Bot UNLIMITED TELEGRAM CLOUD

![Chasire Bot Banner](./banner.png)

<div align="center">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Telegraf-03A9F4?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegraf" />
  <img src="https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge" alt="MIT License" />
</div>

**Chasire Bot UNLIMITED TELEGRAM CLOUD** is an advanced Telegram bot that turns any Telegram Group (with Forum/Topics enabled) into your own personal unlimited cloud storage. This bot is designed to seamlessly archive and organize your files, photos, videos, and documents into specific topics.

This bot is **Private** by default, meaning it only responds to its *Owner* based on the configured `OWNER_ID`.

---

## 🌟 Key Features

- **Unlimited Storage**: Leverage Telegram's server capacity to store thousands of files without consuming your local storage.
- **Automatic Categorization**: The bot automatically creates and routes your files into default topics: `image`, `video`, `pdf`, and `mp3`.
- **Auto-Detect Custom Topics**: If you create a new topic manually in the group or rename an existing one, the bot smartly detects the change and updates its internal database automatically!
- **Custom Folder Management**: Create new folders/topics directly from the chat using `/add` and remove them using `/rmfolder`.
- **Internal Search Engine**: Search for previously uploaded files using the `/search` command. The bot provides a direct link to the file inside the group.
- **Statistics Dashboard**: Monitor your server's memory usage, total file size, and document breakdown using `/stats` or `/menu`.
- **Privacy & Security**: Built-in authentication middleware ensures that the bot only processes instructions from the Owner.

---

## ⚙️ System Requirements

- **Node.js** (v16 or newer recommended)
- **NPM** (installed automatically with Node.js)
- **Telegram Account** & **Bot Token** (from [@BotFather](https://t.me/BotFather))
- A **Telegram Group** configured as a Supergroup with the **Topics/Forum** feature enabled.

---

## 🛠️ Step-by-Step Setup Guide (Preventing Errors)

### Step 1: Create the Telegram Group
1. Open Telegram and create a **New Group**.
2. Go to the Group Settings (Manage Group).
3. Enable the **Topics** (or Forum) feature. *(Note: This is mandatory for the bot to organize files into folders!)*
4. Ensure the group type is a **Private Group**.

### Step 2: Set Up the Bot
1. Talk to [@BotFather](https://t.me/BotFather) and create a new bot. Save the **Bot Token**.
2. Invite your newly created bot to the group you just made.
3. **Promote the bot to Admin** in the group so it has permissions to manage topics and send messages.

### Step 3: Run the Code
1. Clone or download this repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Rename `.env.example` to `.env` (or create a new `.env` file) and fill it out:
   ```env
   BOT_TOKEN=123456789:ABCdefGHIjklmNOPqrsTUVwxyz
   OWNER_ID=123456789
   ```
   *(You can get your OWNER_ID from bots like `@userinfobot`)*
4. Start the bot:
   ```bash
   npm start
   ```

### Step 4: Lock the Bot to Your Group
1. Go to your **Telegram Group**.
2. Type the following command directly in the group chat:
   ```text
   /lock
   ```
3. The bot will save this group as its main database and automatically generate the default mandatory topics (`image`, `video`, `pdf`, `mp3`).

---

## 📖 How to Use

- **Upload Files**: Simply send or forward any file (photo, video, document, audio) to the Bot via **Private Message (DM)**. The bot will automatically forward and organize it into the correct topic in your storage group.
- **Create Custom Topics**: Type `/add <folder_name>` in the bot's DM. Any file you send afterward will be routed to this custom folder. Type `/exit` to stop.
- **Auto-Detect**: If you create a new topic manually inside the Telegram Group, the bot will instantly recognize it. You don't need to configure anything else!

---

## 💻 Commands Reference

| Command | Description |
| --- | --- |
| `/start`, `/help`, `/menu` | Displays the interactive menu and your storage statistics. |
| `/lock` | *(Use inside the Group)* Locks the group as your target storage database. |
| `/add <folder_name>` | Activates custom folder mode. |
| `/exit` | Exits custom folder mode and returns to automatic categorization. |
| `/rmfolder <folder_name>` | Deletes a custom folder/topic and clears its history from the bot. |
| `/search` | Opens the interactive file search feature. |
| `/stats`, `/dashboard` | Shows the current storage capacity status. |

---

*Built with ❤️ for unlimited and organized Telegram file management.*
