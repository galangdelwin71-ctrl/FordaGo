import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import jsPDF from 'jspdf';
import { ToastService } from './toast.service';

export interface PdfExportOptions {
  title?: string;
  isPrint?: boolean;
  dialogTitle?: string;
}

export interface BlobExportOptions {
  title?: string;
  dialogTitle?: string;
  mimeType?: string;
}

@Injectable({
  providedIn: 'root',
})
export class PdfExportService {
  constructor(private toastService: ToastService) {}

  /**
   * Universal Blob exporter for both Web browsers and Native Android/iOS (Capacitor).
   * Supports Word (.docx), Excel (.xlsx), PDF (.pdf), and any binary documents.
   * - On Web: triggers immediate browser file download.
   * - On Native APK: writes file to device Cache via Filesystem and opens
   *   native Share sheet so user can Save to Device / Drive / Office / Files / Share.
   */
  async exportBlob(blob: Blob, filename: string, options: BlobExportOptions = {}): Promise<void> {
    const title = options.title || filename;
    const dialogTitle = options.dialogTitle || 'Save / Share Document';

    if (Capacitor.isNativePlatform()) {
      try {
        const base64Data = await this.blobToBase64(blob);

        const writeResult = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Cache,
          recursive: true,
        });

        await Share.share({
          title,
          text: `FordaGO Document: ${filename}`,
          files: [writeResult.uri],
          dialogTitle,
        });

        await this.toastService.success(`${filename} generated! Choose where to save or open.`);
      } catch (err: any) {
        const msg = String(err?.message || err || '').toLowerCase();
        if (msg.includes('cancel') || msg.includes('dismiss')) {
          return;
        }

        console.error('Native file export failed:', err);
        // Fallback to web download
        try {
          this.downloadBlobWeb(blob, filename);
        } catch {
          // ignore fallback error
        }
        await this.toastService.error('Failed to export file on this device.');
      }
    } else {
      // Browser Web execution
      this.downloadBlobWeb(blob, filename);
      await this.toastService.success(`${filename} downloaded!`);
    }
  }

  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to convert file to base64'));
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1] || '';
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    });
  }

  private downloadBlobWeb(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore
      }
    }, 2500);
  }

  /**
   * Universal PDF exporter for both Web browsers and Native Android/iOS (Capacitor).
   * - On Web: triggers browser download or iframe print.
   * - On Native APK: writes PDF to device Cache via Filesystem and opens
   *   native Share/Save sheet via Share plugin so user can Save to Device / Drive / PDF viewer / Print.
   */
  async exportPdf(doc: jsPDF, filename: string, options: PdfExportOptions = {}): Promise<void> {
    const cleanFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
    const title = options.title || cleanFilename;
    const isPrint = Boolean(options.isPrint);
    const dialogTitle = options.dialogTitle || (isPrint ? 'Print / Share PDF' : 'Save / Download PDF');

    if (Capacitor.isNativePlatform()) {
      try {
        // Output base64 data URI and extract base64 string
        const dataUri = doc.output('datauristring');
        const base64Data = dataUri.split(',')[1];

        // Write PDF file to device cache directory
        const writeResult = await Filesystem.writeFile({
          path: cleanFilename,
          data: base64Data,
          directory: Directory.Cache,
          recursive: true,
        });

        // Open native share sheet with file uri attached
        await Share.share({
          title,
          text: `FordaGO Document: ${cleanFilename}`,
          files: [writeResult.uri],
          dialogTitle,
        });

        await this.toastService.success('PDF generated! Choose where to save or open.');
      } catch (err: any) {
        const msg = String(err?.message || err || '').toLowerCase();
        if (msg.includes('cancel') || msg.includes('dismiss')) {
          return;
        }

        console.error('Native PDF export failed:', err);
        try {
          doc.save(cleanFilename);
        } catch {
          // ignore fallback error
        }
        await this.toastService.error('Failed to export PDF on this device.');
      }
    } else {
      // Browser Web execution
      if (isPrint) {
        this.printWebBlob(doc, cleanFilename);
      } else {
        doc.save(cleanFilename);
        await this.toastService.success('PDF downloaded!');
      }
    }
  }

  /**
   * Helper to export a base64 image (e.g. gym QR code PNG) on both Web and Native APK.
   */
  async exportBase64Image(dataUrl: string, filename: string, title = 'FordaGO QR Code'): Promise<void> {
    const cleanFilename = filename.toLowerCase().endsWith('.png') ? filename : `${filename}.png`;

    if (Capacitor.isNativePlatform()) {
      try {
        const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        const writeResult = await Filesystem.writeFile({
          path: cleanFilename,
          data: base64Data,
          directory: Directory.Cache,
          recursive: true,
        });

        await Share.share({
          title,
          text: `FordaGO QR Code: ${cleanFilename}`,
          files: [writeResult.uri],
          dialogTitle: 'Save / Share QR Code',
        });

        await this.toastService.success('QR Code ready! Choose where to save or view.');
      } catch (err: any) {
        const msg = String(err?.message || err || '').toLowerCase();
        if (!msg.includes('cancel') && !msg.includes('dismiss')) {
          console.error('Native image export failed:', err);
          await this.toastService.error('Failed to save QR code.');
        }
      }
    } else {
      // Browser download
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = cleanFilename;
      link.click();
      await this.toastService.success('QR code downloaded!');
    }
  }

  private printWebBlob(doc: jsPDF, fallbackFilename: string): void {
    try {
      const blob = doc.output('blob');
      const blobUrl = URL.createObjectURL(blob);
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.src = blobUrl;
      document.body.appendChild(iframe);

      iframe.onload = () => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          window.open(blobUrl, '_blank');
        } finally {
          setTimeout(() => {
            try {
              document.body.removeChild(iframe);
              URL.revokeObjectURL(blobUrl);
            } catch {
              // ignore
            }
          }, 3000);
        }
      };
    } catch {
      doc.save(fallbackFilename);
    }
  }
}
