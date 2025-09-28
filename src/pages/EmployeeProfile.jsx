import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Phone, DollarSign, Calendar, Filter, Printer, Edit, Eye, Plus, Minus, CreditCard } from 'lucide-react';
import Button from '../components/Button';
import Table from '../components/Table';
import DateFilter from '../components/DateFilter';
import InvoiceModal from '../components/InvoiceModal';
import FormInput from '../components/FormInput';
import { employeesAPI, invoicesAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import Footer from '../components/Footer';

const EmployeeProfile = () => {
  const { id } = useParams();
  const { showError, showSuccess } = useToast();
  const [employee, setEmployee] = useState(null);
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
  
  // Balance management modals
  const [showAddBalanceModal, setShowAddBalanceModal] = useState(false);
  const [showDeductBalanceModal, setShowDeductBalanceModal] = useState(false);
  const [balanceFormData, setBalanceFormData] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });
  const [balanceLoading, setBalanceLoading] = useState(false);
  
  const [transactions, setTransactions] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);

  // Load employee data and transactions from database
  useEffect(() => {
    if (id) {
      loadEmployeeData();
      loadTransactions();
      loadPaymentHistory();
    }
  }, [id]);

  const loadEmployeeData = async () => {
    try {
      setLoading(true);
      const response = await employeesAPI.getById(id);
      setEmployee(response.data);
      console.log('✅ Employee data loaded:', response.data);
    } catch (error) {
      console.error('❌ Error loading employee:', error);
      showError('Load Failed', 'Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      // Load all invoices and extract employee-related transactions
      const response = await invoicesAPI.getAll();
      const allInvoices = response.data;
      
      // Find transactions where this employee was involved (as driver or kirishboy)
      const employeeTransactions = [];
      
      allInvoices.forEach(invoice => {
        if (invoice.carId && (invoice.carId.driverId === id || invoice.carId.kirishboyId === id)) {
          // Calculate employee's fee based on items
          invoice.items?.forEach(item => {
            if (item.itemId) {
              const fee = employee?.category === 'driver' 
                ? item.itemId.driverPrice || 0 
                : item.itemId.kirishboyPrice || 0;
              
              employeeTransactions.push({
                id: `${invoice._id}-${item._id}`,
                invoiceNo: invoice.invoiceNo,
                itemName: item.itemId.itemName || 'Unknown Item',
                quantity: item.quantity || 0,
                fee: fee,
                total: (item.quantity || 0) * fee,
                date: invoice.invoiceDate
              });
            }
          });
        }
      });
      
      setTransactions(employeeTransactions);
      console.log('✅ Employee transactions loaded:', employeeTransactions);
    } catch (error) {
      console.error('❌ Error loading transactions:', error);
      showError('Load Failed', 'Failed to load transaction data');
      setTransactions([]);
    }
  };

  const loadPaymentHistory = async () => {
    try {
      // Use the new payment history endpoint
      const response = await employeesAPI.getPaymentHistory(id);
      setPaymentHistory(response.data);
      console.log('✅ Employee payment history loaded:', response.data);
    } catch (error) {
      console.error('❌ Error loading payment history:', error);
      showError('Load Failed', 'Failed to load payment history');
      setPaymentHistory([]);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.itemName.toLowerCase().includes(searchTerm.toLowerCase());
    const transactionDate = new Date(transaction.date);
    const matchesDateRange = transactionDate >= dateRange.from && transactionDate <= dateRange.to;
    
    return matchesSearch && matchesDateRange;
  });

  const filteredPaymentHistory = paymentHistory.filter(payment => {
    const matchesSearch = payment.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const paymentDate = new Date(payment.paymentDate);
    const matchesDateRange = paymentDate >= dateRange.from && paymentDate <= dateRange.to;
    
    return matchesSearch && matchesDateRange;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleApplyFilter = () => {
    console.log('Applying employee profile filter with:', {
      searchTerm,
      dateRange
    });
    
    alert(`Filter applied for ${employee?.employeeName} with ${filteredTransactions.length} transactions and ${filteredPaymentHistory.length} payment records found`);
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

  // Balance management functions
  const handleBalanceFormChange = (e) => {
    const { name, value } = e.target;
    setBalanceFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddBalance = async (e) => {
    e.preventDefault();
    
    if (!balanceFormData.amount || !balanceFormData.date || !balanceFormData.description) {
      showError('Validation Error', 'Please fill in all fields');
      return;
    }

    setBalanceLoading(true);
    
    try {
      // Call API to add balance
      const response = await employeesAPI.addBalance(id, balanceFormData);
      
      showSuccess('Balance Added', `$${balanceFormData.amount} has been added to ${employee.employeeName}'s balance`);
      
      // Reset form and close modal
      setBalanceFormData({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
      setShowAddBalanceModal(false);
      
      // Reload data
      loadEmployeeData();
      loadPaymentHistory();
      
    } catch (error) {
      console.error('❌ Error adding balance:', error);
      showError('Add Balance Failed', 'Failed to add balance. Please try again.');
    } finally {
      setBalanceLoading(false);
    }
  };

  const handleDeductBalance = async (e) => {
    e.preventDefault();
    
    if (!balanceFormData.amount || !balanceFormData.date || !balanceFormData.description) {
      showError('Validation Error', 'Please fill in all fields');
      return;
    }

    setBalanceLoading(true);
    
    try {
      // Call API to deduct balance
      const response = await employeesAPI.deductBalance(id, balanceFormData);
      
      showSuccess('Balance Deducted', `$${balanceFormData.amount} has been deducted from ${employee.employeeName}'s balance`);
      
      // Reset form and close modal
      setBalanceFormData({
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
      setShowDeductBalanceModal(false);
      
      // Reload data
      loadEmployeeData();
      loadPaymentHistory();
      
    } catch (error) {
      console.error('❌ Error deducting balance:', error);
      showError('Deduct Balance Failed', 'Failed to deduct balance. Please try again.');
    } finally {
      setBalanceLoading(false);
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
      header: 'Quantity',
      accessor: 'quantity',
      render: (value) => (
        <span className="font-semibold">{value}</span>
      )
    },
    {
      header: 'Fee',
      accessor: 'fee',
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

  const paymentHistoryColumns = [
    {
      header: 'Date',
      accessor: 'paymentDate',
      render: (value) => format(new Date(value), 'MMM dd, yyyy')
    },
    {
      header: 'Description',
      accessor: 'description'
    },
    {
      header: 'Amount',
      accessor: 'amount',
      render: (value, row) => (
        <span className={`font-semibold ${
          row.type === 'balance_add' ? 'text-green-600' : 'text-red-600'
        }`}>
          {row.type === 'balance_add' ? '+' : '-'}${value.toLocaleString()}
        </span>
      )
    },
    {
      header: 'Balance After',
      accessor: 'balanceAfter',
      render: (value) => (
        <span className="font-semibold text-blue-600">${(value || 0).toLocaleString()}</span>
      )
    },
    {
      header: 'Type',
      accessor: 'type',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'balance_add' 
            ? 'bg-green-100 text-green-800' 
            : value === 'balance_deduct'
            ? 'bg-red-100 text-red-800'
            : 'bg-blue-100 text-blue-800'
        }`}>
          {value === 'balance_add' ? 'Added' : value === 'balance_deduct' ? 'Deducted' : 'Payment'}
        </span>
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

  if (!employee) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Employee Not Found</h3>
        <p className="text-gray-600 mb-4">The requested employee could not be found.</p>
        <Link to="/employees">
          <Button>Back to Employees</Button>
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
            to="/employees"
            className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{employee.employeeName}</h1>
            <p className="text-gray-600">Employee Profile & History</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={() => setShowAddBalanceModal(true)}
            variant="success"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Balance
          </Button>
          <Button 
            onClick={() => setShowDeductBalanceModal(true)}
            variant="danger"
            size="sm"
          >
            <Minus className="w-4 h-4 mr-2" />
            Deduct Balance
          </Button>
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="w-5 h-5 mr-2" />
            Print
          </Button>
        </div>
      </div>

      {/* Employee Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="flex items-center">
            <User className="w-12 h-12 text-blue-600 mr-4" />
            <div>
              <p className="text-sm text-gray-600">Employee Name</p>
              <p className="text-lg font-semibold text-gray-900">{employee.employeeName}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Phone className="w-12 h-12 text-green-600 mr-4" />
            <div>
              <p className="text-sm text-gray-600">Phone Number</p>
              <p className="text-lg font-semibold font-mono">{employee.phoneNumber || 'N/A'}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Category</p>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              employee.category === 'driver' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-green-100 text-green-800'
            }`}>
              {employee.category.charAt(0).toUpperCase() + employee.category.slice(1)}
            </span>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Current Balance</p>
            <p className="text-lg font-semibold text-green-600">${(employee.balance || 0).toLocaleString()}</p>
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
              placeholder="Search invoice or item..."
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
                  {filteredPaymentHistory.length}
                </span>
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'transactions' ? (
             <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment History</h2>
              <p className="text-gray-600 mb-4">
                Showing {filteredPaymentHistory.length} payment records
              </p>
              <Table 
                data={filteredPaymentHistory} 
                columns={paymentHistoryColumns}
                emptyMessage="No payment history found. Use the Add/Deduct Balance buttons to manage employee balance."
              />
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment History</h2>
              <p className="text-gray-600 mb-4">
                Showing {filteredPaymentHistory.length} payment records
              </p>
              <Table 
                data={filteredPaymentHistory} 
                columns={paymentHistoryColumns}
                emptyMessage="No payment history found. Use the Add/Deduct Balance buttons to manage employee balance."
              />
            </div>
          )}
        </div>
      </div>

    

      {/* Add Balance Modal */}
      {showAddBalanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add Balance</h3>
              <p className="text-sm text-gray-600">Add amount to {employee.employeeName}'s balance</p>
            </div>

            <form onSubmit={handleAddBalance} className="p-6 space-y-4">
              <FormInput
                label="Amount"
                name="amount"
                type="number"
                value={balanceFormData.amount}
                onChange={handleBalanceFormChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />

              <FormInput
                label="Date"
                name="date"
                type="date"
                value={balanceFormData.date}
                onChange={handleBalanceFormChange}
                required
              />

              <FormInput
                label="Description"
                name="description"
                value={balanceFormData.description}
                onChange={handleBalanceFormChange}
                placeholder="Reason for adding balance"
                required
              />

              <div className="flex space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddBalanceModal(false)}
                  className="flex-1"
                  disabled={balanceLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={balanceLoading}>
                  {balanceLoading ? 'Adding...' : 'Add Balance'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deduct Balance Modal */}
      {showDeductBalanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Deduct Balance</h3>
              <p className="text-sm text-gray-600">Deduct amount from {employee.employeeName}'s balance</p>
            </div>

            <form onSubmit={handleDeductBalance} className="p-6 space-y-4">
              <FormInput
                label="Amount"
                name="amount"
                type="number"
                value={balanceFormData.amount}
                onChange={handleBalanceFormChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />

              <FormInput
                label="Date"
                name="date"
                type="date"
                value={balanceFormData.date}
                onChange={handleBalanceFormChange}
                required
              />

              <FormInput
                label="Description"
                name="description"
                value={balanceFormData.description}
                onChange={handleBalanceFormChange}
                placeholder="Reason for deducting balance"
                required
              />

              <div className="flex space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeductBalanceModal(false)}
                  className="flex-1"
                  disabled={balanceLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="danger" className="flex-1" disabled={balanceLoading}>
                  {balanceLoading ? 'Deducting...' : 'Deduct Balance'}
                </Button>
              </div>
            </form>
          </div>


<Footer/>

        </div>
      )}

      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={showModal}
        onClose={handleCloseModal}
        invoiceNo={selectedInvoice}
        mode={modalMode}
      />
    </div>
  );
};

export default EmployeeProfile;