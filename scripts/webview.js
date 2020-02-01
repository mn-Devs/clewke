class WebView {
  constructor() {
    this.element = document.createElement('webview')
    this.element.setAttribute('src', '')
    this.element.setAttribute('autosize', true)
    this.element.setAttribute('plugins', true)
    this.element.setAttribute('preload', './scripts/inject.js')
    this.element.setAttribute('webpreferences', '')
    this.element.style.width = '100%'
    this.element.style.height = '100%'

    this.isBookmarked = false
    this.isPrivate = false

    this.element.addEventListener('dom-ready', () => this.init())
    this.element.addEventListener('did-stop-load', () => {
      this.addHistoryEntry()
    })
  }

  init() {
    this.setupContextMenu()
    
  }

  addHistoryEntry() {
    let entry = {}
    entry.title = this.element.getTitle()
    entry.url = this.element.getURL()
    entry.time = new Date().getTime()
    remote.app.emit('add-history-entry', entry)
  }

  loadHome() {
    this.element.setAttribute('src', `file://${__dirname}/pages/home.html`)
    
  }

  loadNewTab() {
    this.element.setAttribute('src', `file://${__dirname}/pages/home.html`)
  }

  setupContextMenu() {
    const webviewElement = this.element
    const webcontents = webviewElement.getWebContents()
    webcontents.addListener('context-menu', (event, params) => {
      let menu = new remote.Menu()

      function addEditableMenu() {
        menu.append(new remote.MenuItem({label: 'Undo', enabled: params.editFlags.canUndo, click: () => webcontents.undo()}))
        menu.append(new remote.MenuItem({label: 'Redo', enabled: params.editFlags.canRedo, click: () => webcontents.redo()}))
        menu.append(new remote.MenuItem({label: 'Cut', enabled: params.editFlags.canCut, click: () => webcontents.cut()}))
        menu.append(new remote.MenuItem({label: 'Copy', enabled: params.editFlags.canCopy, click: () => webcontents.copy()}))
        menu.append(new remote.MenuItem({label: 'Paste', enabled: params.editFlags.canPaste, click: () => webcontents.paste()}))
        menu.append(new remote.MenuItem({label: 'Select All', enabled: params.editFlags.canSelectAll, click: () => webcontents.selectAll()}))
      }

      function addSelectionMenu() {
        const text = params.selectionText.substring(0, 10) + (params.selectionText.length > 10 ? '...' : '')
        if (process.platform === 'darwin') {
          menu.append(new remote.MenuItem({label: `Lookup "${text}"`, click: () => webcontents.showDefinitionForSelection()}))
        }
        menu.append(new remote.MenuItem({label: `Search "${text}"`}))
      }

      function addLinkMenu() {
        const link = params.linkURL
        menu.append(new remote.MenuItem({label: 'Open link in new tab', click: () => {
          let event = new Event('new-tab-by-user')
          event.url = link
          webviewElement.dispatchEvent(event)
        }}))
        menu.append(new remote.MenuItem({label: 'Open link in new background tab', click: () => {
          let event = new Event('new-background-tab-by-user')
          event.url = link
          webviewElement.dispatchEvent(event)
        }}))
        menu.append(new remote.MenuItem({label: 'Open link in new window'}))
        menu.append(new remote.MenuItem({label: 'Copy link address', click: () => remote.clipboard.writeText(link)}))
        menu.append(new remote.MenuItem({label: 'Save target link as', click: () => webcontents.downloadURL(link)}))
      }

      function addImageMenu() {
        const link = params.srcURL
        menu.append(new remote.MenuItem({label: 'Open image in new tab', click: () => {
          let event = new Event('new-tab-by-user')
          event.url = link
          webviewElement.dispatchEvent(event)
        }}))
        menu.append(new remote.MenuItem({label: 'Copy image address', click: () => remote.clipboard.writeText(link)}))
        menu.append(new remote.MenuItem({label: 'Save image as', click: () => webcontents.downloadURL(link)}))
      }
      
      function addSeparator() {
        menu.append(new remote.MenuItem({type: 'separator'}))
      }

      if (params.isEditable) {
        addEditableMenu()
        addSeparator()
      } else {
        if (params.selectionText !== '') {
          addSelectionMenu()
          addSeparator()
        }

        if (params.linkURL !== '') {
          addLinkMenu()
          addSeparator()
        }

        if (params.mediaType === 'image') {
          addImageMenu()
          addSeparator()
        }
      }

      menu.append(new remote.MenuItem({label: 'View page source', click: () => {
        let event = new Event('new-tab-by-user')
        event.url = `view-source:${params.pageURL}`
        webviewElement.dispatchEvent(event)
      }}))
      menu.append(new remote.MenuItem({label: 'Inspect element', click: () => webcontents.inspectElement(params.x, params.y)}))
      menu.append(new remote.MenuItem({label: 'Open dev tools', click: () => webcontents.openDevTools()}))
      menu.popup({window: remote.getCurrentWindow(), x: params.x, y: params.y})
    })
  }
}