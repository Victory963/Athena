const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("athenaApp", {
  close: () => ipcRenderer.send("athena-close"),
  listScreens: () => ipcRenderer.invoke("athena-screens"),
  chooseScreen: (id) => ipcRenderer.invoke("athena-choose-screen", id),
});
