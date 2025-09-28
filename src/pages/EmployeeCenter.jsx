import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Search, Edit, Trash2, Eye, Filter } from 'lucide-react';
import Button from '../components/Button';
import Table from '../components/Table';
import SearchInput from '../components/SearchInput';
import EditEmployeeModal from '../components/EditEmployeeModal';
import { employeesAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Footer from '../components/Footer';
import SectionPrintOptions from '../components/SectionPrintOptions';
import { format } from 'date-fns';

const EmployeeCenter = () => {
  const { showSuccess, showError } = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

  // Load employees from database
  useEffect(() => {
    loadEmployees();
  }, []);

  // Filter employees when search term or category changes
  useEffect(() => {
    const filtered = employees.filter(employee => {
      const matchesSearch = employee.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (employee.phoneNumber && employee.phoneNumber.includes(searchTerm));
      const matchesCategory = categoryFilter === 'all' || employee.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
    setFilteredEmployees(filtered);
  }, [searchTerm, categoryFilter, employees]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const response = await employeesAPI.getAll();
      setEmployees(response.data);
      console.log('✅ Employees loaded from database:', response.data);
    } catch (error) {
      console.error('❌ Error loading employees:', error);
      showError('Load Failed', 'Failed to load employees from database');
      setEmployees([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await employeesAPI.delete(id);
        showSuccess('Employee Deleted', 'Employee has been deleted successfully');
        loadEmployees(); // Reload the list
      } catch (error) {
        console.error('❌ Error deleting employee:', error);
        showError('Delete Failed', 'Failed to delete employee');
      }
    }
  };

  const columns = [
    {
      header: 'Employee Name',
      accessor: 'employeeName',
      render: (value, row) => (
        <div className="flex items-center">
          <Users className="w-5 h-5 text-blue-600 mr-2" />
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
      header: 'Category',
      accessor: 'category',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'driver' 
            ? 'bg-blue-100 text-blue-800' 
            : 'bg-green-100 text-green-800'
        }`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
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
      header: 'Status',
      accessor: 'status',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Active' 
            ? 'bg-green-100 text-green-800' 
            : 'bg-gray-100 text-gray-800'
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
            to={`/employees/${value}`}
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
    setSelectedEmployeeId(id);
    setShowEditModal(true);
  };

  const handleEditSave = () => {
    loadEmployees(); // Refresh the employees list
    setShowEditModal(false);
    setSelectedEmployeeId(null);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Employee Center</h1>
          <p className="text-gray-600">Manage your workforce</p>
        </div>
        <Link to="/employees/create">
          <Button className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Create Employee
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <SearchInput
            placeholder="Search by name or phone..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
          
          <div className="flex items-center space-x-4">
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="driver">Driver</option>
              <option value="kirishboy">Kirishboy</option>
            </select>
            <Button variant="outline" size="sm" onClick={loadEmployees}>
              <Filter className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Employees List</h2>
          <SectionPrintOptions
            data={filteredEmployees}
            columns={columns}
            title="Employee Center"
            sectionName="All Employees"
            profileData={{
              'Total Employees': employees.length,
              'Drivers': employees.filter(emp => emp.category === 'driver').length,
              'Kirishboys': employees.filter(emp => emp.category === 'kirishboy').length,
              'Total Employee Balance': `$${employees.reduce((sum, emp) => sum + (emp.balance || 0), 0).toLocaleString()}`,
              'Report Generated': format(new Date(), 'MMMM dd, yyyy')
            }}
          />
        </div>
        <Table 
          data={filteredEmployees} 
          columns={columns}
          emptyMessage="No employees found. Create your first employee to get started."
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Users className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Drivers</p>
              <p className="text-2xl font-bold text-gray-900">
                {employees.filter(emp => emp.category === 'driver').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-teal-100 rounded-lg">
              <Users className="w-6 h-6 text-teal-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Balance</p>
              <p className="text-2xl font-bold text-gray-900">
                ${employees.reduce((sum, emp) => sum + (emp.balance || 0), 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Employee Modal */}
      <EditEmployeeModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedEmployeeId(null);
        }}
        employeeId={selectedEmployeeId}
        onSave={handleEditSave}
      />

<Footer/>

    </div>
  );
};

export default EmployeeCenter;