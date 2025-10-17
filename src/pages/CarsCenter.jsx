import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Car, Plus, Search, Edit, Trash2, Eye, Filter } from 'lucide-react';
import Button from '../components/Button';
import Table from '../components/Table';
import SearchInput from '../components/SearchInput';
import EditCarModal from '../components/EditCarModal';
import { carsAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Footer from '../components/Footer';
import SectionPrintOptions from '../components/SectionPrintOptions';
import { format } from 'date-fns';

const CarsCenter = () => {
  const { showSuccess, showError } = useToast();
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCars, setFilteredCars] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCarId, setSelectedCarId] = useState(null);

  // Load cars from database
  useEffect(() => {
    loadCars();
  }, []);

  // Filter cars when search term changes
  useEffect(() => {
    const filtered = cars.filter(car =>
      car.carName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      car.numberPlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (car.driverId?.employeeName && car.driverId.employeeName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredCars(filtered);
  }, [searchTerm, cars]);

  const loadCars = async () => {
    try {
      setLoading(true);
      const response = await carsAPI.getAll();
      setCars(response.data);
      console.log('✅ Cars loaded from database:', response.data);
    } catch (error) {
      console.error('❌ Error loading cars:', error);
      showError('Load Failed', 'Failed to load cars from database');
      setCars([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this car?')) {
      try {
        await carsAPI.delete(id);
        showSuccess('Car Deleted', 'Car has been deleted successfully');
        loadCars();
      } catch (error) {
        console.error('❌ Error deleting car:', error);
        showError('Delete Failed', 'Failed to delete car');
      }
    }
  };

  const columns = [
    {
      header: 'Car Name',
      accessor: 'carName',
      render: (value, row) => (
        <div className="flex items-center">
          <Car className="w-5 h-5 text-blue-600 mr-2" />
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      )
    },
    {
      header: 'Number Plate',
      accessor: 'numberPlate',
      render: (value) => (
        <span className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">{value}</span>
      )
    },
    {
      header: 'Balance',
      accessor: 'balance',
      render: (value) => (
        <span className="font-semibold text-green-600">${(value || 0).toLocaleString()}</span>
      )
    },
    {
      header: 'Driver',
      accessor: 'driverId',
      render: (value) => (
        <span className="text-gray-700">{value?.employeeName || 'Not Assigned'}</span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          {value || 'Active'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <Link
            to={`/cars/${value}`}
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
    setSelectedCarId(id);
    setShowEditModal(true);
  };

  const handleEditSave = () => {
    loadCars(); // Refresh the cars list
    setShowEditModal(false);
    setSelectedCarId(null);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cars Center</h1>
          <p className="text-gray-600">Manage your fleet of vehicles</p>
        </div>
        <Link to="/cars/create">
          <Button className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Create Car
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <SearchInput
            placeholder="Search by car name, plate, or driver..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
          
          <div className="flex items-center space-x-4">
            <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <Button variant="outline" size="sm" onClick={loadCars}>
              <Filter className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Car Modal */}
      <EditCarModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCarId(null);
        }}
        carId={selectedCarId}
        onSave={handleEditSave}
      />

      {/* Cars Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Cars List</h2>
          <SectionPrintOptions
            data={filteredCars}
            columns={columns}
            title="Cars Center"
            sectionName="All Cars"
            profileData={{
              'Total Cars': cars.length,
              'Active Cars': cars.filter(car => car.status === 'Active').length,
              'Total Fleet Balance': `$${cars.reduce((sum, car) => sum + (car.balance || 0), 0).toLocaleString()}`,
              'Report Generated': format(new Date(), 'MMMM dd, yyyy')
            }}
          />
        </div>
        <Table 
          data={filteredCars} 
          columns={columns}
          emptyMessage="No cars found. Create your first car to get started."
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Cars</p>
              <p className="text-2xl font-bold text-gray-900">{cars.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Car className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Cars</p>
              <p className="text-2xl font-bold text-gray-900">
                {cars.filter(car => car.status === 'Active').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-teal-100 rounded-lg">
              <Car className="w-6 h-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                ${cars.reduce((sum, car) => sum + (car.balance || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>
<Footer/>

    </div>
  );
};

export default CarsCenter;