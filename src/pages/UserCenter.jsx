import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Plus, Search, Edit, Trash2, Eye, Filter } from 'lucide-react';
import Button from '../components/Button';
import Table from '../components/Table';
import SearchInput from '../components/SearchInput';
import { authAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Footer from '../components/Footer';
import SectionPrintOptions from '../components/SectionPrintOptions';
import { format } from 'date-fns';

const UserCenter = () => {
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [filteredUsers, setFilteredUsers] = useState([]);

  // Load users from database
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users when search term or role changes
  useEffect(() => {
    const filtered = users.filter(user => {
      const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      return matchesSearch && matchesRole;
    });
    setFilteredUsers(filtered);
  }, [searchTerm, roleFilter, users]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Note: This endpoint might not exist in your API yet
      // You may need to add it to your server
      const response = await authAPI.getUsers?.() || { data: [] };
      setUsers(response.data);
      console.log('✅ Users loaded from database:', response.data);
    } catch (error) {
      console.error('❌ Error loading users:', error);
      showError('Load Failed', 'Failed to load users from database');
      // Set default admin user if API fails
      setUsers([
        {
          _id: '1',
          username: 'admin',
          email: 'admin@haype.com',
          role: 'Administrator',
          status: 'Active',
          lastLogin: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const userToDelete = users.find(user => user._id === id);
    
    if (userToDelete?.role === 'Administrator') {
      showError('Cannot Delete', 'Administrator accounts cannot be deleted');
      return;
    }
    
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        // Note: This endpoint might not exist in your API yet
        // await authAPI.deleteUser(id);
        setUsers(users.filter(user => user._id !== id));
        showSuccess('User Deleted', 'User has been deleted successfully');
      } catch (error) {
        console.error('❌ Error deleting user:', error);
        showError('Delete Failed', 'Failed to delete user');
      }
    }
  };

  const columns = [
    {
      header: 'Username',
      accessor: 'username',
      render: (value, row) => (
        <div className="flex items-center">
          <UserPlus className="w-5 h-5 text-blue-600 mr-2" />
          <span className="font-medium text-gray-900">{value}</span>
        </div>
      )
    },
    {
      header: 'Email',
      accessor: 'email',
      render: (value) => (
        <span className="text-gray-700">{value}</span>
      )
    },
    {
      header: 'Role',
      accessor: 'role',
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Administrator' 
            ? 'bg-red-100 text-red-800' 
            : value === 'Manager'
            ? 'bg-blue-100 text-blue-800'
            : 'bg-green-100 text-green-800'
        }`}>
          {value}
        </span>
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
      header: 'Last Login',
      accessor: 'lastLogin',
      render: (value) => value ? new Date(value).toLocaleDateString() : 'Never'
    },
    {
      header: 'Actions',
      accessor: '_id',
      render: (value, row) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleView(value)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
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
            disabled={row.role === 'Administrator'}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const handleView = (id) => {
    console.log('View user:', id);
  };

  const handleEdit = (id) => {
    console.log('Edit user:', id);
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">User Center</h1>
          <p className="text-gray-600">Manage system users and permissions</p>
        </div>
        <Link to="/users/create">
          <Button className="flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Create User
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Roles</option>
                <option value="Administrator">Administrator</option>
                <option value="Manager">Manager</option>
                <option value="Operator">Operator</option>
              </select>
            </div>
            
            <SearchInput
              placeholder="Search by username or email..."
              value={searchTerm}
              onChange={setSearchTerm}
            />
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={loadUsers}>
              <Filter className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Users List</h2>
          <SectionPrintOptions
            data={filteredUsers}
            columns={columns}
            title="User Center"
            sectionName="All Users"
            profileData={{
              'Total Users': users.length,
              'Active Users': users.filter(user => user.status === 'Active').length,
              'Administrators': users.filter(user => user.role === 'Administrator').length,
              'Report Generated': format(new Date(), 'MMMM dd, yyyy')
            }}
          />
        </div>
        <Table 
          data={filteredUsers} 
          columns={columns}
          emptyMessage="No users found. Create your first user to get started."
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserPlus className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(user => user.status === 'Active').length}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <UserPlus className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Administrators</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(user => user.role === 'Administrator').length}
              </p>
            </div>
          </div>
        </div>
      </div>

<Footer/>

    </div>
  );
};

export default UserCenter;