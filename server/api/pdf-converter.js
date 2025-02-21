import puppeteer from 'puppeteer-core'
import fs from 'fs'
import path from 'path'
import extract from 'extract-zip'
import chromium from '@sparticuz/chromium'

// Modified to accept custom output path
export async function processNotionExport(zipFilePath, outputPdfPath) {
  const extractDir = path.dirname(zipFilePath) + '/extracted'
  if (!fs.existsSync(extractDir)) fs.mkdirSync(extractDir)
  
  await extract(zipFilePath, { dir: extractDir })
  
  const htmlFile = fs.readdirSync(extractDir).find(file => file.endsWith('.html'))
  if (!htmlFile) throw new Error('No HTML file found in the ZIP')
  
  const htmlFilePath = path.join(extractDir, htmlFile)
  await convertHtmlToPdf(htmlFilePath, outputPdfPath)
  
  return outputPdfPath
}

export async function convertHtmlToPdf(htmlPath, outputPath) {
  // Setup browser for Vercel serverless environment
  const executablePath = await chromium.executablePath()
  
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath,
    headless: true
  })
  
  const page = await browser.newPage()
  let htmlContent = fs.readFileSync(htmlPath, 'utf8')
  
  // Add highlight.js and custom styles
  const additionalHead = `
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/default.min.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/highlight.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/languages/csharp.min.js"></script>
    <style>
      @media print {
        body { padding: 0.3cm; }
        h1, h2, h3 { margin-top: 1.2em; page-break-after: avoid; }
        h1 {
          page-break-before: always; /* Ensure h1 starts on a new page */
        }
        pre {
          white-space: pre-wrap;
          word-break: break-word;
          overflow-x: hidden;
          font-size: 0.75em;
          line-height: 1.4;
          page-break-inside: avoid;
          background-color: #f5f5f5;
          border-radius: 4px;
          padding: 1em;
          margin: .5em 0;
        }
        code { font-size: 0.85em !important; }
      }
      @page { margin: 0.5in; }
    </style>
  `
  htmlContent = htmlContent.replace('</head>', `${additionalHead}\n</head>`)
  
  // Add script for syntax highlighting
  const scriptToExecute = `
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(function() {
          document.querySelectorAll('pre code').forEach(block => hljs.highlightBlock(block));
        }, 500);
      });
    </script>
  `
  htmlContent = htmlContent.replace('</body>', `${scriptToExecute}\n</body>`)
  
  // Add page breaks for horizontal rules
  htmlContent = htmlContent.replace(
    /<hr id="[^"]*"[^>]*>\s*<hr id="[^"]*"[^>]*>/g,
    '<div style="page-break-after: always;"></div>'
  )
  
  const tempHtmlPath = path.join(path.dirname(htmlPath), '_temp.html')
  fs.writeFileSync(tempHtmlPath, htmlContent)
  
  // Load HTML and generate PDF
  await page.goto(`file://${tempHtmlPath}`, { waitUntil: 'networkidle0', timeout: 60000 })
  await page.evaluate(() => {
    document.querySelectorAll('pre code').forEach(block => hljs.highlightBlock(block))
  })
  
  await new Promise(resolve => setTimeout(resolve, 3000)) // Ensure highlight completion
  
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0.5cm', right: '0.5cm', bottom: '0.5cm', left: '0.5cm' },
    scale: 0.98
  })
  
  await browser.close()
  fs.unlinkSync(tempHtmlPath)
}