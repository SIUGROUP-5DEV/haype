import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Save, Plus } from 'lucide-react';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import { useToast } from '../contexts/ToastContext';
import { itemsAPI } from '../services/api';
import Footer from '../components/Footer';

const CreateItem = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    itemName: '',
    
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

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
    
    if (!formData.itemName.trim()) {
      newErrors.itemName = 'Item name is required';
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
      const response = await itemsAPI.create(formData);
      console.log('✅ Item created:', response.data);
      
      setFormData({
        itemName: '',
  
      });
      
      showSuccess('Item Created', `${formData.itemName} has been created successfully!`);
      
    } catch (error) {
      console.error('❌ Error creating item:', error);
      showError('Creation Failed', error.response?.data?.error || 'Error creating item. Please try again.');
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
      const response = await itemsAPI.create(formData);
      console.log('✅ Item created:', response.data);
      
      showSuccess('Item Created', `${formData.itemName} has been created successfully!`);
      
      setTimeout(() => {
        navigate('/items');
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error creating item:', error);
      showError('Creation Failed', error.response?.data?.error || 'Error creating item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <Link 
          to="/items"
          className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Item</h1>
          <p className="text-gray-600">Add a new item to your inventory</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Package className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Item Information</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label="Item Name"
              name="itemName"
              value={formData.itemName}
              onChange={handleChange}
              error={errors.itemName}
              placeholder="e.g., Cement, Sand, Gravel"
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
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Instructions</h3>
        <ul className="text-blue-800 space-y-1">
          <li>• Item name should be descriptive (e.g., Cement, Sand, Gravel)</li>

          <li>• Items will be available for selection in invoices</li>
          <li>• Click "Create & Add Another" to continue adding items</li>
        </ul>
      </div>

<Footer/>

    </div>
  );
};

export default CreateItem;