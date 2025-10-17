import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Plus, Search, Edit, Trash2, Eye, Filter } from 'lucide-react';
import Button from '../components/Button';
import Table from '../components/Table';
import SearchInput from '../components/SearchInput';
import { itemsAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Footer from '../components/Footer';
import SectionPrintOptions from '../components/SectionPrintOptions';
import { format } from 'date-fns';

const ItemsCenter = () => {
  const { showSuccess, showError } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);

  // Load items from database
  useEffect(() => {
    loadItems();
  }, []);

  // Filter items when search term changes
  useEffect(() => {
    const filtered = items.filter(item =>
      item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchTerm, items]);

  const loadItems = async () => {
    try {
      setLoading(true);
      const response = await itemsAPI.getAll();
      setItems(response.data);
      console.log('✅ Items loaded from database:', response.data);
    } catch (error) {
      console.error('❌ Error loading items:', error);
      showError('Load Failed', 'Failed to load items from database');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await itemsAPI.delete(id);
        showSuccess('Item Deleted', 'Item has been deleted successfully');
        loadItems();
      } catch (error) {
        console.error('❌ Error deleting item:', error);
        showError('Delete Failed', 'Failed to delete item');
      }
    }
  };

  const columns = [
    {
      header: 'Item Name',
      accessor: 'itemName',
      render: (value, row) => (
        <div className="flex items-center">
          <Package className="w-5 h-5 text-blue-600 mr-2" />
          <span className="font-medium text-gray-900">{value}</span>
        </div>
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
      header: 'Actions',
      accessor: '_id',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <Link
            to={`/items/${value}`}
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
    console.log('Edit item:', id);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Items Center</h1>
          <p className="text-gray-600">Manage your inventory items</p>
        </div>
        <Link to="/items/create">
          <Button className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Create Item
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <SearchInput
            placeholder="Search by item name..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={loadItems}>
              <Filter className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Items List</h2>
          <SectionPrintOptions
            data={filteredItems}
            columns={columns}
            title="Items Center"
            sectionName="All Items"
            profileData={{
              'Total Items': items.length,
              'Average Price': items.length > 0 ? `$${(items.reduce((sum, item) => sum + item.price, 0) / items.length).toFixed(0)}` : '$0',
              'Highest Price': items.length > 0 ? `$${Math.max(...items.map(item => item.price)).toFixed(0)}` : '$0',
              'Report Generated': format(new Date(), 'MMMM dd, yyyy')
            }}
          />
        </div>
        <Table 
          data={filteredItems} 
          columns={columns}
          emptyMessage="No items found. Create your first item to get started."
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Items</p>
              <p className="text-2xl font-bold text-gray-900">{items.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Price</p>
              <p className="text-2xl font-bold text-gray-900">
                ${items.length > 0 
                  ? (items.reduce((sum, item) => sum + item.price, 0) / items.length).toFixed(0)
                  : 0}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-teal-100 rounded-lg">
              <Package className="w-6 h-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Highest Price</p>
              <p className="text-2xl font-bold text-gray-900">
                ${items.length > 0 
                  ? Math.max(...items.map(item => item.price)).toFixed(0)
                  : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

<Footer/>

    </div>
  );
};

export default ItemsCenter;