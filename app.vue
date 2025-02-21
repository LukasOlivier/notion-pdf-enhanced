<template>
  <div class="app-container">
    <div class="converter-card">
      <header class="header">
        <h1 class="title">Notion to PDF Converter</h1>
        <p class="subtitle">
          Transform your Notion exports with better page breaks and code highlighting
        </p>
      </header>

      <div class="feature-list">
        <div class="feature-item">
          <span class="feature-icon">📄</span>
          <span>Auto page breaks at <code>#titles</code></span>
        </div>

        <div class="feature-item">
          <span class="feature-icon">🎨</span>
          <span>Code syntax highlighting</span>
        </div>

        <div class="feature-item">
          <span class="feature-icon">⚡</span>
          <span>Add manual page breaks with 2 consecutive <code>---</code></span>
        </div>
      </div>

      <div v-if="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Converting your document...</p>
        <p class="loading-subtext">This may take a moment depending on file size</p>
      </div>
      
      <div v-else-if="!pdfUrl" class="upload-container" @dragover.prevent @drop="handleDrop">
        <div class="upload-area">
          <div class="upload-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
          </div>
          <h2 class="upload-title">Upload Notion Export</h2>
          <p class="upload-instruction">Drag and drop your .zip file here or click to browse</p>
          <input id="file-upload" type="file" accept=".zip" @change="handleZipUpload" class="file-input" />
          <label for="file-upload" class="file-button">Select ZIP File</label>
        </div>
      </div>
      
      <div v-else class="result-container">
        <div class="success-icon">✓</div>
        <h2 class="result-title">Conversion Complete!</h2>
        <div class="preview-container">
          <div class="pdf-preview">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
        </div>
        <div class="button-group">
          <a :href="pdfUrl" download="notion-export.pdf" class="primary-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Download PDF
          </a>
          <button @click="resetForm" class="secondary-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 2v6h6"></path>
              <path d="M21 12A9 9 0 0 0 6 5.3L3 8"></path>
              <path d="M21 22v-6h-6"></path>
              <path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"></path>
            </svg>
            Convert Another
          </button>
        </div>
      </div>
      
      <div v-if="error" class="error-container">
        <div class="error-icon">!</div>
        <p class="error-message">{{ error }}</p>
        <button @click="resetForm" class="secondary-button">Try Again</button>
      </div>

      <footer class="footer">
        <p class="privacy-notice">Your files are processed locally in your browser. No data is uploaded to any server.</p>
        <div class="footer-links">
          <a href="https://github.com/LukasOlivier" target="_blank" class="footer-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
            GitHub
          </a>
          <a href="https://www.linkedin.com/in/lukas-olivier" target="_blank" class="footer-link">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
              <rect x="2" y="9" width="4" height="12"></rect>
              <circle cx="4" cy="4" r="2"></circle>
            </svg>
            LinkedIn
          </a>
        </div>
        <p class="copyright">Source code is available on <a href="https://github.com/LukasOlivier/notion-pdf-enhanced" target="_blank">GitHub</a></p>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const loading = ref(false);
const error = ref(null);
const pdfUrl = ref(null);

async function handleZipUpload(event) {
  const file = event.target.files[0];
  processFile(file);
}

async function handleDrop(event) {
  event.preventDefault();
  const file = event.dataTransfer.files[0];
  processFile(file);
}

async function processFile(file) {
  if (!file) return;
  if (!file.name.endsWith('.zip')) {
    error.value = 'Please upload a ZIP file from Notion export';
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const base64 = await fileToBase64(file);
    const response = await fetch('/api/convert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zipBase64: base64 })
    });
    const result = await response.json();
    if (result.success && result.pdf) {
      const blob = base64ToBlob(result.pdf, 'application/pdf');
      pdfUrl.value = URL.createObjectURL(blob);
    } else {
      error.value = result.error || 'Failed to convert PDF';
    }
  } catch (err) {
    console.error(err);
    error.value = 'Error converting file: ' + err.message;
  } finally {
    loading.value = false;
  }
}

function resetForm() {
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value);
  }
  pdfUrl.value = null;
  error.value = null;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = (error) => reject(error);
  });
}

function base64ToBlob(base64, mimeType) {
  const byteCharacters = atob(base64);
  const byteArrays = [];
  for (let i = 0; i < byteCharacters.length; i += 512) {
    const slice = byteCharacters.slice(i, i + 512);
    const byteNumbers = new Array(slice.length);
    for (let j = 0; j < slice.length; j++) {
      byteNumbers[j] = slice.charCodeAt(j);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }
  return new Blob(byteArrays, { type: mimeType });
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

:root {
  --primary-color: #6c5ce7;
  --primary-light: #8075e7;
  --accent-color: #50fa7b;
  --bg-color: #0f1117;
  --card-bg: #1e2029;
  --text-primary: #fff;
  --text-secondary: #b9bbc2;
  --error-color: #ff5555;
  --success-color: #50fa7b;
  --border-radius: 12px;
  --shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: var(--bg-color);
  color: var(--text-primary);
  font-family: 'Inter', sans-serif;
  line-height: 1.6;
}

.app-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, #13141f, #1b1d2a);
}

.converter-card {
  width: 100%;
  max-width: 800px;
  background: var(--card-bg);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow);
  overflow: hidden;
  position: relative;
}

.header {
  padding: 2.5rem 2.5rem 1.5rem;
  text-align: center;
  background: linear-gradient(to right, #4834d4, #686de0);
  clip-path: polygon(0 0, 100% 0, 100% 85%, 0 100%);
  padding-bottom: 3rem;
}

.title {
  font-size: 2.2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1.1rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
}

.feature-list {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  padding: 0 2rem;
  margin-top: -1rem;
  margin-bottom: 2rem;
  position: relative;
  z-index: 5;
}

.feature-item {
  background: rgba(30, 32, 41, 0.9);
  border-radius: 8px;
  padding: 0.75rem 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.feature-icon {
  font-size: 1.2rem;
}

.upload-container {
  padding: 2rem;
}

.upload-area {
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: var(--border-radius);
  padding: 3rem 2rem;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.upload-area:hover {
  border-color: var(--primary-color);
  background: rgba(108, 92, 231, 0.05);
}

.upload-icon {
  margin-bottom: 1.5rem;
  color: var(--primary-color);
}

.upload-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.upload-instruction {
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.file-input {
  display: none;
}

.file-button {
  display: inline-block;
  background: var(--primary-color);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.file-button:hover {
  background: var(--primary-light);
  transform: translateY(-2px);
}

.loading-container {
  padding: 4rem 2rem;
  text-align: center;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-left-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1.5rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-subtext {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

.result-container {
  padding: 3rem 2rem;
  text-align: center;
}

.success-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--success-color);
  color: #1a1c25;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0 auto 1.5rem;
}

.result-title {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.preview-container {
  max-width: 250px;
  margin: 0 auto 2rem;
  background: #292b36;
  padding: 2rem;
  border-radius: 10px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.15);
}

.pdf-preview {
  color: var(--text-secondary);
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.primary-button, .secondary-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  border: none;
  font-family: inherit;
  font-size: 1rem;
}

.primary-button {
  background: var(--primary-color);
  color: white;
}

.primary-button:hover {
  background: var(--primary-light);
  transform: translateY(-2px);
}

.secondary-button {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.secondary-button:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
}

.error-container {
  padding: 2rem;
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
}

.error-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--error-color);
  color: #1a1c25;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 1.8rem;
  font-weight: bold;
  margin: 0 auto 1.5rem;
}

.error-message {
  margin-bottom: 1.5rem;
  color: var(--text-secondary);
  background: rgba(255, 85, 85, 0.1);
  padding: 1rem;
  border-radius: 6px;
  border-left: 3px solid var(--error-color);
}

.footer {
  margin-top: 2rem;
  padding: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
}

.privacy-notice {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  background: rgba(80, 250, 123, 0.05);
  border-radius: 6px;
  display: inline-block;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.footer-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.3s ease;
}

.footer-link:hover {
  color: var(--accent-color);
}

.copyright {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.copyright a {
  color: var(--accent-color);
  text-decoration: none;
}

@media (max-width: 768px) {
  .app-container {
    padding: 1rem;
  }
  
  .header {
    padding: 2rem 1.5rem 3rem;
  }
  
  .title {
    font-size: 1.8rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .feature-list {
    flex-direction: column;
    align-items: center;
  }
  
  .upload-area {
    padding: 2rem 1rem;
  }
  
  .button-group {
    flex-direction: column;
  }
  
  .primary-button, .secondary-button {
    width: 100%;
    justify-content: center;
  }
}

code {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: monospace;
  font-size: 0.9em;
}
</style>