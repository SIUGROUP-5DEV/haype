import React, { useState } from 'react';
import { X, Download, Upload, Database, FileSpreadsheet, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import Button from './Button';
import { useToast } from '../contexts/ToastContext';
import { backupAPI } from '../services/api';
import * as XLSX from 'xlsx';

const BackupRestoreModal = ({ isOpen, onClose }) => {
  const { showSuccess, showError, showWarning } = useToast();
  const [activeTab, setActiveTab] = useState('backup');
  const [loading, setLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState(null);

  const handleBackupExport = async () => {
    setLoading(true);
    
    try {
      console.log('🔄 Starting full system backup...');
      
      // Get all data from backend
      const response = await backupAPI.exportAll();
      const allData = response.data;
      
      console.log('✅ Backup data received:', {
        cars: allData.cars?.length || 0,
        employees: allData.employees?.length || 0,
        items: allData.items?.length || 0,
        customers: allData.customers?.length || 0,
        invoices: allData.invoices?.length || 0,
        payments: allData.payments?.length || 0
      });
      
      // Create workbook
      const wb = XLSX.utils.book_new();
      
      // Add metadata sheet
      const metadataSheet = XLSX.utils.json_to_sheet([
        { Field: 'HAYPE CONSTRUCTION - COMPLETE SYSTEM BACKUP' },
        { Field: '' },
        { Field: 'Backup Information' },
        { Field: 'Export Date', Value: new Date().toISOString() },
        { Field: 'System Version', Value: '1.0.0' },
        { Field: 'Total Cars', Value: allData.cars?.length || 0 },
        { Field: 'Total Employees', Value: allData.employees?.length || 0 },
        { Field: 'Total Items', Value: allData.items?.length || 0 },
        { Field: 'Total Customers', Value: allData.customers?.length || 0 },
        { Field: 'Total Invoices', Value: allData.invoices?.length || 0 },
        { Field: 'Total Payments', Value: allData.payments?.length || 0 },
        { Field: '' },
        { Field: 'Instructions' },
        { Field: 'This file contains complete system backup' },
        { Field: 'Use Import function to restore data' },
        { Field: 'All sheets must be present for successful import' }
      ]);
      XLSX.utils.book_append_sheet(wb, metadataSheet, 'Backup_Info');
      
      // Add Cars sheet
      if (allData.cars && allData.cars.length > 0) {
        const carsData = allData.cars.map(car => ({
          ID: car._id,
          'Car Name': car.carName,
          'Number Plate': car.numberPlate || '',
          'Driver ID': car.driverId?._id || car.driverId || '',
          'Driver Name': car.driverId?.employeeName || '',
          'Kirishboy ID': car.kirishboyId?._id || car.kirishboyId || '',
          'Kirishboy Name': car.kirishboyId?.employeeName || '',
          'Balance': car.balance || 0,
          'Left Amount': car.left || 0,
          'Status': car.status || 'Active',
          'Created Date': car.createdAt ? new Date(car.createdAt).toISOString() : ''
        }));
        const carsSheet = XLSX.utils.json_to_sheet(carsData);
        XLSX.utils.book_append_sheet(wb, carsSheet, 'Cars');
      }
      
      // Add Employees sheet
      if (allData.employees && allData.employees.length > 0) {
        const employeesData = allData.employees.map(employee => ({
          ID: employee._id,
          'Employee Name': employee.employeeName,
          'Phone Number': employee.phoneNumber || '',
          'Category': employee.category,
          'Balance': employee.balance || 0,
          'Status': employee.status || 'Active',
          'Created Date': employee.createdAt ? new Date(employee.createdAt).toISOString() : ''
        }));
        const employeesSheet = XLSX.utils.json_to_sheet(employeesData);
        XLSX.utils.book_append_sheet(wb, employeesSheet, 'Employees');
      }
      
      // Add Items sheet
      if (allData.items && allData.items.length > 0) {
        const itemsData = allData.items.map(item => ({
          ID: item._id,
          'Item Name': item.itemName,
          'Price': item.price || 0,
          'Driver Price': item.driverPrice || 0,
          'Kirishboy Price': item.kirishboyPrice || 0,
          'Quantity': item.quantity || 0,
          'Created Date': item.createdAt ? new Date(item.createdAt).toISOString() : ''
        }));
        const itemsSheet = XLSX.utils.json_to_sheet(itemsData);
        XLSX.utils.book_append_sheet(wb, itemsSheet, 'Items');
      }
      
      // Add Customers sheet
      if (allData.customers && allData.customers.length > 0) {
        const customersData = allData.customers.map(customer => ({
          ID: customer._id,
          'Customer Name': customer.customerName,
          'Phone Number': customer.phoneNumber || '',
          'Balance': customer.balance || 0,
          'Status': customer.status || 'Active',
          'Created Date': customer.createdAt ? new Date(customer.createdAt).toISOString() : ''
        }));
        const customersSheet = XLSX.utils.json_to_sheet(customersData);
        XLSX.utils.book_append_sheet(wb, customersSheet, 'Customers');
      }
      
      // Add Invoices sheet
      if (allData.invoices && allData.invoices.length > 0) {
        const invoicesData = allData.invoices.map(invoice => ({
          ID: invoice._id,
          'Invoice No': invoice.invoiceNo,
          'Car ID': invoice.carId?._id || invoice.carId || '',
          'Car Name': invoice.carId?.carName || '',
          'Invoice Date': invoice.invoiceDate,
          'Total': invoice.total || 0,
          'Total Left': invoice.totalLeft || 0,
          'Total Profit': invoice.totalProfit || 0,
          'Items Count': invoice.items?.length || 0,
          'Created Date': invoice.createdAt ? new Date(invoice.createdAt).toISOString() : ''
        }));
        const invoicesSheet = XLSX.utils.json_to_sheet(invoicesData);
        XLSX.utils.book_append_sheet(wb, invoicesSheet, 'Invoices');
      }
      
      // Add Invoice Items sheet
      if (allData.invoices && allData.invoices.length > 0) {
        const invoiceItemsData = [];
        allData.invoices.forEach(invoice => {
          invoice.items?.forEach((item, index) => {
            invoiceItemsData.push({
              'Invoice ID': invoice._id,
              'Invoice No': invoice.invoiceNo,
              'Item Index': index,
              'Item ID': item.itemId?._id || item.itemId || '',
              'Item Name': item.itemId?.itemName || item.itemName || '',
              'Customer ID': item.customerId?._id || item.customerId || '',
              'Customer Name': item.customerId?.customerName || item.customerName || '',
              'Description': item.description || '',
              'Quantity': item.quantity || 0,
              'Price': item.price || 0,
              'Total': item.total || 0,
              'Left Amount': item.leftAmount || 0,
              'Payment Method': item.paymentMethod || 'cash'
            });
          });
        });
        
        if (invoiceItemsData.length > 0) {
          const invoiceItemsSheet = XLSX.utils.json_to_sheet(invoiceItemsData);
          XLSX.utils.book_append_sheet(wb, invoiceItemsSheet, 'Invoice_Items');
        }
      }
      
      // Add Payments sheet
      if (allData.payments && allData.payments.length > 0) {
        const paymentsData = allData.payments.map(payment => ({
          ID: payment._id,
          'Payment No': payment.paymentNo || '',
          'Type': payment.type,
          'Customer ID': payment.customerId?._id || payment.customerId || '',
          'Customer Name': payment.customerId?.customerName || '',
          'Car ID': payment.carId?._id || payment.carId || '',
          'Car Name': payment.carId?.carName || '',
          'Amount': payment.amount || 0,
          'Payment Date': payment.paymentDate,
          'Description': payment.description || '',
          'Account Month': payment.accountMonth || '',
          'Created Date': payment.createdAt ? new Date(payment.createdAt).toISOString() : ''
        }));
        const paymentsSheet = XLSX.utils.json_to_sheet(paymentsData);
        XLSX.utils.book_append_sheet(wb, paymentsSheet, 'Payments');
      }
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
      const filename = `Haype_System_Backup_${timestamp}.xlsx`;
      
      // Save file
      XLSX.writeFile(wb, filename);
      
      showSuccess(
        'Backup Complete', 
        `System backup exported successfully as ${filename}. All ${Object.keys(allData).length} data types included.`
      );
      
      console.log('✅ Full system backup exported:', filename);
      
    } catch (error) {
      console.error('❌ Backup export error:', error);
      showError('Backup Failed', 'Failed to export system backup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.name.endsWith('.xlsx')) {
      showError('Invalid File', 'Please select an Excel (.xlsx) file');
      return;
    }
    
    setImportFile(file);
    
    // Preview file contents
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const preview = {
          filename: file.name,
          sheets: workbook.SheetNames,
          size: (file.size / 1024 / 1024).toFixed(2) + ' MB'
        };
        
        // Count records in each sheet
        workbook.SheetNames.forEach(sheetName => {
          if (sheetName !== 'Backup_Info') {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);
            preview[`${sheetName}_count`] = jsonData.length;
          }
        });
        
        setImportPreview(preview);
        console.log('📋 Import file preview:', preview);
        
      } catch (error) {
        console.error('❌ Error reading file:', error);
        showError('File Error', 'Error reading the selected file');
      }
    };
    
    reader.readAsArrayBuffer(file);
  };

  const handleImportRestore = async () => {
    if (!importFile) {
      showError('No File Selected', 'Please select a backup file first');
      return;
    }
    
    const confirmMessage = `🚨 SYSTEM RESTORE WARNING 🚨\n\n` +
      `This will COMPLETELY REPLACE all current data with backup data!\n\n` +
      `Current system data will be PERMANENTLY DELETED:\n` +
      `• All cars, employees, items, customers\n` +
      `• All invoices and invoice items\n` +
      `• All payment records\n` +
      `• All balances and transactions\n\n` +
      `Backup file: ${importFile.name}\n` +
      `File size: ${(importFile.size / 1024 / 1024).toFixed(2)} MB\n\n` +
      `⚠️ THIS ACTION CANNOT BE UNDONE!\n\n` +
      `Are you absolutely sure you want to proceed?`;

    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setLoading(true);
    
    try {
      console.log('🔄 Starting system restore from backup...');
      
      // Read Excel file
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          console.log('📋 Backup file sheets:', workbook.SheetNames);
          
          // Parse all sheets
          const backupData = {};
          
          // Parse Cars
          if (workbook.SheetNames.includes('Cars')) {
            const carsSheet = workbook.Sheets['Cars'];
            const carsData = XLSX.utils.sheet_to_json(carsSheet);
            backupData.cars = carsData.map(car => ({
              _id: car.ID,
              carName: car['Car Name'],
              numberPlate: car['Number Plate'],
              driverId: car['Driver ID'] || null,
              kirishboyId: car['Kirishboy ID'] || null,
              balance: parseFloat(car.Balance) || 0,
              left: parseFloat(car['Left Amount']) || 0,
              status: car.Status || 'Active'
            }));
          }
          
          // Parse Employees
          if (workbook.SheetNames.includes('Employees')) {
            const employeesSheet = workbook.Sheets['Employees'];
            const employeesData = XLSX.utils.sheet_to_json(employeesSheet);
            backupData.employees = employeesData.map(employee => ({
              _id: employee.ID,
              employeeName: employee['Employee Name'],
              phoneNumber: employee['Phone Number'],
              category: employee.Category,
              balance: parseFloat(employee.Balance) || 0,
              status: employee.Status || 'Active'
            }));
          }
          
          // Parse Items
          if (workbook.SheetNames.includes('Items')) {
            const itemsSheet = workbook.Sheets['Items'];
            const itemsData = XLSX.utils.sheet_to_json(itemsSheet);
            backupData.items = itemsData.map(item => ({
              _id: item.ID,
              itemName: item['Item Name'],
              price: parseFloat(item.Price) || 0,
              driverPrice: parseFloat(item['Driver Price']) || 0,
              kirishboyPrice: parseFloat(item['Kirishboy Price']) || 0,
              quantity: parseInt(item.Quantity) || 0
            }));
          }
          
          // Parse Customers
          if (workbook.SheetNames.includes('Customers')) {
            const customersSheet = workbook.Sheets['Customers'];
            const customersData = XLSX.utils.sheet_to_json(customersSheet);
            backupData.customers = customersData.map(customer => ({
              _id: customer.ID,
              customerName: customer['Customer Name'],
              phoneNumber: customer['Phone Number'],
              balance: parseFloat(customer.Balance) || 0,
              status: customer.Status || 'Active'
            }));
          }
          
          // Parse Invoices
          if (workbook.SheetNames.includes('Invoices')) {
            const invoicesSheet = workbook.Sheets['Invoices'];
            const invoicesData = XLSX.utils.sheet_to_json(invoicesSheet);
            backupData.invoices = invoicesData.map(invoice => ({
              _id: invoice.ID,
              invoiceNo: invoice['Invoice No'],
              carId: invoice['Car ID'],
              invoiceDate: invoice['Invoice Date'],
              total: parseFloat(invoice.Total) || 0,
              totalLeft: parseFloat(invoice['Total Left']) || 0,
              totalProfit: parseFloat(invoice['Total Profit']) || 0,
              items: [] // Will be populated from Invoice_Items sheet
            }));
          }
          
          // Parse Invoice Items
          if (workbook.SheetNames.includes('Invoice_Items')) {
            const invoiceItemsSheet = workbook.Sheets['Invoice_Items'];
            const invoiceItemsData = XLSX.utils.sheet_to_json(invoiceItemsSheet);
            
            // Group items by invoice
            const itemsByInvoice = {};
            invoiceItemsData.forEach(item => {
              const invoiceId = item['Invoice ID'];
              if (!itemsByInvoice[invoiceId]) {
                itemsByInvoice[invoiceId] = [];
              }
              
              itemsByInvoice[invoiceId].push({
                itemId: item['Item ID'],
                customerId: item['Customer ID'],
                description: item.Description,
                quantity: parseInt(item.Quantity) || 0,
                price: parseFloat(item.Price) || 0,
                total: parseFloat(item.Total) || 0,
                leftAmount: parseFloat(item['Left Amount']) || 0,
                paymentMethod: item['Payment Method'] || 'cash'
              });
            });
            
            // Add items to invoices
            if (backupData.invoices) {
              backupData.invoices.forEach(invoice => {
                invoice.items = itemsByInvoice[invoice._id] || [];
              });
            }
          }
          
          // Parse Payments
          if (workbook.SheetNames.includes('Payments')) {
            const paymentsSheet = workbook.Sheets['Payments'];
            const paymentsData = XLSX.utils.sheet_to_json(paymentsSheet);
            backupData.payments = paymentsData.map(payment => ({
              _id: payment.ID,
              paymentNo: payment['Payment No'],
              type: payment.Type,
              customerId: payment['Customer ID'] || null,
              carId: payment['Car ID'] || null,
              amount: parseFloat(payment.Amount) || 0,
              paymentDate: payment['Payment Date'],
              description: payment.Description,
              accountMonth: payment['Account Month']
            }));
          }
          
          console.log('📊 Parsed backup data:', {
            cars: backupData.cars?.length || 0,
            employees: backupData.employees?.length || 0,
            items: backupData.items?.length || 0,
            customers: backupData.customers?.length || 0,
            invoices: backupData.invoices?.length || 0,
            payments: backupData.payments?.length || 0
          });
          
          // Send to backend for restoration
          const response = await backupAPI.importAll(backupData);
          console.log('✅ System restore completed:', response.data);
          
          showSuccess(
            'System Restored Successfully', 
            `All data has been restored from backup file: ${importFile.name}. The page will reload to show updated data.`
          );
          
          // Close modal and reload page
          onClose();
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          
        } catch (error) {
          console.error('❌ Import restore error:', error);
          showError('Restore Failed', error.response?.data?.error || 'Failed to restore system from backup. Please check the file format.');
        } finally {
          setLoading(false);
        }
      };
      
      reader.readAsArrayBuffer(importFile);
      
    } catch (error) {
      console.error('❌ Import error:', error);
      showError('Import Failed', 'Error processing backup file');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center">
            <Database className="w-6 h-6 text-blue-600 mr-2" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">System Backup & Restore</h3>
              <p className="text-sm text-gray-600">Export or import complete system data</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('backup')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'backup'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Download className="w-4 h-4 mr-2" />
                Export Backup
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('restore')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'restore'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <Upload className="w-4 h-4 mr-2" />
                Import Restore
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'backup' ? (
            <div className="space-y-6">
              <div className="text-center">
                <FileSpreadsheet className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Export Complete System Backup</h4>
                <p className="text-gray-600 mb-6">
                  Download all system data in Excel format including cars, employees, items, customers, invoices, and payments.
                </p>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h5 className="font-semibold text-blue-900 mb-2">📋 What will be exported:</h5>
                <ul className="text-blue-800 space-y-1 text-sm">
                  <li>• <strong>Cars:</strong> All vehicle information, balances, and assignments</li>
                  <li>• <strong>Employees:</strong> All staff data including drivers and kirishboys</li>
                  <li>• <strong>Items:</strong> Complete inventory with pricing information</li>
                  <li>• <strong>Customers:</strong> Customer database with balance information</li>
                  <li>• <strong>Invoices:</strong> All invoice headers and detailed line items</li>
                  <li>• <strong>Payments:</strong> Complete payment history and transactions</li>
                  <li>• <strong>Metadata:</strong> Backup information and system details</li>
                </ul>
              </div>
              
              <div className="text-center">
                <Button
                  onClick={handleBackupExport}
                  disabled={loading}
                  size="lg"
                  className="px-8"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Exporting Backup...
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5 mr-2" />
                      Export Complete Backup
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <Upload className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 mb-2">Import System Restore</h4>
                <p className="text-gray-600 mb-6">
                  Upload a backup file to restore complete system data. This will replace all current data.
                </p>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-red-900 mb-2">⚠️ Critical Warning</h5>
                    <ul className="text-red-800 space-y-1 text-sm">
                      <li>• This will <strong>COMPLETELY REPLACE</strong> all current system data</li>
                      <li>• All existing cars, employees, customers, invoices will be <strong>DELETED</strong></li>
                      <li>• All current balances and transactions will be <strong>LOST</strong></li>
                      <li>• This action <strong>CANNOT BE UNDONE</strong></li>
                      <li>• Make sure you have a current backup before proceeding</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              {/* File Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  accept=".xlsx"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="backup-file-input"
                />
                <label
                  htmlFor="backup-file-input"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <FileSpreadsheet className="w-12 h-12 text-gray-400 mb-4" />
                  <span className="text-lg font-medium text-gray-900 mb-2">
                    Select Backup File
                  </span>
                  <span className="text-sm text-gray-600">
                    Choose an Excel (.xlsx) backup file to restore
                  </span>
                </label>
              </div>
              
              {/* Import Preview */}
              {importPreview && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h5 className="font-semibold text-gray-900 mb-3">📋 File Preview</h5>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Filename:</span>
                      <span className="ml-2 font-medium">{importPreview.filename}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">File Size:</span>
                      <span className="ml-2 font-medium">{importPreview.size}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Cars:</span>
                      <span className="ml-2 font-medium">{importPreview.Cars_count || 0} records</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Employees:</span>
                      <span className="ml-2 font-medium">{importPreview.Employees_count || 0} records</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Items:</span>
                      <span className="ml-2 font-medium">{importPreview.Items_count || 0} records</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Customers:</span>
                      <span className="ml-2 font-medium">{importPreview.Customers_count || 0} records</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Invoices:</span>
                      <span className="ml-2 font-medium">{importPreview.Invoices_count || 0} records</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Payments:</span>
                      <span className="ml-2 font-medium">{importPreview.Payments_count || 0} records</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm text-green-800 font-medium">
                        File validated successfully - Ready for import
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Import Button */}
              {importFile && (
                <div className="text-center">
                  <Button
                    onClick={handleImportRestore}
                    disabled={loading}
                    variant="danger"
                    size="lg"
                    className="px-8"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Restoring System...
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 mr-2" />
                        Restore System from Backup
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackupRestoreModal;