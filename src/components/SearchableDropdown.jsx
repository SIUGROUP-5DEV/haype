import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, X, Plus } from 'lucide-react';

const SearchableDropdown = ({ 
  placeholder = "Search...", 
  value = "", 
  options = [], 
  onSelect, 
  onAddNew,
  addNewText = "Add New",
  width = "200px",
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);
  const triggerRef = useRef(null);

  // Filter options based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredOptions(options);
    } else {
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    }
  }, [searchTerm, options]);

  // Calculate dropdown position
  const calculatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          triggerRef.current && !triggerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        calculatePosition();
      }
    };

    const handleResize = () => {
      if (isOpen) {
        calculatePosition();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [isOpen]);

  const handleInputClick = () => {
    if (!disabled) {
      calculatePosition();
      setIsOpen(true);
      setSearchTerm('');
      // Focus the input when opening
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setIsOpen(true);
  };

  const handleOptionSelect = (option) => {
    onSelect(option);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onSelect(null);
    setSearchTerm('');
  };

  const handleAddNew = () => {
    if (onAddNew && searchTerm.trim()) {
      onAddNew(searchTerm.trim());
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  const hasExactMatch = filteredOptions.some(option => 
    option.label.toLowerCase() === searchTerm.toLowerCase()
  );

  const showAddNew = onAddNew && searchTerm.trim() && !hasExactMatch;

  // Portal dropdown content
  const dropdownContent = isOpen && !disabled && (
    <div 
      ref={dropdownRef}
      className="fixed bg-white border border-gray-300 rounded-md shadow-2xl max-h-60 overflow-y-auto"
      style={{ 
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        width: dropdownPosition.width,
        zIndex: 999999
      }}
    >
      {/* Search Input */}
      <div className="p-2 border-b border-gray-200 bg-white sticky top-0">
        <div className="flex items-center">
          <Search className="w-4 h-4 text-gray-400 mr-2" />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 outline-none text-sm bg-transparent"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleSearchChange}
            autoFocus
          />
        </div>
      </div>

      {/* Search Results */}
      <div className="max-h-48 overflow-y-auto">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <div
              key={option.id}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 bg-white"
              onClick={() => handleOptionSelect(option)}
            >
              <div className="font-medium text-gray-900 text-sm">{option.label}</div>
              {option.subtitle && (
                <div className="text-xs text-gray-500 mt-1">{option.subtitle}</div>
              )}
            </div>
          ))
        ) : searchTerm.trim() ? (
          <div className="px-3 py-2 text-gray-500 text-sm bg-white">
            No results found for "{searchTerm}"
          </div>
        ) : (
          <div className="px-3 py-2 text-gray-500 text-sm bg-white">
            Type to search...
          </div>
        )}

        {/* Add New Option */}
        {showAddNew && (
          <div
            className="px-3 py-2 hover:bg-green-50 cursor-pointer border-t border-gray-200 bg-green-50"
            onClick={handleAddNew}
          >
            <div className="flex items-center text-green-700 font-medium text-sm">
              <Plus className="w-4 h-4 mr-2" />
              {addNewText}: "{searchTerm}"
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Main Input */}
      <div 
        ref={triggerRef}
        className={`
          flex items-center w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white cursor-pointer
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
        onClick={handleInputClick}
        style={{ minWidth: width }}
      >
        <Search className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
        
        <span className={`flex-1 text-sm ${value ? 'text-gray-900' : 'text-gray-500'}`}>
          {value || placeholder}
        </span>
        
        <div className="flex items-center space-x-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* Portal Dropdown */}
      {typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
    </>
  );
};

export default SearchableDropdown;