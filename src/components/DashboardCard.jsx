import React from 'react';
import { TrendingUp, DollarSign, AlertCircle } from 'lucide-react';

const DashboardCard = ({ title, balance, profit, left, icon: Icon, gradient }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className={`bg-gradient-to-r ${gradient} p-4`}>
        <div className="flex items-center justify-between">
          <Icon className="w-8 h-8 text-white" />
          <div className="text-right">
            <p className="text-white text-sm opacity-90">Balance</p>
            <p className="text-white text-2xl font-bold">${balance.toLocaleString()}</p>
          </div>
        </div>
      </div>
      
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-3 text-lg">{title}</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-sm text-gray-600">Profit</span>
            </div>
            <span className="font-semibold text-green-600">${profit.toLocaleString()}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <AlertCircle className="w-4 h-4 text-orange-500 mr-2" />
              <span className="text-sm text-gray-600">Left</span>
            </div>
            <span className="font-semibold text-orange-600">${left.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;