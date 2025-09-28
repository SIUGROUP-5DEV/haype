import React, { useState, useEffect } from 'react';
import { X, UserCheck, Save } from 'lucide-react';
import Button from './Button';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import { useToast } from '../contexts/ToastContext';
import { customersAPI } from '../services/api';

const EditCustomerModal = ({ isOpen, onClose, customerId, onSave }) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    balance: 0,
    status: 'Active'
  });

  useEffect(() => {
    if (isOpen && customerId) {
      loadCustomerData();
    }
  }, [isOpen, customerId]);

  const loadCustomerData = async () => {
    try {
      setLoadingData(true);
      const response = await customersAPI.getById(customerId);
      const customer = response.data;
      
      setFormData({
        customerName: customer.customerName || '',
        phoneNumber: customer.phoneNumber || '',
        balance: customer.balance || 0,
        status: customer.status || 'Active'
      });
      
      console.log('✅ Customer data loaded for editing:', customer);
    } catch (error) {
      console.error('❌ Error loading customer:', error);
      showError('Load Failed', 'Failed to load customer data');
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
    
    if (!formData.customerName.trim()) {
      showError('Validation Error', 'Customer name is required');
      return;
    }

    setLoading(true);
    
    try {
      const response = await customersAPI.update(customerId, formData);
      console.log('✅ Customer updated:', response.data);
      
      showSuccess('Customer Updated', `${formData.customerName} has been updated successfully!`);
      
      onSave(); // Refresh the parent component
      onClose(); // Close modal
      
    } catch (error) {
      console.error('❌ Error updating customer:', error);
      showError('Update Failed', error.response?.data?.error || 'Error updating customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <UserCheck className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Edit Customer</h3>
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
            <p className="text-gray-600">Loading customer data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <FormInput
              label="Customer Name"
              name="customerName"
              value={formData.customerName}
              onChange={handleChange}
              placeholder="e.g., John Doe"
              required
            />

            <FormInput
              label="Phone Number"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="e.g., +1234567890"
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
                    Update Customer
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

export default EditCustomerModal;