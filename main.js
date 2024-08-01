const path = require('path');
const fs = require("fs");
const {execSync} = require('child_process')
const process = require('process');

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const electron_local_shortcut = require('electron-localshortcut');


function createWindow() {
  const win = new BrowserWindow({
    width: 850,
    height: 500,
    title: "electron 초기 파일 생성",
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
    //resizable: false
  });

  electron_local_shortcut.register(win, 'F12', () => {
    console.log("Developement mode is enable")
    win.webContents.toggleDevTools()
  })

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// =============================================================== ipc
// main -> render
ipcMain.handle('open-directory-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (result.canceled) {
    return null;
  } else {
    return result.filePaths[0];
  }
});

// render -> main
ipcMain.on("file-info",(event, args) => {
  // node js에서 콘솔로 출력을 하면 한글이 깨짐. 그 외에는 한글 문제 없음
  // 현재로서는 영어 외 문자 출력 방법 모르겠음
  // 굳이 영어 외 출력 결과를 봐야겠으면 파일에 쓰면 됨.

  directory = args[1]+"\\"+args[0];

  try {
    fs.mkdirSync(directory);
  } catch (error) {
    console.log("mkdir error");
    console.log(error.toString());

    // send response to render process
    event.reply("finish", "overlap");
    return;
  }

  // 콘솔의 작업 경로를 변경하기 위함
  process.chdir(directory);
  console.log("work directory: " + process.cwd());

  let stdout = execSync("npm init -y");
  console.log(stdout.toString());

  try {
    f = fs.readFileSync(`${directory}\\package.json`);
  } catch (error) {
    console.log("error");
    console.log(error.toString());
    return;
  }

  // package.json 수정
  dict = JSON.parse(f);
  dict.main = "main.js";
  dict.scripts.start = "electron .";
  fs.writeFileSync(`${directory}\\package.json`, JSON.stringify(dict,null,4));
  console.log("generate package.json");

  // main.js
  fs.writeFileSync(`${directory}\\${args[2]}`,
   `const { app, BrowserWindow } = require('electron/main')
    const path = require('node:path')
    
    function createWindow () {
      const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
          preload: path.join(__dirname, '${args[3]}')
        }
      })
    
      win.loadFile('${args[4]}')
    }
    
    app.whenReady().then(() => {
      createWindow()
    
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          createWindow()
        }
      })
    })
    
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })`);
  console.log(`generate ${args[2]}`);

  // style.css
  fs.writeFileSync(`${directory}\\${args[5]}`,"");
  console.log(`generate ${args[5]}`);

  // renderer.js
  fs.writeFileSync(`${directory}\\${args[6]}`,"");
  console.log(`generate ${args[6]}`);

  if(args[7] == "empty"){
    // preload.js
    fs.writeFileSync(`${directory}\\${args[3]}`,"");
    console.log(`generate ${args[3]}`);

    // index.html
    fs.writeFileSync(`${directory}\\${args[4]}`,`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline';" />
    <link rel="stylesheet" href="./\${args[5]}">
    <script defer src="./\${args[6]}"></script>
</head>
<body>

</body>
</html>`);
    console.log(`generate ${args[4]}`);
  }
  else if(args[7] == "hello"){    
    // preload.js
    fs.writeFileSync(`${directory}\\${args[3]}`,`
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(\`\${type}-version\`, process.versions[type])
  }
})`);
    console.log(`generate ${args[3]}`);
    // index.html
    fs.writeFileSync(`${directory}\\${args[4]}`,`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Hello World!</title>
    <meta http-equiv="Content-Security-Policy" content="script-src 'self' 'unsafe-inline';" />
</head>
<body>
    <h1>Hello World!</h1>
    <p>
        We are using Node.js <span id="node-version"></span>,
        Chromium <span id="chrome-version"></span>,
        and Electron <span id="electron-version"></span>.
    </p>
</body>
</html>`);
    console.log(`generate ${args[4]}`);
  }

  // send response to render process
  event.reply("finish", "finish");

  stdout = execSync("start .");
  console.log(stdout.toString());
});