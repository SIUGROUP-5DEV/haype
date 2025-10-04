export const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

export const handlePrintContent = (htmlContent, title = 'Print') => {
  const isMobile = isMobileDevice();

  if (isMobile) {
    // Mobile: Use direct print with better compatibility
    const printContainer = document.createElement('div');
    printContainer.innerHTML = htmlContent;
    printContainer.style.display = 'none';
    document.body.appendChild(printContainer);

    // Apply print styles
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        body > *:not(.print-container) {
          display: none !important;
        }
        .print-container {
          display: block !important;
        }
      }
    `;
    document.head.appendChild(style);
    printContainer.className = 'print-container';

    // Trigger print
    window.print();

    // Cleanup after print
    setTimeout(() => {
      document.body.removeChild(printContainer);
      document.head.removeChild(style);
    }, 1000);
  } else {
    // Desktop: Use popup window
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();

      // Wait for content to load then print
      printWindow.onload = () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 250);
      };
    } else {
      alert('Please allow popups to print');
    }
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
