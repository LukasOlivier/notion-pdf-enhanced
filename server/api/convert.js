import { defineEventHandler, readBody } from 'h3'
import path from 'path'
import fs from 'fs'
import os from 'os'
import { v4 as uuidv4 } from 'uuid'
import { processNotionExport, convertHtmlToPdf } from './pdf-converter.js'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    // Check if this is a direct HTML to PDF conversion or a ZIP file processing
    if (body.html) {
      // Create temp directory and files
      const tempDir = path.join(os.tmpdir(), uuidv4())
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
      
      const htmlPath = path.join(tempDir, 'input.html')
      const outputPath = path.join(tempDir, 'output.pdf')
      
      // Write the HTML to a file
      fs.writeFileSync(htmlPath, body.html)
      
      // Convert to PDF
      await convertHtmlToPdf(htmlPath, outputPath)
      
      // Read the PDF as base64
      const pdfBuffer = fs.readFileSync(outputPath)
      const pdfBase64 = pdfBuffer.toString('base64')
      
      // Clean up
      fs.rmSync(tempDir, { recursive: true, force: true })
      
      return {
        success: true,
        pdf: pdfBase64
      }
    } 
    else if (body.zipBase64) {
      // Handle ZIP file processing
      const tempDir = path.join(os.tmpdir(), uuidv4())
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })
      
      const zipPath = path.join(tempDir, 'input.zip')
      const outputPath = path.join(tempDir, 'output.pdf')
      
      // Decode and write the ZIP file
      const zipBuffer = Buffer.from(body.zipBase64, 'base64')
      fs.writeFileSync(zipPath, zipBuffer)
      
      // Process the ZIP file
      await processNotionExport(zipPath, outputPath)
      
      // Read the generated PDF
      const pdfBuffer = fs.readFileSync(outputPath)
      const pdfBase64 = pdfBuffer.toString('base64')
      
      // Clean up
      fs.rmSync(tempDir, { recursive: true, force: true })
      
      return {
        success: true,
        pdf: pdfBase64
      }
    }
    
    return {
      success: false,
      error: 'No HTML or ZIP provided'
    }
  } catch (error) {
    console.error('Error in PDF conversion:', error)
    return {
      success: false,
      error: error.message
    }
  }
})