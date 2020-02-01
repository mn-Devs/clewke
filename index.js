const {app, BrowserWindow} = require('electron')
const fs = require('fs')
const os = require('os')
const DEFAULT_SEARCH_URL = 'https://www.google.com/search?q='


let stdPath = {}
let history = {items: []}
let bookmarks = {items: []}
app.settings = {}
let windows = []


const client = require('discord-rich-presence')('646007034428391437');
client.updatePresence({
details: 'Browsing the web with Clewke',
  state: 'Try Clewke today: clewke.mn-devs.ga',
  largeImageKey: 'large',
  smallImageKey: 'mall',
  instance: true,
});

function loadData() {

  stdPath.dir = os.homedir() + '/.clewke'
  if (!fs.existsSync(stdPath.dir)) {
    fs.mkdirSync(stdPath.dir)
  }
  stdPath.history = stdPath.dir + '/history.crdata'
  stdPath.bookmarks = stdPath.dir + '/bookmarks.crdata'
  stdPath.settings = stdPath.dir + '/settings.crdata'
  loadHistory()
  loadBookmarks()
  loadSettings()
}

function loadHistory() {
  fs.readFile(stdPath.history, (err, data) => {
    if (err) {
      return
    }
    data = JSON.parse(data)
    for (let i = 0; i < data.items.length; i++) {
      history.items.push(data.items[i])
    }
  })
}

function loadBookmarks() {
  fs.readFile(stdPath.bookmarks, (err, data) => {
    if (err) {
      return
    }
    data = JSON.parse(data)
    for (let i = 0; i < data.items.length; i++) {
      bookmarks.items.push(data.items[i])
    }
  })
}

function loadSettings() {
  fs.readFile(stdPath.settings, (err, data) => {
    if (err) {
      return
    }
    app.settings = JSON.parse(data)
    if (app.settings.searchEngine !== '') {
      app.settings.searchUrl = DEFAULT_SEARCH_URL
    }
  })
}

function createWindow () {
  
  mainWindow = new BrowserWindow({
    width: 800, 
    height: 600, 
    frame: false,
    
    minWidth: 400,
    minHeight: 500,
    webPreferences: { nodeIntegration: true },
  })
 


  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`)

  mainWindow.on('closed', function () {
  mainWindow = null
  })
}

loadData()

app.isBookmarked = (url) => {
  if (bookmarks.items.includes(url)) {
    return true
  }
  return false
}

app.on('ready', () => {
  createWindow()
})

app.on('new-window', () => {
  createWindow()
})

app.on('open-about', () => {
  let window = new BrowserWindow({width: 600, height: 450, frame: false})
  window.loadURL(`file://${__dirname}/pages/about.html`)
})

app.on("new-window", function(event, url) {
  event.preventDefault();
  shell.openExternal(url);
});


app.on('add-history-entry', (entry) => {
  history.items.push(entry)
})

app.on('add-bookmark-entry', (entry) => {
  if (bookmarks.items.includes(entry)) {
    return
  }
  bookmarks.items.push(entry)
})

app.on('remove-bookmark-entry', (entry) => {
  bookmarks.items.splice(bookmarks.items.indexOf(entry), 1)
})

app.on('window-all-closed', () => {
  fs.writeFileSync(stdPath.history, JSON.stringify(history))
  fs.writeFileSync(stdPath.bookmarks, JSON.stringify(bookmarks))
  fs.writeFileSync(stdPath.settings, JSON.stringify(app.settings))
  app.quit()
})