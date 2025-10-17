import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const DashboardCharts = ({ dateRange, carData }) => {
  // Generate sample daily data based on selected car
  const generateDailyData = () => {
    if (!carData || carData.length === 0) return [];
    
    const selectedCar = carData[0];
    const baseValue = selectedCar.carBalance / 30; // Divide by 30 days
    
    return [
      { date: '01', [selectedCar.carName]: Math.floor(baseValue * 0.8) },
      { date: '02', [selectedCar.carName]: Math.floor(baseValue * 0.6) },
      { date: '03', [selectedCar.carName]: Math.floor(baseValue * 1.2) },
      { date: '04', [selectedCar.carName]: Math.floor(baseValue * 0.9) },
      { date: '05', [selectedCar.carName]: Math.floor(baseValue * 1.1) },
      { date: '06', [selectedCar.carName]: Math.floor(baseValue * 1.0) },
      { date: '07', [selectedCar.carName]: Math.floor(baseValue * 1.3) }
    ];
  };

  // Generate sample monthly data based on selected car
  const generateMonthlyData = () => {
    if (!carData || carData.length === 0) return [];
    
    const selectedCar = carData[0];
    const baseRevenue = selectedCar.carBalance / 6; // Divide by 6 months
    const baseProfit = selectedCar.carProfit / 6;
    
    return [
      { month: 'Jan', revenue: Math.floor(baseRevenue * 0.8), profit: Math.floor(baseProfit * 0.8) },
      { month: 'Feb', revenue: Math.floor(baseRevenue * 1.2), profit: Math.floor(baseProfit * 1.2) },
      { month: 'Mar', revenue: Math.floor(baseRevenue * 0.9), profit: Math.floor(baseProfit * 0.9) },
      { month: 'Apr', revenue: Math.floor(baseRevenue * 1.4), profit: Math.floor(baseProfit * 1.4) },
      { month: 'May', revenue: Math.floor(baseRevenue * 1.1), profit: Math.floor(baseProfit * 1.1) },
      { month: 'Jun', revenue: Math.floor(baseRevenue * 1.5), profit: Math.floor(baseProfit * 1.5) }
    ];
  };

  const dailyData = generateDailyData();
  const monthlyData = generateMonthlyData();

  // Pie chart data for selected car
  const pieData = carData.map((car, index) => ({
    name: car.carName,
    value: car.carProfit,
    color: ['#3B82F6', '#14B8A6', '#8B5CF6', '#F97316'][index]
  }));

  const colors = ['#3B82F6', '#14B8A6', '#8B5CF6', '#F97316'];

  if (!carData || carData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Car Selected</h3>
        <p className="text-gray-600">Select a car to view performance charts.</p>
      </div>
    );
  }

  const selectedCar = carData[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily Performance Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Daily Performance - {selectedCar.carName}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
              formatter={(value) => [`$${value.toLocaleString()}`, selectedCar.carName]}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={selectedCar.carName} 
              stroke="#3B82F6" 
              strokeWidth={3}
              dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Revenue Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Monthly Revenue & Profit - {selectedCar.carName}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
              formatter={(value) => [`$${value.toLocaleString()}`]}
            />
            <Legend />
            <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Revenue" />
            <Bar dataKey="profit" fill="#14B8A6" radius={[4, 4, 0, 0]} name="Profit" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Car Balance Distribution */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Balance Distribution - {selectedCar.carName}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={[
                { name: 'Available Balance', value: selectedCar.carBalance - selectedCar.carLeft, color: '#14B8A6' },
                { name: 'Outstanding Amount', value: selectedCar.carLeft, color: '#F97316' },
                { name: 'Estimated Profit', value: selectedCar.carProfit, color: '#3B82F6' }
              ]}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {[
                { color: '#14B8A6' },
                { color: '#F97316' },
                { color: '#3B82F6' }
              ].map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value) => [`$${value.toLocaleString()}`]}
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Summary */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Performance Summary - {selectedCar.carName}
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center">
              <div 
                className="w-4 h-4 rounded-full mr-3 bg-blue-600"
              ></div>
              <span className="font-medium text-blue-900">Current Balance</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-blue-600">
                ${selectedCar.carBalance.toLocaleString()}
              </div>
              <div className="text-sm text-blue-700">Total available</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center">
              <div 
                className="w-4 h-4 rounded-full mr-3 bg-green-600"
              ></div>
              <span className="font-medium text-green-900">Estimated Profit</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-green-600">
                ${selectedCar.carProfit.toLocaleString()}
              </div>
              <div className="text-sm text-green-700">15% of balance</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center">
              <div 
                className="w-4 h-4 rounded-full mr-3 bg-orange-600"
              ></div>
              <span className="font-medium text-orange-900">Outstanding</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-orange-600">
                ${selectedCar.carLeft.toLocaleString()}
              </div>
              <div className="text-sm text-orange-700">8% of balance</div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center">
              <div 
                className="w-4 h-4 rounded-full mr-3 bg-gray-600"
              ></div>
              <span className="font-medium text-gray-900">Net Available</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-600">
                ${(selectedCar.carBalance - selectedCar.carLeft).toLocaleString()}
              </div>
              <div className="text-sm text-gray-700">After outstanding</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;