export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const handlePrintContent = (htmlContent, title = 'Print') => {
  // Try popup window first (works on most devices)
  const printWindow = window.open('', '_blank', 'width=800,height=600');

  if (printWindow) {
    // Desktop and most mobile browsers
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for images and content to load
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();

        // Close after print dialog is dismissed (give user time)
        setTimeout(() => {
          printWindow.close();
        }, 100);
      }, 500);
    };
  } else {
    // Fallback for browsers that block popups
    // Create iframe for printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    // Wait for content to load
    iframe.onload = () => {
      setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();

        // Remove iframe after print
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 500);
    };
  }
};

export const generatePrintStyles = () => `
  @page {
    margin: 0.5in;
    size: A4;
  }
  @media print {
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: black;
      margin: 0;
      padding: 20px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
  body {
    font-family: Arial, sans-serif;
    font-size: 12px;
    line-height: 1.4;
    color: black;
    margin: 0;
    padding: 20px;
  }
  .header {
    text-align: center;
    margin-bottom: 30px;
    border-bottom: 2px solid black;
    padding-bottom: 20px;
  }
  .company-name {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 5px;
  }
  .report-title {
    font-size: 18px;
    font-weight: bold;
    margin-bottom: 10px;
  }
  .report-date {
    font-size: 12px;
    color: #666;
  }
  .profile-section {
    margin-bottom: 30px;
    padding: 15px;
    border: 1px solid #ccc;
    background-color: #f9f9f9;
  }
  .profile-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    margin-top: 10px;
  }
  .profile-item {
    display: flex;
    flex-direction: column;
  }
  .profile-label {
    font-size: 10px;
    color: #666;
    margin-bottom: 2px;
  }
  .profile-value {
    font-weight: bold;
    font-size: 14px;
  }
  .data-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
  }
  .data-table th, .data-table td {
    border: 1px solid black;
    padding: 8px;
    text-align: left;
    font-size: 11px;
  }
  .data-table th {
    background-color: #f0f0f0;
    font-weight: bold;
  }
  .data-table tr:nth-child(even) {
    background-color: #f9f9f9;
  }
  .summary-section {
    margin-top: 30px;
    padding: 15px;
    border: 2px solid black;
    background-color: #f0f0f0;
  }
  .summary-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    margin-top: 10px;
  }
  .summary-item {
    text-align: center;
    padding: 10px;
    border: 1px solid #ccc;
    background-color: white;
  }
  .summary-label {
    font-size: 10px;
    color: #666;
    margin-bottom: 5px;
  }
  .summary-value {
    font-weight: bold;
    font-size: 16px;
  }
  .no-break {
    page-break-inside: avoid;
  }
`;
