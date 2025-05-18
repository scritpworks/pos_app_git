const express = require('express');
const cors = require('cors');
const util = require('util');
const bcrypt = require('bcrypt');
const db = require('./db');
const app = express();
const jwt = require('jsonwebtoken');
const { escape } = require('mysql2');
const PORT = 5000;
// JWT secret key
const JWT_SECRET = 'your-secret-key';

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};



const query = (sql, values) => {
  return new Promise((resolve, reject) => {
    db.query(sql, values, (error, results) => {
      if (error) reject(error);
      resolve(results);
    });
  });
};


app.post('/api/change-password', authenticateToken, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user.id;

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const query = `
      UPDATE employees 
      SET password = ${escape(hashedPassword)}, 
          initialLogin = false 
      WHERE id = ${escape(userId)}
    `;

    db.query(query, (err, result) => {
      if (err) {
        return res.status(500).json({ message: 'Database error' });
      }
      res.json({ message: 'Password updated successfully' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});


app.post('/api/employees', authenticateToken, async (req, res) => {
  try {

    await query('START TRANSACTION');

    const {
      name,
      email,
      phone,
      role,
      branch,
      status,
      loginStatus,
      hireDate
    } = req.body;


    if (!name || !email || !role || !branch) {
      throw new Error('Please fill all required fields');
    }


    const existingEmployees = await query(
      'SELECT id FROM employees WHERE email = ?',
      [email]
    );

    if (existingEmployees.length > 0) {
      throw new Error('Email already exists');
    }


    const defaultPassword = email.split('@')[0];


    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);



    const result = await query(
      `INSERT INTO employees (
        name, email, password, phone, role, branch, status, 
        initialLogin, loginStatus, hireDate, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        name,
        email,
        hashedPassword,
        phone || '',
        role,
        branch,
        status === 'active' ? true : false,
        1,
        loginStatus,
        hireDate
      ]
    );




    await query('COMMIT');

    res.status(201).json({
      message: 'Employee created successfully',
      employeeId: result.insertId,
      requiresPasswordChange: true
    });

  } catch (error) {
    await query('ROLLBACK');
    console.error('Error creating employee:', error);
    res.status(400).json({
      message: error.message || 'Error creating employee'
    });
  }
});



app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;



    const results = await query(
      'SELECT * FROM employees WHERE email = ?',
      [email]
    );

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = results[0];


    const isValidPassword = await bcrypt.compare(password, results[0].password);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }


    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        initialLogin: user.initialLogin
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        initialLogin: user.initialLogin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


app.get('/api/employees', authenticateToken, async (req, res) => {
  try {
    const results = await query(
      `SELECT id, name, email, phone, role, branch, status, 
       loginStatus, hireDate, created_at, updated_at 
       FROM employees`
    );

    res.json(results);

  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Error fetching employees' });
  }
});


app.delete('/api/employees/:id', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM employees WHERE id = ?', [req.params.id]);
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Error deleting employee' });
  }
});

app.put('/api/employees/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      email,
      phone,
      role,
      branch,
      status,
      loginStatus,
      hireDate
    } = req.body;

    // Check if email exists for other employees
    const existingEmployees = await query(
      'SELECT id FROM employees WHERE email = ? AND id != ?',
      [email, id]
    );

    if (existingEmployees.length > 0) {
      throw new Error('Email already exists for another employee');
    }

    // Update employee
    await query(
      `UPDATE employees 
       SET name = ?, 
           email = ?, 
           phone = ?, 
           role = ?, 
           branch = ?, 
           status = ?, 
           loginStatus = ?, 
           hireDate = ?,
           updated_at = NOW()
       WHERE id = ?`,
      [
        name,
        email,
        phone,
        role,
        branch,
        status,
        loginStatus,
        hireDate,
        id
      ]
    );

    res.json({
      message: 'Employee updated successfully',
      employeeId: id
    });

  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(400).json({
      message: error.message || 'Error updating employee'
    });
  }
});


app.get('/api/login-status', authenticateToken, async (req, res) => {
  try {
    const results = await query('SELECT * FROM login_status ORDER BY name ASC');
    res.json(results);
  } catch (error) {
    console.error('Error fetching login status:', error);
    res.status(500).json({ message: 'Error fetching login status' });
  }
});

app.post('/api/login-status', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      throw new Error('Name is required');
    }

    // Check if name already exists
    const existing = await query(
      'SELECT id FROM login_status WHERE name = ?',
      [name]
    );

    if (existing.length > 0) {
      throw new Error('Login status already exists');
    }

    const result = await query(
      'INSERT INTO login_status (name) VALUES (?)',
      [name]
    );

    res.status(201).json({
      message: 'Login status created successfully',
      id: result.insertId
    });

  } catch (error) {
    console.error('Error creating login status:', error);
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/login-status/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if status is default
    const [status] = await query(
      'SELECT is_default FROM login_status WHERE id = ?',
      [id]
    );

    if (status && status.is_default) {
      throw new Error('Cannot delete system default login status');
    }

    // Check if status is being used
    const inUse = await query(
      'SELECT id FROM employees WHERE loginStatus = (SELECT name FROM login_status WHERE id = ?)',
      [id]
    );

    if (inUse.length > 0) {
      throw new Error('Cannot delete: Login status is being used by employees');
    }

    await query('DELETE FROM login_status WHERE id = ?', [id]);
    res.json({ message: 'Login status deleted successfully' });
  } catch (error) {
    console.error('Error deleting login status:', error);
    res.status(400).json({ message: error.message });
  }
});

app.put('/api/login-status/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, oldName } = req.body;

    // Validate input
    if (!name || !name.trim()) {
      throw new Error('Status name is required');
    }

    // Start transaction
    await query('START TRANSACTION');

    // Check if status exists and if it's default
    const [existingStatus] = await query(
      'SELECT * FROM login_status WHERE id = ?',
      [id]
    );

    if (!existingStatus) {
      throw new Error('Login status not found');
    }

    if (existingStatus.is_default) {
      throw new Error('Cannot modify system default login status');
    }

    // Check if new name already exists (excluding current status)
    const [duplicateName] = await query(
      'SELECT id FROM login_status WHERE name = ? AND id != ?',
      [name.trim(), id]
    );

    if (duplicateName) {
      throw new Error('Login status name already exists');
    }

    // Update login status
    await query(
      `UPDATE login_status 
       SET name = ?, 
           updated_at = NOW() 
       WHERE id = ?`,
      [name.trim(), id]
    );

    // Update all employees using this login status
    if (oldName) {
      await query(
        'UPDATE employees SET loginStatus = ? WHERE loginStatus = ?',
        [name.trim(), oldName]
      );
    }

    // Commit transaction
    await query('COMMIT');

    res.json({
      message: 'Login status updated successfully',
      id,
      name: name.trim()
    });

  } catch (error) {
    // Rollback on error
    await query('ROLLBACK');
    console.error('Error updating login status:', error);
    res.status(400).json({
      message: error.message || 'Error updating login status'
    });
  }
});

// Get all branches
app.get('/api/branches', authenticateToken, async (req, res) => {
  try {
    const results = await query(
      'SELECT * FROM branches ORDER BY name ASC'
    );
    res.json(results);
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ message: 'Error fetching branches' });
  }
});

// Create new branch
app.post('/api/branches', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      address,
      phone,
      manager,
      isActive
    } = req.body;

    // Start transaction
    await query('START TRANSACTION');

    try {
      // Validate required fields
      if (!name || !address) {
        throw new Error('Name and address are required');
      }

      // Check if branch name already exists
      const existing = await query(
        'SELECT id FROM branches WHERE name = ?',
        [name.trim()]
      );

      if (existing.length > 0) {
        throw new Error('Branch name already exists');
      }

      const result = await query(
        `INSERT INTO branches (
          name, address, phone, manager, is_active, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          name.trim(),
          address.trim(),
          phone?.trim() || '',
          manager?.trim() || '',
          isActive === true ? 1 : 0
        ]
      );

      // Commit transaction
      await query('COMMIT');

      res.status(201).json({
        message: 'Branch created successfully',
        id: result.insertId
      });

    } catch (error) {
      // Rollback on error
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(400).json({
      message: error.message || 'Error creating branch'
    });
  }
});

// Update branch
app.put('/api/branches/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      address,
      phone,
      manager,
      isActive
    } = req.body;

    // Check if branch exists and get its current name
    const [existingBranch] = await query(
      'SELECT id, name FROM branches WHERE id = ?',
      [id]
    );

    if (!existingBranch) {
      throw new Error('Branch not found');
    }

    // Prevent name change for Main Store
    if (existingBranch.name === 'Main Store' && name !== 'Main Store') {
      throw new Error('Cannot change the name of Main Store');
    }

    // Start transaction
    await query('START TRANSACTION');

    try {
      // Validate required fields
      if (!name || !address) {
        throw new Error('Name and address are required');
      }

      // Check if new name exists for other branches
      const [duplicateName] = await query(
        'SELECT id FROM branches WHERE name = ? AND id != ?',
        [name.trim(), id]
      );

      if (duplicateName) {
        throw new Error('Branch name already exists');
      }

      // Update branch
      await query(
        `UPDATE branches 
         SET name = ?, 
             address = ?, 
             phone = ?, 
             manager = ?, 
             is_active = ?,
             updated_at = NOW() 
         WHERE id = ?`,
        [
          name.trim(),
          address.trim(),
          phone?.trim() || '',
          manager?.trim() || '',
          isActive === true ? 1 : 0,
          id
        ]
      );

      // update employee table
      await query('UPDATE employees SET branch = ? WHERE branch = ?', [name.trim(),
      existingBranch.name]);

      await query('COMMIT');

      res.json({
        message: 'Branch updated successfully',
        id
      });

    } catch (error) {
      // Rollback on error
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(400).json({
      message: error.message || 'Error updating branch'
    });
  }
});

// Delete branch
app.delete('/api/branches/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if branch exists and get its name
    const [branch] = await query(
      'SELECT id, name FROM branches WHERE id = ?',
      [id]
    );

    if (!branch) {
      throw new Error('Branch not found');
    }

    // Prevent deletion of Main Store
    if (branch.name === 'Main Store') {
      throw new Error('Cannot delete Main Store - it is a default branch');
    }

    // Check if branch is being used by employees
    const inUse = await query(
      'SELECT id FROM employees WHERE branch = ?',
      [branch.name]
    );

    if (inUse.length > 0) {
      throw new Error('Cannot delete: Branch is assigned to employees');
    }

    // Delete branch
    await query('DELETE FROM branches WHERE id = ?', [id]);

    res.json({
      message: 'Branch deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(400).json({
      message: error.message || 'Error deleting branch'
    });
  }
});

// Get all roles with their permissions
app.get('/api/roles', authenticateToken, async (req, res) => {
  try {
    const roles = await query(`
      SELECT r.*, GROUP_CONCAT(p.id) as permissions
      FROM roles r
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      LEFT JOIN permissions p ON rp.permission_id = p.id
      GROUP BY r.id
    `);

    res.json(roles.map(role => ({
      ...role,
      permissions: role.permissions ? role.permissions.split(',').map(Number) : []
    })));
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ message: 'Error fetching roles' });
  }
});

// Get all permissions
app.get('/api/permissions', authenticateToken, async (req, res) => {
  try {
    const permissions = await query(`
      SELECT id, name, display_name, path, icon 
      FROM permissions 
      ORDER BY display_name
    `);
    res.json(permissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ message: 'Error fetching permissions' });
  }
});

// Create new role
app.post('/api/roles', authenticateToken, async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    // Validate required fields
    if (!name || !permissions || !Array.isArray(permissions)) {
      throw new Error('Name and permissions are required');
    }

    // Start transaction
    await query('START TRANSACTION');

    try {
      // Check if role name exists
      const [existingRole] = await query(
        'SELECT id FROM roles WHERE name = ?',
        [name.trim()]
      );

      if (existingRole) {
        throw new Error('Role name already exists');
      }

      // Insert role
      const result = await query(
        'INSERT INTO roles (name, description) VALUES (?, ?)',
        [name.trim(), description?.trim() || '']
      );

      // Insert permissions
      if (permissions.length > 0) {
        const values = permissions.map(p => [result.insertId, p]);
        await query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ?',
          [values]
        );
      }

      await query('COMMIT');

      res.status(201).json({
        message: 'Role created successfully',
        id: result.insertId
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error creating role:', error);
    res.status(400).json({
      message: error.message || 'Error creating role'
    });
  }
});

// Update role
app.put('/api/roles/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;

    // Validate required fields
    if (!name || !permissions || !Array.isArray(permissions)) {
      throw new Error('Name and permissions are required');
    }

    // Start transaction
    await query('START TRANSACTION');

    try {
      // Check if role exists
      const [existingRole] = await query(
        'SELECT name FROM roles WHERE id = ?',
        [id]
      );

      if (!existingRole) {
        throw new Error('Role not found');
      }

      // Prevent modification of Administrator role
      if (existingRole.name === 'Administrator') {
        throw new Error('Cannot modify Administrator role');
      }

      // Check if new name exists for other roles
      const [duplicateName] = await query(
        'SELECT id FROM roles WHERE name = ? AND id != ?',
        [name.trim(), id]
      );

      if (duplicateName) {
        throw new Error('Role name already exists');
      }

      // Update role
      await query(
        'UPDATE roles SET name = ?, description = ?, updated_at = NOW() WHERE id = ?',
        [name.trim(), description?.trim() || '', id]
      );

      // Delete existing permissions
      await query('DELETE FROM role_permissions WHERE role_id = ?', [id]);

      // Insert new permissions
      if (permissions.length > 0) {
        const values = permissions.map(p => [id, p]);
        await query(
          'INSERT INTO role_permissions (role_id, permission_id) VALUES ?',
          [values]
        );
      }

      await query('COMMIT');

      res.json({
        message: 'Role updated successfully',
        id
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error updating role:', error);
    res.status(400).json({
      message: error.message || 'Error updating role'
    });
  }
});

// Add this DELETE endpoint after your other role endpoints
app.delete('/api/roles/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Start transaction
    await query('START TRANSACTION');

    try {
      // Check if role exists and get its name
      const [role] = await query(
        'SELECT name FROM roles WHERE id = ?',
        [id]
      );

      if (!role) {
        throw new Error('Role not found');
      }

      // Prevent deletion of Administrator role
      if (role.name === 'Administrator') {
        throw new Error('Cannot delete Administrator role - it is a system role');
      }

      // Check if role is assigned to any employees
      const [employeeCount] = await query(
        'SELECT COUNT(*) as count FROM employees WHERE role = ?',
        [role.name]
      );

      if (employeeCount.count > 0) {
        throw new Error('Cannot delete: Role is assigned to employees');
      }

      // Delete role permissions first (due to foreign key constraint)
      await query('DELETE FROM role_permissions WHERE role_id = ?', [id]);

      // Delete the role
      await query('DELETE FROM roles WHERE id = ?', [id]);

      await query('COMMIT');

      res.json({ message: 'Role deleted successfully' });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error deleting role:', error);
    res.status(400).json({
      message: error.message || 'Error deleting role'
    });
  }
});

// Add this after your other endpoints, before app.listen()

// Get company settings
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const [settings] = await query('SELECT * FROM company_settings LIMIT 1');

    if (!settings) {
      // Return default settings if none exist
      return res.json({
        name: '',
        phone: '',
        email: '',
        address: '',
        website: '',
        company_logo: null,
        receipt_logo: null,
        favicon: null,
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Error fetching company settings' });
  }
});

// Save/Update company settings
app.post('/api/settings', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      phone,
      email,
      address,
      website,
      company_logo,
      receipt_logo,
      favicon
    } = req.body;

    // Validate required fields
    if (!name || !email) {
      throw new Error('Company name and email are required');
    }

    // Start transaction
    await query('START TRANSACTION');

    try {
      // Check if settings exist
      const [existingSettings] = await query(
        'SELECT id FROM company_settings LIMIT 1'
      );

      let result;
      if (existingSettings) {
        // Update existing settings
        await query(
          `UPDATE company_settings SET 
            name = ?,
            phone = ?,
            email = ?,
            address = ?,
            website = ?,
            company_logo = ?,
            receipt_logo = ?,
            favicon = ?,
            updated_at = NOW()
          WHERE id = ?`,
          [
            name.trim(),
            phone?.trim() || '',
            email.trim(),
            address?.trim() || '',
            website?.trim() || '',
            company_logo || null,
            receipt_logo || null,
            favicon || null,
            existingSettings.id
          ]
        );
        result = existingSettings;
      } else {
        // Insert new settings
        result = await query(
          `INSERT INTO company_settings (
            name, phone, email, address, website,
            company_logo, receipt_logo, favicon,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            name.trim(),
            phone?.trim() || '',
            email.trim(),
            address?.trim() || '',
            website?.trim() || '',
            company_logo || null,
            receipt_logo || null,
            favicon || null
          ]
        );
      }

      await query('COMMIT');

      res.json({
        message: 'Settings saved successfully',
        id: result.id || result.insertId
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(400).json({
      message: error.message || 'Error saving settings'
    });
  }
});

app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const results = await query(
      'SELECT * FROM categories ORDER BY name ASC'
    );
    res.json(results);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Create new category
app.post('/api/categories', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      throw new Error('Category name is required');
    }

    // Check if category exists
    const existing = await query(
      'SELECT id FROM categories WHERE name = ?',
      [name.trim()]
    );

    if (existing.length > 0) {
      throw new Error('Category already exists');
    }

    // Insert category
    const result = await query(
      'INSERT INTO categories (name) VALUES (?)',
      [name.trim()]
    );

    res.status(201).json({
      message: 'Category created successfully',
      id: result.insertId
    });

  } catch (error) {
    console.error('Error creating category:', error);
    res.status(400).json({
      message: error.message || 'Error creating category'
    });
  }
});

// Update category
app.put('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      throw new Error('Category name is required');
    }

    // Check if category exists
    const [existingCategory] = await query(
      'SELECT id FROM categories WHERE id = ?',
      [id]
    );

    if (!existingCategory) {
      throw new Error('Category not found');
    }

    // Check if new name exists for other categories
    const [duplicateName] = await query(
      'SELECT id FROM categories WHERE name = ? AND id != ?',
      [name.trim(), id]
    );

    if (duplicateName) {
      throw new Error('Category name already exists');
    }

    // Update category
    await query(
      'UPDATE categories SET name = ?, updated_at = NOW() WHERE id = ?',
      [name.trim(), id]
    );

    res.json({
      message: 'Category updated successfully',
      id
    });

  } catch (error) {
    console.error('Error updating category:', error);
    res.status(400).json({
      message: error.message || 'Error updating category'
    });
  }
});

// Delete category
app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category exists
    const [category] = await query(
      'SELECT id FROM categories WHERE id = ?',
      [id]
    );

    if (!category) {
      throw new Error('Category not found');
    }


    await query('DELETE FROM categories WHERE id = ?', [id]);

    res.json({
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(400).json({
      message: error.message || 'Error deleting category'
    });
  }
});

// Units Management Routes

// Get all units
app.get('/api/units', authenticateToken, async (req, res) => {
  try {
    const rows = await query('SELECT * FROM units ORDER BY name');

    const response = {
      success: true,
      data: rows || []
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching units:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching units'
    });
  }
});

// Add new unit
app.post('/api/units', authenticateToken, async (req, res) => {
  const { name } = req.body;


  if (!name || name.trim() === '') {
    console.log('Validation failed: Unit name is required');
    return res.status(400).json({
      success: false,
      message: 'Unit name is required'
    });
  }

  try {

    const existingRows = await query('SELECT id FROM units WHERE name = ?', [name]);


    if (existingRows && existingRows.length > 0) {
      console.log('Unit already exists');
      return res.status(400).json({
        success: false,
        message: 'Unit already exists'
      });
    }

    const result = await query('INSERT INTO units (name) VALUES (?)', [name.trim()]);


    const response = {
      success: true,
      message: 'Unit created successfully'
    };

    console.log('Sending response:', response);
    res.status(201).json(response);
  } catch (error) {
    console.error('Error adding unit:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding unit'
    });
  }
});

// Update unit
app.put('/api/units/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Unit name is required'
    });
  }

  try {
    // Check if unit exists
    const [rows] = await query('SELECT * FROM units WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    // Check if new name already exists for another unit
    const [nameRows] = await query('SELECT * FROM units WHERE name = ? AND id != ?', [name, id]);
    if (nameRows && nameRows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Unit name already exists'
      });
    }

    // Update unit
    await query('UPDATE units SET name = ? WHERE id = ?', [name, id]);

    res.json({
      success: true,
      message: 'Unit updated successfully'
    });
  } catch (error) {
    console.error('Error updating unit:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating unit'
    });
  }
});

// Delete unit
app.delete('/api/units/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // Check if unit exists
    const [rows] = await query('SELECT * FROM units WHERE id = ?', [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Unit not found'
      });
    }

    // Delete unit
    await query('DELETE FROM units WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Unit deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting unit:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting unit'
    });
  }
});

// Add new product with branch-specific prices and branch products
app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      product_type,
      category_id,
      unit_id,
      barcode,
      image,
      initial_stock,
      alert_quantity,
      purchase_price,
      branch_prices,
      status
    } = req.body;
    console.log(req.body);
    await query('START TRANSACTION');

    try {
      // Validate required fields
      if (!name || !product_type || !category_id || !unit_id) {
        throw new Error('Required fields missing');
      }

      // Check if the product already exists in the main branch
      const [existingProduct] = await query(
        'SELECT id FROM products WHERE name = ? ',
        [name.trim()]
      );

      let mainProductId;

      if (existingProduct) {
        // Update existing main product
        await query(
          `UPDATE products 
           SET description = ?, 
               product_type = ?, 
               category_id = ?, 
               unit_id = ?, 
               barcode = ?, 
               image = ?, 
               purchase_price = ?,
               alert_quantity = ?, 
               status = ? 
           WHERE id = ?`,
          [
            description?.trim() || '',
            product_type,
            category_id,
            unit_id,
            barcode?.trim() || null,
            image || null,
            purchase_price || 0,
            alert_quantity || 0,
            status || 'Active',
            existingProduct.id
          ]
        );
        mainProductId = existingProduct.id;
      } else {
        // Insert new main product
        const result = await query(
          `INSERT INTO products (
            name, description, product_type, category_id, unit_id,
            barcode, image, initial_stock, alert_quantity,
            purchase_price, stock_quantity, status, is_main_product
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?)`,
          [
            name.trim(),
            description?.trim() || '',
            product_type,
            category_id,
            unit_id,
            barcode?.trim() || null,
            image || null,
            initial_stock || 0,
            alert_quantity || 0,
            purchase_price || 0,
            initial_stock || 0,
            status || 'Active',
            1
          ]
        );
        mainProductId = result.insertId;
      }

      // Handle branch products and prices
      if (branch_prices && branch_prices.length > 0) {
        // Group prices by branch
        const branchGroups = {};
        branch_prices.forEach(bp => {
          if (!branchGroups[bp.branch_id]) {
            branchGroups[bp.branch_id] = [];
          }
          branchGroups[bp.branch_id].push(bp);
        });

        // Process each branch
        for (const branchId in branchGroups) {
          // Skip if it's the main branch
          const [branch] = await query('SELECT name FROM branches WHERE id = ?', [branchId]);
          if (branch.name === 'Main Store') continue;

          // Check if branch product already exists
          const [existingBranchProduct] = await query(
            'SELECT id FROM branch_products WHERE main_product_id = ? AND branch_id = ?',
            [mainProductId, branchId]
          );

          if (!existingBranchProduct) {
            // Insert new branch product only if it doesn't exist
            await query(
              `INSERT INTO branch_products (
                main_product_id, branch_id, stock_quantity,
                alert_quantity, status
              ) VALUES (?, ?, ?, ?, ?)`,
              [
                mainProductId,
                branchId,
                0,
                alert_quantity || 0,
                status || 'Active'
              ]
            );
          }

          // Handle prices for this branch
          const branchPrices = branchGroups[branchId];
          for (const priceData of branchPrices) {
            // Check if price already exists
            const [existingPrice] = await query(
              `SELECT id FROM product_prices 
               WHERE product_id = ? AND branch_id = ? AND price_type_id = ?`,
              [mainProductId, branchId, priceData.price_type_id]
            );

            if (existingPrice) {
              // Update existing price
              await query(
                `UPDATE product_prices 
                 SET price = ? 
                 WHERE id = ?`,
                [priceData.price, existingPrice.id]
              );
            } else {
              // Insert new price
              await query(
                `INSERT INTO product_prices (
                  product_id, branch_id, price_type_id, price
                ) VALUES (?, ?, ?, ?)`,
                [
                  mainProductId,
                  branchId,
                  priceData.price_type_id,
                  priceData.price
                ]
              );
            }
          }
        }
      }

      await query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Product, branch products, and prices updated successfully',
        data: {
          id: mainProductId
        }
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error managing product:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error managing product'
    });
  }
});




app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const products = await query(`
      SELECT 
        p.*,
        c.name as category_name,
        u.name as unit_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE p.is_main_product = 1
      ORDER BY p.created_at DESC
    `);

    res.json({
      success: true,
      data: products
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products'
    });
  }
});


// Get product prices
app.get('/api/products/:id/prices', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const prices = await query(`
      SELECT 
        pp.*, 
        pt.name as price_type_name,
        b.name as branch_name
      FROM product_prices pp
      JOIN price_types pt ON pp.price_type_id = pt.id
      JOIN branches b ON pp.branch_id = b.id
      WHERE pp.product_id = ?
    `, [id]);

    res.json({
      success: true,
      data: prices
    });

  } catch (error) {
    console.error('Error fetching product prices:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product prices'
    });
  }
});

// Get single product with all details
app.get('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    // console.log(id);

    // Get main product details
    const [product] = await query(`
      SELECT 
        p.*,
        c.name as category_name,
        u.name as unit_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE p.id = ?
    `, [id]);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // console.log(product);

    // Get branch products
    const branchProducts = await query(`
      SELECT 
        bp.*,
        b.name as branch_name
      FROM branch_products bp
      JOIN branches b ON bp.branch_id = b.id
      WHERE bp.main_product_id = ?
    `, [id]);

    // Get product prices for all branches
    const prices = await query(`
      SELECT 
        pp.*,
        b.name as branch_name
      FROM product_prices pp
      JOIN branches b ON pp.branch_id = b.id
      WHERE pp.product_id = ?
    `, [id]);

    // Group prices by branch
    const branchPrices = {};
    prices.forEach(price => {
      if (!branchPrices[price.branch_id]) {
        branchPrices[price.branch_id] = [];
      }
      branchPrices[price.branch_id].push({
        price_type: price.price_type,
        price: price.price
      });
    });

    res.json({
      success: true,
      data: {
        ...product,
        branch_products: branchProducts,
        branch_prices: branchPrices
      }
    });

  } catch (error) {
    console.error('Error fetching product details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product details'
    });
  }
});

// Update product
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      product_type,
      category_id,
      unit_id,
      barcode,
      image,
      alert_quantity,
      purchase_price,
      branch_prices,
      status
    } = req.body;
    console.log(req.body);

    await query('START TRANSACTION');

    try {
      // Update main product
      await query(
        `UPDATE products 
         SET name = ?,
             description = ?, 
             product_type = ?, 
             category_id = ?, 
             unit_id = ?, 
             barcode = ?, 
             image = ?, 
             purchase_price = ?,
             alert_quantity = ?, 
             status = ? 
         WHERE id = ?`,
        [
          name.trim(),
          description?.trim() || '',
          product_type,
          category_id,
          unit_id,
          barcode?.trim() || null,
          image || null,
          purchase_price || 0,
          alert_quantity || 0,
          status || 'Active',
          id
        ]
      );

      // Handle branch products and prices
      if (branch_prices && branch_prices.length > 0) {
        // Group prices by branch
        const branchGroups = {};
        branch_prices.forEach(bp => {
          if (!branchGroups[bp.branch_id]) {
            branchGroups[bp.branch_id] = [];
          }
          branchGroups[bp.branch_id].push(bp);
        });

        // Process each branch
        for (const branchId in branchGroups) {
          // Skip if it's the main branch
          const [branch] = await query('SELECT name FROM branches WHERE id = ?', [branchId]);
          if (branch.name === 'Main Store') continue;

          // Check if branch product already exists
          const [existingBranchProduct] = await query(
            'SELECT id FROM branch_products WHERE main_product_id = ? AND branch_id = ?',
            [id, branchId]
          );

          if (!existingBranchProduct) {
            // Insert new branch product only if it doesn't exist
            await query(
              `INSERT INTO branch_products (
                main_product_id, branch_id, stock_quantity,
                alert_quantity, status
              ) VALUES (?, ?, ?, ?, ?)`,
              [
                id,
                branchId,
                0,
                alert_quantity || 0,
                status || 'Active'
              ]
            );
          }

          // Handle prices for this branch
          const branchPrices = branchGroups[branchId];
          for (const priceData of branchPrices) {
            // Check if price already exists
            const [existingPrice] = await query(
              `SELECT id FROM product_prices 
               WHERE product_id = ? AND branch_id = ? AND price_type_id = ?`,
              [id, branchId, priceData.price_type_id]
            );

            if (existingPrice) {
              // Update existing price
              await query(
                `UPDATE product_prices 
                 SET price = ? 
                 WHERE id = ?`,
                [priceData.price, existingPrice.id]
              );
            } else {
              // Insert new price
              await query(
                `INSERT INTO product_prices (
                  product_id, branch_id, price_type_id, price
                ) VALUES (?, ?, ?, ?)`,
                [
                  id,
                  branchId,
                  priceData.price_type_id,
                  priceData.price
                ]
              );
            }
          }
        }
      }

      await query('COMMIT');

      res.json({
        success: true,
        message: 'Product updated successfully'
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating product'
    });
  }
});

// Price Types Management Routes

// Get all price types
app.get('/api/price-types', authenticateToken, async (req, res) => {
  try {
    const priceTypes = await query(`
      SELECT 
        id,
        name,
        description,
        status,
        created_at,
        updated_at
      FROM price_types 
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: priceTypes
    });
  } catch (error) {
    console.error('Error fetching price types:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching price types'
    });
  }
});

// Create new price type
app.post('/api/price-types', authenticateToken, async (req, res) => {
  try {
    const { name, description, status } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      throw new Error('Price type name is required');
    }

    // Start transaction
    await query('START TRANSACTION');

    try {
      // Check if price type with same name exists
      const [existingPriceType] = await query(
        'SELECT id FROM price_types WHERE name = ?',
        [name.trim()]
      );

      if (existingPriceType) {
        throw new Error('Price type with this name already exists');
      }

      // Insert new price type
      const result = await query(
        `INSERT INTO price_types (
          name, description, status, created_at, updated_at
        ) VALUES (?, ?, ?, NOW(), NOW())`,
        [
          name.trim(),
          description?.trim() || '',
          status || 'Active'
        ]
      );

      await query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Price type created successfully',
        data: {
          id: result.insertId
        }
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error creating price type:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating price type'
    });
  }
});

// Update price type
app.put('/api/price-types/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      throw new Error('Price type name is required');
    }

    // Start transaction
    await query('START TRANSACTION');

    try {
      // Check if price type exists
      const [existingPriceType] = await query(
        'SELECT id FROM price_types WHERE id = ?',
        [id]
      );

      if (!existingPriceType) {
        throw new Error('Price type not found');
      }

      // Check if new name conflicts with existing price types
      const [duplicateName] = await query(
        'SELECT id FROM price_types WHERE name = ? AND id != ?',
        [name.trim(), id]
      );

      if (duplicateName) {
        throw new Error('Price type with this name already exists');
      }

      // Update price type
      await query(
        `UPDATE price_types 
         SET name = ?,
             description = ?,
             status = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [
          name.trim(),
          description?.trim() || '',
          status || 'Active',
          id
        ]
      );

      await query('COMMIT');

      res.json({
        success: true,
        message: 'Price type updated successfully'
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error updating price type:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating price type'
    });
  }
});

// Delete price type
app.delete('/api/price-types/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Start transaction
    await query('START TRANSACTION');

    try {
      // Check if price type exists
      const [existingPriceType] = await query(
        'SELECT id FROM price_types WHERE id = ?',
        [id]
      );

      if (!existingPriceType) {
        throw new Error('Price type not found');
      }

      // Check if price type is being used in product_prices
      const [usedInProducts] = await query(
        'SELECT COUNT(*) as count FROM product_prices WHERE price_type_id = ?',
        [id]
      );

      if (usedInProducts.count > 0) {
        throw new Error('Cannot delete price type as it is being used by products');
      }

      // Delete price type
      await query('DELETE FROM price_types WHERE id = ?', [id]);

      await query('COMMIT');

      res.json({
        success: true,
        message: 'Price type deleted successfully'
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error deleting price type:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error deleting price type'
    });
  }
});

// Get single price type
app.get('/api/price-types/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [priceType] = await query(
      `SELECT 
        id, name, description, status,
        created_at, updated_at
       FROM price_types 
       WHERE id = ?`,
      [id]
    );

    if (!priceType) {
      return res.status(404).json({
        success: false,
        message: 'Price type not found'
      });
    }

    res.json({
      success: true,
      data: priceType
    });

  } catch (error) {
    console.error('Error fetching price type:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching price type'
    });
  }
});


app.post('/api/products/update-price', authenticateToken, async (req, res) => {
  try {
    const { prices } = req.body;

    if (!Array.isArray(prices) || prices.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid prices data' });
    }

    await query('START TRANSACTION');

    try {

      // load the branch id from the branch name
      const [branchId_main] = await query('SELECT id FROM branches WHERE name = ?', [prices[0].branch_id]);
      if (!branchId_main) {
        return res.status(404).json({ success: false, message: 'Branch not found' });
      }
      console.log(branchId_main.id + " branchId_main");
      for (const priceUpdate of prices) {

        const { product_id, branch_id, price_type_id, price } = priceUpdate;
        if (!product_id || !price_type_id || price === undefined) {
          throw new Error('Missing required price update fields');
        }

        const [existingPrice] = await query(
          `SELECT id FROM product_prices WHERE product_id = ? AND branch_id = ? AND price_type_id = ?`,
          [product_id, branchId_main.id, price_type_id]
        );

        if (existingPrice) {
          await query(
            `UPDATE product_prices SET price = ?, updated_at = NOW() WHERE id = ?`,
            [price, existingPrice.id]
          );
        } else {
          await query(
            `INSERT INTO product_prices (product_id, branch_id, price_type_id, price, created_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())`,
            [product_id, branchId_main.id, price_type_id, price]
          );
        }
      }

      await query('COMMIT');

      res.json({ success: true, message: 'Prices updated successfully' });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating product prices:', error);
    res.status(500).json({ success: false, message: 'Error updating product prices' });
  }
});


app.get('/api/branch-products', authenticateToken, async (req, res) => {
  try {
    const branchId = req.query.branch_id;
    if (!branchId) {
      return res.status(400).json({ success: false, message: 'branch_id is required' });
    }

    const [branch] = await query('SELECT id FROM branches WHERE name = ?', [branchId]);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }
    const branch_main_id = branch.id;

    const products = await query(
      `SELECT 
        p.id,
        p.name,
        p.barcode,
        p.description,
        p.product_type,
        p.image,
        p.purchase_price,
        p.status,
        c.name as category_name,
        u.name as unit_name,
        bp.stock_quantity,
        bp.alert_quantity,
        bp.status as branch_status
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN units u ON p.unit_id = u.id
      JOIN branch_products bp ON bp.main_product_id = p.id
      WHERE bp.branch_id = ? AND p.is_main_product = 1
      ORDER BY p.name ASC`,
      [branch_main_id]
    );

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error fetching branch products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching branch products'
    });
  }
});

// Add new endpoint for updating low stock level
app.put('/api/branch-products/:id/alert-quantity', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { alert_quantity, branch_id } = req.body;

    if (!alert_quantity || alert_quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid alert quantity is required'
      });
    }

    // Get branch ID from name
    const [branch] = await query('SELECT id FROM branches WHERE name = ?', [branch_id]);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    // Update alert quantity
    await query(
      `UPDATE branch_products 
       SET alert_quantity = ? 
       WHERE main_product_id = ? AND branch_id = ?`,
      [alert_quantity, id, branch.id]
    );

    res.json({
      success: true,
      message: 'Alert quantity updated successfully'
    });

  } catch (error) {
    console.error('Error updating alert quantity:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating alert quantity'
    });
  }
});

app.get('/api/employees/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const [employee] = await query('SELECT  branch FROM employees WHERE id = ?', [id]);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching employee' });
  }
});




app.get('/api/product/load-product-prices', async (req, res) => {
  try {
    console.log(req.query);

    const branch_id = await query('SELECT id FROM branches WHERE name = ?', [req.query.branch_id]);
    console.log("branch_id: " + branch_id[0].id);

    const prices = await query('SELECT price_type_id, price FROM product_prices WHERE product_id = ? AND branch_id = ?', [req.query.product_id, branch_id[0].id]);

    if (prices.length === 0) {
      console.log("prices not found");
      throw new Error('Prices not found');
    } else {
      console.log("prices found");
      console.log("prices length: " + prices.length);
    }


    res.json({ success: true, data: prices });

  } catch (error) {
    console.error('Error loading product prices:', error);
    res.status(500).json({ success: false, message: 'Error loading product prices' });
  }

});

// Supplier Endpoints
app.get('/api/suppliers', authenticateToken, async (req, res) => {
  try {
    const results = await query(
      `SELECT id, name, contact, email, phone, address, isActive 
       FROM suppliers 
       ORDER BY name ASC`
    );
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ success: false, message: 'Error fetching suppliers' });
  }
});

app.post('/api/suppliers', authenticateToken, async (req, res) => {
  try {
    const { name, contact, email, phone, address, isActive } = req.body;

    // Validate required fields
    if (!name || !contact) {
      throw new Error('Name, contact person are required');
    }

    // Start transaction
    await query('START TRANSACTION');

    try {
      // Check if supplier with same email exists
      const existing = await query(
        'SELECT id FROM suppliers WHERE email = ?',
        [email]
      );

      if (existing.length > 0) {
        throw new Error('Supplier with this email already exists');
      }

      const result = await query(
        `INSERT INTO suppliers (
          name, contact, email, phone, address, isActive, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [name, contact, email, phone, address || '', isActive]
      );

      await query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Supplier created successfully',
        data: { id: result.insertId }
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating supplier'
    });
  }
});

app.put('/api/suppliers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, email, phone, address, isActive } = req.body;

    // Validate required fields
    if (!name || !contact) {
      throw new Error('Name, contact person are required');
    }

    // Start transaction
    await query('START TRANSACTION');

    try {
      // Check if email exists for other suppliers
      const existing = await query(
        'SELECT id FROM suppliers WHERE email = ? AND id != ?',
        [email, id]
      );

      if (existing.length > 0) {
        throw new Error('Email already exists for another supplier');
      }

      await query(
        `UPDATE suppliers 
         SET name = ?, 
             contact = ?, 
             email = ?, 
             phone = ?, 
             address = ?,
             isActive = ?,
             updated_at = NOW()
         WHERE id = ?`,
        [name, contact, email, phone, address || '', isActive, id]
      );

      await query('COMMIT');

      res.json({
        success: true,
        message: 'Supplier updated successfully'
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error updating supplier:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating supplier'
    });
  }
});

app.delete('/api/suppliers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Start transaction
    await query('START TRANSACTION');

    try {


      await query('DELETE FROM suppliers WHERE id = ?', [id]);

      await query('COMMIT');

      res.json({
        success: true,
        message: 'Supplier deleted successfully'
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error deleting supplier:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error deleting supplier'
    });
  }
});

// Get single supplier
app.get('/api/suppliers/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const [supplier] = await query(
      `SELECT id, name, contact, email, phone, address, isActive
       FROM suppliers 
       WHERE id = ?`,
      [id]
    );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found'
      });
    }

    res.json({
      success: true,
      data: supplier
    });

  } catch (error) {
    console.error('Error fetching supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching supplier'
    });
  }
});

// Helper function to generate receipt number
const generateReceiptNumber = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');

  // Get count of receipts for today
  const [result] = await query(
    `SELECT COUNT(*) as count 
     FROM purchases 
     WHERE DATE(created_at) = CURDATE()`
  );

  const count = (result.count + 1).toString().padStart(4, '0');
  return `RCP${year}${month}${day}${count}`;
};

// Purchase Endpoints

// Get all purchases with supplier and items
app.get('/api/purchases', authenticateToken, async (req, res) => {
  try {
    const purchases = await query(`
      SELECT 
        p.*,
        s.name as supplier_name,
        pr.name as product_name,
        pr.barcode,
        u.name as unit_name,
        DATE_FORMAT(p.purchase_date, '%Y-%m-%d') as date,
        DATE_FORMAT(p.expiry_date, '%Y-%m-%d') as expiry_date
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      JOIN products pr ON p.product_id = pr.id
      LEFT JOIN units u ON pr.unit_id = u.id
      ORDER BY p.purchase_date DESC, p.created_at DESC
    `);

    res.json({
      success: true,
      data: purchases
    });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching purchases'
    });
  }
});

// Get single purchase with items
app.get('/api/purchases/:receipt', authenticateToken, async (req, res) => {
  try {
    const { receipt } = req.params;

    const [purchase] = await query(`
      SELECT 
        p.*,
        s.name as supplier_name,
        DATE_FORMAT(p.purchase_date, '%Y-%m-%d') as date
      FROM purchases p
      JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.receipt_number = ?
    `, [receipt]);

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found'
      });
    }

    // Get items for this purchase
    const items = await query(`
      SELECT 
        pi.*,
        pr.name as product_name,
        pr.barcode,
        u.name as unit_name,
        DATE_FORMAT(pi.expiry_date, '%Y-%m-%d') as expiry_date
      FROM purchase_items pi
      JOIN products pr ON pi.product_id = pr.id
      LEFT JOIN units u ON pr.unit_id = u.id
      WHERE pi.purchase_id = ?
    `, [purchase.id]);

    purchase.items = items;

    res.json({
      success: true,
      data: purchase
    });

  } catch (error) {
    console.error('Error fetching purchase:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error fetching purchase'
    });
  }
});

// Create new purchase with items
app.post('/api/purchases', authenticateToken, async (req, res) => {
  try {
    const {
      supplier_id,
      purchase_date,
      status,
      mode,
      payment_mode,
      notes,
      items
    } = req.body;

    // Validate required fields
    if (!supplier_id || !purchase_date || !status || !mode || !items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Required fields missing');
    }

    // Start transaction
    await query('START TRANSACTION');

    try {
      for (const item of items) {

        let receipt_number;
        let isUnique = false;
        while (!isUnique) {
          receipt_number = await generateReceiptNumber();
          const [existing] = await query(
            'SELECT id FROM purchases WHERE receipt_number = ?',
            [receipt_number]
          );
          isUnique = !existing;
        }


        if (item.expiry_date) {
          const expiryDate = new Date(item.expiry_date);
          const today = new Date();

          if (expiryDate <= today) {
            throw new Error('Expiry date must be in the future');
          }

          // Check if expiry date already exists for this product
          const [existingExpiry] = await query(
            'SELECT id FROM expiry_dates WHERE product_id = ? AND expiry_date = ?',
            [item.product_id, item.expiry_date]
          );

          // If no existing expiry date, insert it
          if (!existingExpiry) {
            await query(
              'INSERT INTO expiry_dates (product_id, expiry_date, receipt_number, created_at) VALUES (?, ?, ?, NOW())',
              [item.product_id, item.expiry_date, receipt_number]
            );
          }
        }

        // Insert purchase record
        await query(
          `INSERT INTO purchases (
            receipt_number, supplier_id, purchase_date,
            status, mode, payment_mode, notes, 
            product_id, quantity, purchase_price, expiry_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            receipt_number,
            supplier_id,
            purchase_date,
            status,
            mode,
            mode === 'Paid' ? payment_mode : null,
            notes || '',
            item.product_id,
            item.quantity,
            item.price,
            item.expiry_date || null
          ]
        );


        if (status === 'Received') {
          await query(
            `UPDATE products 
             SET stock_quantity = stock_quantity + ? 
             WHERE id = ?`,
            [item.quantity, item.product_id]
          );
        }
      }

      await query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Purchase created successfully'
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error creating purchase:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating purchase'
    });
  }
});

// Update purchase status
app.put('/api/purchases/:receipt/status', authenticateToken, async (req, res) => {
  try {
    const { receipt } = req.params;
    const { status } = req.body;

    if (!status || !['Received', 'Ordered', 'Pending'].includes(status)) {
      throw new Error('Invalid status');
    }

    // Start transaction
    await query('START TRANSACTION');

    try {
      // Get current purchase info
      const [purchase] = await query(
        'SELECT id, status, product_id, quantity FROM purchases WHERE receipt_number = ?',
        [receipt]
      );

      if (!purchase) {
        throw new Error('Purchase not found');
      }

      // Validate status transitions
      const validTransitions = {
        'Pending': ['Received'],
        'Ordered': ['Received'],
        'Received': [] // Cannot change from Received
      };

      if (!validTransitions[purchase.status]?.includes(status)) {
        throw new Error(`Cannot change status from ${purchase.status} to ${status}`);
      }

      // Update purchase status
      await query(
        'UPDATE purchases SET status = ? WHERE receipt_number = ?',
        [status, receipt]
      );

      // Handle stock updates
      if (status === 'Received' && purchase.status !== 'Received') {
        // Increase stock when changing to Received
        await query(
          `UPDATE products 
           SET stock_quantity = stock_quantity + ? 
           WHERE id = ?`,
          [purchase.quantity, purchase.product_id]
        );
      }

      await query('COMMIT');

      res.json({
        success: true,
        message: 'Purchase status updated successfully'
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error updating purchase status:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating purchase status'
    });
  }
});

// Delete purchase
app.delete('/api/purchases/:receipt', authenticateToken, async (req, res) => {
  try {
    const { receipt } = req.params;

    // Start transaction
    await query('START TRANSACTION');

    try {
      // Get purchase info
      const [purchase] = await query(
        'SELECT id, status, product_id, quantity FROM purchases WHERE receipt_number = ?',
        [receipt]
      );

      if (!purchase) {
        throw new Error('Purchase not found');
      }

      // Validate deletion based on status
      if (purchase.status === 'Pending') {
        throw new Error('Cannot delete a pending purchase');
      }

      // If purchase was received, revert stock quantities
      if (purchase.status === 'Received') {
        // Check if there's enough stock to revert
        const [product] = await query(
          'SELECT stock_quantity FROM products WHERE id = ?',
          [purchase.product_id]
        );

        if (product.stock_quantity < purchase.quantity) {
          throw new Error('Cannot delete: Insufficient stock to revert. Some items may have been sold.');
        }

        // Decrease stock
        await query(
          `UPDATE products 
           SET stock_quantity = stock_quantity - ? 
           WHERE id = ?`,
          [purchase.quantity, purchase.product_id]
        );
      }

      // Delete purchase
      await query('DELETE FROM purchases WHERE receipt_number = ?', [receipt]);

      await query('COMMIT');

      res.json({
        success: true,
        message: 'Purchase deleted successfully'
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error deleting purchase:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error deleting purchase'
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});

// Stock Transfer Endpoints

// Get all stock transfers
app.get('/api/stock-transfers', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, status, branch } = req.query;

    let whereClause = '1=1';
    const queryParams = [];

    // Add date range filter
    if (startDate && endDate) {
      whereClause += ' AND st.transfer_date BETWEEN ? AND ?';
      queryParams.push(startDate, endDate);
    }

    // Add status filter
    if (status && status !== 'All') {
      whereClause += ' AND st.status = ?';
      queryParams.push(status);
    }

    // Add branch filter
    if (branch && branch !== 'All') {
      whereClause += ' AND b.name = ?';
      queryParams.push(branch);
    }

    const transfers = await query(`
      SELECT 
        st.*,
        b.name as branch_name,
        p.name as product_name,
        p.barcode,
        u.name as unit_name,
        DATE_FORMAT(st.transfer_date, '%Y-%m-%d') as formatted_date
      FROM stock_transfers st
      JOIN branches b ON st.to_branch_id = b.id
      JOIN products p ON st.product_id = p.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE ${whereClause}
      ORDER BY st.created_at DESC
    `, queryParams);

    // Get summary statistics
    const stats = {
      totalTransfers: transfers.length,
      pendingCount: transfers.filter(t => t.status === 'Pending').length,
      receivedCount: transfers.filter(t => t.status === 'Received').length,
      totalQuantity: transfers.reduce((sum, t) => sum + t.quantity, 0)
    };

    res.json({
      success: true,
      data: transfers,
      stats
    });
  } catch (error) {
    console.error('Error fetching stock transfers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching stock transfers'
    });
  }
});

// Get single stock transfer
app.get('/api/stock-transfers/:reference', authenticateToken, async (req, res) => {
  try {
    const { reference } = req.params;

    const [transfer] = await query(`
      SELECT 
        st.*,
        b.name as branch_name,
        p.name as product_name,
        p.barcode,
        u.name as unit_name,
        DATE_FORMAT(st.transfer_date, '%Y-%m-%d') as formatted_date
      FROM stock_transfers st
      JOIN branches b ON st.to_branch_id = b.id
      JOIN products p ON st.product_id = p.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE st.reference_number = ?
    `, [reference]);

    if (!transfer) {
      return res.status(404).json({
        success: false,
        message: 'Stock transfer not found'
      });
    }

    res.json({
      success: true,
      data: transfer
    });

  } catch (error) {
    console.error('Error fetching stock transfer:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error fetching stock transfer'
    });
  }
});

// Create new stock transfer
app.post('/api/stock-transfers', authenticateToken, async (req, res) => {
  try {
    const {
      branch_id,
      transfer_date,
      notes,
      status,
      items
    } = req.body;
    console.log(req.body);


    // Validate required fields
    if (!branch_id || !transfer_date || !items || !Array.isArray(items) || items.length === 0) {
      throw new Error('Required fields missing');
    }



    // Start transaction
    await query('START TRANSACTION');

    try {
      // Generate unique reference number
      let reference_number;
      let isUnique = false;
      while (!isUnique) {
        reference_number = 'ST' + Math.random().toString(36).substr(2, 8).toUpperCase();
        const [existing] = await query(
          'SELECT id FROM stock_transfers WHERE reference_number = ?',
          [reference_number]
        );
        isUnique = !existing;
      }

      for (const item of items) {
        const { product_id, quantity } = item;

        // Check if product exists in source branch with sufficient stock
        const [sourceStock] = await query(
          `SELECT stock_quantity 
           FROM products 
           WHERE id = ?`,
          [product_id]
        );

        if (!sourceStock || sourceStock.stock_quantity < quantity) {
          throw new Error(`Insufficient stock for product ID ${product_id}`);
        }

        // Insert stock transfer record
        await query(
          `INSERT INTO stock_transfers (
            reference_number, from_branch_id, to_branch_id,
            transfer_date, notes, product_id, quantity
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            reference_number,
            branch_id,
            branch_id,
            transfer_date,
            notes || '',
            product_id,
            quantity
          ]
        );

        // If status is Received, update stock quantities
        if (status === 'Received') {
          // Deduct from source branch
          await query(
            `UPDATE products 
             SET stock_quantity = stock_quantity - ? 
             WHERE id = ?`,
            [quantity, product_id]
          );

          // Add to destination branch
          await query(
            `UPDATE branch_products 
             SET stock_quantity = stock_quantity + ? 
             WHERE main_product_id = ? AND branch_id = ?`,
            [quantity, product_id, branch_id]
          );
        }
      }

      await query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Stock transfer created successfully',

      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error creating stock transfer:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating stock transfer'
    });
  }
});

// Update stock transfer status
app.put('/api/stock-transfers/:reference/status', authenticateToken, async (req, res) => {
  try {
    const { reference } = req.params;
    const { status } = req.body;
  
    if (!status || !['Received'].includes(status)) {
      throw new Error('Invalid status');
    }

    // Start transaction
    await query('START TRANSACTION');

    try {
      // Get current transfer info
      const transfers = await query(
        `SELECT * FROM stock_transfers WHERE id = ?`,
        [reference]
      );

      if (transfers.length === 0) {
        throw new Error('Stock transfer not found');
      }

      // Validate status transition
      if (transfers[0].status === 'Received') {
        throw new Error('Transfer is already received');
      }

      // Update transfer status
      await query(
        'UPDATE stock_transfers SET status = ? WHERE id = ?',
        [status, reference]
      );

      // Process each product in the transfer
      for (const transfer of transfers) {

        await query(
          `UPDATE products 
           SET stock_quantity = stock_quantity - ? 
           WHERE id = ?`,
          [transfer.quantity, transfer.product_id]
        );

        // Add to destination branch
        await query(
          `UPDATE branch_products 
           SET stock_quantity = stock_quantity + ? 
           WHERE main_product_id = ? AND branch_id = ?`,
          [transfer.quantity, transfer.product_id, transfer.to_branch_id]
        );
      }

      await query('COMMIT');

      res.json({
        success: true,
        message: 'Stock transfer status updated successfully'
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error updating stock transfer status:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating stock transfer status'
    });
  }
});

// Delete stock transfer
app.delete('/api/stock-transfers/:reference', authenticateToken, async (req, res) => {
  try {
    const { reference } = req.params;

    // Start transaction
    await query('START TRANSACTION');

    try {
      // Get transfer info
      const [transfer] = await query(
        'SELECT * FROM stock_transfers WHERE reference_number = ?',
        [reference]
      );

      if (!transfer) {
        throw new Error('Stock transfer not found');
      }

      // Can only delete pending transfers
      if (transfer.status !== 'Pending') {
        throw new Error('Cannot delete a received transfer');
      }

      // Restore stock to source branch
      await query(
        `UPDATE branch_products 
         SET stock_quantity = stock_quantity + ? 
         WHERE main_product_id = ? AND branch_id = ?`,
        [transfer.quantity, transfer.product_id, transfer.from_branch_id]
      );

      // Delete transfer
      await query('DELETE FROM stock_transfers WHERE reference_number = ?', [reference]);

      await query('COMMIT');

      res.json({
        success: true,
        message: 'Stock transfer deleted successfully'
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error deleting stock transfer:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error deleting stock transfer'
    });
  }
});
