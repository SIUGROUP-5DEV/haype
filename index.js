import express from 'express';

import cors from 'cors'
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = process.env.PORT || 5009;
const JWT_SECRET = process.env.JWT_SECRET || 'haype-system-secret-key-2025';

// MongoDB connection string
const MONGO_URI = 'mongodb+srv://milgo:2366@cluster0.u8hg6b7.mongodb.net/Haype?retryWrites=true&w=majority&appName=Cluster0';


// Middleware
app.use(cors({
  origin: ['http://localhost:', 'https://heybe-construction-system.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}))





app.use(express.json());

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB Atlas');
    console.log('📊 Database: Haype');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// MongoDB Schemas
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'Operator', enum: ['Administrator', 'Manager', 'Operator'] },
  status: { type: String, default: 'Active', enum: ['Active', 'Inactive'] },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const employeeSchema = new mongoose.Schema({
  employeeName: { type: String, required: true },
  phoneNumber: { type: String },
  category: { type: String, required: true, enum: ['driver', 'kirishboy'] },
  balance: { type: Number, default: 0 },
  status: { type: String, default: 'Active', enum: ['Active', 'Inactive', 'Closed'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const carSchema = new mongoose.Schema({
  carName: { type: String, required: true },
  numberPlate: { type: String, required: true, unique: true },
  driverName: { type: String }, // Changed to text field
  kirishboyName: { type: String }, // Changed to text field
  balance: { type: Number, default: 0 },
  status: { type: String, default: 'Active', enum: ['Active', 'Maintenance', 'Closed'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const itemSchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const customerSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  phoneNumber: { type: String },
  balance: { type: Number, default: 0 },
  status: { type: String, default: 'Active', enum: ['Active', 'Inactive', 'Closed'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const invoiceItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  description: { type: String },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
  leftAmount: { type: Number, default: 0 },
  paymentMethod: { type: String, default: 'cash', enum: ['cash', 'credit'] }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNo: { type: String, required: true, unique: true },
  carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car', required: true },
  invoiceDate: { type: Date, required: true },
  items: [invoiceItemSchema],
  total: { type: Number, default: 0 },
  totalLeft: { type: Number, default: 0 },
  // totalProfit: { type: Number, default: 0 },
  status: { type: String, default: 'Active', enum: ['Active', 'Cancelled'] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const paymentSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['receive', 'payment_out', 'balance_add', 'balance_deduct'] },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  carId: { type: mongoose.Schema.Types.ObjectId, ref: 'Car' },
  paymentNo: { type: String,  }, 
  amount: { type: Number, required: true },
  description: { type: String },
  paymentDate: { type: Date, required: true },
  accountMonth: { type: String },
  balanceAfter: { type: Number }, // Track balance after transaction
  createdAt: { type: Date, default: Date.now }
});

// Create Models
const User = mongoose.model('User', userSchema);
const Employee = mongoose.model('Employee', employeeSchema);
const Car = mongoose.model('Car', carSchema);
const Item = mongoose.model('Item', itemSchema);
const Customer = mongoose.model('Customer', customerSchema);
const Invoice = mongoose.model('Invoice', invoiceSchema);
const Payment = mongoose.model('Payment', paymentSchema);

// Initialize only admin user
async function initializeAdminUser() {
  try {
    // Create default admin user only
    const adminExists = await User.findOne({ email: 'admin@haype.com' });
    if (!adminExists) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await User.create({
        username: 'admin',
        email: 'admin@haype.com',
        password: hashedPassword,
        role: 'Administrator',
        status: 'Active'
      });
      console.log('✅ Default admin user created');
      console.log('🔐 Login: admin@haype.com / admin123');
    } else {
      console.log('✅ Admin user already exists');
    }

    console.log('🎉 Database initialization completed');
  } catch (error) {
    console.error('❌ Error initializing admin user:', error);
  }
}

// Initialize admin user after connection
mongoose.connection.once('open', () => {
  initializeAdminUser();
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await User.findOne({ email, status: 'Active' });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValidPassword = bcrypt.compareSync(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        username: user.username,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    await User.findByIdAndUpdate(user._id, { 
      lastLogin: new Date(),
      updatedAt: new Date()
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', authenticateToken, async (req, res) => {
  try {
    const { username, email, password, role = 'Operator' } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    // Check if user has permission to create users
    if (req.user.role !== 'Administrator') {
      return res.status(403).json({ error: 'Only administrators can create users' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role
    });

    res.json({
      success: true,
      message: 'User created successfully',
      userId: newUser._id
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected route to verify token
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// Cars Routes
app.get('/api/cars', authenticateToken, async (req, res) => {
  try {
    const cars = await Car.find().sort({ createdAt: -1 });
    res.json(cars);
  } catch (error) {
    console.error('Get cars error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/cars', authenticateToken, async (req, res) => {
  try {
    const { carName, numberPlate, driverName, kirishboyName, balance = 0 } = req.body;

    if (!carName || !numberPlate) {
      return res.status(400).json({ error: 'Car name and number plate are required' });
    }

    const newCar = await Car.create({
      carName,
      numberPlate,
      driverName: driverName || '',
      kirishboyName: kirishboyName || '',
      balance
    });

    res.json({
      success: true,
      message: 'Car created successfully',
      carId: newCar._id
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Number plate already exists' });
    }
    console.error('Create car error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/cars/:id', authenticateToken, async (req, res) => {
  try {
    const car = await Car.findById(req.params.id);
    
    if (!car) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    res.json(car);
  } catch (error) {
    console.error('Get car error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/cars/:id', authenticateToken, async (req, res) => {
  try {
    const updatedCar = await Car.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    
    if (!updatedCar) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    res.json({
      success: true,
      message: 'Car updated successfully',
      car: updatedCar
    });
  } catch (error) {
    console.error('Update car error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/cars/:id', authenticateToken, async (req, res) => {
  try {
    const deletedCar = await Car.findByIdAndDelete(req.params.id);
    
    if (!deletedCar) {
      return res.status(404).json({ error: 'Car not found' });
    }
    
    res.json({
      success: true,
      message: 'Car deleted successfully'
    });
  } catch (error) {
    console.error('Delete car error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Employees Routes
app.get('/api/employees', authenticateToken, async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/employees', authenticateToken, async (req, res) => {
  try {
    const { employeeName, phoneNumber, category, balance = 0 } = req.body;

    if (!employeeName || !category) {
      return res.status(400).json({ error: 'Employee name and category are required' });
    }

    const newEmployee = await Employee.create({
      employeeName,
      phoneNumber,
      category,
      balance
    });

    res.json({
      success: true,
      message: 'Employee created successfully',
      employeeId: newEmployee._id
    });
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/employees/:id', authenticateToken, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/employees/:id', authenticateToken, async (req, res) => {
  try {
    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    
    if (!updatedEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json({
      success: true,
      message: 'Employee updated successfully',
      employee: updatedEmployee
    });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/employees/:id', authenticateToken, async (req, res) => {
  try {
    const deletedEmployee = await Employee.findByIdAndDelete(req.params.id);
    
    if (!deletedEmployee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json({
      success: true,
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Employee Balance Management Routes
app.post('/api/employees/:id/add-balance', authenticateToken, async (req, res) => {
  try {
    const { amount, date, description } = req.body;
    const employeeId = req.params.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (!date || !description) {
      return res.status(400).json({ error: 'Date and description are required' });
    }

    // Get current employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Calculate new balance
    const newBalance = (employee.balance || 0) + parseFloat(amount);

    // Update employee balance
    await Employee.findByIdAndUpdate(employeeId, {
      balance: newBalance,
      updatedAt: new Date()
    });

    // Generate unique payment number for balance transaction
    const paymentCount = await Payment.countDocuments();
    const paymentNo = `BAL-${String(paymentCount + 1).padStart(4, '0')}`;

    // Record transaction
    await Payment.create({
      type: 'balance_add',
      employeeId: employeeId,
      paymentNo: paymentNo,
      amount: parseFloat(amount),
      description: description,
      paymentDate: new Date(date),
      balanceAfter: newBalance
    });

    res.json({
      success: true,
      message: 'Balance added successfully',
      newBalance: newBalance
    });
  } catch (error) {
    console.error('Add balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/employees/:id/deduct-balance', authenticateToken, async (req, res) => {
  try {
    const { amount, date, description } = req.body;
    const employeeId = req.params.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (!date || !description) {
      return res.status(400).json({ error: 'Date and description are required' });
    }

    // Get current employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Calculate new balance
    const newBalance = (employee.balance || 0) - parseFloat(amount);

    // Update employee balance
    await Employee.findByIdAndUpdate(employeeId, {
      balance: newBalance,
      updatedAt: new Date()
    });

    // Generate unique payment number for balance transaction
    const paymentCount = await Payment.countDocuments();
    const paymentNo = `BAL-${String(paymentCount + 1).padStart(4, '0')}`;

    // Record transaction
    await Payment.create({
      type: 'balance_deduct',
      employeeId: employeeId,
      paymentNo: paymentNo,
      amount: parseFloat(amount),
      description: description,
      paymentDate: new Date(date),
      balanceAfter: newBalance
    });

    res.json({
      success: true,
      message: 'Balance deducted successfully',
      newBalance: newBalance
    });
  } catch (error) {
    console.error('Deduct balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// NEW: Get employee payment history
app.get('/api/employees/:id/payment-history', authenticateToken, async (req, res) => {
  try {
    const employeeId = req.params.id;
    
    const payments = await Payment.find({
      employeeId: employeeId,
      type: { $in: ['balance_add', 'balance_deduct', 'payment_out'] }
    }).sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Items Routes
app.get('/api/items', authenticateToken, async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/items', authenticateToken, async (req, res) => {
  try {
    const { itemName, price } = req.body;

    if (!itemName) {
      return res.status(400).json({ error: 'Item name and price are required' });
    }

    const newItem = await Item.create({
      itemName,
      
    });

    res.json({
      success: true,
      message: 'Item created successfully',
      itemId: newItem._id
    });
  } catch (error) {
    console.error('Create item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/items/:id', authenticateToken, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/items/:id', authenticateToken, async (req, res) => {
  try {
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    
    if (!updatedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({
      success: true,
      message: 'Item updated successfully',
      item: updatedItem
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/items/:id', authenticateToken, async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    
    if (!deletedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Delete item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Customers Routes
app.get('/api/customers', authenticateToken, async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.json(customers);
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/customers', authenticateToken, async (req, res) => {
  try {
    const { customerName, phoneNumber, balance = 0 } = req.body;

    if (!customerName) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    const newCustomer = await Customer.create({
      customerName,
      phoneNumber,
      balance
    });

    res.json({
      success: true,
      message: 'Customer created successfully',
      customerId: newCustomer._id
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const updatedCustomer = await Customer.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    
    if (!updatedCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({
      success: true,
      message: 'Customer updated successfully',
      customer: updatedCustomer
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/customers/:id', authenticateToken, async (req, res) => {
  try {
    const deletedCustomer = await Customer.findByIdAndDelete(req.params.id);
    
    if (!deletedCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Invoices Routes
app.get('/api/invoices', authenticateToken, async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .populate('carId', 'carName')
      .populate('items.itemId', 'itemName')
      .populate('items.customerId', 'customerName')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/invoices', authenticateToken, async (req, res) => {
  try {
    const { invoiceNo, carId, invoiceDate, items } = req.body;

    if (!invoiceNo || !carId || !invoiceDate || !items || items.length === 0) {
      return res.status(400).json({ error: 'Invoice number, car, date, and items are required' });
    }

    // Calculate totals
    const total = items.reduce((sum, item) => sum + item.total, 0);
    const totalLeft = items.reduce((sum, item) => sum + item.leftAmount, 0);
    // const totalProfit = (total - totalLeft) * 0.2; // 20% profit on paid amount

    const newInvoice = await Invoice.create({
      invoiceNo,
      carId,
      invoiceDate,
      items,
      total,
      totalLeft,
      // totalProfit
    });

    res.json({
      success: true,
      message: 'Invoice created successfully',
      invoiceId: newInvoice._id
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Invoice number already exists' });
    }
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/invoices/:id', authenticateToken, async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('carId', 'carName')
      .populate('items.itemId', 'itemName')
      .populate('items.customerId', 'customerName');
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/invoices/:id', authenticateToken, async (req, res) => {
  try {
    const updatedInvoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    
    if (!updatedInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json({
      success: true,
      message: 'Invoice updated successfully',
      invoice: updatedInvoice
    });
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/invoices/:id', authenticateToken, async (req, res) => {
  try {
    const deletedInvoice = await Invoice.findByIdAndDelete(req.params.id);
    
    if (!deletedInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Delete invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Payments Routes
app.post('/api/payments/receive', authenticateToken, async (req, res) => {
  try {
    const { customerId, paymentNo, amount, description, paymentDate } = req.body;

    if (!customerId || !amount || !paymentDate) {
      return res.status(400).json({ error: 'Customer, amount, and payment date are required' });
    }

    // Generate payment number if not provided
    let finalPaymentNo = paymentNo;
    if (!finalPaymentNo) {
      const paymentCount = await Payment.countDocuments();
      finalPaymentNo = `PYN-${String(paymentCount + 1).padStart(4, '0')}`;
    }

    const newPayment = await Payment.create({
      type: 'receive',
      customerId,
      paymentNo: finalPaymentNo,
      amount,
      description,
      paymentDate
    });

  

    // Update customer balance
    await Customer.findByIdAndUpdate(customerId, {
      $inc: { balance: -amount },
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Payment received successfully',
      paymentId: newPayment._id
    });
  } catch (error) {
    console.error('Receive payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/payments/payment-out', authenticateToken, async (req, res) => {
  try {
    const { accountType, recipientId, accountMonth, paymentNo, amount, description, paymentDate } = req.body;

    if (!accountType || !recipientId || !amount || !paymentDate) {
      return res.status(400).json({ error: 'Account type, recipient, amount, and payment date are required' });
    }

    // Generate payment number if not provided
    let finalPaymentNo = paymentNo;
    if (!finalPaymentNo) {
      const paymentCount = await Payment.countDocuments();
      finalPaymentNo = `PYN-${String(paymentCount + 1).padStart(4, '0')}`;
    }

    const paymentData = {
      type: 'payment_out',
      paymentNo: finalPaymentNo,
      amount,
      description,
      paymentDate,
      accountMonth: accountMonth || null
    };

    if (accountType === 'employee') {
      paymentData.employeeId = recipientId;
      // Update employee balance
      await Employee.findByIdAndUpdate(recipientId, {
        $inc: { balance: -amount },
        updatedAt: new Date()
      });
    } else if (accountType === 'car') {
      paymentData.carId = recipientId;
      // Update car balance
      await Car.findByIdAndUpdate(recipientId, {
        $inc: { balance: -amount },
        updatedAt: new Date()
      });
    }

    const newPayment = await Payment.create(paymentData);

    res.json({
      success: true,
      message: 'Payment processed successfully',
      paymentId: newPayment._id
    });
  } catch (error) {
    console.error('Payment out error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/payments', authenticateToken, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('customerId', 'customerName')
      .populate('employeeId', 'employeeName')
      .populate('carId', 'carName')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// UPDATE PAYMENT - NEW ROUTE
app.put('/api/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentNo, amount, description, paymentDate, customerId, carId } = req.body;

    console.log('🔄 Updating payment:', { id, amount, customerId, carId });

    // Find the original payment
    const originalPayment = await Payment.findById(id);
    if (!originalPayment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    const originalAmount = originalPayment.amount;
    const amountDifference = amount - originalAmount;

    console.log('💰 Payment update - Original:', originalAmount, 'New:', amount, 'Difference:', amountDifference);

    // Update the payment
    const updatedPayment = await Payment.findByIdAndUpdate(
      id,
      {
        paymentNo,
        amount,
        description,
        paymentDate,
        customerId: customerId || originalPayment.customerId,
        carId: carId || originalPayment.carId
      },
      { new: true }
    ).populate('customerId', 'customerName phoneNumber')
     .populate('carId', 'carName numberPlate');

    console.log('✅ Payment updated in database:', updatedPayment);

    // Update customer balance if there's a difference and it's a customer payment
    if (amountDifference !== 0 && (customerId || originalPayment.customerId)) {
      const targetCustomerId = customerId || originalPayment.customerId;
      const customer = await Customer.findById(targetCustomerId);
      
      if (customer) {
        if (originalPayment.type === 'receive') {
          // For payment received: if amount increases, customer balance should decrease more
          const newBalance = Math.max(0, (customer.balance || 0) - amountDifference);
          customer.balance = newBalance;
          await customer.save();
          console.log(`💰 Customer balance adjusted: ${customer.balance + amountDifference} - ${amountDifference} = ${newBalance}`);
        }
      }
    }

    // Update car balance if there's a difference and it's a car payment
    if (amountDifference !== 0 && (carId || originalPayment.carId)) {
      const targetCarId = carId || originalPayment.carId;
      const car = await Car.findById(targetCarId);
      
      if (car) {
        if (originalPayment.type === 'payment_out') {
          // For payment out: if amount increases, car left should increase
          const newLeft = Math.max(0, (car.left || 0) + amountDifference);
          car.left = newLeft;
          await car.save();
          console.log(`🚗 Car left amount adjusted: ${car.left - amountDifference} + ${amountDifference} = ${newLeft}`);
        }
      }
    }

    res.json({ success: true, payment: updatedPayment });
  } catch (error) {
    console.error('❌ Error updating payment:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// DELETE PAYMENT - NEW ROUTE
app.delete('/api/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;

    console.log('🗑️ Deleting payment:', id);

    // Find the payment to get details before deletion
    const payment = await Payment.findById(id)
      .populate('customerId', 'customerName')
      .populate('carId', 'carName');

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    console.log('💰 Payment to delete:', {
      type: payment.type,
      amount: payment.amount,
      customerId: payment.customerId?._id,
      carId: payment.carId?._id
    });

    // Reverse balance changes before deletion
    if (payment.type === 'receive' && payment.customerId) {
      // For payment received: add back to customer balance (increase debt)
      const customer = await Customer.findById(payment.customerId._id);
      if (customer) {
        const newBalance = (customer.balance || 0) + payment.amount;
        customer.balance = newBalance;
        await customer.save();
        console.log(`✅ Customer ${customer.customerName} balance restored: +$${payment.amount} = $${newBalance}`);
      }
    }

    if (payment.type === 'payment_out' && payment.carId) {
      // For payment out: reduce car left amount
      const car = await Car.findById(payment.carId._id);
      if (car) {
        const newLeft = Math.max(0, (car.left || 0) - payment.amount);
        car.left = newLeft;
        await car.save();
        console.log(`✅ Car ${car.carName} left amount reduced: -$${payment.amount} = $${newLeft}`);
      }
    }

    // Delete the payment
    await Payment.findByIdAndDelete(id);
    console.log('✅ Payment deleted from database');
 
    res.json({ success: true, message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting payment:', error);
    res.status(500).json({ error: 'Failed to delete payment' });
  }
});

// Dashboard data
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const [cars, stats] = await Promise.all([
      Car.find({ status: 'Active' }, 'carName balance'),
      Promise.all([
        Car.countDocuments({ status: 'Active' }),
        Employee.countDocuments({ status: 'Active' }),
        Customer.countDocuments({ status: 'Active' }),
        Invoice.countDocuments(),
        Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
        Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$totalProfit' } } }]),
        Invoice.aggregate([{ $group: { _id: null, total: { $sum: '$totalLeft' } } }])
      ])
    ]);

    const dashboardData = {
      cars,
      stats: {
        totalCars: stats[0],
        totalEmployees: stats[1],
        totalCustomers: stats[2],
        totalInvoices: stats[3],
        totalRevenue: stats[4][0]?.total || 0,
        totalProfit: stats[5][0]?.total || 0,
        totalOutstanding: stats[6][0]?.total || 0
      }
    };

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Users Routes (for user management)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Administrator') {
      return res.status(403).json({ error: 'Only administrators can view users' });
    }

    const users = await User.find({}, '-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Administrator') {
      return res.status(403).json({ error: 'Only administrators can update users' });
    }

    const { password, ...updateData } = req.body;
    
    if (password) {
      updateData.password = bcrypt.hashSync(password, 10);
    }
    
    updateData.updatedAt = new Date();

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, select: '-password' }
    );
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'Administrator') {
      return res.status(403).json({ error: 'Only administrators can delete users' });
    }

    const deletedUser = await User.findByIdAndDelete(req.params.id);
    
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export all system data
app.get('/export', async (req, res) => {
  try {
    console.log('🔄 Starting complete system backup export...');
    
    // Get all data from database with populated references
    const [cars, employees, items, customers, invoices, payments] = await Promise.all([
      Car.find().populate('driverId kirishboyId'),
      Employee.find(),
      Item.find(),
      Customer.find(),
      Invoice.find().populate('carId').populate('items.itemId').populate('items.customerId'),
      Payment.find().populate('customerId carId')
    ]);
    
    const backupData = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      cars: cars || [],
      employees: employees || [],
      items: items || [],
      customers: customers || [],
      invoices: invoices || [],
      payments: payments || []
    };
    
    console.log('✅ System backup data prepared:', {
      cars: backupData.cars.length,
      employees: backupData.employees.length,
      items: backupData.items.length,
      customers: backupData.customers.length,
      invoices: backupData.invoices.length,
      payments: backupData.payments.length
    });
    
    res.json(backupData);
    
  } catch (error) {
    console.error('❌ Backup export error:', error);
    res.status(500).json({ 
      error: 'Failed to export system backup',
      details: error.message 
    });
  }
});

// Import and restore all system data
app.post('/import', async (req, res) => {
  try {
    console.log('🔄 Starting complete system restore from backup...');
    
    const backupData = req.body;
    
    // Validate backup data structure
    if (!backupData || typeof backupData !== 'object') {
      return res.status(400).json({ error: 'Invalid backup data format' });
    }
    
    console.log('📊 Backup data received:', {
      cars: backupData.cars?.length || 0,
      employees: backupData.employees?.length || 0,
      items: backupData.items?.length || 0,
      customers: backupData.customers?.length || 0,
      invoices: backupData.invoices?.length || 0,
      payments: backupData.payments?.length || 0
    });
    
    // Start transaction-like operation (delete all, then import)
    console.log('🗑️ Clearing existing data...');
    
    // Delete all existing data in correct order (to handle dependencies)
    await Payment.deleteMany({});
    await Invoice.deleteMany({});
    await Customer.deleteMany({});
    await Item.deleteMany({});
    await Car.deleteMany({});
    await Employee.deleteMany({});
    
    console.log('✅ Existing data cleared');
    
    // Import data in correct order (dependencies first)
    let importResults = {
      employees: 0,
      items: 0,
      cars: 0,
      customers: 0,
      invoices: 0,
      payments: 0
    };
    
    // 1. Import Employees first (no dependencies)
    if (backupData.employees && backupData.employees.length > 0) {
      console.log('👥 Importing employees...');
      const employeesToImport = backupData.employees.map(emp => ({
        _id: emp._id,
        employeeName: emp.employeeName,
        phoneNumber: emp.phoneNumber,
        category: emp.category,
        balance: emp.balance || 0,
        status: emp.status || 'Active'
      }));
      
      await Employee.insertMany(employeesToImport);
      importResults.employees = employeesToImport.length;
      console.log(`✅ Imported ${employeesToImport.length} employees`);
    }
    
    // 2. Import Items (no dependencies)
    if (backupData.items && backupData.items.length > 0) {
      console.log('📦 Importing items...');
      const itemsToImport = backupData.items.map(item => ({
        _id: item._id,
        itemName: item.itemName,
        price: item.price || 0,
        driverPrice: item.driverPrice || 0,
        kirishboyPrice: item.kirishboyPrice || 0,
        quantity: item.quantity || 0
      }));
      
      await Item.insertMany(itemsToImport);
      importResults.items = itemsToImport.length;
      console.log(`✅ Imported ${itemsToImport.length} items`);
    }
    
    // 3. Import Cars (depends on employees)
    if (backupData.cars && backupData.cars.length > 0) {
      console.log('🚗 Importing cars...');
      const carsToImport = backupData.cars.map(car => ({
        _id: car._id,
        carName: car.carName,
        numberPlate: car.numberPlate,
        driverId: car.driverId || null,
        kirishboyId: car.kirishboyId || null,
        balance: car.balance || 0,
        left: car.left || 0,
        status: car.status || 'Active'
      }));
      
      await Car.insertMany(carsToImport);
      importResults.cars = carsToImport.length;
      console.log(`✅ Imported ${carsToImport.length} cars`);
    }
    
    // 4. Import Customers (no dependencies)
    if (backupData.customers && backupData.customers.length > 0) {
      console.log('👤 Importing customers...');
      const customersToImport = backupData.customers.map(customer => ({
        _id: customer._id,
        customerName: customer.customerName,
        phoneNumber: customer.phoneNumber,
        balance: customer.balance || 0,
        status: customer.status || 'Active'
      }));
      
      await Customer.insertMany(customersToImport);
      importResults.customers = customersToImport.length;
      console.log(`✅ Imported ${customersToImport.length} customers`);
    }
    
    // 5. Import Invoices (depends on cars, items, customers)
    if (backupData.invoices && backupData.invoices.length > 0) {
      console.log('📄 Importing invoices...');
      const invoicesToImport = backupData.invoices.map(invoice => ({
        _id: invoice._id,
        invoiceNo: invoice.invoiceNo,
        carId: invoice.carId,
        invoiceDate: invoice.invoiceDate,
        total: invoice.total || 0,
        totalLeft: invoice.totalLeft || 0,
        totalProfit: invoice.totalProfit || 0,
        items: invoice.items || []
      }));
      
      await Invoice.insertMany(invoicesToImport);
      importResults.invoices = invoicesToImport.length;
      console.log(`✅ Imported ${invoicesToImport.length} invoices`);
    }
    
    // 6. Import Payments (depends on customers and cars)
    if (backupData.payments && backupData.payments.length > 0) {
      console.log('💳 Importing payments...');
      const paymentsToImport = backupData.payments.map(payment => ({
        _id: payment._id,
        paymentNo: payment.paymentNo,
        type: payment.type,
        customerId: payment.customerId || null,
        carId: payment.carId || null,
        amount: payment.amount || 0,
        paymentDate: payment.paymentDate,
        description: payment.description,
        accountMonth: payment.accountMonth
      }));
      
      await Payment.insertMany(paymentsToImport);
      importResults.payments = paymentsToImport.length;
      console.log(`✅ Imported ${paymentsToImport.length} payments`);
    }
    
    console.log('🎉 Complete system restore finished successfully!');
    console.log('📊 Import summary:', importResults);
    
    res.json({
      success: true,
      message: 'System restored successfully from backup',
      importResults,
      totalRecords: Object.values(importResults).reduce((sum, count) => sum + count, 0)
    });
    
  } catch (error) {
    console.error('❌ System restore error:', error);
    res.status(500).json({ 
      error: 'Failed to restore system from backup',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔐 Default login: admin@haype.com / admin123`);
  console.log(`🌐 MongoDB Atlas: Connected to Haype database`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  mongoose.connection.close(() => {
    console.log('✅ MongoDB connection Failed.');
    process.exit(0);
  });
});