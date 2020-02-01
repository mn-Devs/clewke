class Tab {
  constructor() {
    this.element = document.createElement('div')
    this.element.className = 'tab'

    this.favicon = document.createElement('div')
    this.favicon.className = 'favicon'
    this.element.appendChild(this.favicon)

    this.title = document.createElement('div')
    this.title.className = 'title'
    this.element.appendChild(this.title)

    this.tabCloseButton = document.createElement('div')
    this.tabCloseButton.className = 'tabclosebutton'
    this.tabCloseButton.title = 'Close tab'
    this.element.appendChild(this.tabCloseButton)

    this.widget = document.createElement('div')
    this.widget.style.width = '100%'
    this.widget.style.height = '100%'
    this.toolBar = new ToolBar(this)
    this.widget.appendChild(this.toolBar.element)

    this.webView = new WebView()
    this.webviewContainer = document.createElement('div')
    this.webviewContainer.style.width = '100%'
    this.webviewContainer.style.height = 'calc(100% - 32px)'
    this.webviewContainer.appendChild(this.webView.element)
    this.widget.appendChild(this.webviewContainer)

    this.toolBar.setWebView(this.webView)

    this.tabCloseButton.addEventListener('click', (e) => {
      e.stopPropagation()
      document.dispatchEvent(new CustomEvent('tab-close-requested', {detail: {tab: this}}))
    })

    this.webView.element.addEventListener('page-favicon-updated', (e) => {
      this.favicon.style.backgroundImage = `url('${e.favicons[0]}')`
    })

    this.webView.element.addEventListener('did-start-loading', () => {
      if (this.webView.element.isLoadingMainFrame()) {
        this.favicon.style.backgroundImage = 'url("./images/ajax-loader.gif")'
      }
    })

    this.webView.element.addEventListener('did-finish-load', () => {
      if (this.favicon.style.backgroundImage === 'url("./images/ajax-loader.gif")') {
        this.favicon.style.backgroundImage = null
      }
    })

    this.webView.element.addEventListener('page-title-updated', (e) => {
      this.title.innerHTML = e.title
      this.element.title = e.title
    })

    this.webView.element.addEventListener('new-window', (e) => {
      console.log(e)
      if (e.disposition === 'foreground-tab') {
        this.tabbar.requestTab(e.url)
      } else if (e.disposition === 'background-tab') {
        this.tabbar.requestBackgroundTab(e.url)
      } else if (e.disposition === 'new-window') {
      } else {
        this.tabbar.requestTab(e.url)
      }
    })

    this.webView.element.addEventListener('new-tab-by-user', (e) => this.tabbar.requestTab(e.url))
    this.webView.element.addEventListener('new-background-tab-by-user', (e) => this.tabbar.requestBackgroundTab(e.url))
  }

  active() {
    this.element.className = 'tab active'
  }

  inactive() {
    this.element.className = 'tab'
  }

  loadUrl(url) {
    this.webView.element.loadURL(url)
  }
}

class TabBar {
  constructor() {
    this.element = document.createElement('div')
    this.element.className = 'tabbar'

    this.addTabButtonElement = document.createElement('div')
    this.addTabButtonElement.className = 'addtabbutton'
    this.addTabButtonElement.title = 'Add new tab'
    this.element.appendChild(this.addTabButtonElement)

    
    this.CloseButtonElement = document.createElement('div')
    this.CloseButtonElement.className = 'action-btn'
    this.CloseButtonElement.id = 'close-btn'
    this.CloseButtonElement.title = 'close application'
    this.element.appendChild(this.CloseButtonElement)

    this.MaxButtonElement = document.createElement('div')
    this.MaxButtonElement.className = 'action-btn'
    this.MaxButtonElement.id = 'max-btn'
    this.MaxButtonElement.title = 'maximize application'
    this.element.appendChild(this.MaxButtonElement)


    this.MinButtonElement = document.createElement('div')
    this.MinButtonElement.className = 'action-btn'
    this.MinButtonElement.id = 'min-btn'
    this.MinButtonElement.title = 'minimize application'
    this.element.appendChild(this.MinButtonElement)


    

    this.maxTabWidth = 250

    this.tabs = []
    this.tabWidth = this.maxTabWidth
    this.addTabButtonWidth = 125
    this.currentIndex = -1

    this.addTabButtonElement.addEventListener('click', () => {
      const tab = new Tab()
      if (this.currentIndex === -1) {
        tab.webView.loadHome()
      } else {
        tab.webView.loadNewTab()
      }
      this.addTab(tab)
    })



    window.onresize = () => {
      this.adjustSize()
    }

    document.addEventListener('tab-close-requested', (e) => {
      const tab = e.detail.tab
      this.closeTab(tab)
    })

    document.addEventListener('tab-changed', () => this.adjustSize())
  }

  addTab(tab, active=true) {
    tab.tabbar = this
    this.tabs.push(tab)
    if (active) {
      this.currentIndex = this.tabs.length - 1
      this.makeActive(this.currentIndex)
    }

    this.element.insertBefore(tab.element, this.addTabButtonElement)

    tab.element.addEventListener('click', () => {
      if (this.currentIndex === this.tabs.indexOf(tab)) {
        return
      }
      this.makeActive(this.tabs.indexOf(tab))
    })

    this.adjustSize()

    document.dispatchEvent(new CustomEvent('tab-added', {detail: {tab: tab}}))
  }

  makeActive(index) {
    this.tabs.forEach(t => t.inactive())
    this.tabs[index].active()
    this.currentIndex = index
    document.dispatchEvent(new CustomEvent('tab-changed', {detail: {tab: this.tabs[index]}}))
  }

  adjustSize() {
    const tabCount = this.tabs.length
    this.tabWidth = (window.innerWidth - this.addTabButtonWidth) / tabCount
    this.tabWidth = Math.min(this.tabWidth, this.maxTabWidth)
    this.tabs.forEach(t => t.element.style.width = `${this.tabWidth}px`)
  }

  closeTab(tab) {
    if (this.tabs.length == 1) {
      remote.getCurrentWindow().close()
    }

    const index = this.tabs.indexOf(tab)
    this.tabs.splice(index, 1)

    if (this.currentIndex >= index) {
      this.currentIndex -= 1
    }
    if (this.currentIndex < 0) {
      this.currentIndex = 0
    }
    this.makeActive(this.currentIndex)

    this.element.removeChild(tab.element)
    document.dispatchEvent(new CustomEvent('tab-closed', {detail: {tab: tab}}))
  }

  requestTab(url) {
    let tab = new Tab()
    tab.webView.element.setAttribute('src', url)
    this.addTab(tab)
  }

  requestBackgroundTab(url) {
    let tab = new Tab()
    tab.webView.element.setAttribute('src', url)
    this.addTab(tab, false)
  }
}

class TabContainer {
  constructor() {
    this.element = document.createElement('div')
    this.element.className = 'tabcontainer'

    this.tabbar = new TabBar()
    this.element.appendChild(this.tabbar.element)

    this.widget = document.createElement('div')
    this.widget.className = 'widget'
    this.element.appendChild(this.widget)

    this.widgets = []
    this.currentIndex = -1

    document.addEventListener('tab-changed', (e) => {
      for (let i = 0; i < this.widgets.length; i++) {
        if (this.widgets[i] === e.detail.tab.widget) {
          this.widgets[i].style.display = 'block'
        } else {
          this.widgets[i].style.display = 'none'
        }
      }
    })

    document.addEventListener('tab-added', (e) => {
      this.widgets.push(e.detail.tab.widget)
      this.widget.appendChild(e.detail.tab.widget)
      e.detail.tab.widget.style.display = 'block'
    })

    document.addEventListener('tab-closed', (e) => {
      const widget = e.detail.tab.widget
      this.widgets.splice(this.widgets.indexOf(widget), 1)
      this.widget.removeChild(widget)
    })
  }
}