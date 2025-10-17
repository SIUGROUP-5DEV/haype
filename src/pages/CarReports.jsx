import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Calendar, Printer, Car, ChevronDown, ChevronRight, Eye, CreditCard as Edit, Filter, Trash2 } from 'lucide-react';
import Button from '../components/Button';
import { carsAPI, invoicesAPI, paymentsAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import Footer from '../components/Footer';
import InvoiceModal from '../components/InvoiceModal';
import SectionPrintOptions from '../components/SectionPrintOptions';
import { handlePrintContent, generatePrintStyles } from '../utils/printUtils';

const CarReports = () => {
  const { showError, showSuccess } = useToast();
  const [searchParams] = useSearchParams();
  const [selectedCar, setSelectedCar] = useState('');
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [expandedItems, setExpandedItems] = useState({});
  const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [modalMode, setModalMode] = useState('view');
      const [showModal, setShowModal] = useState(false);
  const [reportData, setReportData] = useState([]);
  const [paymentsData, setPaymentsData] = useState([]);
  
  // Data from database
  const [cars, setCars] = useState([]);

  // Load data from database
  useEffect(() => {
    loadCars();
    
    // Check for URL parameters from Account Management
    const carId = searchParams.get('carId');
    const month = searchParams.get('month');
    const carName = searchParams.get('carName');
    
    if (carId) {
      setSelectedCar(carId);
    }
    
    if (month) {
      // Set date range based on month parameter
      const [year, monthNum] = month.split('-');
      const startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(monthNum), 0);
      
      setDateRange({
        from: startDate,
        to: endDate
      });
    }
  }, []);

  // Load report data when car or date range changes
  useEffect(() => {
    if (selectedCar) {
      loadReportData();
      loadPaymentsData();
    }
  }, [selectedCar, dateRange]);

  const loadCars = async () => {
    try {
      setLoading(true);
      const response = await carsAPI.getAll();
      setCars(response.data);
      console.log('✅ Cars loaded for reports:', response.data);
    } catch (error) {
      console.error('❌ Error loading cars:', error);
      showError('Load Failed', 'Failed to load cars');
    } finally {
      setLoading(false);
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      // Load all invoices and filter for selected car and date range
      const response = await invoicesAPI.getAll();
      const allInvoices = response.data;
      
      console.log('📊 Loading report for car:', selectedCar);
      console.log('📊 Date range:', dateRange);
      console.log('📊 All invoices:', allInvoices.length);
      
      // Filter invoices by car and date range
      const filteredInvoices = allInvoices.filter(invoice => {
        const carMatch = invoice.carId?._id === selectedCar || invoice.carId === selectedCar;
        const invoiceDate = new Date(invoice.invoiceDate);
        const dateMatch = invoiceDate >= dateRange.from && invoiceDate <= dateRange.to;
        return carMatch && dateMatch;
      });
      
      console.log('📊 Filtered invoices by car and date:', filteredInvoices.length);
      
      // Group transactions by items for the selected car
      const itemGroups = {};
      
      filteredInvoices.forEach(invoice => {
        invoice.items?.forEach(item => {
          const itemName = item.itemId?.itemName || item.itemName || 'Unknown item';
          const customerName = item.customerId?.customerName || item.customerName || 'Unknown Customer';
        
          
          if (!itemGroups[itemName]) {
            itemGroups[itemName] = {
              itemName,
              transactions: [],
              totalQuantity: 0,
              totalValue: 0,
              totalLeft: 0
            };
          }
          
          itemGroups[itemName].transactions.push({
            date: invoice.invoiceDate,
            invoiceNo: invoice.invoiceNo,
            customerName: customerName,
            quantity: item.quantity || 0,
            price: item.price || 0,
            total: item.total || 0,
            leftAmount: item.leftAmount || 0,
            paymentMethod: item.paymentMethod || 'cash',
            description: item.description || ''
          });
          
          itemGroups[itemName].totalQuantity += item.quantity || 0;
          itemGroups[itemName].totalValue += item.total || 0;
          itemGroups[itemName].totalLeft += item.leftAmount || 0;
        });
      });
      
      // Convert to array and sort by total value
      const reportArray = Object.values(itemGroups).sort((a, b) => b.totalValue - a.totalValue);
      setReportData(reportArray);
      
      console.log('✅ Car report data loaded:', reportArray);
      console.log('📊 Car transactions found:', reportArray.reduce((sum, item) => sum + item.transactions.length, 0));
    } catch (error) {
      console.error('❌ Error loading report data:', error);
      showError('Load Failed', 'Failed to load report data');
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentsData = async () => {
    try {
      // Load payments for selected car
      const response = await paymentsAPI.getAll();
      const allPayments = response.data;
      
      // Filter payments by car and date range
      const carPayments = allPayments.filter(payment => {
        const carMatch = payment.carId?._id === selectedCar || payment.carId === selectedCar;
        const paymentDate = new Date(payment.paymentDate);
        const dateMatch = paymentDate >= dateRange.from && paymentDate <= dateRange.to;
        return carMatch && dateMatch;
      });
      
      setPaymentsData(carPayments);
      console.log('✅ Car payments loaded:', carPayments);
    } catch (error) {
      console.error('❌ Error loading payments data:', error);
      setPaymentsData([]);
    }
  };
  const handlePrint = () => {
    if (!selectedCar || reportData.length === 0) {
      showError('Print Error', 'Please select a car and load data before printing');
      return;
    }
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Prepare car profile data
    const carData = cars.find(c => c._id === selectedCar);
    const profileData = {
      'Car Name': selectedCarName,
      'Report Period': `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`,
      'Total Items': `${reportData.length} different items`,
      'Total Transactions': `${reportData.reduce((sum, item) => sum + item.transactions.length, 0)} transactions`
    };
    
    // Prepare summary data
    const summaryData = {
      'Total Value': `$${reportData.reduce((sum, item) => sum + item.totalValue, 0).toLocaleString()}`,
      'Total Left': `$${reportData.reduce((sum, item) => sum + item.totalLeft, 0).toLocaleString()}`,
      'Total Payments': `$${paymentsData.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}`,
      'Net Amount': `$${(reportData.reduce((sum, item) => sum + item.totalValue, 0) - paymentsData.reduce((sum, p) => sum + p.amount, 0)).toLocaleString()}`
    };
    
    // Flatten all transactions for printing
    const allTransactions = [];
    reportData.forEach(item => {
      item.transactions.forEach(transaction => {
        allTransactions.push({
          date: format(new Date(transaction.date), 'MMM dd, yyyy'),
          invoiceNo: transaction.invoiceNo,
          itemName: item.itemName,
          customerName: transaction.customerName,
          quantity: `${transaction.quantity} units`,
          price: `$${transaction.price}`,
          total: `$${transaction.total.toLocaleString()}`,
          leftAmount: `$${transaction.leftAmount.toLocaleString()}`,
          paymentMethod: transaction.paymentMethod.toUpperCase()
        });
      });
    });
    
    // Generate the HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Car Report - ${selectedCarName}</title>
          <style>
            @page { margin: 0.5in; size: A4; }
            body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: black; margin: 0; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid black; padding-bottom: 20px; }
            .company-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .report-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .report-date { font-size: 12px; color: #666; }
            .profile-section { margin-bottom: 30px; padding: 15px; border: 1px solid #ccc; background-color: #f9f9f9; }
            .profile-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-top: 10px; }
            .profile-item { display: flex; flex-direction: column; }
            .profile-label { font-size: 10px; color: #666; margin-bottom: 2px; }
            .profile-value { font-weight: bold; font-size: 14px; }
            .data-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .data-table th, .data-table td { border: 1px solid black; padding: 8px; text-align: left; font-size: 11px; }
            .data-table th { background-color: #f0f0f0; font-weight: bold; }
            .data-table tr:nth-child(even) { background-color: #f9f9f9; }
            .summary-section { margin-top: 30px; padding: 15px; border: 2px solid black; background-color: #f0f0f0; }
            .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 10px; }
            .summary-item { text-align: center; padding: 10px; border: 1px solid #ccc; background-color: white; }
            .summary-label { font-size: 10px; color: #666; margin-bottom: 5px; }
            .summary-value { font-weight: bold; font-size: 16px; }
            .no-break { page-break-inside: avoid; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Haype Construction</div>
            <div class="report-title">Car Report - ${selectedCarName}</div>
            <div class="report-date">Generated on ${new Date().toLocaleDateString()}</div>
          </div>
          
          <div class="profile-section no-break">
            <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">Car Information</h3>
            <div class="profile-grid">
              ${Object.entries(profileData).map(([key, value]) => `
                <div class="profile-item">
                  <div class="profile-label">${key}</div>
                  <div class="profile-value">${value}</div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <div class="no-break">
            <h3 style="margin: 20px 0 10px 0; font-size: 16px; font-weight: bold;">All Transactions (${allTransactions.length} records)</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice No</th>
                  <th>Item Name</th>
                  <th>Customer</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Left Amount</th>
                  <th>Payment Method</th>
                </tr>
              </thead>
              <tbody>
                ${allTransactions.map(transaction => `
                  <tr>
                    <td>${transaction.date}</td>
                    <td>${transaction.invoiceNo}</td>
                    <td>${transaction.itemName}</td>
                    <td>${transaction.customerName}</td>
                    <td>${transaction.quantity}</td>
                    <td>${transaction.price}</td>
                    <td>${transaction.total}</td>
                    <td>${transaction.leftAmount}</td>
                    <td>${transaction.paymentMethod}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          ${paymentsData.length > 0 ? `
            <div class="no-break">
              <h3 style="margin: 20px 0 10px 0; font-size: 16px; font-weight: bold;">Payment History (${paymentsData.length} records)</h3>
              <table class="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Payment No</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Account Month</th>
                  </tr>
                </thead>
                <tbody>
                  ${paymentsData.map(payment => `
                    <tr>
                      <td>${format(new Date(payment.paymentDate), 'MMM dd, yyyy')}</td>
                      <td>${payment.type === 'receive' ? 'Payment Received' : 'Payment Out'}</td>
                      <td>${payment.paymentNo || 'N/A'}</td>
                      <td>${payment.description || 'No description'}</td>
                      <td>${payment.type === 'receive' ? '+' : '-'}$${payment.amount.toLocaleString()}</td>
                      <td>${payment.accountMonth || 'N/A'}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : ''}
          
          <div class="summary-section no-break">
            <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">Financial Summary</h3>
            <div class="summary-grid">
              ${Object.entries(summaryData).map(([key, value]) => `
                <div class="summary-item">
                  <div class="summary-label">${key}</div>
                  <div class="summary-value">${value}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Write content to new window and print
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const handleApplyFilter = () => {
    if (!selectedCar) {
      alert('Please select a car first');
      return;
    }
    
    loadReportData();
    const carName = cars.find(c => c._id === selectedCar)?.carName || '';
    alert(`Filter applied for ${carName} from ${format(dateRange.from, 'MMM dd')} to ${format(dateRange.to, 'MMM dd, yyyy')}`);
  };

  const toggleitemExpansion = (itemName) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };
 const handleViewInvoice = (invoiceNo) => {
    setSelectedInvoice(invoiceNo);
    setModalMode('view');
    setShowModal(true);
  };

  const handleEditInvoice = (invoiceNo) => {
    setSelectedInvoice(invoiceNo);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedInvoice(null);
  };

  const handleDeletePayment = async (payment) => {
    const confirmMessage = `🗑️ DELETE PAYMENT\n\n` +
      `Payment Details:\n` +
      `• Date: ${format(new Date(payment.paymentDate), 'MMM dd, yyyy')}\n` +
      `• Type: ${payment.type === 'receive' ? 'Payment Received' : 'Payment Out'}\n` +
      `• Amount: $${payment.amount.toLocaleString()}\n` +
      `• Description: ${payment.description || 'No description'}\n` +
      `• Invoice: ${payment.invoiceNo || 'N/A'}\n\n` +
      `This will:\n` +
      `• Delete the payment record permanently\n` +
      `• Reverse the car balance change: ${payment.type === 'receive' ? '+' : '-'}$${payment.amount.toLocaleString()}\n` +
      `• Update car left amount if applicable\n` +
      `• This action cannot be undone!\n\n` +
      `Are you sure you want to delete this payment?`;

    if (window.confirm(confirmMessage)) {
      try {
        setLoading(true);
        
        // Delete payment from database
        if (payment._id) {
          await paymentsAPI.delete(payment._id);
          console.log('✅ Payment deleted from database');
        }
        
        // Reverse car balance changes
        const selectedCarData = cars.find(car => car._id === selectedCar);
        if (selectedCarData) {
          let newBalance = selectedCarData.balance || 0;
          let newLeft = selectedCarData.left || 0;
          
          if (payment.type === 'receive') {
            // If it was a payment received, subtract from balance
            newBalance = Math.max(0, newBalance - payment.amount);
          } else {
            // If it was a payment out, add back to balance and subtract from left
            newBalance = newBalance + payment.amount;
            newLeft = Math.max(0, newLeft - payment.amount);
          }
          
          // Update car balance
          await carsAPI.update(selectedCar, { 
            balance: newBalance,
            left: newLeft
          });
          
          console.log(`✅ Car balance updated: $${newBalance}, Left: $${newLeft}`);
        }
        
        showSuccess(
          'Payment Deleted', 
          `Payment of $${payment.amount.toLocaleString()} has been deleted and car balance has been updated!`
        );
        
        // Reload data
        loadReportData();
        loadPaymentsData();
        
      } catch (error) {
        console.error('❌ Error deleting payment:', error);
        showError('Delete Failed', 'Failed to delete payment. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const selectedCarName = cars.find(c => c._id === selectedCar)?.carName || '';

  if (loading && cars.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <LoadingSpinner size={32} />
          <p className="text-gray-600 mt-4">Loading car data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Hidden in print */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Car Reports</h1>
          <p className="text-gray-600">Generate detailed car transaction reports</p>
        </div>
        <Button onClick={handlePrint} variant="outline">
          <Printer className="w-5 h-5 mr-2" />
          Print Report
        </Button>
      </div>

      {/* Filters - Hidden in print */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 print:hidden">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
          <div className="flex flex-col lg:flex-row lg:items-end space-y-4 lg:space-y-0 lg:space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Car</label>
              <select
                value={selectedCar}
                onChange={(e) => setSelectedCar(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-48"
              >
                <option value="">Choose a car</option>
                {cars.map(car => (
                  <option key={car._id} value={car._id}>
                    {car.carName} - {car.numberPlate || 'No Plate'}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filter</label>
                <button
                  onClick={() => {
                    setDateRange({
                      from: new Date('2020-01-01'),
                      to: new Date('2030-12-31')
                    });
                    if (selectedCar) loadReportData();
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium"
                >
                  All Dates
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From</label>
                <input
                  type="date"
                  value={format(dateRange.from, 'yyyy-MM-dd')}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: new Date(e.target.value) }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                <input
                  type="date"
                  value={format(dateRange.to, 'yyyy-MM-dd')}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: new Date(e.target.value) }))}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
          
          <Button onClick={handleApplyFilter} className="lg:mb-0">
            <Filter className="w-4 h-4 mr-2" />
            Apply Filter
          </Button>
        </div>
      </div>

      {/* Report Content */}
      {selectedCar && reportData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 print:shadow-none print:border-none">
          {/* Report Header */}
          <div className="p-6 border-b border-gray-200 print:border-b-2 print:border-black">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Building2 className="w-16 h-32 text-blue-600 mr-3" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Haype Construction</h2>
                  <p className="text-gray-600">Business Management System</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Report Date</p>
                <p className="font-semibold">{format(new Date(), 'MMM dd, yyyy')}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Car</p>
                <p className="text-lg font-semibold text-gray-900">{selectedCarName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Report Period</p>
                <p className="text-lg font-semibold text-gray-900">
                  {format(dateRange.from, 'MMM dd')} - {format(dateRange.to, 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>

          {/* Report Data */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Summary by item</h3>
            
            {/* Section Print Options for Car Reports */}
            <div className="mb-6 flex justify-end">
              <SectionPrintOptions
                data={(() => {
                  // Flatten all transactions for export
                  const allTransactions = [];
                  reportData.forEach(item => {
                    item.transactions.forEach(transaction => {
                      allTransactions.push({
                        date: transaction.date,
                        invoiceNo: transaction.invoiceNo,
                        itemName: item.itemName,
                        customerName: transaction.customerName,
                        quantity: transaction.quantity,
                        price: transaction.price,
                        total: transaction.total,
                        leftAmount: transaction.leftAmount,
                        paymentMethod: transaction.paymentMethod
                      });
                    });
                  });
                  return allTransactions;
                })()}
                columns={[
                  { header: 'Date', accessor: 'date' },
                  { header: 'Invoice No', accessor: 'invoiceNo' },
                  { header: 'Item Name', accessor: 'itemName' },
                  { header: 'Customer', accessor: 'customerName' },
                  { header: 'Quantity', accessor: 'quantity' },
                  { header: 'Price', accessor: 'price' },
                  { header: 'Total', accessor: 'total' },
                  { header: 'Left Amount', accessor: 'leftAmount' },
                  { header: 'Payment Method', accessor: 'paymentMethod' }
                ]}
                title="Car Reports"
                sectionName="Car Transaction Report"
                profileData={{
                  'Car Name': selectedCarName,
                  'Report Period': `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`,
                  'Total Items': `${reportData.length} different items`,
                  'Total Transactions': `${reportData.reduce((sum, item) => sum + item.transactions.length, 0)} transactions`,
                  'Total Value': `$${reportData.reduce((sum, item) => sum + item.totalValue, 0).toLocaleString()}`,
                  'Total Left': `$${reportData.reduce((sum, item) => sum + item.totalLeft, 0).toLocaleString()}`
                }}
                dateRange={dateRange}
              />
            </div>
            
            <div className="space-y-4">
              {reportData.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* item Header - Clickable */}
                  <div 
                    className="p-4 bg-white cursor-pointer hover:bg-gray-50 transition-colors print:cursor-default print:hover:bg-white print:bg-white"
                    onClick={() => toggleitemExpansion(item.itemName)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="print:hidden">
                          {expandedItems[item.itemName] ? (
                            <ChevronDown className="w-5 h-5 text-gray-500 mr-2" />
                          ) : (
                            <ChevronRight className="w-5 h-5 text-gray-500 mr-2" />
                          )}
                        </div>
                        <h4 className="text-lg font-semibold text-gray-900">{item.itemName}</h4>
                      </div>
                      <div className="grid grid-cols-3 gap-8 text-center">
                        <div>
                          <p className="text-sm text-gray-600">Total Quantity</p>
                          <p className="font-semibold text-blue-600">{item.totalQuantity} units</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Value</p>
                          <p className="font-semibold text-green-600">${item.totalValue.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Amount Left</p>
                          <p className="font-semibold text-red-600">${item.totalLeft.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Transaction Details - Expandable */}
                  {(expandedItems[item.itemName] || window.matchMedia('print').matches) && (
                    <div className="p-4 border-t border-gray-200 bg-white print:bg-white">
                      <h5 className="font-medium text-gray-900 mb-3">Transaction Details:</h5>
                      
                      {/* Transaction Table */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full bg-white print:bg-white">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Date</th>
                              <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Invoice No</th>
                              <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Customer Name</th>
                              <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Description</th>
                              <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Quantity</th>
                              <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Price</th>
                              <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Total</th>
                              <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Left</th>
                              <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Payment</th>
                              <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white print:hidden">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white print:bg-white">
                            {item.transactions.map((transaction, txIndex) => (
                              <tr key={txIndex} className="border-b border-gray-100 hover:bg-gray-50 print:hover:bg-white bg-white print:bg-white">
                                <td className="py-2 px-3 text-sm text-gray-600 bg-white print:bg-white">
                                  {format(new Date(transaction.date), 'MMM dd, yyyy')}
                                </td>
                                <td className="py-2 px-3 text-sm font-medium text-blue-600 bg-white print:bg-white">
                                  {transaction.invoiceNo}
                                </td>
                                <td className="py-2 px-3 text-sm text-gray-900 bg-white print:bg-white">
                                  {transaction.customerName}
                                </td>
                                <td className="py-2 px-3 text-sm text-gray-600 bg-white print:bg-white">
                                  {transaction.description || 'No description'}
                                </td>
                                <td className="py-2 px-3 text-sm font-medium text-gray-900 bg-white print:bg-white">
                                  {transaction.quantity} units
                                </td>
                                <td className="py-2 px-3 text-sm text-gray-600 bg-white print:bg-white">
                                  ${transaction.price}
                                </td>
                                <td className="py-2 px-3 text-sm font-semibold text-green-600 bg-white print:bg-white">
                                  ${transaction.total.toLocaleString()}
                                </td>
                                <td className="py-2 px-3 text-sm font-semibold text-red-600 bg-white print:bg-white">
                                  ${transaction.leftAmount.toLocaleString()}
                                </td>
                                <td className="py-2 px-3 text-sm bg-white print:bg-white">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    transaction.paymentMethod === 'cash' 
                                      ? 'bg-green-100 text-green-800' 
                                      : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {transaction.paymentMethod?.toUpperCase() || 'CASH'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-sm print:hidden bg-white">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => handleViewInvoice(transaction.invoiceNo)}
                                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      title="View Invoice"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleEditInvoice(transaction.invoiceNo)}
                                      className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                      title="Edit Invoice"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Grand Total */}
            <div className="mt-6 bg-white border border-gray-300 rounded-lg p-4 print:bg-white print:border-gray-400">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900">Grand Total</h4>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${reportData.reduce((sum, item) => sum + item.totalValue, 0).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <p className="text-sm text-gray-600">Total items</p>
                  <p className="font-semibold text-gray-900">{reportData.length} items</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="font-semibold text-gray-900">
                    {reportData.reduce((sum, item) => sum + item.transactions.length, 0)} transactions
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Left</p>
                  <p className="font-semibold text-red-600">
                    ${reportData.reduce((sum, item) => sum + item.totalLeft, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Payments Section */}
            {paymentsData.length > 0 && (
              <div className="mt-6 bg-white border border-gray-300 rounded-lg p-4 print:bg-white print:border-gray-400">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Car Payments History</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white print:bg-white">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Date</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Type</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Invoice No</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Description</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Amount</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Account Month</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white print:hidden">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white print:bg-white">
                      {paymentsData.map((payment, index) => (
                        <tr key={index} className="border-b border-gray-100 bg-white print:bg-white">
                          <td className="py-2 px-3 text-sm text-gray-600 bg-white print:bg-white">
                            {format(new Date(payment.paymentDate), 'MMM dd, yyyy')}
                          </td>
                          <td className="py-2 px-3 text-sm bg-white print:bg-white">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.type === 'receive' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {payment.type === 'receive' ? 'Received' : 'Payment Out'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-sm font-medium text-blue-600 bg-white print:bg-white">
                            {payment.invoiceNo || 'N/A'}
                          </td>
                          <td className="py-2 px-3 text-sm text-gray-700 bg-white print:bg-white">
                            {payment.description || 'No description'}
                          </td>
                          <td className="py-2 px-3 text-sm font-semibold bg-white print:bg-white">
                            <span className={payment.type === 'receive' ? 'text-green-600' : 'text-red-600'}>
                              {payment.type === 'receive' ? '+' : '-'}${payment.amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-sm text-gray-600 bg-white print:bg-white">
                            {payment.accountMonth || 'N/A'}
                          </td>
                          <td className="py-2 px-3 text-sm print:hidden bg-white">
                            <div className="flex items-center space-x-2">
                              {payment.invoiceNo && (
                                <>
                                  <button
                                    onClick={() => handleViewInvoice(payment.invoiceNo)}
                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="View Invoice"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleEditInvoice(payment.invoiceNo)}
                                    className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="Edit Invoice"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleDeletePayment(payment)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete Payment"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Payments Summary */}
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">Total Received</p>
                    <p className="font-semibold text-green-600">
                      ${paymentsData
                        .filter(p => p.type === 'receive')
                        .reduce((sum, p) => sum + p.amount, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-700">Total Payments Out</p>
                    <p className="font-semibold text-red-600">
                      ${paymentsData
                        .filter(p => p.type === 'payment_out')
                        .reduce((sum, p) => sum + p.amount, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">Net Amount</p>
                    <p className="font-semibold text-blue-600">
                      ${(paymentsData
                        .filter(p => p.type === 'receive')
                        .reduce((sum, p) => sum + p.amount, 0) -
                        paymentsData
                        .filter(p => p.type === 'payment_out')
                        .reduce((sum, p) => sum + p.amount, 0))
                        .toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Car Selected */}
      {!selectedCar && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Car className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Car</h3>
          <p className="text-gray-600">Choose a car from the dropdown above to generate their detailed report.</p>
        </div>
      )}

      {/* No Data Found */}
      {selectedCar && reportData.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Found</h3>
          <p className="text-gray-600">No transactions found for {selectedCarName} in the selected date range.</p>
        </div>
      )}

      {/* Loading */}
      {loading && selectedCar && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <LoadingSpinner size={32} />
          <p className="text-gray-600 mt-4">Loading report data...</p>
        </div>
      )}

 {/* Invoice Modal */}
      <InvoiceModal
        isOpen={showModal}
        onClose={handleCloseModal}
        invoiceNo={selectedInvoice}
        mode={modalMode}
      />

<Footer/>

    </div>
  );
};

export default CarReports;