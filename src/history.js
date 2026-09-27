const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'files.json');

let fileHistory = [];

const history = {
  load() {
    try {
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8');
        fileHistory = JSON.parse(raw);
        console.log(`Loaded ${fileHistory.length} files from files.json`);
      } else {
        this.save();
        console.log('Initialized new files.json');
      }
    } catch (e) {
      console.error('Failed to load files.json:', e);
      fileHistory = [];
    }
  },

  save() {
    try {
      fs.writeFileSync(filePath, JSON.stringify(fileHistory, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to save files.json:', e);
    }
  },

  addFile(data) {
    // data: { id, timestamp, type, folder, link, name }
    fileHistory.push(data);
    this.save();
  },

  getFiles() {
    return fileHistory;
  },

  deleteByFolder(folderName) {
    const initialLength = fileHistory.length;
    fileHistory = fileHistory.filter(f => String(f.folder).toLowerCase() !== String(folderName).toLowerCase());
    
    if (fileHistory.length !== initialLength) {
      this.save();
      console.log(`Deleted ${initialLength - fileHistory.length} files from history for folder ${folderName}`);
    }
  }
};

// Initial load
history.load();

module.exports = history;
