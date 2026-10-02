// System Permissions Definitions
export const SYSTEM_PERMISSIONS = [
  // Sales & Invoicing
  { id: 'pos_terminal', name: 'POS Terminal', group: 'Sales & Invoicing', desc: 'Can access POS counter, scan items and process sales' },
  { id: 'view_invoices', name: 'View Invoices', group: 'Sales & Invoicing', desc: 'Can view sales vouchers, invoice list and download receipts' },
  { id: 'edit_invoices', name: 'Edit Invoices', group: 'Sales & Invoicing', desc: 'Can modify vouchers, change prices and adjust discounts' },
  { id: 'delete_invoices', name: 'Delete Invoices', group: 'Sales & Invoicing', desc: 'Can cancel, void or delete completed sales invoices' },
  { id: 'customers_manage', name: 'Manage Customers & Dues', group: 'Sales & Invoicing', desc: 'Can manage customer profiles, credit limits and collect dues' },

  // Inventory & Products
  { id: 'inventory_view', name: 'View Product Catalog', group: 'Inventory & Products', desc: 'Can view product list, stock counts and category catalog' },
  { id: 'inventory_manage', name: 'Manage Products', group: 'Inventory & Products', desc: 'Can add, edit, or delete items and pricing' },
  { id: 'stock_adjustment', name: 'Stock Adjustments', group: 'Inventory & Products', desc: 'Can perform stock write-offs, damages, and physical reconciliation' },
  { id: 'suppliers_manage', name: 'Manage Suppliers & PO', group: 'Inventory & Products', desc: 'Can create and manage suppliers and incoming purchase orders' },
  { id: 'barcodes_manage', name: 'Barcode Generator', group: 'Inventory & Products', desc: 'Can generate, customize and print barcode labels' },

  // Finance & Outlets
  { id: 'cash_register', name: 'Cash Register Drawer', group: 'Finance & Outlets', desc: 'Can open/close daily shifts and count physical cash' },
  { id: 'expenses_manage', name: 'Manage Expenses', group: 'Finance & Outlets', desc: 'Can view, create and categorize store operational expenses' },
  { id: 'branches_manage', name: 'Branches & Stock Transfers', group: 'Finance & Outlets', desc: 'Can view multiple branches and transfer inventory' },

  // Reports & Analytics
  { id: 'reports_view', name: 'View Sales & Profit Reports', group: 'Reports & Analytics', desc: 'Can view revenue summaries, sales charts and income statements' },
  { id: 'view_cost_price', name: 'View Cost & Profit Margins', group: 'Reports & Analytics', desc: 'Can view purchase cost price and gross profit margins' },
  { id: 'audit_logs', name: 'View System Audit Logs', group: 'Reports & Analytics', desc: 'Can inspect user login and activity security audit trails' },

  // Settings & Administration
  { id: 'company_settings', name: 'Company & Mail Settings', group: 'Settings & Administration', desc: 'Can edit company details, logo, favicon and email gateway' },
  { id: 'invoice_settings', name: 'Invoice Layout Settings', group: 'Settings & Administration', desc: 'Can configure thermal/A4 invoice templates, terms and design' },
  { id: 'staff_roles_manage', name: 'Manage Staff, Roles & Permissions', group: 'Settings & Administration', desc: 'Can manage staff accounts, edit role permissions and user overrides' }
];

// Default Built-in Roles Definitions
export const DEFAULT_ROLES = [
  {
    id: 'owner',
    name: 'Store Owner / Admin',
    isSystem: true,
    description: 'Full unrestricted system access across all store features and configurations',
    permissions: SYSTEM_PERMISSIONS.map(p => p.id)
  },
  {
    id: 'manager',
    name: 'Store Manager',
    isSystem: true,
    description: 'Can manage daily store operations, inventory, customers, expenses and invoices',
    permissions: [
      'pos_terminal', 'view_invoices', 'edit_invoices', 'customers_manage',
      'inventory_view', 'inventory_manage', 'stock_adjustment', 'suppliers_manage', 'barcodes_manage',
      'cash_register', 'expenses_manage', 'branches_manage',
      'reports_view', 'view_cost_price',
      'invoice_settings'
    ]
  },
  {
    id: 'cashier',
    name: 'Cashier / Billing Counter',
    isSystem: true,
    description: 'Point of sale counter cashier, receipt creation and customer dues',
    permissions: [
      'pos_terminal', 'view_invoices', 'customers_manage',
      'inventory_view', 'barcodes_manage',
      'cash_register'
    ]
  },
  {
    id: 'stock_keeper',
    name: 'Stock & Warehouse Manager',
    isSystem: false,
    description: 'Handles inventory tracking, purchase orders, adjustments and barcode generation',
    permissions: [
      'inventory_view', 'inventory_manage', 'stock_adjustment', 'suppliers_manage', 'barcodes_manage'
    ]
  },
  {
    id: 'accountant',
    name: 'Accountant',
    isSystem: false,
    description: 'Handles cash shifts, expense management, invoice audits and profit reports',
    permissions: [
      'view_invoices', 'customers_manage', 'cash_register', 'expenses_manage',
      'reports_view', 'view_cost_price'
    ]
  }
];
