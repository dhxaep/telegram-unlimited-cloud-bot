const fs = require('fs');
const path = require('path');

const statePath = path.join(__dirname, '..', 'data.json');

const defaultState = {
  TARGET_GROUP_ID: null,
  totalFilesProcessed: 0,
  totalBytesProcessed: 0,
  statsByCategory: { image: 0, video: 0, pdf: 0, mp3: 0, custom: 0 },
  userTargetTopics: {},
  knownTopics: {}
};

module.exports = {
  data: { ...defaultState },
  
  load() {
    try {
      if (fs.existsSync(statePath)) {
        const raw = fs.readFileSync(statePath, 'utf8');
        const parsed = JSON.parse(raw);
        this.data = { ...defaultState, ...parsed };
        // Deep merge untuk stats
        this.data.statsByCategory = { ...defaultState.statsByCategory, ...(parsed.statsByCategory || {}) };
        console.log('State loaded from data.json');
      } else {
        this.save();
        console.log('Initialized new data.json');
      }
    } catch (e) {
      console.error('Failed to load data.json:', e);
    }
  },
  
  save() {
    try {
      fs.writeFileSync(statePath, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to save data.json:', e);
    }
  }
};
