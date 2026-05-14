const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const User = require('./models/User');
const Task = require('./models/Task');
const authMiddleware = require('./middleware/auth');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URL)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// --- Auth Routes ---
const authRouter = express.Router();

authRouter.post('/register', async (req, res) => {
  try {
    const { username, email, password, full_name } = req.body;
    if (await User.findOne({ $or: [{ email }, { username }] })) {
      return res.status(409).json({ detail: 'User with this email or username already exists' });
    }
    const user = new User({ username, email, password, full_name });
    await user.save();
    
    const token = jwt.sign({ sub: user._id, email: user.email }, process.env.SECRET_KEY || 'your-super-secret-key');
    res.status(201).json({
      access_token: token,
      token_type: 'bearer',
      user: { id: user._id, username: user.username, email: user.email, full_name: user.full_name, created_at: user.createdAt }
    });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ detail: 'Invalid email or password' });
    }
    const token = jwt.sign({ sub: user._id, email: user.email }, process.env.SECRET_KEY || 'your-super-secret-key');
    res.json({
      access_token: token,
      token_type: 'bearer',
      user: { id: user._id, username: user.username, email: user.email, full_name: user.full_name, created_at: user.createdAt }
    });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

authRouter.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ id: user._id, username: user.username, email: user.email, full_name: user.full_name, created_at: user.createdAt });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

// --- Task Routes ---
const taskRouter = express.Router();

taskRouter.post('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const task = new Task({
      ...req.body,
      owner: req.user.id,
      owner_username: user.username
    });
    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

taskRouter.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, priority, search, page = 1, page_size = 10 } = req.query;
    const query = { owner: req.user.id };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Task.countDocuments(query);
    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * page_size)
      .limit(Number(page_size));

    res.json({
      tasks,
      total,
      page: Number(page),
      page_size: Number(page_size),
      total_pages: Math.ceil(total / page_size)
    });
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

taskRouter.get('/stats', authMiddleware, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const stats = await Task.aggregate([
      { $match: { owner: userId } },
      { $facet: {
        status_counts: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
        priority_counts: [{ $group: { _id: "$priority", count: { $sum: 1 } } }],
        total: [{ $count: "count" }],
        overdue: [
          { $match: { due_date: { $lt: new Date() }, status: { $ne: "done" } } },
          { $count: "count" }
        ]
      }}
    ]);

    const data = stats[0];
    const resData = {
      total: data.total[0]?.count || 0,
      overdue: data.overdue[0]?.count || 0,
      by_status: {},
      by_priority: {}
    };
    data.status_counts.forEach(item => resData.by_status[item._id] = item.count);
    data.priority_counts.forEach(item => resData.by_priority[item._id] = item.count);
    
    res.json(resData);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

taskRouter.get('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, owner: req.user.id });
    if (!task) return res.status(404).json({ detail: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

taskRouter.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, owner: req.user.id },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    if (!task) return res.status(404).json({ detail: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

taskRouter.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await Task.deleteOne({ _id: req.params.id, owner: req.user.id });
    if (result.deletedCount === 0) return res.status(404).json({ detail: 'Task not found' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ detail: err.message });
  }
});

app.use('/api/auth', authRouter);
app.use('/api/tasks', taskRouter);

app.get('/api/health', (req, res) => res.json({ status: 'healthy' }));
app.get('/api', (req, res) => res.json({ status: 'ok', app: 'Task Manager API', version: '1.0.0-MERN' }));

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app; // For Vercel
