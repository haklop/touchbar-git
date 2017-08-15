const {CompositeDisposable} = require('atom');
const path = require('path');

const remote = require('remote');
const {TouchBar} = remote;
const {TouchBarButton, TouchBarPopover} = TouchBar;

const branchButtonId = 'touchbar-git-branch';

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

    // this.newBranchButton = new TouchBarButton({
    //   label: 'New branch',
    //   backgroundColor: '#313440',
    //   click: () => {
    //     console.log('new branch');
    //   }
    // });
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

    const references = repo.getReferences();
    const headsButtons = [];

    references.heads.forEach(head => {
      const ref = head.substring(11);
      headsButtons.push(new TouchBarButton({
        label: ref,
        backgroundColor: '#313440',
        click: () => {
          repo.checkoutReference(ref);
          this.touchbarRegistry.refresh();
        }
      }));
    });

    const branchButton = new TouchBarPopover({
      label: '',
      backgroundColor: '#313440',
      iconPosition: 'left',
      icon: path.join(__dirname, 'branch.png'),
      items: headsButtons
    });

    const head = repo.getShortHead(this.getActiveItemPath());
    if (head) {
      branchButton.label = head;
      this.touchbarRegistry.addItem(branchButton, 50, branchButtonId);
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
    if (this.getActiveItem() && this.getActiveItem().getPath === 'function') {
      return this.getActiveItem().getPath();
    }

    return undefined;
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
