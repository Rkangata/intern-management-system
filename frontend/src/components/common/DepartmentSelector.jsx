import { useState, useEffect } from 'react';

const DepartmentSelector = ({ 
  selectedDepartment, 
  selectedSubdepartment, 
  onDepartmentChange, 
  onSubdepartmentChange,
  required = false,
  disabled = false 
}) => {
  const departments = [
    { code: 'OPCS', name: 'Office of the Prime Cabinet Secretary' },
    { code: 'SDPA', name: 'State Department for Parliamentary Affairs' }
  ];

  const subdepartments = {
    SDPA: [
      { code: 'ADMIN', name: 'Administration' },
      { code: 'CPPMD', name: 'CPPMD' },
      { code: 'HRMD', name: 'HRM&D Division' },
      { code: 'FINANCE', name: 'Finance Unit' },
      { code: 'ACCOUNTS', name: 'Accounts Unit' },
      { code: 'SCM', name: 'SCM Unit' },
      { code: 'PUBLIC_COMM', name: 'Public Communications Unit' },
      { code: 'ICT', name: 'ICT Unit' }
    ],
    OPCS: []
  };

  const handleDepartmentChange = (e) => {
    const value = e.target.value;
    onDepartmentChange(value);
    onSubdepartmentChange('');
  };

  const currentSubdepts = selectedDepartment ? subdepartments[selectedDepartment] || [] : [];

  return (
    <>
      {/* Department Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Department {required && '*'}
        </label>
        <select
          value={selectedDepartment}
          onChange={handleDepartmentChange}
          required={required}
          disabled={disabled}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100"
        >
          <option value="">Select Department</option>
          {departments.map((dept) => (
            <option key={dept.code} value={dept.code}>
              {dept.name}
            </option>
          ))}
        </select>
      </div>

      {/* Subdepartment Selection */}
      {currentSubdepts.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Subdepartment {required && '*'}
          </label>
          <select
            value={selectedSubdepartment}
            onChange={(e) => onSubdepartmentChange(e.target.value)}
            required={required}
            disabled={disabled}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none disabled:bg-gray-100"
          >
            <option value="">Select Subdepartment</option>
            {currentSubdepts.map((subdept) => (
              <option key={subdept.code} value={subdept.code}>
                {subdept.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
};

export default DepartmentSelector;
