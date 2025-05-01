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

app.use(cors());
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

      // Commit transaction
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



app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
