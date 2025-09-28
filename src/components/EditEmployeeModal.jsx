import React, { useState, useEffect } from 'react';
import { X, User, Save } from 'lucide-react';
import Button from './Button';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import { useToast } from '../contexts/ToastContext';
import { employeesAPI } from '../services/api';

const EditEmployeeModal = ({ isOpen, onClose, employeeId, onSave }) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    employeeName: '',
    phoneNumber: '',
    category: '',
    balance: 0,
    status: 'Active'
  });

  useEffect(() => {
    if (isOpen && employeeId) {
      loadEmployeeData();
    }
  }, [isOpen, employeeId]);

  const loadEmployeeData = async () => {
    try {
      setLoadingData(true);
      const response = await employeesAPI.getById(employeeId);
      const employee = response.data;
      
      setFormData({
        employeeName: employee.employeeName || '',
        phoneNumber: employee.phoneNumber || '',
        category: employee.category || '',
        balance: employee.balance || 0,
        status: employee.status || 'Active'
      });
      
      console.log('✅ Employee data loaded for editing:', employee);
    } catch (error) {
      console.error('❌ Error loading employee:', error);
      showError('Load Failed', 'Failed to load employee data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.employeeName.trim()) {
      showError('Validation Error', 'Employee name is required');
      return;
    }

    if (!formData.category) {
      showError('Validation Error', 'Category is required');
      return;
    }

    setLoading(true);
    
    try {
      const response = await employeesAPI.update(employeeId, formData);
      console.log('✅ Employee updated:', response.data);
      
      showSuccess('Employee Updated', `${formData.employeeName} has been updated successfully!`);
      
      onSave(); // Refresh the parent component
      onClose(); // Close modal
      
    } catch (error) {
      console.error('❌ Error updating employee:', error);
      showError('Update Failed', error.response?.data?.error || 'Error updating employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const categoryOptions = [
    { value: '', label: 'Select category' },
    { value: 'driver', label: 'Driver' },
    { value: 'kirishboy', label: 'Kirishboy' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <User className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Edit Employee</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        {loadingData ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading employee data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <FormInput
              label="Employee Name"
              name="employeeName"
              value={formData.employeeName}
              onChange={handleChange}
              placeholder="e.g., John Smith"
              required
            />

            <FormInput
              label="Phone Number"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="e.g., +1234567890"
            />

            <FormSelect
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              options={categoryOptions}
              required
            />

            <FormInput
              label="Balance"
              name="balance"
              type="number"
              value={formData.balance}
              onChange={handleChange}
              min="0"
              step="0.01"
            />

            <FormSelect
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={[
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' }
              ]}
            />

            <div className="flex space-x-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Update Employee
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditEmployeeModal;