// ========================================
// renderer.js (UI Logic)
// ========================================
class WebPConverter {
    constructor() {
        this.selectedFiles = [];
        this.convertedFiles = [];
        this.isConverting = false;
        
        this.initializeElements();
        this.bindEvents();
        this.updatePlatformInfo();
    }

    initializeElements() {
        this.selectBtn = document.getElementById('selectBtn');
        this.convertBtn = document.getElementById('convertBtn');
        this.saveAllBtn = document.getElementById('saveAllBtn');
        this.targetSizeInput = document.getElementById('targetSize');
        this.minQualityInput = document.getElementById('minQuality');
        this.maxQualityInput = document.getElementById('maxQuality');
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.progressPercent = document.getElementById('progressPercent');
        this.resultsSection = document.getElementById('resultsSection');
        this.fileList = document.getElementById('fileList');
        this.resultsStats = document.getElementById('resultsStats');
    }

    bindEvents() {
        this.selectBtn.addEventListener('click', () => this.selectFiles());
        this.convertBtn.addEventListener('click', () => this.convertImages());
        this.saveAllBtn.addEventListener('click', () => this.saveAllFiles());
    }

    updatePlatformInfo() {
        const platformInfo = document.getElementById('platformInfo');
        if (window.electronAPI) {
            const platform = window.electronAPI.platform;
            const versions = window.electronAPI.versions;
            platformInfo.textContent = `${platform} | Electron ${versions.electron}`;
        }
    }

    async selectFiles() {
        try {
            const filePaths = await window.electronAPI.selectFiles();
            if (filePaths.length > 0) {
                this.selectedFiles = filePaths;
                this.updateUI();
            }
        } catch (error) {
            console.error('Error selecting files:', error);
        }
    }

    updateUI() {
        const fileCount = this.selectedFiles.length;
        if (fileCount > 0) {
            this.convertBtn.disabled = false;
            this.convertBtn.textContent = `Convert ${fileCount} Image${fileCount > 1 ? 's' : ''}`;
        } else {
            this.convertBtn.disabled = true;
            this.convertBtn.textContent = 'Select Images First';
        }

        // Update save all button
        const convertedCount = this.convertedFiles.length;
        if (convertedCount > 0) {
            this.saveAllBtn.disabled = false;
            this.saveAllBtn.textContent = `Save All ${convertedCount} Files`;
        } else {
            this.saveAllBtn.disabled = true;
            this.saveAllBtn.textContent = 'Save All to Folder';
        }
    }

    async convertImages() {
        if (this.selectedFiles.length === 0 || this.isConverting) return;

        this.isConverting = true;
        this.convertedFiles = [];
        
        // Get conversion settings
        const targetSizeKB = parseInt(this.targetSizeInput.value);
        const minQuality = parseInt(this.minQualityInput.value);
        const maxQuality = parseInt(this.maxQualityInput.value);

        // Show progress
        this.progressSection.style.display = 'block';
        this.resultsSection.style.display = 'none';
        
        // Update button state
        this.convertBtn.disabled = true;
        this.convertBtn.textContent = 'Converting...';

        let totalSavings = 0;
        let totalOriginalSize = 0;
        let successCount = 0;

        for (let i = 0; i < this.selectedFiles.length; i++) {
            const filePath = this.selectedFiles[i];
            const fileName = filePath.split(/[/\\]/).pop();
            
            // Update progress
            const progress = ((i + 1) / this.selectedFiles.length) * 100;
            this.progressFill.style.width = `${progress}%`;
            this.progressText.textContent = `Processing ${fileName}...`;
            this.progressPercent.textContent = `${Math.round(progress)}%`;

            try {
                const result = await window.electronAPI.convertImage({
                    filePath,
                    targetSizeKB,
                    minQuality,
                    maxQuality
                });

                if (result.success) {
                    this.convertedFiles.push(result);
                    totalOriginalSize += result.originalSizeKB;
                    totalSavings += (result.originalSizeKB - result.finalSizeKB);
                    successCount++;
                }
            } catch (error) {
                console.error(`Error converting ${fileName}:`, error);
            }
        }

        // Hide progress and show results
        this.progressSection.style.display = 'none';
        this.displayResults(successCount, totalOriginalSize, totalSavings);
        
        this.isConverting = false;
        this.updateUI();
    }

    displayResults(successCount, totalOriginalSize, totalSavings) {
        // Update stats
        const avgSavings = totalOriginalSize > 0 ? (totalSavings / totalOriginalSize) * 100 : 0;
        this.resultsStats.innerHTML = `
            <div>✅ ${successCount} converted</div>
            <div>💾 ${Math.round(avgSavings)}% average savings</div>
            <div>📦 ${Math.round(totalSavings)} KB saved</div>
        `;

        // Clear and populate file list
        this.fileList.innerHTML = '';
        
        this.convertedFiles.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const webpName = file.originalName.replace(/\.(jpg|jpeg|png)$/i, '.webp');
            
            fileItem.innerHTML = `
                <div class="file-info">
                    <div class="file-icon">WebP</div>
                    <div class="file-details">
                        <h4>${webpName}</h4>
                        <p>${file.originalSizeKB} KB → ${file.finalSizeKB} KB (${file.savings}% smaller) | Quality: ${file.quality}%</p>
                    </div>
                </div>
                <div class="file-actions">
                    <button class="download-btn" onclick="converter.saveFile(${index})">
                        Save
                    </button>
                </div>
            `;
            
            this.fileList.appendChild(fileItem);
        });

        this.resultsSection.style.display = 'block';
    }

    async saveFile(index) {
        const file = this.convertedFiles[index];
        if (!file) return;

        const webpName = file.originalName.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        
        try {
            const result = await window.electronAPI.saveFile({
                buffer: file.buffer,
                fileName: webpName
            });

            if (result.success) {
                console.log('File saved:', result.filePath);
            }
        } catch (error) {
            console.error('Error saving file:', error);
        }
    }

    async saveAllFiles() {
        if (this.convertedFiles.length === 0) return;

        try {
            const result = await window.electronAPI.saveAllFiles({
                files: this.convertedFiles
            });

            if (result.success) {
                console.log(`Saved ${result.results.length} files to ${result.directory}`);
            }
        } catch (error) {
            console.error('Error saving files:', error);
        }
    }
}

// Initialize the app
const converter = new WebPConverter();