import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, ArrowDownLeft, ArrowUpRight, Building2, Calendar, Eye, Edit2, Edit } from 'lucide-react';
import Button from '../components/Button';
import FormInput from '../components/FormInput';
import FormSelect from '../components/FormSelect';
import { useToast } from '../contexts/ToastContext';
import { paymentsAPI, customersAPI, carsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Footer from '../components/Footer';

const Payments = () => {
  const { showSuccess, showError, showWarning } = useToast();
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showPaymentOutModal, setShowPaymentOutModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
const [showEditPaymentModal, setShowEditPaymentModal] = useState(false);
const [editPaymentData, setEditPaymentData] = useState(null);



  
  // Payment number state
  const [nextPaymentNumber, setNextPaymentNumber] = useState('PYN-001');
  
  const [receiveFormData, setReceiveFormData] = useState({
    customerId: '',
    paymentNo: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: ''
  });
  
  const [paymentOutFormData, setPaymentOutFormData] = useState({
    carId: '',
    category: '',
    accountMonth: '',
    paymentNo: '',
    date: new Date().toISOString().split('T')[0],
    amount: '',
    description: ''
  });

  // Data from database
  const [customers, setCustomers] = useState([]);
  const [cars, setCars] = useState([]);
  const [payments, setPayments] = useState([]);
  const [categories, setCategories] = useState([
    { value: 'farsamo', label: 'farsamo' },
    { value: 'shidaal', label: 'shidaal' },
    { value: 'canshuur', label: 'canshuur' },
    { value: 'mushaar', label: 'mushaar' },
    { value: 'other', label: 'Other' }
  ]);

  // Account Monthly options - generate for current and past months
  const [accountMonths, setAccountMonths] = useState([]);

  // Modal states for adding new category
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Modal for viewing payment details
  const [showViewPaymentModal, setShowViewPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Load data from database
  useEffect(() => {
    loadAllData();
    generateAccountMonths();
    generateNextPaymentNumber();
  }, []);

  const generateAccountMonths = () => {
    const months = [];
    const currentDate = new Date();
    
    // Generate 12 months (current + 11 previous)
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM format
      const monthLabel = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long' 
      });
      
      months.push({
        value: monthKey,
        label: monthLabel,
        status: i === 0 ? 'Active' : 'Closed' // Current month is active, others are closed
      });
    }
    
    setAccountMonths(months);
    
    // Auto-select current month
    if (months.length > 0) {
      setPaymentOutFormData(prev => ({
        ...prev,
        accountMonth: months[0].value
      }));
    }
  };

  const generateNextPaymentNumber = () => {
    // Find the highest payment number
    const paymentNumbers = payments
      .filter(payment => payment.paymentNo && payment.paymentNo.startsWith('PYN-'))
      .map(payment => parseInt(payment.paymentNo.replace('PYN-', '')))
      .filter(num => !isNaN(num));
    
    const maxNumber = paymentNumbers.length > 0 ? Math.max(...paymentNumbers) : 0;
    const nextNumber = maxNumber + 1;
    const nextPaymentNo = `PYN-${String(nextNumber).padStart(4, '0')}`;
    
    setNextPaymentNumber(nextPaymentNo);
    
    // Set in both forms
    setReceiveFormData(prev => ({
      ...prev,
      paymentNo: nextPaymentNo
    }));
    
    setPaymentOutFormData(prev => ({
      ...prev,
      paymentNo: nextPaymentNo
    }));
  };

  const loadAllData = async () => {
    try {
      setLoadingData(true);
      const [customersResponse, carsResponse, paymentsResponse] = await Promise.all([
        customersAPI.getAll(),
        carsAPI.getAll(),
        paymentsAPI.getAll()
      ]);
      
      setCustomers(customersResponse.data);
      setCars(carsResponse.data);
      setPayments(paymentsResponse.data);
      
      console.log('✅ Payment data loaded:', {
        customers: customersResponse.data.length,
        cars: carsResponse.data.length,
        payments: paymentsResponse.data.length
      });
      
      // Generate next payment number after loading payments
      setTimeout(() => {
        generateNextPaymentNumber();
      }, 500);
      
    } catch (error) {
      console.error('❌ Error loading payment data:', error);
      showError('Load Failed', 'Failed to load required data for payments');
    } finally {
      setLoadingData(false);
    }
  };

  const handleReceiveChange = (e) => {
    const { name, value } = e.target;
    setReceiveFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentOutChange = (e) => {
    const { name, value } = e.target;
    setPaymentOutFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      showError('Validation Error', 'Please enter a category name');
      return;
    }

    const newCategory = {
      value: newCategoryName.toLowerCase().replace(/\s+/g, '_'),
      label: newCategoryName
    };

    setCategories(prev => [...prev, newCategory]);
    setPaymentOutFormData(prev => ({
      ...prev,
      category: newCategory.value
    }));

    setNewCategoryName('');
    setShowAddCategoryModal(false);
    showSuccess('Category Added', `${newCategoryName} has been added to categories`);
  };

  const handleViewPayment = (payment) => {
    setSelectedPayment(payment);
    setShowViewPaymentModal(true);
    console.log('👁️ Viewing payment:', payment);
  };
const formatDateForInput = (d) => {
  if (!d) return '';
  try {
    return new Date(d).toISOString().split('T')[0];
  } catch {
    return '';
  }
};

// change handler for edit form
const handleEditPaymentChange = (e) => {
  const { name, value } = e.target;
  setEditPaymentData(prev => ({
    ...prev,
    [name]: value
  }));
};

// submit update
const handleEditPaymentSubmit = async (e) => {
  e.preventDefault();
  if (!editPaymentData) return;
  setLoading(true);

  try {
    // prepare payload matching your backend
    const payload = {
      accountType: editPaymentData.accountType,
      recipientId: editPaymentData.recipientId,
      paymentNo: editPaymentData.paymentNo,
      amount: parseFloat(editPaymentData.amount || 0),
      description: editPaymentData.description,
      paymentDate: editPaymentData.paymentDate,
      accountMonth: editPaymentData.accountMonth
    };

    await paymentsAPI.update(editPaymentData._id, payload);
    showSuccess('Payment Updated', `Payment ${editPaymentData.paymentNo} updated`);
    setShowEditPaymentModal(false);
    setEditPaymentData(null);
    loadAllData();
  } catch (error) {
    console.error('❌ Error updating payment:', error);
    showError('Update Failed', error.response?.data?.error || 'Error updating payment');
  } finally {
    setLoading(false);
  }
};


  const validateReceiveForm = () => {
    if (!receiveFormData.customerId) {
      showError('Validation Error', 'Please select a customer');
      return false;
    }
    if (!receiveFormData.amount || parseFloat(receiveFormData.amount) <= 0) {
      showError('Validation Error', 'Please enter a valid amount');
      return false;
    }
    if (!receiveFormData.paymentNo) {
      showError('Validation Error', 'Please enter payment number');
      return false;
    }
    return true;
  };

  const validatePaymentOutForm = () => {
    if (!paymentOutFormData.carId) {
      showError('Validation Error', 'Please select a car');
      return false;
    }
    if (!paymentOutFormData.category) {
      showError('Validation Error', 'Please select a category');
      return false;
    }
    if (!paymentOutFormData.accountMonth) {
      showError('Validation Error', 'Please select account month');
      return false;
    }
    if (!paymentOutFormData.amount || parseFloat(paymentOutFormData.amount) <= 0) {
      showError('Validation Error', 'Please enter a valid amount');
      return false;
    }
    if (!paymentOutFormData.paymentNo) {
      showError('Validation Error', 'Please enter payment number');
      return false;
    }
    return true;
  };

  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateReceiveForm()) return;
    
    setLoading(true);
    
    try {
      const paymentData = {
        customerId: receiveFormData.customerId,
        paymentNo: receiveFormData.paymentNo,
        amount: parseFloat(receiveFormData.amount),
        description: receiveFormData.description,
        paymentDate: receiveFormData.date
      };
      
      const response = await paymentsAPI.receive(paymentData);
      console.log('✅ Payment received:', response.data);
      
      const customer = customers.find(c => c._id === receiveFormData.customerId);
      
      showSuccess(
        'Payment Received', 
        `Payment of $${receiveFormData.amount} received from ${customer?.customerName} with payment number ${receiveFormData.paymentNo}`
      );
      
      setShowReceiveModal(false);
      
      // Generate next payment number
      const nextNum = parseInt(nextPaymentNumber.replace('PYN-', '')) + 1;
      const newPaymentNo = `PYN-${String(nextNum).padStart(4, '0')}`;
      setNextPaymentNumber(newPaymentNo);
      
      // Reset form with new payment number
      setReceiveFormData({
        customerId: '',
        paymentNo: newPaymentNo,
        date: new Date().toISOString().split('T')[0],
        amount: '',
        description: ''
      });
      
      // Reload payments
      loadAllData();
      
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      showError('Payment Failed', error.response?.data?.error || 'Error processing payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentOutSubmit = async (e) => {
    e.preventDefault();
    
    if (!validatePaymentOutForm()) return;
    
    // Check if trying to pay from closed account
    const selectedAccountMonth = accountMonths.find(month => month.value === paymentOutFormData.accountMonth);
    if (selectedAccountMonth?.status === 'Closed') {
      showWarning(
        'Closed Account Warning', 
        `You are making a payment from ${selectedAccountMonth.label} which is a closed account. The payment will still be processed.`
      );
    }
    
    setLoading(true);
    
    try {
      const paymentData = {
        accountType: 'car',
        recipientId: paymentOutFormData.carId,
        paymentNo: paymentOutFormData.paymentNo,
        amount: parseFloat(paymentOutFormData.amount),
        description: `${paymentOutFormData.category}: ${paymentOutFormData.description}`,
        paymentDate: paymentOutFormData.date,
        accountMonth: paymentOutFormData.accountMonth
      };
      
      const response = await paymentsAPI.paymentOut(paymentData);
      console.log('✅ Payment processed:', response.data);
      
      // Add payment amount to car left amount
      const selectedCar = cars.find(car => car._id === paymentOutFormData.carId);
      if (selectedCar) {
        const newCarLeft = (selectedCar.left || 0) + parseFloat(paymentOutFormData.amount);
        await carsAPI.update(paymentOutFormData.carId, { 
          left: newCarLeft 
        });
        console.log(`✅ Car ${selectedCar.carName} left amount updated: +$${paymentOutFormData.amount} = $${newCarLeft}`);
      }
      
      const selectedCategory = categories.find(cat => cat.value === paymentOutFormData.category);
      const selectedMonth = accountMonths.find(month => month.value === paymentOutFormData.accountMonth);
      
      showSuccess(
        'Payment Processed',
        `Payment of $${paymentOutFormData.amount} processed for ${selectedCar.carName} - ${selectedCategory?.label} from ${selectedMonth?.label} account with payment number ${paymentOutFormData.paymentNo}`
      );
      
      setShowPaymentOutModal(false);
      
      // Generate next payment number
      const nextNum = parseInt(nextPaymentNumber.replace('PYN-', '')) + 1;
      const newPaymentNo = `PYN-${String(nextNum).padStart(4, '0')}`;
      setNextPaymentNumber(newPaymentNo);
      
      // Reset form with new payment number
      setPaymentOutFormData({
        carId: '',
        category: '',
        accountMonth: accountMonths[0]?.value || '',
        paymentNo: newPaymentNo,
        date: new Date().toISOString().split('T')[0],
        amount: '',
        description: ''
      });
      
      // Reload payments
      loadAllData();
      
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      showError('Payment Failed', error.response?.data?.error || 'Error processing payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <LoadingSpinner size={32} />
          <p className="text-gray-600 mt-4">Loading payment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Payments</h1>
        <p className="text-gray-600">Manage incoming and outgoing payments</p>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <ArrowDownLeft className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Receive Payment</h3>
              <p className="text-gray-600">Record payments from customers</p>
            </div>
          </div>
          <Button
            onClick={() => setShowReceiveModal(true)}
            className="w-full"
          >
            <Plus className="w-5 h-5 mr-2" />
            Receive Payment
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <ArrowUpRight className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Payment Out</h3>
              <p className="text-gray-600">Make payments for car expenses</p>
            </div>
          </div>
          <Button
            onClick={() => setShowPaymentOutModal(true)}
            variant="secondary"
            className="w-full"
          >
            <Plus className="w-5 h-5 mr-2" />
            Payment Out
          </Button>
        </div>
      </div>

      {/* Account Monthly Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Monthly Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accountMonths.slice(0, 6).map((month) => (
            <div key={month.value} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900">{month.label}</h4>
                  <p className="text-sm text-gray-600">{month.value}</p>
                </div>
                <div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    month.status === 'Active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {month.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Transactions</h2>
        </div>
        <div className="p-6">
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recent Transactions</h3>
              <p className="text-gray-600">Payment transactions will appear here once you start processing payments.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.slice(0, 10).map((payment) => (
                <div key={payment._id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${
                      payment.type === 'receive' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {payment.type === 'receive' ? (
                        <ArrowDownLeft className={`w-5 h-5 ${
                          payment.type === 'receive' ? 'text-green-600' : 'text-red-600'
                        }`} />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {payment.type === 'receive' ? 'Payment Received' : 'Payment Out'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {payment.paymentNo && `Payment: ${payment.paymentNo}`}
                        {payment.accountMonth && ` - ${payment.accountMonth}`}
                        {payment.description && ` - ${payment.description}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <div className="text-right mr-4">
                      <p className={`font-semibold ${
                        payment.type === 'receive' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {payment.type === 'receive' ? '+' : '-'}${payment.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.paymentDate).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleViewPayment(payment)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
<button
  onClick={() => {
    setEditPaymentData(payment); // xogtii payment
    setShowEditPaymentModal(true);
  }}
  className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors"
  title="Edit Payment"
>
   <Edit className="w-5 text-red-500 h-5" />
</button>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Receive Payment Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <Building2 className="w-6 h-6 text-blue-600 mr-2" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Haype System</h3>
                  <p className="text-sm text-gray-600">Receive Payment</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleReceiveSubmit} className="p-6 space-y-4">
              <FormSelect
                label="Select Customer"
                name="customerId"
                value={receiveFormData.customerId}
                onChange={handleReceiveChange}
                options={[
                  { value: '', label: 'Choose a customer' },
                  ...customers.map(customer => ({
                    value: customer._id,
                    label: `${customer.customerName} (Balance: $${(customer.balance || 0).toLocaleString()})`
                  }))
                ]}
                required
              />

              <FormInput
                label="Payment Number"
                name="paymentNo"
                value={receiveFormData.paymentNo}
                onChange={handleReceiveChange}
                placeholder="e.g., PYN-001"
                required
                enabled
              />

              <FormInput
                label="Date"
                name="date"
                type="date"
                value={receiveFormData.date}
                onChange={handleReceiveChange}
                required
              />

              <FormInput
                label="Amount"
                name="amount"
                type="number"
                value={receiveFormData.amount}
                onChange={handleReceiveChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />

              <FormInput
                label="Description"
                name="description"
                value={receiveFormData.description}
                onChange={handleReceiveChange}
                placeholder="Payment description"
              />

              <div className="flex space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowReceiveModal(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Processing...' : 'Save Payment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Out Modal */}
      {showPaymentOutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <Building2 className="w-6 h-6 text-blue-600 mr-2" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Haype System</h3>
                  <p className="text-sm text-gray-600">Payment Out - Car Expenses</p>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <form onSubmit={handlePaymentOutSubmit} className="p-6 space-y-4">
              <FormSelect
                label="Select Car"
                name="carId"
                value={paymentOutFormData.carId}
                onChange={handlePaymentOutChange}
                options={[
                  { value: '', label: 'Choose a car' },
                  ...cars.map(car => ({
                    value: car._id,
                    label: `${car.carName} (Balance: $${(car.balance || 0).toLocaleString()})`
                  }))
                ]}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Category <span className="text-red-500">*</span>
                </label>
                <div className="flex space-x-2">
                  <select
                    name="category"
                    value={paymentOutFormData.category}
                    onChange={handlePaymentOutChange}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Choose a category</option>
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddCategoryModal(true)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <FormSelect
                label="Account Monthly"
                name="accountMonth"
                value={paymentOutFormData.accountMonth}
                onChange={handlePaymentOutChange}
                options={[
                  { value: '', label: 'Choose account month' },
                  ...accountMonths.map(month => ({
                    value: month.value,
                    label: `${month.label} (${month.status})`
                  }))
                ]}
                required
              />

              <FormInput
                label="Payment Number"
                name="paymentNo"
                value={paymentOutFormData.paymentNo}
                onChange={handlePaymentOutChange}
                placeholder="e.g., PYN-001"
                required
                enabled
              />

              <FormInput
                label="Date"
                name="date"
                type="date"
                value={paymentOutFormData.date}
                onChange={handlePaymentOutChange}
                required
              />

              <FormInput
                label="Amount"
                name="amount"
                type="number"
                value={paymentOutFormData.amount}
                onChange={handlePaymentOutChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                required
              />

              <FormInput
                label="Description"
                name="description"
                value={paymentOutFormData.description}
                onChange={handlePaymentOutChange}
                placeholder="Payment description"
              />

              <div className="flex space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPaymentOutModal(false)}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Processing...' : 'Process Payment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add New Category</h3>
              <p className="text-sm text-gray-600">Create a new expense category</p>
            </div>

            <div className="p-6 space-y-4">
              <FormInput
                label="Category Name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g., Tolls, Parking"
                required
              />

              <div className="flex space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddCategoryModal(false);
                    setNewCategoryName('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button onClick={handleAddCategory} className="flex-1">
                  Add Category
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Payment Modal */}
      {showViewPaymentModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="w-6 h-6 text-blue-600 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowViewPaymentModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className={`p-2 rounded-full ${
                    selectedPayment.type === 'receive' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {selectedPayment.type === 'receive' ? (
                      <ArrowDownLeft className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="ml-3">
                    <h4 className="font-semibold text-gray-900">
                      {selectedPayment.type === 'receive' ? 'Payment Received' : 'Payment Out'}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedPayment.paymentDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Number:</span>
                    <span className="font-medium">{selectedPayment.paymentNo || 'N/A'}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className={`font-semibold ${
                      selectedPayment.type === 'receive' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedPayment.type === 'receive' ? '+' : '-'}${selectedPayment.amount.toLocaleString()}
                    </span>
                  </div>
                  
                  {selectedPayment.customerId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Customer:</span>
                      <span className="font-medium">
                        {customers.find(c => c._id === selectedPayment.customerId)?.customerName || 'Unknown Customer'}
                      </span>
                    </div>
                  )}
                  
                  {selectedPayment.carId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Car:</span>
                      <span className="font-medium">
                        {cars.find(c => c._id === selectedPayment.carId)?.carName || 'Unknown Car'}
                      </span>
                    </div>
                  )}
                  
                  {selectedPayment.accountMonth && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Account Month:</span>
                      <span className="font-medium">{selectedPayment.accountMonth}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Description:</span>
                    <span className="font-medium">{selectedPayment.description || 'No description'}</span>
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowViewPaymentModal(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

{/* Edit Payment Modal */}
{showEditPaymentModal && editPaymentData && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Edit Payment</h3>
          <Button variant="outline" size="sm" onClick={() => { setShowEditPaymentModal(false); setEditPaymentData(null); }}>
            Close
          </Button>
        </div>
      </div>

      <form onSubmit={handleEditPaymentSubmit} className="p-6 space-y-4">
        <FormInput
          label="Payment Number"
          name="paymentNo"
          value={editPaymentData.paymentNo || ''}
          onChange={handleEditPaymentChange}
          required
        />

        <FormInput
          label="Payment Date"
          type="date"
          name="paymentDate"
          value={formatDateForInput(editPaymentData.paymentDate)}
          onChange={handleEditPaymentChange}
          required
        />

        <FormSelect
          label="Account Type"
          name="accountType"
          value={editPaymentData.accountType || ''}
          onChange={handleEditPaymentChange}
          options={[
            { value: '', label: 'Choose account type' },
            { value: 'customer', label: 'Customer' },
            { value: 'car', label: 'Car' },
            { value: 'company', label: 'Company' }
          ]}
          required
        />

        {/* Conditional recipient selector: customer or car */}
        {editPaymentData.accountType === 'customer' && (
          <FormSelect
            label="Select Customer"
            name="recipientId"
            value={editPaymentData.recipientId || ''}
            onChange={handleEditPaymentChange}
            options={[
              { value: '', label: 'Choose a customer' },
              ...customers.map(c => ({ value: c._id, label: `${c.customerName} (Balance: $${(c.balance||0).toLocaleString()})` }))
            ]}
            required
          />
        )}

        {editPaymentData.accountType === 'car' && (
          <FormSelect
            label="Select Car"
            name="recipientId"
            value={editPaymentData.recipientId || ''}
            onChange={handleEditPaymentChange}
            options={[
              { value: '', label: 'Choose a car' },
              ...cars.map(car => ({ value: car._id, label: `${car.carName} (Balance: $${(car.balance||0).toLocaleString()})` }))
            ]}
            required
          />
        )}

        {/* fallback: if company or none selected, allow manual recipient id */}
        {(!editPaymentData.accountType || editPaymentData.accountType === 'company') && (
          <FormInput
            label="Recipient ID (manual)"
            name="recipientId"
            value={editPaymentData.recipientId || ''}
            onChange={handleEditPaymentChange}
            placeholder="Recipient identifier"
          />
        )}

        <FormSelect
          label="Account Month"
          name="accountMonth"
          value={editPaymentData.accountMonth || ''}
          onChange={handleEditPaymentChange}
          options={[
            { value: '', label: 'Choose account month' },
            ...accountMonths.map(m => ({ value: m.value, label: `${m.label} (${m.status})` }))
          ]}
        />

        <FormInput
          label="Amount"
          type="number"
          name="amount"
          value={editPaymentData.amount || ''}
          onChange={handleEditPaymentChange}
          required
        />

        <FormInput
          label="Description"
          name="description"
          value={editPaymentData.description || ''}
          onChange={handleEditPaymentChange}
        />

        <div className="flex space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => { setShowEditPaymentModal(false); setEditPaymentData(null); }}
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Updating...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  </div>
)}



      <Footer/>
    </div>
  );
};

export default Payments;