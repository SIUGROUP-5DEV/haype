import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Car, User, DollarSign, Calendar, Filter, Printer, CreditCard as Edit, Eye, CreditCard, FileText, Trash2, X, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import Button from '../components/Button';
import Table from '../components/Table';
import DateFilter from '../components/DateFilter';
import InvoiceModal from '../components/InvoiceModal';
import { carsAPI, invoicesAPI, paymentsAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import Footer from '../components/Footer';
import SectionPrintOptions from '../components/SectionPrintOptions';
import { handlePrintContent, generatePrintStyles } from '../utils/printUtils';

const CarProfile = () => {
  const { id } = useParams();
  const { showError, showSuccess } = useToast();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions');
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [modalMode, setModalMode] = useState('view');
  const [showModal, setShowModal] = useState(false);
  const [showViewPaymentModal, setShowViewPaymentModal] = useState(false);
  const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [editPaymentData, setEditPaymentData] = useState({
    paymentNo: '',
    paymentDate: '',
    amount: '',
    description: ''
  });
  
  const [transactions, setTransactions] = useState([]);
  const [payments, setPayments] = useState([]);

  // Load car data and transactions from database
  useEffect(() => {
    if (id) {
      loadCarData();
      loadTransactions();
      loadPayments();
    }
  }, [id]);

  const loadCarData = async () => {
    try {
      setLoading(true);
      const response = await carsAPI.getById(id);
      setCar(response.data);
      console.log('✅ Car data loaded:', response.data);
    } catch (error) {
      console.error('❌ Error loading car:', error);
      showError('Load Failed', 'Failed to load car data');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      // Load all invoices and filter by car
      const response = await invoicesAPI.getAll();
      const carInvoices = response.data.filter(invoice => 
        invoice.carId?._id === id || invoice.carId === id
      );
      
      // Transform invoices to transaction format
      const transactionData = carInvoices.map(invoice => ({
        id: invoice._id,
        invoiceNo: invoice.invoiceNo,
        date: invoice.invoiceDate,
        total: invoice.total || 0,
        totalLeft: invoice.totalLeft || 0,
        totalProfit: invoice.totalProfit || 0,
        paymentMethod: 'mixed', // Since invoices can have multiple payment methods
        customer: invoice.items?.[0]?.customerId?.customerName || 
                 invoice.items?.[0]?.customerName || 'Multiple Customers',
        itemsCount: invoice.items?.length || 0
      }));
      
      setTransactions(transactionData);
      console.log('✅ Car transactions loaded:', transactionData);
    } catch (error) {
      console.error('❌ Error loading transactions:', error);
      showError('Load Failed', 'Failed to load transaction data');
      setTransactions([]);
    }
  };

  const loadPayments = async () => {
    try {
      // Load all payments and filter by car
      const response = await paymentsAPI.getAll();
      const carPayments = response.data.filter(payment => 
        payment.carId?._id === id || payment.carId === id
      );
      
      setPayments(carPayments);
      console.log('✅ Car payments loaded:', carPayments);
    } catch (error) {
      console.error('❌ Error loading payments:', error);
      showError('Load Failed', 'Failed to load payment data');
      setPayments([]);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const transactionDate = new Date(transaction.date);
    const matchesDateRange = transactionDate >= dateRange.from && transactionDate <= dateRange.to;
    
    return matchesSearch && matchesDateRange;
  });

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase());
    const paymentDate = new Date(payment.paymentDate);
    const matchesDateRange = paymentDate >= dateRange.from && paymentDate <= dateRange.to;
    
    return matchesSearch && matchesDateRange;
  });

  const handlePrint = () => {
    // Calculate totals
    const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalPaymentsReceived = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalPaymentLeft = transactions.reduce((sum, t) => sum + t.totalLeft, 0);
    const amountLeft = totalRevenue - totalPaymentsReceived;

    // Prepare profile data
    const profileData = {
      'Car Name': car.carName,
      'Number Plate': car.numberPlate || 'N/A',
      'Driver': car.driverName || 'Not Assigned',
      'Kirishboy': car.kirishboyName || 'Not Assigned',
      'Status': car.status || 'Active'
    };

    // Prepare summary data - Car specific format
    const summaryData = {
      'Total Revenue': `$${totalRevenue.toLocaleString()}`,
      'Total Payment Left': `$${totalPaymentLeft.toLocaleString()}`,
      'Amount Left': `$${amountLeft.toLocaleString()}`
    };
    
    // Combine all data for printing
    const allData = [
      ...transactions.map(t => ({
        date: format(new Date(t.date), 'MMM dd, yyyy'),
        type: 'Invoice Transaction',
        reference: t.invoiceNo,
        description: `${t.customer} (${t.itemsCount} items)`,
        amount: `$${t.total.toLocaleString()}`,
        status: t.totalLeft > 0 ? 'Pending' : 'Completed'
      })),
      ...payments.map(p => ({
        date: format(new Date(p.paymentDate), 'MMM dd, yyyy'),
        type: p.type === 'receive' ? 'Payment Received' : 'Payment Out',
        reference: p.paymentNo || 'N/A',
        description: p.description || 'No description',
        amount: `${p.type === 'receive' ? '+' : '-'}$${p.amount.toLocaleString()}`,
        status: 'Completed'
      }))
    ].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Generate the HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Car Profile - ${car.carName}</title>
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
            <div class="report-title">Car Profile Report - ${car.carName}</div>
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
            <h3 style="margin: 20px 0 10px 0; font-size: 16px; font-weight: bold;">Complete Transaction & Payment History</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${allData.map(item => `
                  <tr>
                    <td>${item.date}</td>
                    <td>${item.type}</td>
                    <td>${item.reference}</td>
                    <td>${item.description}</td>
                    <td>${item.amount}</td>
                    <td>${item.status}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
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

    // Use universal print function that works on both mobile and desktop
    handlePrintContent(htmlContent, `Car Profile - ${car.carName}`);
  };

  const handleApplyFilter = () => {
    console.log('Applying car profile filter with:', {
      searchTerm,
      dateRange
    });
    
    alert(`Filter applied for ${car?.carName} with ${filteredTransactions.length} transactions and ${filteredPayments.length} payments found`);
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setShowViewPaymentModal(true);
    
    // Set edit payment data
    setEditPaymentData({
      paymentNo: payment.paymentNo || '',
      paymentDate: payment.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : '',
      amount: payment.amount || '',
      description: payment.description || ''
    });
  };
  
  const handleEditPayment = (payment) => {
    setSelectedPayment(payment);
    setEditPaymentData({
      paymentNo: payment.paymentNo || '',
      paymentDate: payment.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : '',
      amount: payment.amount || '',
      description: payment.description || ''
    });
    setShowEditPaymentModal(true);
  };

  const handleEditPaymentChange = (e) => {
    const { name, value } = e.target;
    setEditPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    
    if (!editPaymentData.amount || !editPaymentData.paymentDate) {
      showError('Validation Error', 'Please fill in all required fields');
      return;
    }
    
    try {
      const updatedPayment = {
        ...selectedPayment,
        paymentDate: editPaymentData.paymentDate,
        amount: parseFloat(editPaymentData.amount),
        description: editPaymentData.description
      };
      
      // Use the new API method that handles balance adjustment
      await paymentsAPI.updateWithBalanceAdjustment(
        selectedPayment._id, 
        updatedPayment, 
        selectedPayment.amount, 
        selectedPayment.customerId
      );
      
      showSuccess('Payment Updated', 'Payment has been updated successfully');
      
      // Close modal and refresh data
      setShowEditPaymentModal(false);
      loadPayments();
      
    } catch (error) {
      console.error('❌ Error updating payment:', error);
      showError('Update Failed', 'Failed to update payment. Please try again.');
    }
  };


  const handleViewInvoice = (invoiceNo) => {
    setSelectedInvoice(invoiceNo);
    setModalMode('view');
    setShowModal(true);
  };

  const handleDeletePayment = async (payment) => {
    if (window.confirm(`Are you sure you want to delete this payment of $${payment.amount}?`)) {
      try {
        setLoading(true);
        
        // Use the new API method that handles balance adjustment
        await paymentsAPI.deleteWithBalanceAdjustment(
          payment._id,
          payment.amount,
          payment.customerId,
          payment.selectedCar
        );
        
        showSuccess(
          'Payment Deleted', 
          `Payment of $${payment.amount.toLocaleString()} has been deleted and balances have been updated!`
        );
        loadPayments();
      } catch (error) {
        console.error('❌ Error deleting payment:', error);
        showError('Delete Failed', error.response?.data?.error || 'Failed to delete payment. Please try again.');
      } finally {
        setLoading(false);
      }
    }
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

  const transactionColumns = [
    {
      header: 'Invoice No',
      accessor: 'invoiceNo',
      render: (value) => (
        <span className="font-mono text-blue-600">{value}</span>
      )
    },
    {
      header: 'Date',
      accessor: 'date',
      render: (value) => format(new Date(value), 'MMM dd, yyyy')
    },
    {
      header: 'Customer',
      accessor: 'customer'
    },
    {
      header: 'Items',
      accessor: 'itemsCount',
      render: (value) => (
        <span className="text-gray-600">{value} item{value !== 1 ? 's' : ''}</span>
      )
    },
    {
      header: 'Total',
      accessor: 'total',
      render: (value) => (
        <span className="font-semibold">${value.toLocaleString()}</span>
      )
    },
    {
      header: 'Total Left',
      accessor: 'totalLeft',
      render: (value) => (
        <span className={`font-semibold ${value > 0 ? 'text-red-600' : 'text-green-600'}`}>
          ${value.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Profit',
      accessor: 'totalProfit',
      render: (value) => (
        <span className="font-semibold text-green-600">${value.toLocaleString()}</span>
      )
    },
    {
      header: 'Actions',
      accessor: 'invoiceNo',
      render: (value) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewInvoice(value)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Invoice"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEditInvoice(value)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Edit Invoice"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const paymentColumns = [
    {
      header: 'Date',
      accessor: 'paymentDate', 
      render: (value) => format(new Date(value), 'MMM dd, yyyy')
    },
    {
      header: 'Type',
      accessor: 'type',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'receive' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {value === 'receive' ? 'Received' : 'Payment Out'}
        </span>
      )
    },
    {
      header: 'Payment No',
      accessor: 'paymentNo',
      render: (value) => (
        <span className="font-mono text-blue-600 font-medium">
          {value || payments.paymentNo || 'N/A'}
        </span>
      )
    },
  
    {
      header: 'Description',
      accessor: 'description',
      render: (value) => (
        <span className="text-gray-700">{value || 'No description'}</span>
      )
    },
    {
      header: 'Amount',
      accessor: 'amount',
      render: (value, row) => (
        <span className={`font-semibold ${
          row.type === 'receive' ? 'text-green-600' : 'text-red-600'
        }`}>
          {row.type === 'receive' ? '+' : '-'}${value.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Account Month',
      accessor: 'accountMonth',
      render: (value) => (
        <span className="text-gray-600">{value || 'N/A'}</span>
      )
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewPayment(row)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.invoiceNo && (
            <button
              onClick={() => handleViewInvoice(row.invoiceNo)}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="View Invoice"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleDeletePayment(row)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Payment"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  if (!car) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Car Not Found</h3>
        <p className="text-gray-600 mb-4">The requested car could not be found.</p>
        <Link to="/cars">
          <Button>Back to Cars</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link 
            to="/cars"
            className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{car.carName}</h1>
            <p className="text-gray-600">Car Profile & History</p>
          </div>
        </div>
        <Button onClick={handlePrint} variant="outline">
          <Printer className="w-5 h-5 mr-2" />
          Print
        </Button>
      </div>

      {/* Car Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          <div className="flex items-center">
            <Car className="w-12 h-12 text-blue-600 mr-4" />
            <div>
              <p className="text-sm text-gray-600">Car Name</p>
              <p className="text-lg font-semibold text-gray-900">{car.carName}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Number Plate</p>
            <p className="text-lg font-semibold bg-gray-100 px-2 py-1 rounded font-mono">{car.numberPlate}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Balance</p>
            <p className="text-lg font-semibold text-green-600">${filteredTransactions.reduce((sum, t) => sum + t.total, 0).toLocaleString()}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Driver</p>
            <p className="text-lg font-semibold text-gray-900">{car.driverName || 'Not Assigned'}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Kirishboy</p>
            <p className="text-lg font-semibold text-gray-900">{car.kirishboyName || 'Not Assigned'}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search invoice or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <DateFilter 
            dateRange={dateRange} 
            onDateChange={setDateRange}
            showApplyButton={true}
            onApplyFilter={handleApplyFilter}
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('transactions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'transactions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                Transaction History
                <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                  {filteredTransactions.length}
                </span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                Payment History
                <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                  {filteredPayments.length}
                </span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6 tab-content">
          {/* Section Print Options for each tab */}
          <div className="mb-4 flex justify-end">
            {activeTab === 'transactions' && (
              <SectionPrintOptions
                data={filteredTransactions}
                columns={transactionColumns}
                title="Car Profile"
                sectionName="Transaction History"
                profileData={{
                  'Car Name': car.carName,
                  'Number Plate': car.numberPlate || 'N/A',
                  'Current Balance': `$${(car.balance || 0).toLocaleString()}`,
                  'Driver': car.driverName || 'Not Assigned',
                  'Kirishboy': car.kirishboyName || 'Not Assigned',
                  'Status': car.status || 'Active'
                }}
                dateRange={dateRange}
              />
            )}
            
            {activeTab === 'payments' && (
              <SectionPrintOptions
                data={filteredPayments}
                columns={paymentColumns}
                title="Car Profile"
                sectionName="Payment History"
                profileData={{
                  'Car Name': car.carName,
                  'Number Plate': car.numberPlate || 'N/A',
                  'Current Balance': `$${(car.balance || 0).toLocaleString()}`,
                  'Driver': car.driverName || 'Not Assigned',
                  'Kirishboy': car.kirishboyName || 'Not Assigned',
                  'Status': car.status || 'Active'
                }}
                dateRange={dateRange}
              />
            )}
          </div>
          
          {activeTab === 'transactions' ? (
            <div className="tab-content-transactions">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Transaction History</h2>
              <p className="text-gray-600 mb-4">
                Showing {filteredTransactions.length} transactions for {car.carName}
              </p>
              <Table 
                data={filteredTransactions} 
                columns={transactionColumns}
                emptyMessage="No transactions found for the selected criteria."
              />
            </div>
          ) : (
            <div className="tab-content-payments">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment History</h2>
              <p className="text-gray-600 mb-4">
                Showing {filteredPayments.length} payments for {car.carName}
              </p>
              <Table 
                data={filteredPayments} 
                columns={paymentColumns}
                emptyMessage="No payments found for the selected criteria."
              />
            </div>
          )}
          
          {/* Print-only content - Show both sections when printing */}
          <div className="hidden print:block">
            <div className="tab-content-transactions mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-black">Transaction History</h2>
              <p className="text-gray-600 mb-4 print:text-black">
                All transactions for {car.carName}
              </p>
              <Table 
                data={transactions} 
                columns={transactionColumns}
                emptyMessage="No transactions found."
              />
            </div>
            
            <div className="tab-content-payments">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 print:text-black">Payment History</h2>
              <p className="text-gray-600 mb-4 print:text-black">
                All payments for {car.carName}
              </p>
              <Table 
                data={payments} 
                columns={paymentColumns}
                emptyMessage="No payments found."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${filteredTransactions.reduce((sum, t) => sum + t.total, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Payment Left</p>
              <p className="text-2xl font-bold text-gray-900">
               ${filteredPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

         <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Amount Left</p>
              <p className="text-2xl font-bold text-gray-900">
                ${filteredTransactions.reduce((sum, t) => sum + t.totalLeft, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Profit</p>
              <p className="text-2xl font-bold text-gray-900">
                ${filteredTransactions.reduce((sum, t) => sum + t.totalProfit, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
       
      </div>

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={showModal}
        onClose={handleCloseModal}
        invoiceNo={selectedInvoice}
        mode={modalMode}
      />
      
      {/* View Payment Modal */}
      {showViewPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="w-6 h-6 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowViewPaymentModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className={`p-2 rounded-full ${
                    selectedPayment.type === 'receive' ? 'bg-green-100' : 'bg-red-100'
                  } flex-shrink-0`}>
                    {selectedPayment.type === 'receive' ? (
                      <ArrowDownLeft className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="ml-3">
                    <h4 className="font-semibold text-gray-900">
                      {selectedPayment.type === 'receive' ? 'Payment Received' : 'Payment Out'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedPayment.paymentDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Number:</span>
                    <span className="font-medium text-blue-600">{selectedPayment.paymentNo || 'N/A'}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className={`font-semibold ${
                      selectedPayment.type === 'receive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedPayment.type === 'receive' ? '+' : '-'}${selectedPayment.amount.toLocaleString()}
                    </span>
                  </div>
                  
                  {selectedPayment.customerId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer:</span>
                      <span className="font-medium">
                        {customers.find(c => c._id === selectedPayment.customerId)?.customerName || 'Unknown Customer'}
                      </span>
                    </div>
                  )}
                  
                  {selectedPayment.carId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Car:</span>
                      <span className="font-medium text-gray-900">
                        {car.carName || 'Unknown Car'}
                      </span>
                    </div>
                  )}
                  
                  {selectedPayment.accountMonth && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Month:</span>
                      <span className="font-medium">{selectedPayment.accountMonth}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Description:</span>
                    <span className="font-medium text-gray-800">{selectedPayment.description || 'No description'}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
                <Button variant="outline" onClick={() => setShowViewPaymentModal(false)}>Close</Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleEditPayment(selectedPayment)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Payment
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {showEditPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="w-6 h-6 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Edit Car Payment</h3>
                </div>
                <button
                  onClick={() => setShowEditPaymentModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleUpdatePayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Number
                </label>
                <input
                  name="paymentNo"
                  value={editPaymentData.paymentNo}
                  onChange={handleEditPaymentChange}
                  className="w-full px-4 py-2 border rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Payment number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  name="paymentDate"
                  type="date"
                  value={editPaymentData.paymentDate}
                  onChange={handleEditPaymentChange}
                  className="w-full px-4 py-2 border rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  name="amount"
                  type="number"
                  value={editPaymentData.amount}
                  onChange={handleEditPaymentChange}
                  className="w-full px-4 py-2 border rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  name="description"
                  value={editPaymentData.description}
                  onChange={handleEditPaymentChange}
                  className="w-full px-4 py-2 border rounded-lg border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Payment description"
                />
              </div>
              
              <div className="flex space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditPaymentModal(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Updating...
                    </>
                  ) : (
                    'Update Car Payment'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
<Footer/>

    </div>
  );
};

export default CarProfile;