import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Save, Plus } from 'lucide-react';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import { useToast } from '../contexts/ToastContext';
import { authAPI } from '../services/api';
import Footer from '../components/Footer';

const CreateUser = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    status: 'Active'
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const roleOptions = [
    { value: '', label: 'Select role' },
    { value: 'Administrator', label: 'Administrator' },
    { value: 'Manager', label: 'Manager' },
    { value: 'Operator', label: 'Operator' }
  ];

  const statusOptions = [
    { value: 'Active', label: 'Active' },
    { value: 'Inactive', label: 'Inactive' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.role) {
      newErrors.role = 'Role selection is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Validation Error', 'Please fill in all required fields correctly');
      return;
    }

    setLoading(true);
    
    try {
      const { confirmPassword, ...userData } = formData;
      const response = await authAPI.register(userData);
      console.log('✅ User created:', response.data);
      
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: '',
        status: 'Active'
      });
      
      showSuccess('User Created', `${formData.username} has been created successfully!`);
      
    } catch (error) {
      console.error('❌ Error creating user:', error);
      showError('Creation Failed', error.response?.data?.error || 'Error creating user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndExit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Validation Error', 'Please fill in all required fields correctly');
      return;
    }

    setLoading(true);
    
    try {
      const { confirmPassword, ...userData } = formData;
      const response = await authAPI.register(userData);
      console.log('✅ User created:', response.data);
      
      showSuccess('User Created', `${formData.username} has been created successfully!`);
      
      setTimeout(() => {
        navigate('/users');
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error creating user:', error);
      showError('Creation Failed', error.response?.data?.error || 'Error creating user. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <Link 
          to="/users"
          className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New User</h1>
          <p className="text-gray-600">Add a new user to the system</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <UserPlus className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">User Information</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label="Username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              error={errors.username}
              placeholder="e.g., john_doe"
              required
            />

            <FormInput
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="e.g., john@example.com"
              required
            />

            <FormInput
              label="Password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="Enter password"
              required
            />

            <FormInput
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={errors.confirmPassword}
              placeholder="Confirm password"
              required
            />

            <FormSelect
              label="Role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              error={errors.role}
              options={roleOptions}
              required
            />

            <FormSelect
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={statusOptions}
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-end space-y-4 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveAndExit}
              disabled={loading}
              className="flex items-center justify-center"
            >
              <Save className="w-5 h-5 mr-2" />
              Save & Exit
            </Button>
            
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5 mr-2" />
                  Create & Add Another
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">User Role Permissions</h3>
        <ul className="text-blue-800 space-y-1">
          <li>• <strong>Administrator:</strong> Full system access and user management</li>
          <li>• <strong>Manager:</strong> Access to all business operations and reports</li>
          <li>• <strong>Operator:</strong> Limited access to daily operations only</li>
          <li>• Username must be unique across the system</li>
          <li>• Password must be at least 6 characters long</li>
          <li>• Users can be activated or deactivated as needed</li>
        </ul>
      </div>

<Footer/>

    </div>
  );
};

export default CreateUser;