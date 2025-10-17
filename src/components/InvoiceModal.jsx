import React, { useState, useEffect } from 'react';
import { X, Building2, Car, User, Package, Calendar, DollarSign, Edit, Save, Trash2, Plug, Plus } from 'lucide-react';
import Button from './Button';
import FormInput from './FormInput';
import FormSelect from './FormSelect';
import { useToast } from '../contexts/ToastContext';
import { invoicesAPI, carsAPI, itemsAPI, customersAPI } from '../services/api';

const InvoiceModal = ({ isOpen, onClose, invoiceNo, mode = 'view' }) => {
  const { showSuccess, showError } = useToast();
  const [invoice, setInvoice] = useState(null);
  const [isEditing, setIsEditing] = useState(mode === 'edit');
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [formData, setFormData] = useState({});

  // Data for dropdowns
  const [cars, setCars] = useState([]);
  const [items, setItems] = useState([]);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    if (isOpen && invoiceNo) {
      loadInvoiceData();
      loadDropdownData();
    }
  }, [isOpen, invoiceNo]);

  const loadDropdownData = async () => {
    try {
      const [carsResponse, itemsResponse, customersResponse] = await Promise.all([
        carsAPI.getAll(),
        itemsAPI.getAll(),
        customersAPI.getAll()
      ]);
      
      setCars(carsResponse.data);
      setItems(itemsResponse.data);
      setCustomers(customersResponse.data);
    } catch (error) {
      console.error('❌ Error loading dropdown data:', error);
    }
  };

  const loadInvoiceData = async () => {
    try {
      setDataLoading(true);
      
      // First try to load from database
      const response = await invoicesAPI.getAll();
      const foundInvoice = response.data.find(inv => inv.invoiceNo === invoiceNo);
      
      if (foundInvoice) {
        console.log('✅ Invoice loaded from database:', foundInvoice);
        setInvoice(foundInvoice);
        setFormData(foundInvoice);
      } else {
        // Fallback to localStorage if not found in database
        const savedInvoice = localStorage.getItem(`invoice_${invoiceNo}`);
        
        if (savedInvoice) {
          const invoiceData = JSON.parse(savedInvoice);
          console.log('✅ Invoice loaded from localStorage:', invoiceData);
          setInvoice(invoiceData);
          setFormData(invoiceData);
        } else {
          // Show error if invoice not found anywhere
          showError('Invoice Not Found', `Invoice ${invoiceNo} could not be found in database or local storage.`);
          onClose();
          return;
        }
      }
    } catch (error) {
      console.error('❌ Error loading invoice:', error);
      showError('Load Failed', 'Failed to load invoice data');
      onClose();
    } finally {
      setDataLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete invoice ${invoiceNo}? This action cannot be undone.`)) {
      setLoading(true);
      
      try {
        // Get invoice details for balance reversal
        if (invoice._id) {
          const { invoice: deletedInvoice } = await invoicesAPI.deleteWithBalanceUpdate(invoice._id);
          console.log('✅ Invoice deleted from database');
          
          // Reverse balance changes for each item
          for (const item of deletedInvoice.items || []) {
            if (item.paymentMethod === 'credit' && item.customerId) {
              try {
                // Get current customer data
                const customerResponse = await customersAPI.getById(item.customerId._id || item.customerId);
                const customer = customerResponse.data;
                
                // Reduce customer balance by item total
                const newBalance = Math.max(0, (customer.balance || 0) - (item.total || 0));
                await customersAPI.update(item.customerId._id || item.customerId, { 
                  balance: newBalance 
                });
                
                console.log(`✅ Customer ${customer.customerName} balance reduced: -$${item.total} = $${newBalance}`);
              } catch (error) {
                console.error('❌ Error updating customer balance:', error);
              }
            }
          }
          
          // Reverse car balance changes
          if (deletedInvoice.carId) {
            try {
              const carResponse = await carsAPI.getById(deletedInvoice.carId._id || deletedInvoice.carId);
              const car = carResponse.data;
              
              // Reduce car balance and left amounts
              const newCarBalance = Math.max(0, (car.balance || 0) - (deletedInvoice.total || 0));
              const newCarLeft = Math.max(0, (car.left || 0) - (deletedInvoice.totalLeft || 0));
              
              await carsAPI.update(deletedInvoice.carId._id || deletedInvoice.carId, { 
                balance: newCarBalance,
                left: newCarLeft
              });
              
              console.log(`✅ Car ${car.carName} balance updated: -$${deletedInvoice.total} = $${newCarBalance}, Left: -$${deletedInvoice.totalLeft} = $${newCarLeft}`);
            } catch (error) {
              console.error('❌ Error updating car balance:', error);
            }
          }
        }
        
        // Also remove from localStorage
        localStorage.removeItem(`invoice_${invoiceNo}`);
        
        showSuccess('Invoice Deleted', `Invoice ${invoiceNo} has been deleted successfully!`);
        onClose();
        
        // Refresh the page to update the invoice list
        window.location.reload();
        
      } catch (error) {
        console.error('❌ Error deleting invoice:', error);
        showError('Delete Failed', 'Error deleting invoice. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    setLoading(true);
    
    try {
      // Calculate totals
      const total = formData.items?.reduce((sum, item) => sum + (item.total || 0), 0) || 0;
      const totalLeft = formData.items?.reduce((sum, item) => sum + (item.leftAmount || 0), 0) || 0;
      const totalProfit = (total - totalLeft) * 0.2; // 20% profit on paid amount

      const updatedInvoice = {
        ...formData,
        total,
        totalLeft,
        totalProfit
      };

      // Get original invoice for balance reversal
      const originalInvoice = invoice;
      
      // Try to update in database first
      try {
        await invoicesAPI.update(invoice._id, updatedInvoice);
        console.log('✅ Invoice updated in database');
        
        // Reverse original balance changes
        if (originalInvoice.items) {
          for (const originalItem of originalInvoice.items) {
            if (originalItem.paymentMethod === 'credit' && originalItem.customerId) {
              try {
                const customerResponse = await customersAPI.getById(originalItem.customerId._id || originalItem.customerId);
                const customer = customerResponse.data;
                
                // Reverse original credit amount
                const reversedBalance = Math.max(0, (customer.balance || 0) - (originalItem.total || 0));
                await customersAPI.update(originalItem.customerId._id || originalItem.customerId, { 
                  balance: reversedBalance 
                });
                
                console.log(`✅ Reversed customer ${customer.customerName} balance: -$${originalItem.total}`);
              } catch (error) {
                console.error('❌ Error reversing customer balance:', error);
              }
            }
          }
        }
        
        // Apply new balance changes
        if (updatedInvoice.items) {
          for (const newItem of updatedInvoice.items) {
            if (newItem.paymentMethod === 'credit' && newItem.customerId) {
              try {
                const customerResponse = await customersAPI.getById(newItem.customerId._id || newItem.customerId);
                const customer = customerResponse.data;
                
                // Apply new credit amount
                const newBalance = (customer.balance || 0) + (newItem.total || 0);
                await customersAPI.update(newItem.customerId._id || newItem.customerId, { 
                  balance: newBalance 
                });
                
                console.log(`✅ Applied customer ${customer.customerName} balance: +$${newItem.total} = $${newBalance}`);
              } catch (error) {
                console.error('❌ Error applying customer balance:', error);
              }
            }
          }
        }
        
      } catch (dbError) {
        console.warn('⚠️ Database update failed, saving to localStorage:', dbError);
        // Fallback to localStorage
        localStorage.setItem(`invoice_${invoiceNo}`, JSON.stringify(updatedInvoice));
      }
      
      setInvoice(updatedInvoice);
      setIsEditing(false);
      
      showSuccess('Invoice Updated', `Invoice ${invoiceNo} has been updated successfully!`);
      
    } catch (error) {
      console.error('❌ Error saving invoice:', error);
      showError('Update Failed', 'Error updating invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(invoice);
    setIsEditing(false);
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...(formData.items || [])];
    updatedItems[index][field] = value;
    
    // Auto-calculate total when quantity or price changes
    if (field === 'quantity' || field === 'price') {
      updatedItems[index].total = (updatedItems[index].quantity || 0) * (updatedItems[index].price || 0);
    }
    
    // Auto-fill item name when item is selected
    if (field === 'itemId') {
      const selectedItem = items.find(item => item._id === value);
      if (selectedItem) {
        updatedItems[index].price = selectedItem.price;
        updatedItems[index].total = (updatedItems[index].quantity || 0) * selectedItem.price;
        updatedItems[index].itemName = selectedItem.itemName;
      }
    }
    
    // Auto-fill customer name when customer is selected
    if (field === 'customerId') {
      const selectedCustomer = customers.find(customer => customer._id === value);
      if (selectedCustomer) {
        updatedItems[index].customerName = selectedCustomer.customerName;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      items: updatedItems,
      total: updatedItems.reduce((sum, item) => sum + (item.total || 0), 0),
      totalLeft: updatedItems.reduce((sum, item) => sum + (item.leftAmount || 0), 0)
    }));
  };

  if (!isOpen) return null;

  if (dataLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice data...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Invoice Not Found</h3>
          <p className="text-gray-600 mb-4">Invoice {invoiceNo} could not be found.</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center">
            <Building2 className="w-6 h-6 text-blue-600 mr-2" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Edit Invoice' : 'View Invoice'} - {invoiceNo}
              </h3>
              <p className="text-sm text-gray-600">
                {isEditing ? 'Make changes to the invoice' : 'Invoice details and items'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <>
                <Button onClick={handleEdit} variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button onClick={handleDelete} variant="danger" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </>
            )}
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-6">
          {/* Company Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div className="flex items-center">
              <Building2 className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">Haype System</h2>
                <p className="text-gray-600">Business Management System</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Invoice Date</p>
              <p className="font-semibold">
                {new Date(invoice.invoiceDate).toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Car</label>
              {isEditing ? (
                <select
                  value={formData.carId || ''}
                  onChange={(e) => handleFormChange('carId', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose a car</option>
                  {cars.map(car => (
                    <option key={car._id} value={car._id}>{car.carName}</option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Car className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-medium">{invoice.carId?.carName || 'Unknown Car'}</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Date</label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.invoiceDate || ''}
                  onChange={(e) => handleFormChange('invoiceDate', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-green-600 mr-2" />
                  <span className="font-medium">
                    {new Date(invoice.invoiceDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Invoice No</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.invoiceNo || ''}
                  onChange={(e) => handleFormChange('invoiceNo', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Invoice number"
                />
              ) : (
                <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-mono font-medium text-blue-600">{invoice.invoiceNo}</span>
                </div>
              )}
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Invoice Items</h4>
            
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Item</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Customer</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Description</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Qty</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Price</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Total</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Left</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Payment</th>
                    {isEditing && (
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Action</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(formData.items || invoice.items || []).map((item, index) => (
                    <tr key={index} className="border-t border-gray-200">
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <select
                            value={item.itemId || ''}
                            onChange={(e) => handleItemChange(index, 'itemId', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select item</option>
                            {items.map(itm => (
                              <option key={itm._id} value={itm._id}>{itm.itemName}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center">
                            <Package className="w-4 h-4 text-blue-600 mr-2" />
                            <span>{item.itemId?.itemName || item.itemName || 'Unknown Item'}</span>
                          </div>
                        )}
                      </td>
                      
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <select
                            value={item.customerId || ''}
                            onChange={(e) => handleItemChange(index, 'customerId', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Select customer</option>
                            {customers.map(customer => (
                              <option key={customer._id} value={customer._id}>{customer.customerName}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-green-600 mr-2" />
                            <span>{item.customerId?.customerName || item.customerName || 'Unknown Customer'}</span>
                          </div>
                        )}
                      </td>
                      
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={item.description || ''}
                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Description"
                          />
                        ) : (
                          <span className="text-gray-600">{item.description || 'No description'}</span>
                        )}
                      </td>
                      
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="number"
                            value={item.quantity || 0}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="w-16 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="1"
                          />
                        ) : (
                          <span className="font-medium">{item.quantity || 0}</span>
                        )}
                      </td>
                      
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="number"
                            value={item.price || 0}
                            onChange={(e) => handleItemChange(index, 'price', parseFloat(e.target.value) || 0)}
                            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            step="0.01"
                          />
                        ) : (
                          <span className="font-medium text-green-600">${item.price || 0}</span>
                        )}
                      </td>
                      
                      <td className="py-3 px-4">
                        <span className="font-semibold text-blue-600">${item.total || 0}</span>
                      </td>
                      
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <input
                            type="number"
                            value={item.leftAmount || 0}
                            onChange={(e) => handleItemChange(index, 'leftAmount', parseFloat(e.target.value) || 0)}
                            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            min="0"
                            step="0.01"
                          />
                        ) : (
                          <span className={`font-medium ${(item.leftAmount || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ${item.leftAmount || 0}
                          </span>
                        )}
                      </td>
                      
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <select
                            value={item.paymentMethod || 'cash'}
                            onChange={(e) => handleItemChange(index, 'paymentMethod', e.target.value)}
                            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="cash">Cash</option>
                            <option value="credit">Credit</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.paymentMethod === 'cash' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {(item.paymentMethod || 'cash').toUpperCase()}
                          </span>
                        )}
                      </td>
                      {isEditing && (
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Action</th>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <div className="space-y-2">
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-600">Total:</span>
                  <span className="text-lg font-bold text-blue-600">
                    ${(formData.total || invoice.total || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-600">Total Left:</span>
                  <span className="text-lg font-bold text-red-600">
                    ${(formData.totalLeft || invoice.totalLeft || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-gray-600">Total Profit:</span>
                        
                        {isEditing && (
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedItems = [...(formData.items || [])];
                                  updatedItems.splice(index, 1);
                                  setFormData(prev => ({ ...prev, items: updatedItems }));
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Remove Item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        )}
                  <span className="text-lg font-bold text-green-600">
                    ${(formData.totalProfit || invoice.totalProfit || 0).toLocaleString()}
                    
                    {isEditing && (
                      <tr>
                        <td colSpan="9" className="py-3 px-4 text-center">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newItem = {
                                itemId: '',
                                customerId: '',
                                description: '',
                                quantity: 1,
                                price: 0,
                                total: 0,
                                leftAmount: 0,
                                paymentMethod: 'cash'
                              };
                              setFormData(prev => ({
                                ...prev,
                                items: [...(prev.items || []), newItem]
                              }));
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add New Item Row
                          </Button>
                        </td>
                      </tr>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end space-x-4">
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={loading}
              >
                Cancel
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;