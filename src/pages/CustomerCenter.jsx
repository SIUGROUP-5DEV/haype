import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, Plus, Search, Edit, Trash2, Eye, Filter } from 'lucide-react';
import Button from '../components/Button';
import Table from '../components/Table';
import SearchInput from '../components/SearchInput';
import EditCustomerModal from '../components/EditCustomerModal';
import { customersAPI, invoicesAPI, paymentsAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Footer from '../components/Footer';
import SectionPrintOptions from '../components/SectionPrintOptions';
import { format } from 'date-fns';

const CustomerCenter = () => {
  const { showSuccess, showError } = useToast();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [customerBalances, setCustomerBalances] = useState({});

  // Load customers from database
  useEffect(() => {
    loadCustomers();
    calculateCustomerBalances();
  }, []);

  // Filter customers when search term or payment method changes
  useEffect(() => {
    const filtered = customers.map(customer => ({
      ...customer,
      finalBalance: customerBalances[customer._id] || customer.balance || 0
    })).filter(customer => {
      const matchesSearch = customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (customer.phoneNumber && customer.phoneNumber.includes(searchTerm));
      
      let matchesType = true;
      if (paymentMethodFilter === 'cash') {
        matchesType = (customer.finalBalance || 0) === 0;
      } else if (paymentMethodFilter === 'credit') {
        matchesType = (customer.finalBalance || 0) > 0;
      }
      
      return matchesSearch && matchesType;
    });
    setFilteredCustomers(filtered);
  }, [searchTerm, paymentMethodFilter, customers, customerBalances]);

  const calculateCustomerBalances = async () => {
    try {
      const [invoicesResponse, paymentsResponse] = await Promise.all([
        invoicesAPI.getAll(),
        paymentsAPI.getAll()
      ]);
      
      const allInvoices = invoicesResponse.data;
      const allPayments = paymentsResponse.data;
      const balances = {};
      
      // Calculate for each customer
      customers.forEach(customer => {
        // Get credit transactions for this customer
        let totalCredited = 0;
        allInvoices.forEach(invoice => {
          invoice.items?.forEach(item => {
            const itemCustomerId = item.customerId?._id || item.customerId;
            if (itemCustomerId === customer._id && item.paymentMethod === 'credit') {
              totalCredited += item.total || 0;
            }
          });
        });
        
        // Get payments received from this customer
        const totalPayments = allPayments
          .filter(payment => 
            (payment.customerId?._id === customer._id || payment.customerId === customer._id) && 
            payment.type === 'receive'
          )
          .reduce((sum, payment) => sum + payment.amount, 0);
        
        // Final balance = Total Credited - Total Payments
        const finalBalance = Math.max(0, totalCredited - totalPayments);
        balances[customer._id] = finalBalance;
      });
      
      setCustomerBalances(balances);
      console.log('✅ Customer balances calculated:', balances);
    } catch (error) {
      console.error('❌ Error calculating customer balances:', error);
    }
  };
  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await customersAPI.getAll();
      setCustomers(response.data);
      console.log('✅ Customers loaded from database:', response.data);
    } catch (error) {
      console.error('❌ Error loading customers:', error);
      showError('Load Failed', 'Failed to load customers from database');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customersAPI.delete(id);
        showSuccess('Customer Deleted', 'Customer has been deleted successfully');
        loadCustomers();
      } catch (error) {
        console.error('❌ Error deleting customer:', error);
        showError('Delete Failed', 'Failed to delete customer');
      }
    }
  };

  const columns = [
    {
      header: 'Customer Name',
      accessor: 'customerName',
      render: (value, row) => (
        <div className="flex items-center">
          <UserCheck className="w-5 h-5 text-blue-600 mr-2" />
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      )
    },
    {
      header: 'Phone Number',
      accessor: 'phoneNumber',
      render: (value) => (
        <span className="font-mono text-gray-700">{value || 'N/A'}</span>
      )
    },
    
    {
      header: 'Status',
      accessor: 'finalBalance',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          (value || 0) === 0 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {(value || 0) === 0 ? 'Cash' : 'Credit'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <Link
            to={`/customers/${value}`}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={() => handleEdit(value)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(value)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const handleEdit = (id) => {
    setSelectedCustomerId(id);
    setShowEditModal(true);
  };

  const handleEditSave = () => {
    loadCustomers(); // Refresh the customers list
    setShowEditModal(false);
    setSelectedCustomerId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <LoadingSpinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Customer Center</h1>
          <p className="text-gray-600">Manage your customer base</p>
        </div>
        <Link to="/customers/create">
          <Button className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Create Customer
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Customers</option>
                <option value="cash">Cash Customers (Balance = 0)</option>
                <option value="credit">Credit Customers (Outstanding Balance)</option>
              </select>
            </div>
            
            <SearchInput
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={loadCustomers}>
              <Filter className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Customers List</h2>
          <SectionPrintOptions
            data={filteredCustomers}
            columns={columns}
            title="Customer Center"
            sectionName="All Customers"
            profileData={{
              'Total Customers': customers.length,
              'Cash Customers': filteredCustomers.filter(customer => (customer.finalBalance || 0) === 0).length,
              'Credit Customers': filteredCustomers.filter(customer => (customer.finalBalance || 0) > 0).length,
              'Total Outstanding': `$${Object.values(customerBalances).reduce((sum, balance) => sum + balance, 0).toLocaleString()}`,
              
              'Report Generated': format(new Date(), 'MMMM dd, yyyy')
            }}
          />
        </div>
        <Table 
          data={filteredCustomers} 
          columns={columns}
          emptyMessage="No customers found. Create your first customer to get started."
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cash Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(customerBalances).filter(balance => balance === 0).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Credit Customers</p>
              <p className="text-2xl font-bold text-gray-900">
                {Object.values(customerBalances).filter(balance => balance > 0).length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-orange-100 rounded-lg">
              <UserCheck className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-gray-900">
                ${Object.values(customerBalances).reduce((sum, balance) => sum + balance, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Customer Modal */}
      <EditCustomerModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCustomerId(null);
        }}
        customerId={selectedCustomerId}
        onSave={handleEditSave}
      />

<Footer/>

    </div>
  );
};

export default CustomerCenter;