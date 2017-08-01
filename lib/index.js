const TouchBarGit = require('./TouchBarGit');

const TouchBarGitWrapper = {
  instance: null,

  deactivate() {
    this.instance.dispose();
  },

  activate() {
    require('atom-package-deps').install('touchbar-git');
  },

  consumeTouchBar(touchbarRegistry) {
    if (!this.instance) {
      this.instance = new TouchBarGit();
    }
    this.instance.attachRegistry(touchbarRegistry);
  }
};

module.exports = TouchBarGitWrapper;
