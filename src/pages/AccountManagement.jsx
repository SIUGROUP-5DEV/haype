import React, { useState, useEffect } from 'react';
import { Settings, Calendar, FileText, TrendingUp, Download, UserX, Car as CarIcon, UserCheck, Building2, AlertTriangle, DollarSign, RotateCcw, Filter, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import FormSelect from '../components/FormSelect';
import FormInput from '../components/FormInput';
import DateFilter from '../components/DateFilter';
import { useToast } from '../contexts/ToastContext';
import { carsAPI, customersAPI, dashboardAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import Footer from '../components/Footer';

const AccountManagement = () => {
  const { showSuccess, showError, showWarning } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [viewPeriod, setViewPeriod] = useState('monthly');
  const [creditDateRange, setCreditDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  // Monthly closing state
  const [monthlyClosingLoading, setMonthlyClosingLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState('');

  // Data from database
  const [cars, setCars] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({
    totalCars: 0,
    totalCustomers: 0
  });

  // Account monthly data
  const [accountMonths, setAccountMonths] = useState([]);
  const [closedAccounts, setClosedAccounts] = useState([]);

  // Load data from database
  useEffect(() => {
    loadAllData();
    generateAccountMonths();
    loadClosedAccounts();
  }, []);

  const generateAccountMonths = () => {
    const months = [];
    const currentDate = new Date();
    
    // Set current month
    const currentMonthKey = currentDate.toISOString().slice(0, 7);
    setCurrentMonth(currentMonthKey);
    setSelectedMonth(currentMonthKey);
    
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
        status: i === 0 ? 'Active' : 'Closed', // Current month is active, others are closed
        isCurrent: i === 0
      });
    }
    
    setAccountMonths(months);
  };

  const loadClosedAccounts = () => {
    // Simulate closed accounts data
    const closed = [
      {
        id: 'closed_2024_11',
        month: '2024-11',
        monthLabel: 'November 2024',
        closedDate: '2024-11-30',
        totalBalance: 125000,
        totalProfit: 18750,
        carsCount: 5,
        customersCount: 12,
        status: 'Closed'
      },
      {
        id: 'closed_2024_10',
        month: '2024-10',
        monthLabel: 'October 2024',
        closedDate: '2024-10-31',
        totalBalance: 98000,
        totalProfit: 14700,
        carsCount: 4,
        customersCount: 10,
        status: 'Closed'
      }
    ];
    
    setClosedAccounts(closed);
  };

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [carsResponse, customersResponse, dashboardResponse] = await Promise.all([
        carsAPI.getAll(),
        customersAPI.getAll(),
        dashboardAPI.getData()
      ]);
      
      setCars(carsResponse.data);
      setCustomers(customersResponse.data);
      setStats(dashboardResponse.data.stats);
      
      console.log('✅ Account management data loaded:', {
        cars: carsResponse.data.length,
        customers: customersResponse.data.length
      });
    } catch (error) {
      console.error('❌ Error loading account management data:', error);
      showError('Load Failed', 'Failed to load account management data');
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyProfit = () => {
    // Calculate profit: Car Balance - Car Left - Car Payments = Profit
    const totalCarBalance = cars.reduce((sum, car) => sum + (car.balance || 0), 0);
    const totalCarLeft = cars.reduce((sum, car) => sum + (car.left || 0), 0);
    const totalCarPayments = cars.reduce((sum, car) => sum + (car.payments || 0), 0);
    
    // Profit = Car Balance - Car Left - Car Payments (no percentage)
    const netAmount = totalCarBalance - totalCarLeft - totalCarPayments;
    const estimatedProfit = netAmount; // Direct calculation, no percentage
    
    return {
      totalCarBalance,
      totalCarLeft,
      totalCarPayments,
      netAmount,
      estimatedProfit
    };
  };

  const handleMonthlyClosing = async () => {
    const currentMonthLabel = accountMonths.find(month => month.isCurrent)?.label || 'Current Month';
    const profitData = calculateMonthlyProfit();
    
    const confirmMessage = `🚨 MONTHLY ACCOUNT CLOSING 🚨\n\n` +
      `This will close ${currentMonthLabel} and calculate final profit.\n\n` +
      `Current Financial Summary:\n` +
      `• Total Car Balance: $${profitData.totalCarBalance.toLocaleString()}\n` +
      `• Total Car Left: $${profitData.totalCarLeft.toLocaleString()}\n` +
      `• Total Car Payments: $${profitData.totalCarPayments.toLocaleString()}\n` +
      `• Net Amount: $${profitData.netAmount.toLocaleString()}\n` +
      `• Final Profit: $${profitData.estimatedProfit.toLocaleString()}\n\n` +
      `Actions that will be performed:\n` +
      `• Calculate final profit: Balance - Left - Payments = $${profitData.estimatedProfit.toLocaleString()}\n` +
      `• Reset all car balances to $0\n` +
      `• Reset all car left amounts to $0\n` +
      `• Reset all car payments to $0\n` +
      `• Archive current month's data\n` +
      `• Create new monthly accounts for next month\n\n` +
      `⚠️ This action cannot be undone!\n\n` +
      `Are you sure you want to proceed?`;

    if (window.confirm(confirmMessage)) {
      setMonthlyClosingLoading(true);
      
      try {
        // Simulate monthly closing process
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        console.log('🔄 Performing monthly closing...');
        console.log('📅 Current month:', currentMonth);
        console.log('💰 Profit calculation:', profitData);
        
        // Reset all car balances and left amounts to 0
        for (const car of cars) {
          await carsAPI.update(car._id, { 
            balance: 0,
            left: 0,
            payments: 0
          });
        }
        
        // Create closed account record
        const newClosedAccount = {
          id: `closed_${currentMonth}`,
          month: currentMonth,
          monthLabel: currentMonthLabel,
          closedDate: new Date().toISOString(),
          totalBalance: profitData.totalCarBalance,
          totalLeft: profitData.totalCarLeft,
          totalProfit: profitData.estimatedProfit,
          carsCount: cars.length,
          customersCount: customers.length,
          status: 'Closed'
        };
        
        setClosedAccounts(prev => [newClosedAccount, ...prev]);
        
        // Update account months - close current and create new
        const newDate = new Date();
        newDate.setMonth(newDate.getMonth() + 1);
        const newMonthKey = newDate.toISOString().slice(0, 7);
        const newMonthLabel = newDate.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        });
        
        // Regenerate account months with new current month
        generateAccountMonths();
        
        showSuccess(
          'Monthly Closing Complete', 
          `${currentMonthLabel} has been closed successfully!\n\nProfit Formula: Balance - Left - Payments\nFinal Profit: $${profitData.estimatedProfit.toLocaleString()}\nAll car balances reset to $0\nNew accounts created for ${newMonthLabel}`
        );
        
        // Reload data
        loadAllData();
        
      } catch (error) {
        console.error('❌ Error performing monthly closing:', error);
        showError('Monthly Closing Failed', 'Error performing monthly closing. Please try again.');
      } finally {
        setMonthlyClosingLoading(false);
      }
    }
  };

  const handleApplyFilter = () => {
    const selectedMonthLabel = accountMonths.find(m => m.value === selectedMonth)?.label || 'Current Month';
    showSuccess('Filter Applied', `Viewing ${selectedMonthLabel} account data with ${viewPeriod} view`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <LoadingSpinner size={32} />
          <p className="text-gray-600 mt-4">Loading account management data...</p>
        </div>
      </div>
    );
  }

  const profitData = calculateMonthlyProfit();

  // Calculate total credit (customers who owe money)
  const calculateTotalCredit = () => {
    return customers.reduce((sum, customer) => sum + (customer.balance || 0), 0);
  };

  const totalCredit = calculateTotalCredit();

  // Handle Total Credit card click
  const handleTotalCreditClick = () => {
    navigate('/credit-overview', {
      state: {
        dateRange: creditDateRange,
        customers: customers.filter(c => (c.balance || 0) > 0)
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Management</h1>
        <p className="text-gray-600">Manage monthly accounts and car account linking</p>
      </div>

      {/* Total Credit Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <CreditCard className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Total Credit Overview</h3>
              <p className="text-gray-600">Outstanding customer debts</p>
            </div>
          </div>
          <DateFilter
            dateRange={creditDateRange}
            onDateChange={setCreditDateRange}
            showApplyButton={false}
          />
        </div>

        <div
          onClick={handleTotalCreditClick}
          className="bg-red-50 border-2 border-red-200 rounded-lg p-6 cursor-pointer hover:bg-red-100 transition-colors"
        >
          <div className="text-center">
            <p className="text-sm text-red-700 mb-2">Total Outstanding Credit</p>
            <p className="text-4xl font-bold text-red-600">${totalCredit.toLocaleString()}</p>
            <p className="text-sm text-red-600 mt-2">
              {customers.filter(c => (c.balance || 0) > 0).length} customers with outstanding balances
            </p>
            <p className="text-xs text-gray-600 mt-2">Click to view detailed breakdown</p>
          </div>
        </div>
      </div>

      {/* Current Month Status with Profit Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Current Active Month</h3>
              <p className="text-blue-700">
                {accountMonths.find(month => month.isCurrent)?.label || 'Loading...'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              Active
            </span>
            <p className="text-sm text-blue-600 mt-1">
              {cars.length} Cars • {customers.length} Customers
            </p>
          </div>
        </div>

        {/* Profit Preview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-4">
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-700">Total Car Balance</p>
            <p className="text-xl font-bold text-blue-900">${profitData.totalCarBalance.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-700">Total Car Left</p>
            <p className="text-xl font-bold text-red-600">${profitData.totalCarLeft.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-700">Total Car Payments</p>
            <p className="text-xl font-bold text-orange-600">${profitData.totalCarPayments.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-700">Net Amount</p>
            <p className="text-xl font-bold text-blue-600">${profitData.netAmount.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <p className="text-sm text-green-700">Final Profit</p>
            <p className="text-xl font-bold text-green-600">${profitData.estimatedProfit.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Monthly Closing Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Settings className="w-6 h-6 text-orange-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">Monthly Account Closing & Profit Calculation</h2>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-orange-600 mr-2 mt-0.5" />
            <div>
              <h4 className="font-medium text-orange-900">Important Notice</h4>
              <p className="text-orange-800 text-sm mt-1">
                This will calculate final profit based on: Car Balance - Car Left - Car Payments = Profit (no percentage).
                Current calculation: ${profitData.totalCarBalance.toLocaleString()} - ${profitData.totalCarLeft.toLocaleString()} - ${profitData.totalCarPayments.toLocaleString()} = ${profitData.estimatedProfit.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <Button 
          onClick={handleMonthlyClosing} 
          variant="warning"
          disabled={monthlyClosingLoading}
        >
          {monthlyClosingLoading ? (
            <>
              <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Processing Monthly Closing...
            </>
          ) : (
            <>
              <Settings className="w-5 h-5 mr-2" />
              Perform Monthly Closing & Calculate Profit
            </>
          )}
        </Button>
      </div>

      {/* Car Account Management */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <CarIcon className="w-6 h-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Car Account Management</h2>
          </div>
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">View Period</label>
              <select 
                value={viewPeriod}
                onChange={(e) => setViewPeriod(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="daily">Daily View</option>
                <option value="monthly">Monthly View</option>
                <option value="yearly">Yearly View</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Account Month</label>
              <select 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {accountMonths.map(month => (
                  <option key={month.value} value={month.value}>
                    {month.label} ({month.status})
                  </option>
                ))}
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={handleApplyFilter}>
              <Filter className="w-4 h-4 mr-2" />
              Apply Filter
            </Button>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6">
          Link cars to monthly accounts automatically at month end, or manually assign them to specific months.
        </p>
        
        {/* Car Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car) => (
            <div key={car._id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <CarIcon className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <h4 className="font-semibold text-gray-900">{car.carName}</h4>
                    <p className="text-sm text-gray-600 font-mono">{car.numberPlate || 'No Plate'}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  car.status === 'Active' 
                    ? 'bg-green-100 text-green-800' 
                    : car.status === 'Maintenance'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {car.status || 'Active'}
                </span>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Balance:</span>
                  <span className="font-semibold text-blue-600">${(car.balance || 0).toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Outstanding:</span>
                  <span className="font-semibold text-red-600">${(car.left || 0).toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Driver:</span>
                  <span className="text-sm text-gray-900">{car.driverId?.employeeName || 'Not Assigned'}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Kirishboy:</span>
                  <span className="text-sm text-gray-900">{car.kirishboyId?.employeeName || 'Not Assigned'}</span>
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Net Available:</span>
                    <span className="font-bold text-green-600">
                      ${((car.balance || 0) - (car.left || 0)).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                {/* Monthly Account Assignment */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Account Month:</span>
                    <span className="text-sm text-blue-600">
                      {accountMonths.find(m => m.value === selectedMonth)?.label || 'Current'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Car linked to {accountMonths.find(m => m.value === selectedMonth)?.label || 'current month'} account
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => window.location.href = `/cars/${car._id}`}
                  >
                    View Details
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => window.location.href = `/car-reports?carId=${car._id}&carName=${car.carName}&month=${selectedMonth}`}
                  >
                    View Reports
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Monthly Account Summary */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-3">
            Monthly Account Summary - {accountMonths.find(m => m.value === selectedMonth)?.label}
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg text-center">
              <p className="text-sm text-blue-700">Cars in Account</p>
              <p className="text-2xl font-bold text-blue-900">{cars.length}</p>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <p className="text-sm text-green-700">Total Fleet Balance</p>
              <p className="text-2xl font-bold text-green-900">
                ${cars.reduce((sum, car) => sum + (car.balance || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <p className="text-sm text-red-700">Total Outstanding</p>
              <p className="text-2xl font-bold text-red-900">
                ${cars.reduce((sum, car) => sum + (car.left || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white p-4 rounded-lg text-center">
              <p className="text-sm text-purple-700">Estimated Profit</p>
              <p className="text-2xl font-bold text-purple-900">
                ${profitData.estimatedProfit.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Account Management Instructions</h3>
        <ul className="text-blue-800 space-y-1">
          <li>• <strong>Monthly Closing:</strong> Calculates profit from Car Balance - Car Left - Car Payments = Profit (no percentage) and resets all car balances to $0</li>
          <li>• <strong>Profit Formula:</strong> Car Balance - Car Left - Car Payments = Final Profit (direct calculation, no percentage)</li>
          <li>• <strong>Car Payments:</strong> All payments made for car expenses are added to car left amount</li>
          <li>• <strong>Balance Reset:</strong> All car balances start from $0 each new month</li>
          <li>• <strong>Car Account Linking:</strong> Cars are automatically linked to monthly accounts</li>
          <li>• <strong>Monthly Accounts:</strong> Each month has its own account for tracking car performance</li>
          <li>• <strong>Account History:</strong> View historical monthly account data and profits</li>
          <li>• <strong>Warning:</strong> Monthly closing actions cannot be undone</li>
        </ul>
      </div>

      <Footer/>
    </div>
  );
};

export default AccountManagement;