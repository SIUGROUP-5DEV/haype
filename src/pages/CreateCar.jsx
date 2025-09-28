import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Car, Save, Plus } from 'lucide-react';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import { useToast } from '../contexts/ToastContext';
import { carsAPI, employeesAPI } from '../services/api';
import Footer from '../components/Footer';

const CreateCar = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    carName: '',
    numberPlate: '',
    driverId: '',
    kirishboyId: '',
    balance: 0
  });
  
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [errors, setErrors] = useState({});

  // Load employees from database
  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const response = await employeesAPI.getAll();
      setEmployees(response.data);
      console.log('✅ Employees loaded for car creation:', response.data);
    } catch (error) {
      console.error('❌ Error loading employees:', error);
      showError('Load Failed', 'Failed to load employees');
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const drivers = employees.filter(emp => emp.category === 'driver');
  const kirishboys = employees.filter(emp => emp.category === 'kirishboy');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.carName.trim()) {
      newErrors.carName = 'Car name is required';
    }
    
    if (!formData.numberPlate.trim()) {
      newErrors.numberPlate = 'Number plate is required';
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
      const response = await carsAPI.create(formData);
      console.log('✅ Car created:', response.data);
      
      // Reset form for next entry
      setFormData({
        carName: '',
        numberPlate: '',
        driverId: '',
        kirishboyId: '',
        balance: 0
      });
      
      showSuccess('Car Created', `${formData.carName} has been created successfully!`);
      
    } catch (error) {
      console.error('❌ Error creating car:', error);
      showError('Creation Failed', error.response?.data?.error || 'Error creating car. Please try again.');
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
      const response = await carsAPI.create(formData);
      console.log('✅ Car created:', response.data);
      
      showSuccess('Car Created', `${formData.carName} has been created successfully!`);
      
      // Navigate after showing success message
      setTimeout(() => {
        navigate('/cars');
      }, 1000);
      
    } catch (error) {
      console.error('❌ Error creating car:', error);
      showError('Creation Failed', error.response?.data?.error || 'Error creating car. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingEmployees) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <Link 
          to="/cars"
          className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create New Car</h1>
          <p className="text-gray-600">Add a new vehicle to your fleet</p>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Car className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Car Information</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormInput
              label="Car Name"
              name="carName"
              value={formData.carName}
              onChange={handleChange}
              error={errors.carName}
              placeholder="e.g., Toyota Hiace"
              required
            />

            <FormInput
              label="Number Plate"
              name="numberPlate"
              value={formData.numberPlate}
              onChange={handleChange}
              error={errors.numberPlate}
              placeholder="e.g., ABC-123"
              required
            />

            <FormSelect
              label="Driver"
              name="driverId"
              value={formData.driverId}
              onChange={handleChange}
              error={errors.driverId}
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
              error={errors.kirishboyId}
              options={[
                { value: '', label: 'Select a kirishboy (optional)' },
                ...kirishboys.map(kirishboy => ({
                  value: kirishboy._id,
                  label: kirishboy.employeeName
                }))
              ]}
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
          <li>• Car name should be descriptive (e.g., Toyota Hiace, Nissan Urvan)</li>
          <li>• Number plate format should follow local standards</li>
          <li>• Driver and Kirishboy assignment is optional</li>
          <li>• Initial balance will be set to 0 and updated through transactions</li>
          <li>• Click "Create & Add Another" to continue adding cars</li>
        </ul>
      </div>
<Footer/>

    </div>
  );
};

export default CreateCar;