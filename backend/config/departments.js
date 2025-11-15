const departments = {
  OPCS: {
    name: "Office of the Prime Cabinet Secretary",
    code: "OPCS",
    subdepartments: [
      { code: "ADMIN", name: "Administration" },
      { code: "CPPMD", name: "CPPMD" },
      { code: "HRMD", name: "HRM&D Division" },
      { code: "FINANCE", name: "Finance Unit" },
      { code: "ACCOUNTS", name: "Accounts Unit" },
      { code: "SCM", name: "SCM Unit" },
      { code: "PUBLIC_COMM", name: "Public Communications Unit" },
      { code: "ICT", name: "ICT Unit" },
    ],
  },
  SDPA: {
    name: "State Department for Parliamentary Affairs",
    code: "SDPA",
    subdepartments: [
      { code: "ADMIN", name: "Administration" },
      { code: "CPPMD", name: "CPPMD" },
      { code: "HRMD", name: "HRM&D Division" },
      { code: "FINANCE", name: "Finance Unit" },
      { code: "ACCOUNTS", name: "Accounts Unit" },
      { code: "SCM", name: "SCM Unit" },
      { code: "PUBLIC_COMM", name: "Public Communications Unit" },
      { code: "ICT", name: "ICT Unit" },
    ],
  },
};

// Helper function to get all departments
const getAllDepartments = () => {
  return Object.values(departments);
};

// Helper function to get subdepartments by department code
const getSubdepartments = (departmentCode) => {
  return departments[departmentCode]?.subdepartments || [];
};

// Helper function to validate department and subdepartment
const validateDepartmentSelection = (departmentCode, subdepartmentCode) => {
  const dept = departments[departmentCode];
  if (!dept) return false;

  if (dept.subdepartments.length === 0) return true; // OPCS has no subdepartments yet

  return dept.subdepartments.some((sub) => sub.code === subdepartmentCode);
};

module.exports = {
  departments,
  getAllDepartments,
  getSubdepartments,
  validateDepartmentSelection,
};
