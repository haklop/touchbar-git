const {CompositeDisposable} = require('atom');
const path = require('path');

const remote = require('remote');
const {TouchBar} = remote;
const {TouchBarButton} = TouchBar;

const branchButton = 'touchbar-git-branch';

class TouchBarGit {

  constructor() {
    this.name = 'touchbar-git';

    this.activeItem = new CompositeDisposable();
    this.repositorySubscriptions = new CompositeDisposable();
    this.onDidChangeActivePaneItem = atom.workspace.getCenter().onDidChangeActivePaneItem(() => {
      this.subscribeToActiveItem();
    });

    this.onDidChangePaths = atom.project.onDidChangePaths(() => {
      this.subscribeToRepositories();
    });

    this.subscribeToActiveItem();

    this.branch = new TouchBarButton({
      label: '',
      backgroundColor: '#313440',
      iconPosition: 'left',
      icon: path.join(__dirname, 'branch.png')
    });
  }

  attachRegistry(touchbarRegistry) {
    this.touchbarRegistry = touchbarRegistry;
    this.subscribeToRepositories();

    this.update();
  }

  update() {
    const repo = this.getRepositoryForActiveItem();
    if (!repo) {
      return;
    }

    const head = repo.getShortHead(this.getActiveItemPath());

    if (head) {
      this.branch.label = head;
      if (!this.touchbarRegistry.getItem(branchButton)) {
        this.touchbarRegistry.addItem(this.branch, 50, branchButton);
      }
    } else {
      this.touchbarRegistry.removeItem(branchButton);
    }
  }

  dispose() {
    this.onDidChangePaths.dispose();
    this.activeItem.dispose();
    this.onDidChangeActivePaneItem.dispose();
    this.repositorySubscriptions.dispose();
  }

  subscribeToActiveItem() {
    this.activeItem.dispose();

    const activeItem = this.getActiveItem();
    if (!activeItem || activeItem.onDidSave !== 'function') {
      return;
    }

    this.activeItem = activeItem.onDidSave(() => {
      this.update();
    });
  }

  subscribeToRepositories() {
    this.repositorySubscriptions.dispose();
    this.repositorySubscriptions = new CompositeDisposable();

    atom.project.getRepositories().forEach(repo => {
      this.repositorySubscriptions.add(repo.onDidChangeStatus(path => {
        if (path === this.getActiveItemPath()) {
          this.update();
        }
      }));

      this.repositorySubscriptions.add(repo.onDidChangeStatuses(() => {
        this.update();
      }));
    });
  }

  getActiveItem() {
    return atom.workspace.getCenter().getActivePaneItem();
  }

  getActiveItemPath() {
    return this.getActiveItem() ? this.getActiveItem().getPath() : undefined;
  }

  getRepositoryForActiveItem() {
    const rootDir = atom.project.relativizePath(this.getActiveItemPath());
    const rootDirIndex = atom.project.getPaths().indexOf(rootDir);
    if (rootDirIndex > 0) {
      return atom.project.getRepositories()[rootDirIndex];
    }

    return atom.project.getRepositories()[0];
  }
}

module.exports = TouchBarGit;
