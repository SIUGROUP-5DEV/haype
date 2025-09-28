import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Phone, DollarSign, Calendar, Filter, Printer, Edit, Eye, CreditCard, Trash2, X, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import Button from '../components/Button';
import Table from '../components/Table';
import DateFilter from '../components/DateFilter';
import InvoiceModal from '../components/InvoiceModal';
import FormInput from '../components/FormInput';
import { customersAPI, invoicesAPI, paymentsAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import Footer from '../components/Footer';
import SectionPrintOptions from '../components/SectionPrintOptions';

const CustomerProfile = () => {
  const { id } = useParams();
  const { showError, showSuccess } = useToast();
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('combined');
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
  const [combinedHistory, setCombinedHistory] = useState([]);

  // Load customer data and transactions from database
  useEffect(() => {
    if (id) {
      loadCustomerData();
      loadTransactions();
      loadPayments();
    }
  }, [id]);

  // Create combined history when transactions or payments change
  useEffect(() => {
    createCombinedHistory();
  }, [transactions, payments]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getById(id);
      setCustomer(response.data);
      console.log('✅ Customer data loaded:', response.data);
    } catch (error) {
      console.error('❌ Error loading customer:', error);
      showError('Load Failed', 'Failed to load customer data');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      // Load all invoices and filter customer transactions
      const response = await invoicesAPI.getAll();
      const allInvoices = response.data;
      
      // Find transactions for this customer (only credit transactions)
      const customerTransactions = [];
      
      allInvoices.forEach(invoice => {
        invoice.items?.forEach(item => {
          const itemCustomerId = item.customerId?._id || item.customerId;
          
          // Only include credit transactions for customer balance
          if (itemCustomerId === id && item.paymentMethod === 'credit') {
            customerTransactions.push({
              id: `${invoice._id}-${item._id}`,
              type: 'transaction',
              invoiceNo: invoice.invoiceNo,
              itemName: item.itemId?.itemName || item.itemName || 'Unknown Item',
              carName: invoice.carId?.carName || 'Unknown Car',
              quantity: item.quantity || 0,
              price: item.price || 0,
              total: item.total || 0,
              date: invoice.invoiceDate,
              description: item.description || '',
              paymentMethod: item.paymentMethod || 'credit'
            });
          }
        });
      });
      
      setTransactions(customerTransactions);
      console.log('✅ Customer credit transactions loaded:', customerTransactions);
    } catch (error) {
      console.error('❌ Error loading transactions:', error);
      showError('Load Failed', 'Failed to load transaction data');
      setTransactions([]);
    }
  };

  const loadPayments = async () => {
    try {
      // Load all payments and filter customer payments
      const response = await paymentsAPI.getAll();
      const customerPayments = response.data.filter(payment => 
        payment.customerId?._id === id || payment.customerId === id
      );
      
      setPayments(customerPayments);
      console.log('✅ Customer payments loaded:', customerPayments);
    } catch (error) {
      console.error('❌ Error loading payments:', error);
      showError('Load Failed', 'Failed to load payment data');
      setPayments([]);
    }
  };

const createCombinedHistory = () => {
  const combined = [
    ...transactions.map(t => ({ ...t, type: 'transaction' })),
    ...payments.map(p => ({ ...p, type: 'payment' }))
  ].sort((a, b) => new Date(a.date || a.paymentDate) - new Date(b.date || b.paymentDate));

  let runningBalance = 0;
  const withRunningBalance = combined.map(item => {
    if (item.type === 'transaction') {
      runningBalance += item.total || 0;
    } else if (item.type === 'payment') {
      runningBalance -= item.amount || 0;
    }
    return { ...item, runningBalance };
  });

  setCombinedHistory(withRunningBalance);
};

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.carName.toLowerCase().includes(searchTerm.toLowerCase());
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

const filteredCombinedHistory = combinedHistory.filter(item => {
  const itemDate = new Date(item.date || item.paymentDate);
  const matchesDateRange = itemDate >= dateRange.from && itemDate <= dateRange.to;

  let matchesSearch = false;
  if (item.type === 'transaction') {
    matchesSearch = item.invoiceNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   item.itemName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                   item.carName?.toLowerCase().includes(searchTerm.toLowerCase());
  } else if (item.type === 'payment') {
    matchesSearch = true || // payments always match
                    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.reference?.toLowerCase().includes(searchTerm.toLowerCase());
  }

  return matchesSearch && matchesDateRange;
});

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    // Prepare profile data
    const profileData = {
      'Customer Name': customer.customerName,
      'Phone Number': customer.phoneNumber || 'N/A',
      'Current Balance': `$${finalBalance.toLocaleString()}`,
      'Customer Type': (customer.balance || 0) === 0 ? 'Cash Customer' : 'Credit Customer'
    };
    
    // Prepare summary data
    const summaryData = {
      'Total Credited': `$${totalCredited.toLocaleString()}`,
      'Total Payments': `$${totalPayments.toLocaleString()}`,
      'Final Balance': `$${finalBalance.toLocaleString()}`,
      'Database Balance': `$${(customer.balance || 0).toLocaleString()}`
    };
    
    // Generate the HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Customer Profile - ${customer.customerName}</title>
          <style>
            @page { margin: 0.5in; size: A4; }
            body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: black; margin: 0; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid black; padding-bottom: 20px; }
            .company-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
            .report-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .report-date { font-size: 12px; color: #666; }
            .profile-section { margin-bottom: 30px; padding: 15px; border: 1px solid #ccc; background-color: #f9f9f9; }
            .profile-grid { display: grid grid-cols-1 md:grid-cols-4  gap: 15px; margin-top: 10px; }
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
            <div class="report-title">Customer Profile Report - ${customer.customerName}</div>
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
            <h3 style="margin: 20px 0 10px 0; font-size: 16px; font-weight: bold;">Complete Transaction & Payment History</h3>
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Running Balance</th>
                </tr>
              </thead>
              <tbody>
                ${combinedHistory.map(item => {
                  const date = format(new Date(item.date || item.paymentDate), 'MMM dd, yyyy');
                  const type = item.type === 'transaction' ? 'Credit Purchase' : 'Payment Received';
                  const reference = item.invoiceNo || item.paymentNo || 'N/A';
                  const description = item.type === 'transaction' 
                    ? `${item.itemName} (${item.quantity} units @ $${item.price})`
                    : item.description || 'Payment received';
                  const amount = item.type === 'transaction' 
                    ? `+$${item.total.toLocaleString()}`
                    : `-$${item.amount.toLocaleString()}`;
                  const runningBalance = `$${item.runningBalance.toLocaleString()}`;
                  
                  return `
                    <tr>
                      <td>${date}</td>
                      <td>${type}</td>
                      <td>${reference}</td>
                      <td>${description}</td>
                      <td>${amount}</td>
                      <td>${runningBalance}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          
          <div class="summary-section no-break">
            <h3 style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">Balance Summary</h3>
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
    console.log('Applying customer profile filter with:', {
      searchTerm,
      dateRange
    });
    
    
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
    console.log('🔧 Editing payment:', payment);
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
      console.log('🔄 Updating payment:', selectedPayment._id, editPaymentData);
      
      setLoading(true);
      
      const updatedPayment = {
        paymentNo: editPaymentData.paymentNo,
        paymentDate: editPaymentData.paymentDate,
        amount: parseFloat(editPaymentData.amount),
        description: editPaymentData.description
      };
      
      // Use the balance adjustment API method
      await paymentsAPI.updateWithBalanceAdjustment(
        selectedPayment._id, 
        updatedPayment, 
        selectedPayment.amount, 
        selectedPayment.customerId?._id || selectedPayment.customerId
      );
      
      showSuccess('MKPYN Payment Updated', 'Payment has been updated successfully and balances adjusted');
      
      // Close modal and refresh data
      setShowEditPaymentModal(false);
      setSelectedPayment(null);
      
      // Reload all data
      loadCustomerData();
      loadTransactions();
      loadPayments();
      loadCustomerData();
      loadPayments();
      
    } catch (error) {
      console.error('❌ Error updating payment:', error);
      showError('Update Failed', 'Failed to update payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePayment = async (payment) => {
    console.log('🗑️ Deleting payment:', payment);
    
    const confirmMessage = `Delete Payment?\n\n` +
      `Payment: $${payment.amount.toLocaleString()}\n` +
      `Date: ${format(new Date(payment.paymentDate), 'MMM dd, yyyy')}\n\n` +
      `This will add $${payment.amount.toLocaleString()} back to customer balance.\n\n` +
      `Continue?`;

    if (window.confirm(confirmMessage)) {
      try {
        setLoading(true);
        
        const customerId = payment.customerId?._id || payment.customerId;
        const carId = payment.carId?._id || payment.carId;
        
        console.log('🔄 Payment deletion details:', {
          paymentId: payment._id,
          amount: payment.amount,
          customerId,
          carId,
          type: payment.type
        });
        
        // Use the balance adjustment API method
        await paymentsAPI.deleteWithBalanceAdjustment(
          payment._id,
          payment.amount,
          customerId,
          carId
        );
        
        showSuccess(
          'MKPYN Payment Deleted', 
          `Payment deleted and $${payment.amount.toLocaleString()} added back to customer balance`
        );
        
        // Refresh data
        loadCustomerData();
        
        // Reload all data to reflect changes
        loadCustomerData();
        loadTransactions();
        loadPayments();
        
        
      } catch (error) {
        console.error('❌ Error deleting payment:', error);
        showError('Delete Failed', 'Failed to delete payment. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteTransaction = async (transaction) => {
    const confirmMessage = `Delete Transaction?\n\n` +
      `Invoice: ${transaction.invoiceNo}\n` +
      `Item: ${transaction.itemName}\n` +
      `Amount: $${transaction.total.toLocaleString()}\n\n` +
      `This will reduce customer balance by $${transaction.total.toLocaleString()}.\n\n` +
      `Continue?`;

    if (window.confirm(confirmMessage)) {
      try {
        setLoading(true);
        
        // Find and delete the invoice
        const invoicesResponse = await invoicesAPI.getAll();
        const invoice = invoicesResponse.data.find(inv => inv.invoiceNo === transaction.invoiceNo);
        
        if (invoice) {
          await invoicesAPI.deleteWithBalanceUpdate(invoice._id);
          
          // Update customer balance (reduce by transaction amount)
          const customerResponse = await customersAPI.getById(id);
          const customer = customerResponse.data;
          const newBalance = Math.max(0, (customer.balance || 0) - transaction.total);
          
          await customersAPI.update(id, { balance: newBalance });
          
          showSuccess(
            'Transaction Deleted', 
            `Transaction deleted and customer balance reduced by $${transaction.total.toLocaleString()}`
          );
          
          // Refresh data
          loadCustomerData();
          loadTransactions();
        }
        
      } catch (error) {
        console.error('❌ Error deleting transaction:', error);
        showError('Delete Failed', 'Failed to delete transaction. Please try again.');
      } finally {
        setLoading(false);
      }
    }
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
      header: 'Item Name',
      accessor: 'itemName'
    },
    {
      header: 'Car Name',
      accessor: 'carName'
    },
    {
      header: 'Quantity',
      accessor: 'quantity',
      render: (value) => (
        <span className="font-semibold">{value}</span>
      )
    },
    {
      header: 'Price',
      accessor: 'price',
      render: (value) => (
        <span className="font-semibold text-green-600">${value}</span>
      )
    },
    {
      header: 'Total',
      accessor: 'total',
      render: (value) => (
        <span className="font-semibold text-blue-600">${value}</span>
      )
    },
    {
      header: 'Date',
      accessor: 'date',
      render: (value) => format(new Date(value), 'MMM dd, yyyy')
    },
    {
      header: 'Actions',
      accessor: 'invoiceNo',
      render: (value, row) => (
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
          <button
            onClick={() => handleDeleteTransaction(row)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Transaction"
          >
            <Trash2 className="w-4 h-4" />
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
      header: 'Payment No',
      accessor: 'paymentNo',
      render: (value) => (
        <span className="font-mono text-blue-600">{value || 'N/A'}</span>
      )
    },
    {
      header: 'Description',
      accessor: 'description'
    },
    {
      header: 'Amount',
      accessor: 'amount',
      render: (value) => (
        <span className="font-semibold text-green-600">${value.toLocaleString()}</span>
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
            title="View Payment"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEditPayment(row)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Edit Payment"
          >
            <Edit className="w-4 h-4" />
          </button>
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

  const combinedHistoryColumns = [
    {
      header: 'Date',
      accessor: 'date',
      render: (value, row) => format(new Date(value || row.paymentDate), 'MMM dd, yyyy')
    },
    {
      header: 'Type',
      accessor: 'type',
      render: (value, row) => (
        <div className="flex items-center">
          {value === 'transaction' ? (
            <>
              <ArrowUpRight className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-red-600 font-medium">Credit Purchase</span>
            </>
          ) : (
            <>
              <ArrowDownLeft className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-green-600 font-medium">MKPYN Payment</span>
            </>
          )}
        </div>
      )
    },
    {
      header: 'Reference',
      accessor: 'invoiceNo',
      render: (value, row) => (
        <span className="font-mono text-blue-600">
          {value || row.paymentNo || 'N/A'}
        </span>
      )
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (value, row) => (
        <span className="text-gray-700">
          {row.type === 'transaction' 
            ? `${row.itemName} (${row.quantity} units @ $${row.price})`
            : value || 'Payment received'
          }
        </span>
      )
    },
    {
      header: 'Amount',
      accessor: 'total',
      render: (value, row) => {
        const amount = row.type === 'transaction' ? row.total : row.amount;
        return (
          <span className={`font-semibold ${
            row.type === 'transaction' ? 'text-red-600' : 'text-green-600'
          }`}>
            {row.type === 'transaction' ? '+' : '-'}${amount.toLocaleString()}
          </span>
        );
      }
    },
    {
      header: 'Running Balance',
      accessor: 'runningBalance',
      render: (value) => (
        <span className="font-bold text-blue-600">${value.toLocaleString()}</span>
      )
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          {row.type === 'transaction' ? (
            <>
              <button
                onClick={() => handleViewInvoice(row.invoiceNo)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="View Invoice"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleEditInvoice(row.invoiceNo)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Edit Invoice"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteTransaction(row)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Transaction"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => handleViewPayment(row)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="View Payment"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleEditPayment(row)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Edit Payment"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeletePayment(row)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Payment"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
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

  if (!customer) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Customer Not Found</h3>
        <p className="text-gray-600 mb-4">The requested customer could not be found.</p>
        <Link to="/customers">
          <Button>Back to Customers</Button>
        </Link>
      </div>
    );
  }

  // Calculate totals for summary
  const totalCredited = transactions.reduce((sum, t) => sum + t.total, 0);
  const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
  const finalBalance = Math.max(0, totalCredited - totalPayments);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between customer-profile-section no-print">
        <div className="flex items-center">
          <Link 
            to="/customers"
            className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{customer.customerName}</h1>
            <p className="text-gray-600">Customer Profile & History</p>
          </div>
        </div>
        <Button onClick={handlePrint} variant="outline">
          <Printer className="w-5 h-5 mr-2" />
          Print Complete Profile
        </Button>
      </div>

      {/* Print Header - Only visible when printing */}
      <div className="hidden print:block customer-profile-section">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-black">Haype Construction</h1>
          <h2 className="text-xl font-semibold text-black mt-2">Customer Profile Report</h2>
          <p className="text-black mt-2">Generated on {format(new Date(), 'MMMM dd, yyyy')}</p>
        </div>
      </div>

      {/* Customer Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 customer-details-section">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="flex items-center">
            <User className="w-12 h-12 text-blue-600 mr-4" />
            <div>
              <p className="text-sm text-gray-600">Customer Name</p>
              <p className="text-lg font-semibold text-gray-900">{customer.customerName}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Phone className="w-12 h-12 text-green-600 mr-4" />
            <div>
              <p className="text-sm text-gray-600">Phone Number</p>
              <p className="text-lg font-semibold font-mono">{customer.phoneNumber || 'N/A'}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <DollarSign className="w-12 h-12 text-red-600 mr-4" />
            <div>
              <p className="text-sm text-gray-600">Current Balance</p>
              <p className="text-lg font-semibold text-red-600">${finalBalance.toLocaleString()}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Customer Type</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              (customer.balance || 0) === 0 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {(customer.balance || 0) === 0 ? 'Cash Customer' : 'Credit Customer'}
            </span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 no-print">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search invoice, item, or payment..."
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
        <div className="border-b border-gray-200 no-print">
          <nav className="flex space-x-8 px-6 tab-navigation">
            <button
              onClick={() => setActiveTab('combined')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'combined'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <CreditCard className="w-4 h-4 mr-2" />
                Combined History
                <span className="ml-2 bg-gray-100 text-gray-600 py-1 px-2 rounded-full text-xs">
                  {filteredCombinedHistory.length}
                </span>
              </div>
            </button>
            
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
                Credit Transactions
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
            {activeTab === 'combined' && (
              <SectionPrintOptions
                data={filteredCombinedHistory}
                columns={combinedHistoryColumns}
                title="Customer Profile"
                sectionName="Combined History"
                profileData={{
                  'Customer Name': customer.customerName,
                  'Phone Number': customer.phoneNumber || 'N/A',
                  'Current Balance': `$${finalBalance.toLocaleString()}`,
                  'Customer Type': (customer.balance || 0) === 0 ? 'Cash Customer' : 'Credit Customer',
                  'Total Credit Transactions': filteredTransactions.length,
                  'Total Payments': filteredPayments.length
                }}
                dateRange={dateRange}
              />
            )}
            
            {activeTab === 'transactions' && (
              <SectionPrintOptions
                data={filteredTransactions}
                columns={transactionColumns}
                title="Customer Profile"
                sectionName="Credit Transactions"
                profileData={{
                  'Customer Name': customer.customerName,
                  'Phone Number': customer.phoneNumber || 'N/A',
                  'Current Balance': `$${finalBalance.toLocaleString()}`,
                  'Customer Type': (customer.balance || 0) === 0 ? 'Cash Customer' : 'Credit Customer'
                }}
                dateRange={dateRange}
              />
            )}
            
            {activeTab === 'payments' && (
              <SectionPrintOptions
                data={filteredPayments}
                columns={paymentColumns}
                title="Customer Profile"
                sectionName="Payment History"
                profileData={{
                  'Customer Name': customer.customerName,
                  'Phone Number': customer.phoneNumber || 'N/A',
                  'Current Balance': `$${finalBalance.toLocaleString()}`,
                  'Customer Type': (customer.balance || 0) === 0 ? 'Cash Customer' : 'Credit Customer'
                }}
                dateRange={dateRange}
              />
            )}
          </div>
          
          {/* Combined History Tab */}
          {activeTab === 'combined' && (
            <div className="combined-history-section">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Combined Transaction & Payment History</h2>
              <p className="text-gray-600 mb-4">
                Showing {filteredCombinedHistory.length} records with running balance calculation
              </p>
              <Table 
                data={filteredCombinedHistory} 
                columns={combinedHistoryColumns}
                emptyMessage="No transactions or payments found for the selected criteria."
              />
              
              {/* Balance Summary */}
              <div className=" grid-cols-3 mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6 summary-section">
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Balance Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-lg text-center">
                    <p className="text-sm text-red-700">Total Credited</p>
                    <p className="text-xl font-bold text-red-600">${totalCredited.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg text-center">
                    <p className="text-sm text-green-700">Total MKPYN Payments</p>
                    <p className="text-xl font-bold text-green-600">${totalPayments.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg text-center">
                    <p className="text-sm text-blue-700">Final Balance</p>
                    <p className="text-xl font-bold text-blue-600">${finalBalance.toLocaleString()}</p>
                  </div>
                 
                </div>
              </div>
            </div>
          )}

          {/* Credit Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="transactions-section">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Credit Transactions Only</h2>
              <p className="text-gray-600 mb-4">
                Showing {filteredTransactions.length} credit transactions (cash transactions excluded)
              </p>
              <Table 
                data={filteredTransactions} 
                columns={transactionColumns}
                emptyMessage="No credit transactions found for the selected criteria."
              />
            </div>
          )}

          {/* Payment History Tab */}
          {activeTab === 'payments' && (
            <div className="payments-section">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment History (MKPYN)</h2>
              <p className="text-gray-600 mb-4">
                Showing {filteredPayments.length} payments received from customer
              </p>
              <Table 
                data={filteredPayments} 
                columns={paymentColumns}
                emptyMessage="No payments found for the selected criteria."
              />
            </div>
          )}

          {/* Print-only content - Show all sections when printing */}
          <div className="hidden print:block">
            <div className="combined-history-section mb-8 page-break-avoid">
              <h2 className="text-xl font-semibold text-black mb-4">Combined Transaction & Payment History</h2>
              <p className="text-black mb-4">
                Complete history with running balance calculation
              </p>
              <Table 
                data={combinedHistory} 
                columns={combinedHistoryColumns}
                emptyMessage="No records found."
              />
              
              {/* Balance Summary for Print */}
              <div className="mt-6 bg-gray-100 border border-gray-400 rounded-lg p-6 summary-section page-break-avoid">
                <h3 className="text-lg font-semibold text-black mb-4">Balance Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white p-4 rounded-lg text-center border border-gray-300">
                    <p className="text-sm text-black">Total Credited</p>
                    <p className="text-xl font-bold text-black">${totalCredited.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg text-center border border-gray-300">
                    <p className="text-sm text-black">Total MKPYN Payments</p>
                    <p className="text-xl font-bold text-black">${totalPayments.toLocaleString()}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg text-center border border-gray-300">
                    <p className="text-sm text-black">Final Balance</p>
                    <p className="text-xl font-bold text-black">${finalBalance.toLocaleString()}</p>
                  </div>
                
                </div>
              </div>
            </div>
            
            <div className="page-break"></div>
            
            <div className="transactions-section mb-8 page-break-avoid">
              <h2 className="text-xl font-semibold text-black mb-4">Credit Transactions Details</h2>
              <p className="text-black mb-4">
                All credit transactions (cash transactions excluded)
              </p>
              <Table 
                data={transactions} 
                columns={transactionColumns}
                emptyMessage="No credit transactions found."
              />
            </div>
            
            <div className="payments-section page-break-avoid">
              <h2 className="text-xl font-semibold text-black mb-4">Payment History Details (MKPYN)</h2>
              <p className="text-black mb-4">
                All payments received from customer
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

      {/* View Payment Modal */}
      {showViewPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="w-6 h-6 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">MKPYN Payment Details</h3>
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
                      MKPYN - {selectedPayment.type === 'receive' ? 'Payment Received' : 'Payment Out'}
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
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Customer:</span>
                    <span className="font-medium">
                      {customer?.customerName || 'Unknown Customer'}
                    </span>
                  </div>
                  
                  {selectedPayment.carId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Car:</span>
                      <span className="font-medium">
                        {cars.find(c => c._id === (selectedPayment.carId?._id || selectedPayment.carId))?.carName || 'Unknown Car'}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Description:</span>
                    <span className="font-medium text-gray-800">{selectedPayment.description || 'Payment received'}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
                <Button variant="outline" onClick={() => setShowViewPaymentModal(false)}>Close</Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowViewPaymentModal(false);
                    handleEditPayment(selectedPayment);
                  }}
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
                  <h3 className="text-lg font-semibold text-gray-900">Edit Payment</h3>
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
              <FormInput
                label="Payment Number"
                name="paymentNo"
                value={editPaymentData.paymentNo}
                onChange={handleEditPaymentChange}
                disabled
              />
              
              <FormInput
                label="Date"
                name="paymentDate"
                type="date"
                value={editPaymentData.paymentDate}
                onChange={handleEditPaymentChange}
                required
              />
              
              <FormInput
                label="Amount"
                name="amount"
                type="number"
                value={editPaymentData.amount}
                onChange={handleEditPaymentChange}
                min="0"
                step="0.01"
                required
              />
              
              <FormInput
                label="Description"
                name="description"
                value={editPaymentData.description}
                onChange={handleEditPaymentChange}
                placeholder="Payment description"
              />
              
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
                  {loading ? 'Updating...' : 'Update Payment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={showModal}
        onClose={handleCloseModal}
        invoiceNo={selectedInvoice}
        mode={modalMode}
      />

      <Footer />
    </div>
  );
};

export default CustomerProfile;