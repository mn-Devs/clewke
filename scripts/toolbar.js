class ToolBar {
  constructor(tab) {
    this.element = document.createElement('div')
    this.element.className = 'toolbar'

    this.backButton = new ToolBarButton({image: 'url(./images/back.svg)'})
    this.forwardButton = new ToolBarButton({image: 'url(./images/forward.svg)'})
    this.rsButton = new ToolBarButton({image: 'url(./images/refresh.svg)'})
    this.bookmarkButton = new ToolBarButton({image: 'url(./images/favourite.svg)'})
    this.menuButton = new ToolBarButton({image: 'url(./images/menu.svg)'})

    this.omniBar = new OmniBar(tab)
    
    this.element.appendChild(this.backButton.element)
    this.element.appendChild(this.forwardButton.element)
    this.element.appendChild(this.rsButton.element)
    this.element.appendChild(this.omniBar.element)
    this.element.appendChild(this.menuButton.element)
    this.toolbarMenu = new ToolBarMenu(tab)
    this.menuButton.element.appendChild(this.toolbarMenu.element)
    this.menuButton.element.addEventListener('click', (e) => {
      this.toolbarMenu.exec()
    })
  }

  setWebView(webview) {
    this.webview = webview

    this.backButton.element.addEventListener('click', () => {
      webview.element.goBack()
    })

    this.forwardButton.element.addEventListener('click', () => {
      webview.element.goForward()
    })

    this.rsButton.element.addEventListener('click', () => {
      if (webview.element.isLoading()) {
        webview.element.stop()
      } else {
        webview.element.reload()
      }
    })

    webview.element.addEventListener('did-start-loading', () => {
      this.rsButton.element.style.backgroundImage = 'url("./images/close.svg")'
    })

    webview.element.addEventListener('did-stop-loading', () => {
      this.rsButton.element.style.backgroundImage = 'url("./images/refresh.svg")'

      if (webview.element.canGoBack()) {
        this.backButton.enable()
      } else {
        this.backButton.disable()
      }

      if (webview.element.canGoForward()) {
        this.forwardButton.enable()
      } else {
        this.forwardButton.disable()
      }
    })


  } 
}

class ToolBarButton {
  constructor(props) {
    this.element = document.createElement('div')
    this.element.style.backgroundImage = props.image

    this.element.className = 'button'
  }

  enable() {
    this.element.className = 'button'
  }

  disable() {
    this.element.className = 'button disable'
  }
}

class OmniBar {
  constructor(tab) {
    this.element = document.createElement('input')
    this.element.setAttribute('type', 'text')
    this.element.className = 'omnibar';
    this.element.placeholder = "Search or type a url";

    this.element.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        let address = this.parse(this.element.value)
        tab.loadUrl(address)
      }
    })
  }

  parse(text) {
    if (text.startsWith('https://') || text.startsWith('http://')) {
      return text
    }

    if (!text.includes(' ') && text.includes('.')) {
      return `http://${text}`
    }

    return `${remote.app.settings.searchUrl + text}`
  }
}

class ToolBarMenu {
  constructor(tab) {
    this.element = document.createElement('div')
    this.element.className = 'toolbarmenu'
    this.element.setAttribute('tabindex', '0')

    this.addMenu({text: 'New tab', click: () => tab.tabbar.addTabButtonElement.click()})
    this.addMenu({text: 'New window', click: () => remote.app.emit('new-window')})

    this.addSeparator()

    this.addMenu({text: 'About This Application', click: () => remote.app.emit('open-about')})

    this.element.addEventListener('blur', (e) => {
      this.element.className = 'toolbarmenu'
    })
  }

  addMenu(item) {
    let menuItem = document.createElement('div')
    menuItem.className = 'menuitem'
    menuItem.innerHTML = item.text
    this.element.appendChild(menuItem)

    menuItem.addEventListener('click', item.click)
  }

  addSeparator() {
    this.element.appendChild(document.createElement('hr'))
  }

  exec() {
    this.element.className = 'toolbarmenu exec'
    this.element.focus()
  }
}