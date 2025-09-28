import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Calendar, Printer, User, ChevronDown, ChevronRight, Eye, Edit, Filter, Trash2 } from 'lucide-react';
import Button from '../components/Button';
import { customersAPI, invoicesAPI, paymentsAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import Footer from '../components/Footer';
import SectionPrintOptions from '../components/SectionPrintOptions';

const CustomerReports = () => {
  const { showError, showSuccess } = useToast();
  const [searchParams] = useSearchParams();
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [expandedItems, setExpandedItems] = useState({});
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState([]);
  const [paymentsData, setPaymentsData] = useState([]);
  
  // Data from database
  const [customers, setCustomers] = useState([]);

  // Load data from database
  useEffect(() => {
    loadCustomers();
    
    // Check for URL parameters from Account Management
    const customerId = searchParams.get('customerId');
    const month = searchParams.get('month');
    const customerName = searchParams.get('customerName');
    
    if (customerId) {
      setSelectedCustomer(customerId);
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

  // Load report data when customer or date range changes
  useEffect(() => {
    if (selectedCustomer) {
      loadReportData();
      loadPaymentsData();
    }
  }, [selectedCustomer, dateRange]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getAll();
      setCustomers(response.data);
      console.log('✅ Customers loaded for reports:', response.data);
    } catch (error) {
      console.error('❌ Error loading customers:', error);
      showError('Load Failed', 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const loadReportData = async () => {
    try {
      setLoading(true);
      
      // Load all invoices and filter for selected customer and date range
      const response = await invoicesAPI.getAll();
      const allInvoices = response.data;
      
      console.log('📊 Loading report for customer:', selectedCustomer);
      console.log('📊 Date range:', dateRange);
      console.log('📊 All invoices:', allInvoices.length);
      
      // Filter invoices by date range
      const filteredInvoices = allInvoices.filter(invoice => {
        const invoiceDate = new Date(invoice.invoiceDate);
        return invoiceDate >= dateRange.from && invoiceDate <= dateRange.to;
      });
      
      console.log('📊 Filtered invoices by date:', filteredInvoices.length);
      
      // Group transactions by item for the selected customer
      const itemGroups = {};
      
      filteredInvoices.forEach(invoice => {
        invoice.items?.forEach(item => {
          // Check both populated and non-populated customer references
          const itemCustomerId = item.customerId?._id || item.customerId;
          
          // Only include credit transactions in customer reports
          if (itemCustomerId === selectedCustomer && item.paymentMethod === 'credit') {
            const itemName = item.itemId?.itemName || item.itemName || 'Unknown Item';
            
            if (!itemGroups[itemName]) {
              itemGroups[itemName] = {
                itemName,
                transactions: [],
                totalQuantity: 0,
                unitPrice: item.price || 0,
                totalValue: 0
              };
            }
            
            itemGroups[itemName].transactions.push({
              date: invoice.invoiceDate,
              invoiceNo: invoice.invoiceNo,
              carName: invoice.carId?.carName || 'Unknown Car',
              quantity: item.quantity || 0,
              price: item.price || 0,
              total: item.total || 0,
              description: item.description || '',
              paymentMethod: item.paymentMethod || 'cash'
            });
            
            itemGroups[itemName].totalQuantity += item.quantity || 0;
            itemGroups[itemName].totalValue += item.total || 0;
          }
        });
      });
      
      // Convert to array and sort by total value
      const reportArray = Object.values(itemGroups).sort((a, b) => b.totalValue - a.totalValue);
      setReportData(reportArray);
      
      console.log('✅ Report data loaded:', reportArray);
      console.log('📊 Customer transactions found:', reportArray.reduce((sum, item) => sum + item.transactions.length, 0));
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
      // Load payments for selected customer
      const response = await paymentsAPI.getAll();
      const allPayments = response.data;
      
      // Filter payments by customer and date range
      const customerPayments = allPayments.filter(payment => {
        const customerMatch = payment.customerId?._id === selectedCustomer || payment.customerId === selectedCustomer;
        const paymentDate = new Date(payment.paymentDate);
        const dateMatch = paymentDate >= dateRange.from && paymentDate <= dateRange.to;
        return customerMatch && dateMatch;
      });
      
      setPaymentsData(customerPayments);
      console.log('✅ Customer payments loaded:', customerPayments);
    } catch (error) {
      console.error('❌ Error loading payments data:', error);
      setPaymentsData([]);
    }
  };
  const handlePrint = () => {
    if (!selectedCustomer || reportData.length === 0) {
      showError('Print Error', 'Please select a customer and load data before printing');
      return;
    }
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Prepare customer profile data
    const profileData = {
      'Customer Name': selectedCustomerName,
      'Report Period': `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`,
      'Total Items': `${reportData.length} different items`,
      'Total Transactions': `${reportData.reduce((sum, item) => sum + item.transactions.length, 0)} transactions`
    };
    
    // Prepare summary data
    const summaryData = {
      'Total Value': `$${reportData.reduce((sum, item) => sum + item.totalValue, 0).toLocaleString()}`,
      'Total Quantity': `${reportData.reduce((sum, item) => sum + item.totalQuantity, 0)} units`,
      'Total Payments': `$${paymentsData.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}`,
      'Outstanding Balance': `$${(reportData.reduce((sum, item) => sum + item.totalValue, 0) - paymentsData.reduce((sum, p) => sum + p.amount, 0)).toLocaleString()}`
    };
    
    // Flatten all transactions for printing
    const allTransactions = [];
    reportData.forEach(item => {
      item.transactions.forEach(transaction => {
        allTransactions.push({
          date: format(new Date(transaction.date), 'MMM dd, yyyy'),
          invoiceNo: transaction.invoiceNo,
          itemName: item.itemName,
          carName: transaction.carName,
          quantity: `${transaction.quantity} units`,
          price: `$${transaction.price}`,
          total: `$${transaction.total.toLocaleString()}`,
          paymentMethod: transaction.paymentMethod.toUpperCase()
        });
      });
    });
    
    // Generate the HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Customer Report - ${selectedCustomerName}</title>
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
            <div class="report-title">Customer Report - ${selectedCustomerName}</div>
            <div class="report-date">Generated on ${new Date().toLocaleDateString()}</div>
          </div>
          
          <div class="profile-section no-break">
            <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">Customer Information</h3>
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
            <h3 style="margin: 20px 0 10px 0; font-size: 16px; font-weight: bold;">Credit Transactions (${allTransactions.length} records)</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice No</th>
                  <th>Item Name</th>
                  <th>Car Name</th>
                  <th>Quantity</th>
                  <th>Price</th>
                  <th>Total</th>
                  <th>Payment Method</th>
                </tr>
              </thead>
              <tbody>
                ${allTransactions.map(transaction => `
                  <tr>
                    <td>${transaction.date}</td>
                    <td>${transaction.invoiceNo}</td>
                    <td>${transaction.itemName}</td>
                    <td>${transaction.carName}</td>
                    <td>${transaction.quantity}</td>
                    <td>${transaction.price}</td>
                    <td>${transaction.total}</td>
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
                    <th>Balance Impact</th>
                  </tr>
                </thead>
                <tbody>
                  ${paymentsData.map(payment => `
                    <tr>
                      <td>${format(new Date(payment.paymentDate), 'MMM dd, yyyy')}</td>
                      <td>${payment.type === 'receive' ? 'Payment Received' : 'Credit Purchase'}</td>
                      <td>${payment.paymentNo || 'N/A'}</td>
                      <td>${payment.description || 'No description'}</td>
                      <td>${payment.type === 'receive' ? '-' : '+'}$${payment.amount.toLocaleString()}</td>
                      <td>${payment.type === 'receive' ? 'Reduced balance' : 'Added to balance'}</td>
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
    if (!selectedCustomer) {
      alert('Please select a customer first');
      return;
    }
    
    loadReportData();
    const customerName = customers.find(c => c._id === selectedCustomer)?.customerName || '';
    alert(`Filter applied for ${customerName} from ${format(dateRange.from, 'MMM dd')} to ${format(dateRange.to, 'MMM dd, yyyy')}`);
  };

  const toggleItemExpansion = (itemName) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemName]: !prev[itemName]
    }));
  };

  const handleViewInvoice = (invoiceNo) => {
    console.log('View invoice:', invoiceNo);
    alert(`Opening invoice ${invoiceNo} for viewing`);
  };

  const handleEditInvoice = (invoiceNo) => {
    console.log('Edit invoice:', invoiceNo);
    alert(`Opening invoice ${invoiceNo} for editing`);
  };

  const handleDeletePayment = async (payment) => {
    const confirmMessage = `🗑️ DELETE PAYMENT\n\n` +
      `Payment Details:\n` +
      `• Date: ${format(new Date(payment.paymentDate), 'MMM dd, yyyy')}\n` +
      `• Type: ${payment.type === 'receive' ? 'Payment Received' : 'Credit Purchase'}\n` +
      `• Amount: $${payment.amount.toLocaleString()}\n` +
      `• Description: ${payment.description || 'No description'}\n` +
      `• Invoice: ${payment.invoiceNo || 'N/A'}\n\n` +
      `This will:\n` +
      `• Delete the payment record permanently\n` +
      `• Reverse the customer balance change: ${payment.type === 'receive' ? '+' : '-'}$${payment.amount.toLocaleString()}\n` +
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
        
        // Reverse customer balance changes
        const selectedCustomerData = customers.find(customer => customer._id === selectedCustomer);
        if (selectedCustomerData) {
          let newBalance = selectedCustomerData.balance || 0;
          
          if (payment.type === 'receive') {
            // If it was a payment received, add back to customer balance (debt)
            newBalance = newBalance + payment.amount;
          } else {
            // If it was a credit purchase, subtract from customer balance
            newBalance = Math.max(0, newBalance - payment.amount);
          }
          
          // Update customer balance
          await customersAPI.update(selectedCustomer, { 
            balance: newBalance
          });
          
          console.log(`✅ Customer balance updated: $${newBalance}`);
        }
        
        showSuccess(
          'Payment Deleted', 
          `Payment of $${payment.amount.toLocaleString()} has been deleted and customer balance has been updated!`
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

  const selectedCustomerName = customers.find(c => c._id === selectedCustomer)?.customerName || '';

  if (loading && customers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <LoadingSpinner size={32} />
          <p className="text-gray-600 mt-4">Loading customer data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Hidden in print */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between print:hidden">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Reports</h1>
          <p className="text-gray-600">Generate detailed customer transaction reports</p>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Customer</label>
              <select
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-48"
              >
                <option value="">Choose a customer</option>
                {customers.map(customer => (
                  <option key={customer._id} value={customer._id}>
                    {customer.customerName}
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
                    if (selectedCustomer) loadReportData();
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
      {selectedCustomer && reportData.length > 0 && (
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
                <p className="text-sm text-gray-600">Customer</p>
                <p className="text-lg font-semibold text-gray-900">{selectedCustomerName}</p>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Summary by Item</h3>
            
            {/* Section Print Options for Customer Reports */}
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
                        carName: transaction.carName,
                        quantity: transaction.quantity,
                        price: transaction.price,
                        total: transaction.total,
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
                  { header: 'Car Name', accessor: 'carName' },
                  { header: 'Quantity', accessor: 'quantity' },
                  { header: 'Price', accessor: 'price' },
                  { header: 'Total', accessor: 'total' },
                  { header: 'Payment Method', accessor: 'paymentMethod' }
                ]}
                title="Customer Reports"
                sectionName="Customer Transaction Report"
                profileData={{
                  'Customer Name': selectedCustomerName,
                  'Report Period': `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd, yyyy')}`,
                  'Total Items': `${reportData.length} different items`,
                  'Total Transactions': `${reportData.reduce((sum, item) => sum + item.transactions.length, 0)} transactions`,
                  'Total Value': `$${reportData.reduce((sum, item) => sum + item.totalValue, 0).toLocaleString()}`,
                  'Total Payments': `$${paymentsData.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}`
                }}
                dateRange={dateRange}
              />
            </div>
            
            <div className="space-y-4">
              {reportData.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* Item Header - Clickable */}
                  <div 
                    className="p-4 bg-white cursor-pointer hover:bg-gray-50 transition-colors print:cursor-default print:hover:bg-white print:bg-white"
                    onClick={() => toggleItemExpansion(item.itemName)}
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
                          <p className="text-sm text-gray-600">Unit Price</p>
                          <p className="font-semibold text-gray-900">${item.unitPrice}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Total Value</p>
                          <p className="font-semibold text-green-600">${item.totalValue.toLocaleString()}</p>
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
                              <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Car Name</th>
                              <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Description</th>
                              <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Quantity</th>
                              <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Price</th>
                              <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Total</th>
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
                                  {transaction.carName}
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
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="font-semibold text-gray-900">{reportData.length} different items</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Transactions</p>
                  <p className="font-semibold text-gray-900">
                    {reportData.reduce((sum, item) => sum + item.transactions.length, 0)} transactions
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Quantity</p>
                  <p className="font-semibold text-gray-900">
                    {reportData.reduce((sum, item) => sum + item.totalQuantity, 0)} units
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Payments Section */}
            {paymentsData.length > 0 && (
              <div className="mt-6 bg-white border border-gray-300 rounded-lg p-4 print:bg-white print:border-gray-400">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Customer Payments History</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white print:bg-white">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Date</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Type</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Invoice No</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Description</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Amount</th>
                        <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 bg-white print:bg-white">Balance Impact</th>
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
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {payment.type === 'receive' ? 'Payment Received' : 'Credit Purchase'}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-sm font-medium text-blue-600 bg-white print:bg-white">
                            {payment.invoiceNo || 'N/A'}
                          </td>
                          <td className="py-2 px-3 text-sm text-gray-700 bg-white print:bg-white">
                            {payment.description || 'No description'}
                          </td>
                          <td className="py-2 px-3 text-sm font-semibold bg-white print:bg-white">
                            <span className={payment.type === 'receive' ? 'text-green-600' : 'text-blue-600'}>
                              {payment.type === 'receive' ? '-' : '+'}${payment.amount.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-xs text-gray-600 bg-white print:bg-white">
                            {payment.type === 'receive' 
                              ? 'Reduced balance' 
                              : 'Added to balance'
                            }
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
                
                {/* Customer Payments Summary */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-green-700">Total Payments Received</p>
                    <p className="font-semibold text-green-600">
                      ${paymentsData
                        .filter(p => p.type === 'receive')
                        .reduce((sum, p) => sum + p.amount, 0)
                        .toLocaleString()}
                    </p>
                    <p className="text-xs text-green-600">Balance reduced</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">Total Credit Purchases</p>
                    <p className="font-semibold text-blue-600">
                      ${paymentsData
                        .filter(p => p.type === 'credit_purchase')
                        .reduce((sum, p) => sum + p.amount, 0)
                        .toLocaleString()}
                    </p>
                    <p className="text-xs text-blue-600">Balance increased</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* No Customer Selected */}
      {!selectedCustomer && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Customer</h3>
          <p className="text-gray-600">Choose a customer from the dropdown above to generate their detailed report.</p>
        </div>
      )}

      {/* No Data Found */}
      {selectedCustomer && reportData.length === 0 && !loading && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Transactions Found</h3>
          <p className="text-gray-600">No transactions found for {selectedCustomerName} in the selected date range.</p>
        </div>
      )}

      {/* Loading */}
      {loading && selectedCustomer && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <LoadingSpinner size={32} />
          <p className="text-gray-600 mt-4">Loading report data...</p>
        </div>
      )}

<Footer/>

    </div>
  );
};

export default CustomerReports;