const { app, BrowserWindow, ipcMain, Tray, nativeImage, Menu, desktopCapturer, session } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const http = require("http");

const HOME = "http://127.0.0.1:3030/?shell=app";
const ROOT = path.join(__dirname, "..");
let child = null;
let tray = null;
let pendingSourceId = "";

function allowCapture() {
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((_webContents, permission, callback) => {
    callback(permission === "media" || permission === "display-capture");
  });
  ses.setDisplayMediaRequestHandler(async (_request, callback) => {
    try {
      for (let i = 0; i < 20 && !pendingSourceId; i += 1) {
        await new Promise((done) => setTimeout(done, 50));
      }
      const sources = await desktopCapturer.getSources({ types: ["screen", "window"] });
      const chosen = sources.find((item) => item.id === pendingSourceId);
      pendingSourceId = "";
      if (!chosen) {
        callback(null);
        return;
      }
      callback({ video: chosen });
    } catch {
      pendingSourceId = "";
      callback(null);
    }
  });
  ipcMain.handle("athena-screens", async () => {
    const sources = await desktopCapturer.getSources({
      types: ["screen", "window"],
      thumbnailSize: { width: 0, height: 0 },
    });
    return sources.map((item) => ({ id: item.id, name: item.name }));
  });
  ipcMain.handle("athena-choose-screen", (_event, id) => {
    pendingSourceId = String(id || "");
    return true;
  });
}

function ping() {
  return new Promise((resolve) => {
    const req = http.get("http://127.0.0.1:3030/", (res) => {
      res.resume();
      resolve(res.statusCode && res.statusCode < 500);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureServer() {
  if (await ping()) return;
  child = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["next", "dev", "-p", "3030"], {
    cwd: ROOT,
    stdio: "ignore",
    windowsHide: true,
  });
  for (let i = 0; i < 40; i += 1) {
    await new Promise((done) => setTimeout(done, 500));
    if (await ping()) return;
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1080,
    height: 760,
    minWidth: 760,
    minHeight: 560,
    frame: true,
    transparent: false,
    backgroundColor: "#f3f2ef",
    title: "Athena",
    autoHideMenuBar: true,
    alwaysOnTop: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.loadURL(HOME);
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  return win;
}

function makeTray(win) {
  const image = nativeImage.createFromDataURL(
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVR4nGNgGAWjYBSMglEwCkbBKBicYPzz/z8DIcD4n4GBgYGJgYHhP8P/UQ0jYBQAAPqkAxH0n2cSAAAAAElFTkSuQmCC",
  );
  tray = new Tray(image);
  tray.setToolTip("Athena");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "打开 Athena", click: () => win.show() },
      { label: "退出", click: () => app.quit() },
    ]),
  );
  tray.on("click", () => win.show());
}

app.whenReady().then(async () => {
  allowCapture();
  await ensureServer();
  const win = createWindow();
  makeTray(win);
  ipcMain.on("athena-close", () => win.hide());
});

app.on("window-all-closed", () => app.quit());
app.on("before-quit", () => {
  if (child && !child.killed) child.kill();
});
