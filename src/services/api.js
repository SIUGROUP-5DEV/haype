import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://haype-server.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verify: () => api.get('/auth/verify'),
};

// Cars API
export const carsAPI = {
  getAll: () => api.get('/cars'),
  create: (carData) => api.post('/cars', carData),
  getById: (id) => api.get(`/cars/${id}`),
  update: (id, carData) => api.put(`/cars/${id}`, carData),
  delete: (id) => api.delete(`/cars/${id}`),
};

// Employees API
export const employeesAPI = {
  getAll: () => api.get('/employees'),
  create: (employeeData) => api.post('/employees', employeeData),
  getById: (id) => api.get(`/employees/${id}`),
  update: (id, employeeData) => api.put(`/employees/${id}`, employeeData),
  delete: (id) => api.delete(`/employees/${id}`),
  addBalance: (id, balanceData) => api.post(`/employees/${id}/add-balance`, balanceData),
  deductBalance: (id, balanceData) => api.post(`/employees/${id}/deduct-balance`, balanceData),
  getPaymentHistory: (id) => api.get(`/employees/${id}/payment-history`),
};

// Items API
export const itemsAPI = {
  getAll: () => api.get('/items'),
  create: (itemData) => api.post('/items', itemData),
  getById: (id) => api.get(`/items/${id}`),
  update: (id, itemData) => api.put(`/items/${id}`, itemData),
  delete: (id) => api.delete(`/items/${id}`),
};

// Customers API
export const customersAPI = {
  getAll: () => api.get('/customers'),
  create: (customerData) => api.post('/customers', customerData),
  getById: (id) => api.get(`/customers/${id}`),
  update: (id, customerData) => api.put(`/customers/${id}`, customerData),
  delete: (id) => api.delete(`/customers/${id}`),
};

// Invoices API
export const invoicesAPI = {
  getAll: () => api.get('/invoices'),
  create: (invoiceData) => api.post('/invoices', invoiceData),
  getById: (id) => api.get(`/invoices/${id}`),
  update: (id, invoiceData) => api.put(`/invoices/${id}`, invoiceData),
  delete: (id) => api.delete(`/invoices/${id}`),
  deleteWithBalanceUpdate: async (invoiceId) => {
    // Get invoice details first
    const invoiceResponse = await api.get(`/invoices/${invoiceId}`);
    const invoice = invoiceResponse.data;
    
    // Delete the invoice
    const deleteResponse = await api.delete(`/invoices/${invoiceId}`);
    
    // Return both invoice data and delete response for balance updates
    return { invoice, deleteResponse };
  },
};

// Payments API
export const paymentsAPI = {
  receive: (paymentData) => api.post('/payments/receive', paymentData),
  paymentOut: (paymentData) => api.post('/payments/payment-out', paymentData),
  update: (id, paymentData) => api.put(`/payments/${id}`, paymentData),
  getAll: () => api.get('/payments'),
  delete: (id) => {
    console.log('🗑️ Deleting payment with ID:', id);
    return api.delete(`/payments/${id}`);
  },
  updateWithBalanceAdjustment: async (paymentId, updatedPaymentData, originalAmount, customerId) => {
    console.log('🔄 API: Updating payment with balance adjustment:', {
      paymentId,
      updatedPaymentData,
      originalAmount,
      customerId
    });
    
    // Update payment first
    const paymentResponse = await api.put(`/payments/${paymentId}`, updatedPaymentData);
    console.log('✅ Payment updated in database:', paymentResponse.data);
    
    // Calculate balance adjustment
    const amountDifference = updatedPaymentData.amount - originalAmount;
    console.log('💰 Amount difference:', amountDifference);
    
    // Update customer balance if there's a difference
    if (amountDifference !== 0 && customerId) {
      console.log('🔄 Updating customer balance for ID:', customerId);
      const customerResponse = await customersAPI.getById(customerId);
      const customer = customerResponse.data;
      
      // For payment received: if amount increases, customer balance should decrease more
      // For payment out: if amount increases, customer balance should increase less
      const newBalance = Math.max(0, (customer.balance || 0) - amountDifference);
      console.log(`💰 Customer balance update: ${customer.balance} - ${amountDifference} = ${newBalance}`);
      
      await customersAPI.update(customerId, { balance: newBalance });
      console.log(`✅ Customer balance adjusted: ${amountDifference > 0 ? '-' : '+'}$${Math.abs(amountDifference)} = $${newBalance}`);
    }
    
    return paymentResponse;
  },
  deleteWithBalanceAdjustment: async (paymentId, paymentAmount, customerId, carId) => {
    console.log('🗑️ API: Deleting payment with balance adjustment:', {
      paymentId,
      paymentAmount,
      customerId,
      carId
    });
    
    // Delete payment first
    const deleteResponse = await api.delete(`/payments/${paymentId}`);
    console.log('✅ Payment deleted from database');
    
    // Adjust customer balance if applicable
    if (customerId && paymentAmount) {
      console.log('🔄 Adjusting customer balance after deletion');
      const customerResponse = await customersAPI.getById(customerId);
      const customer = customerResponse.data;
      
      // When deleting a payment received, add back to customer balance (increase debt)
      // When deleting a payment out, subtract from customer balance (decrease debt)
      const newBalance = (customer.balance || 0) + paymentAmount;
      console.log(`💰 Customer balance restoration: ${customer.balance} + ${paymentAmount} = ${newBalance}`);
      
      await customersAPI.update(customerId, { balance: newBalance });
      console.log(`✅ Customer balance adjusted after payment deletion: +$${paymentAmount} = $${newBalance}`);
    }
    
    // Adjust car balance if applicable
    if (carId && paymentAmount) {
      console.log('🔄 Adjusting car balance after deletion');
      const carResponse = await carsAPI.getById(carId);
      const car = carResponse.data;
      const newCarLeft = Math.max(0, (car.left || 0) - paymentAmount);
      console.log(`🚗 Car left amount adjustment: ${car.left} - ${paymentAmount} = ${newCarLeft}`);
      
      await carsAPI.update(carId, { left: newCarLeft });
      console.log(`✅ Car left amount adjusted after payment deletion: -$${paymentAmount} = $${newCarLeft}`);
    }
    
    return deleteResponse;
  }
};

// Dashboard API
export const dashboardAPI = {
  getData: () => api.get('/dashboard'),
};

// Backup & Restore API
export const backupAPI = {
  exportAll: () => api.get('/backup/export'),
  importAll: (backupData) => api.post('/backup/import', backupData),
};

export default api;