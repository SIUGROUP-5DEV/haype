import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, DollarSign, Calendar, Filter, Printer, Edit, Eye } from 'lucide-react';
import Button from '../components/Button';
import Table from '../components/Table';
import DateFilter from '../components/DateFilter';
import InvoiceModal from '../components/InvoiceModal';
import { itemsAPI, invoicesAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import Footer from '../components/Footer';

const ItemProfile = () => {
  const { id } = useParams();
  const { showError, showSuccess } = useToast();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [modalMode, setModalMode] = useState('view');
  const [showModal, setShowModal] = useState(false);
  
  const [transactions, setTransactions] = useState([]);

  // Load item data and transactions from database
  useEffect(() => {
    if (id) {
      loadItemData();
      loadTransactions();
    }
  }, [id]);

  const loadItemData = async () => {
    try {
      setLoading(true);
      console.log('📦 Loading item data for ID:', id);
      
      const response = await itemsAPI.getById(id);
      setItem(response.data);
      console.log('✅ Item data loaded:', response.data);
      
      showSuccess('Item Loaded', `${response.data.itemName} profile loaded successfully`);
    } catch (error) {
      console.error('❌ Error loading item:', error);
      showError('Load Failed', 'Failed to load item data');
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async () => {
    try {
      console.log('🛒 Loading transactions for item ID:', id);
      
      // Load all invoices and filter item transactions
      const response = await invoicesAPI.getAll();
      const allInvoices = response.data;
      
      console.log('📋 All invoices loaded:', allInvoices.length);
      
      // Find transactions for this item
      const itemTransactions = [];
      
      allInvoices.forEach(invoice => {
        invoice.items?.forEach(item => {
          const itemId = item.itemId?._id || item.itemId;
          if (itemId === id) {
            itemTransactions.push({
              id: `${invoice._id}-${item._id}`,
              invoiceNo: invoice.invoiceNo,
              customerName: item.customerId?.customerName || 'Unknown Customer',
              quantity: item.quantity || 0,
              price: item.price || 0,
              total: item.total || 0,
              date: invoice.invoiceDate,
              carName: invoice.carId?.carName || 'Unknown Car',
              paymentMethod: item.paymentMethod || 'cash',
              description: item.description || ''
            });
          }
        });
      });
      
      setTransactions(itemTransactions);
      console.log('✅ Item transactions processed:', itemTransactions.length);
      
    } catch (error) {
      console.error('❌ Error loading transactions:', error);
      showError('Load Failed', 'Failed to load transaction data');
      setTransactions([]);
    }
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.carName.toLowerCase().includes(searchTerm.toLowerCase());
    const transactionDate = new Date(transaction.date);
    const matchesDateRange = transactionDate >= dateRange.from && transactionDate <= dateRange.to;
    
    return matchesSearch && matchesDateRange;
  });

  const handlePrint = () => {
    window.print();
  };

  const handleApplyFilter = () => {
    console.log('Applying item profile filter with:', {
      searchTerm,
      dateRange,
      itemId: id
    });
    
    showSuccess('Filter Applied', `Found ${filteredTransactions.length} transactions for ${item?.itemName}`);
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

  const columns = [
    {
      header: 'Invoice No',
      accessor: 'invoiceNo',
      render: (value) => (
        <span className="font-mono text-blue-600 font-medium">{value}</span>
      )
    },
    {
      header: 'Customer',
      accessor: 'customerName',
      render: (value) => (
        <span className="text-gray-700">{value}</span>
      )
    },
    {
      header: 'Car',
      accessor: 'carName',
      render: (value) => (
        <span className="text-gray-700">{value}</span>
      )
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
      header: 'Payment',
      accessor: 'paymentMethod',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'cash' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {value.toUpperCase()}
        </span>
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <LoadingSpinner size={32} />
          <p className="text-gray-600 mt-4">Loading item profile...</p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Item Not Found</h3>
        <p className="text-gray-600 mb-4">The requested item could not be found.</p>
        <Link to="/items">
          <Button>Back to Items</Button>
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
            to="/items"
            className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{item.itemName}</h1>
            <p className="text-gray-600">Item Profile & Sales History</p>
          </div>
        </div>
        <Button onClick={handlePrint} variant="outline">
          <Printer className="w-5 h-5 mr-2" />
          Print
        </Button>
      </div>

      {/* Item Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="flex items-center">
            <Package className="w-12 h-12 text-blue-600 mr-4" />
            <div>
              <p className="text-sm text-gray-600">Item Name</p>
              <p className="text-lg font-semibold text-gray-900">{item.itemName}</p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Current Quantity</p>
            <p className="text-lg font-semibold text-gray-900">{item.quantity || 0}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Driver Price</p>
            <p className="text-lg font-semibold text-blue-600">${item.driverPrice}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Kirishboy Price</p>
            <p className="text-lg font-semibold text-green-600">${item.kirishboyPrice}</p>
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
              placeholder="Search invoice, customer, or car..."
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

      {/* Transaction History */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Sales History</h2>
          <p className="text-gray-600 mt-1">
            Showing {filteredTransactions.length} of {transactions.length} sales
          </p>
        </div>
        
        <Table 
          data={filteredTransactions} 
          columns={columns}
          emptyMessage="No sales found for the selected criteria."
        />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sold</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredTransactions.reduce((sum, t) => sum + t.quantity, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-teal-100 rounded-lg">
              <Calendar className="w-6 h-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
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

      {/* Debug Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
          <div>
            <h4 className="font-medium text-gray-900">Item Profile Debug Info</h4>
            <p className="text-sm text-gray-700">
              Item ID: {id} | Driver Price: ${item?.driverPrice} | Kirishboy Price: ${item?.kirishboyPrice} | Sales Loaded: {transactions.length} | Filtered: {filteredTransactions.length}
            </p>
          </div>
        </div>
      </div>

<Footer/>

    </div>
  );
};

export default ItemProfile;