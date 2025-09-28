import React from 'react';
import { Calendar, Filter } from 'lucide-react';
import { format } from 'date-fns';
import Button from './Button';

const DateFilter = ({ dateRange, onDateChange, showApplyButton = false, onApplyFilter }) => {
  const handleFromDateChange = (e) => {
    onDateChange({
      ...dateRange,
      from: new Date(e.target.value)
    });
  };

  const handleToDateChange = (e) => {
    onDateChange({
      ...dateRange,
      to: new Date(e.target.value)
    });
  };

  const handleApplyFilter = () => {
    if (onApplyFilter) {
      onApplyFilter();
    }
  };

  return (
    <div className="flex items-end space-x-4 bg-white p-4 rounded-lg border border-gray-200">
      <Calendar className="w-5 h-5 text-gray-500 mb-2" />
      
      <div className="flex items-center space-x-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">From:</label>
          <input
            type="date"
            value={format(dateRange.from, 'yyyy-MM-dd')}
            onChange={handleFromDateChange}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">To:</label>
          <input
            type="date"
            value={format(dateRange.to, 'yyyy-MM-dd')}
            onChange={handleToDateChange}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      {showApplyButton && (
        <Button onClick={handleApplyFilter} size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Apply Filter
        </Button>
      )}
    </div>
  );
};

export default DateFilter;