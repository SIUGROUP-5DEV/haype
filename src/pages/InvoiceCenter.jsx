import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Search, Edit, Trash2, Eye, Filter } from 'lucide-react';
import Button from '../components/Button';
import Table from '../components/Table';
import SearchInput from '../components/SearchInput';
import InvoiceModal from '../components/InvoiceModal';
import { invoicesAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { format } from 'date-fns';
import Footer from '../components/Footer';
import SectionPrintOptions from '../components/SectionPrintOptions';

const InvoiceCenter = () => {
  const { showSuccess, showError } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [modalMode, setModalMode] = useState('view');
  const [showModal, setShowModal] = useState(false);

  // Load invoices from database
  useEffect(() => {
    loadInvoices();
  }, []);

  // Filter invoices when search term changes
  useEffect(() => {
    const filtered = invoices.filter(invoice =>
      invoice.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.carId?.carName && invoice.carId.carName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredInvoices(filtered);
  }, [searchTerm, invoices]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const response = await invoicesAPI.getAll();
      setInvoices(response.data);
      console.log('✅ Invoices loaded from database:', response.data);
    } catch (error) {
      console.error('❌ Error loading invoices:', error);
      showError('Load Failed', 'Failed to load invoices from database');
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await invoicesAPI.delete(id);
        showSuccess('Invoice Deleted', 'Invoice has been deleted successfully');
        loadInvoices();
      } catch (error) {
        console.error('❌ Error deleting invoice:', error);
        showError('Delete Failed', 'Failed to delete invoice');
      }
    }
  };

  const handleView = (invoiceNo) => {
    setSelectedInvoice(invoiceNo);
    setModalMode('view');
    setShowModal(true);
  };

  const handleEdit = (invoiceNo) => {
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
      render: (value, row) => (
        <div className="flex items-center">
          <FileText className="w-5 h-5 text-blue-600 mr-2" />
          <span className="font-mono font-medium text-gray-900">{value}</span>
        </div>
      )
    },
    {
      header: 'Car Name',
      accessor: 'carId',
      render: (value) => (
        <span className="text-gray-700">{value?.carName || 'N/A'}</span>
      )
    },
    {
      header: 'Date',
      accessor: 'invoiceDate',
      render: (value) => format(new Date(value), 'MMM dd, yyyy')
    },
    {
      header: 'Total',
      accessor: 'total',
      render: (value) => (
        <span className="font-semibold text-blue-600">${(value || 0).toLocaleString()}</span>
      )
    },
    {
      header: 'Total Left',
      accessor: 'totalLeft',
      render: (value) => (
        <span className={`font-semibold ${(value || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
          ${(value || 0).toLocaleString()}
        </span>
      )
    },
    {
      header: 'Total Profit',
      accessor: 'totalProfit',
      render: (value) => (
        <span className="font-semibold text-green-600">${(value || 0).toLocaleString()}</span>
      )
    },
    {
      header: 'Actions',
      accessor: 'invoiceNo',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleView(value)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Invoice"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEdit(value)}
            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Edit Invoice"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row._id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Invoice Center</h1>
          <p className="text-gray-600">Manage your invoices and billing</p>
        </div>
        <Link to="/invoices/create">
          <Button className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <SearchInput
            placeholder="Search by invoice number or car name..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
          
          <div className="flex items-center space-x-4">
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">All Status</option>
              <option value="paid">Fully Paid</option>
              <option value="partial">Partially Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
            <Button variant="outline" size="sm" onClick={loadInvoices}>
              <Filter className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Invoices List</h2>
          <SectionPrintOptions
            data={filteredInvoices}
            columns={columns}
            title="Invoice Center"
            sectionName="All Invoices"
            profileData={{
              'Total Invoices': invoices.length,
              'Total Revenue': `$${invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0).toLocaleString()}`,
              'Total Profit': `$${invoices.reduce((sum, invoice) => sum + (invoice.totalProfit || 0), 0).toLocaleString()}`,
              'Outstanding Amount': `$${invoices.reduce((sum, invoice) => sum + (invoice.totalLeft || 0), 0).toLocaleString()}`,
              'Report Generated': format(new Date(), 'MMMM dd, yyyy')
            }}
          />
        </div>
        <Table 
          data={filteredInvoices} 
          columns={columns}
          emptyMessage="No invoices found. Create your first invoice to get started."
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${invoices.reduce((sum, invoice) => sum + (invoice.total || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-teal-100 rounded-lg">
              <FileText className="w-6 h-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Profit</p>
              <p className="text-2xl font-bold text-gray-900">
                ${invoices.reduce((sum, invoice) => sum + (invoice.totalProfit || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-gray-900">
                ${invoices.reduce((sum, invoice) => sum + (invoice.totalLeft || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

<Footer/>

      </div>

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

export default InvoiceCenter;