import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Save, Plus } from 'lucide-react';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import { useToast } from '../contexts/ToastContext';
import { employeesAPI } from '../services/api';
import Footer from '../components/Footer';

const CreateEmployee = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    employeeName: '',
    phoneNumber: '',
    category: '',
    balance: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const categoryOptions = [
    { value: '', label: 'Select category' },
    { value: 'driver', label: 'Driver' },
    { value: 'kirishboy', label: 'Kirishboy' }
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
    
    if (!formData.employeeName.trim()) {
      newErrors.employeeName = 'Employee name is required';
    }
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category selection is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Validation Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Creating employee:', formData);
      
      const response = await employeesAPI.create(formData);
      console.log('✅ Employee created:', response.data);
      
      setFormData({
        employeeName: '',
        phoneNumber: '',
        category: '',
        balance: 0
      });
      
      showSuccess('Employee Created', `${formData.employeeName} has been created successfully!`);
      
    } catch (error) {
      console.error('❌ Error creating employee:', error);
      showError('Creation Failed', error.response?.data?.error || 'Error creating employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAndExit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Validation Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    
    try {
      console.log('Creating employee:', formData);
      
      const response = await employeesAPI.create(formData);
      console.log('✅ Employee created:', response.data);
      
      showSuccess('Employee Created', `${formData.employeeName} has been created successfully!`);
      
      setTimeout(() => {
        navigate('/employees');
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error creating employee:', error);
      showError('Creation Failed', error.response?.data?.error || 'Error creating employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <Link 
          to="/employees"
          className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Employee</h1>
          <p className="text-gray-600">Add a new employee to your workforce</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <User className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Employee Information</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label="Employee Name"
              name="employeeName"
              value={formData.employeeName}
              onChange={handleChange}
              error={errors.employeeName}
              placeholder="e.g., John Smith"
              required
            />

            <FormInput
              label="Phone Number"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              error={errors.phoneNumber}
              placeholder="e.g., +1234567890"
              required
            />

            <FormSelect
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              error={errors.category}
              options={categoryOptions}
              required
            />

            <FormInput
              label="Initial Balance"
              name="balance"
              type="number"
              value={formData.balance}
              onChange={handleChange}
              placeholder="0"
              min="0"
              step="0.01"
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
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Instructions</h3>
        <ul className="text-blue-800 space-y-1">
          <li>• Employee name should be full name (e.g., John Smith)</li>
          <li>• Phone number should include country code if applicable</li>
          <li>• Select appropriate category: Driver or Kirishboy</li>
          <li>• Initial balance will be set to 0 and updated through transactions</li>
          <li>• Click "Create & Add Another" to continue adding employees</li>
        </ul>
      </div>

<Footer/>

    </div>
  );
};

export default CreateEmployee;