const TouchBarGit = {
  deactivate() {
    this.instance.dispose();
  },

  activate() {
    require('atom-package-deps').install('touchbar-git');
  },

  consumeTouchBar(touchbarRegistry) {
    this.touchbarRegistry = touchbarRegistry;
  }
};

module.exports = TouchBarGit;
