import React, { useState, useEffect } from 'react';
import { X, Car, Save } from 'lucide-react';
import Button from './Button';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import { useToast } from '../contexts/ToastContext';
import { carsAPI, employeesAPI } from '../services/api';

const EditCarModal = ({ isOpen, onClose, carId, onSave }) => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [formData, setFormData] = useState({
    carName: '',
    numberPlate: '',
    driverId: '',
    kirishboyId: '',
    balance: 0,
    status: 'Active'
  });
  
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (isOpen && carId) {
      loadCarData();
      loadEmployees();
    }
  }, [isOpen, carId]);

  const loadCarData = async () => {
    try {
      setLoadingData(true);
      const response = await carsAPI.getById(carId);
      const car = response.data;
      
      setFormData({
        carName: car.carName || '',
        numberPlate: car.numberPlate || '',
        driverId: car.driverId?._id || car.driverId || '',
        kirishboyId: car.kirishboyId?._id || car.kirishboyId || '',
        balance: car.balance || 0,
        status: car.status || 'Active'
      });
      
      console.log('✅ Car data loaded for editing:', car);
    } catch (error) {
      console.error('❌ Error loading car:', error);
      showError('Load Failed', 'Failed to load car data');
    } finally {
      setLoadingData(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await employeesAPI.getAll();
      setEmployees(response.data);
    } catch (error) {
      console.error('❌ Error loading employees:', error);
      setEmployees([]);
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
    
    if (!formData.carName.trim()) {
      showError('Validation Error', 'Car name is required');
      return;
    }

    setLoading(true);
    
    try {
      const response = await carsAPI.update(carId, formData);
      console.log('✅ Car updated:', response.data);
      
      showSuccess('Car Updated', `${formData.carName} has been updated successfully!`);
      
      onSave(); // Refresh the parent component
      onClose(); // Close modal
      
    } catch (error) {
      console.error('❌ Error updating car:', error);
      showError('Update Failed', error.response?.data?.error || 'Error updating car. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const drivers = employees.filter(emp => emp.category === 'driver');
  const kirishboys = employees.filter(emp => emp.category === 'kirishboy');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Car className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">Edit Car</h3>
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
            <p className="text-gray-600">Loading car data...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <FormInput
              label="Car Name"
              name="carName"
              value={formData.carName}
              onChange={handleChange}
              placeholder="e.g., Toyota Hiace"
              required
            />

            <FormInput
              label="Number Plate"
              name="numberPlate"
              value={formData.numberPlate}
              onChange={handleChange}
              placeholder="e.g., ABC-123"
            />

            <FormSelect
              label="Driver"
              name="driverId"
              value={formData.driverId}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select a driver (optional)' },
                ...drivers.map(driver => ({
                  value: driver._id,
                  label: driver.employeeName
                }))
              ]}
            />

            <FormSelect
              label="Kirishboy"
              name="kirishboyId"
              value={formData.kirishboyId}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select a kirishboy (optional)' },
                ...kirishboys.map(kirishboy => ({
                  value: kirishboy._id,
                  label: kirishboy.employeeName
                }))
              ]}
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
                { value: 'Maintenance', label: 'Maintenance' },
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
                    Update Car
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

export default EditCarModal;