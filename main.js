// ========================================
// Hot Reload for Development
// ========================================
// Only use electron-reloader in development
if (process.env.NODE_ENV === 'development') {
    try {
        require('electron-reloader')(module, {
            debug: true,
            watchRenderer: true
        });
    } catch (_) {}
}

// ========================================
// main.js (Main Electron Process)
// ========================================
const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
// Patch for sharp native module loading in production
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  // Try to load from unpacked asar if in production
  const path = require('path');
  const unpackedSharp = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'sharp');
  sharp = require(unpackedSharp);
}

// Keep a global reference of the window object
let mainWindow;

function createWindow() {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false, // Don't show until ready
    titleBarStyle: 'default'
  });

  // Load the index.html
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// App event handlers
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

// IPC Handlers for file operations
ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Images', extensions: ['jpg', 'jpeg', 'png'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });
  
  return result.filePaths;
});

ipcMain.handle('convert-image', async (event, { filePath, targetSizeKB, minQuality, maxQuality }) => {
  try {
    const inputBuffer = fs.readFileSync(filePath);
    const originalSizeKB = inputBuffer.length / 1024;
    
    let quality = maxQuality;
    let outputBuffer;
    let finalSizeKB;

    // Try different quality levels until target size is reached
    while (quality >= minQuality) {
      outputBuffer = await sharp(inputBuffer)
        .webp({ quality: quality })
        .toBuffer();
      
      finalSizeKB = outputBuffer.length / 1024;
      
      if (finalSizeKB <= targetSizeKB) {
        break;
      }
      
      quality -= 5;
    }

    const savings = ((originalSizeKB - finalSizeKB) / originalSizeKB) * 100;
    
    return {
      success: true,
      originalSizeKB: Math.round(originalSizeKB),
      finalSizeKB: Math.round(finalSizeKB),
      savings: Math.round(savings),
      quality: quality,
      buffer: outputBuffer,
      originalName: path.basename(filePath)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      originalName: path.basename(filePath)
    };
  }
});

ipcMain.handle('save-file', async (event, { buffer, fileName }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: fileName,
    filters: [
      { name: 'WebP Images', extensions: ['webp'] },
      { name: 'All Files', extensions: ['*'] }
    ]
  });

  if (!result.canceled) {
    try {
      fs.writeFileSync(result.filePath, buffer);
      return { success: true, filePath: result.filePath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  
  return { success: false, error: 'Save canceled' };
});

ipcMain.handle('save-all-files', async (event, { files, directory }) => {
  let selectedDir = directory;
  
  if (!selectedDir) {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select folder to save converted images'
    });
    
    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, error: 'No directory selected' };
    }
    
    selectedDir = result.filePaths[0];
  }

  const results = [];
  
  for (const file of files) {
    try {
      const fileName = file.originalName.replace(/\.(jpg|jpeg|png)$/i, '.webp');
      const filePath = path.join(selectedDir, fileName);
      fs.writeFileSync(filePath, file.buffer);
      results.push({ success: true, fileName, filePath });
    } catch (error) {
      results.push({ success: false, fileName: file.originalName, error: error.message });
    }
  }
  
  return { success: true, results, directory: selectedDir };
});