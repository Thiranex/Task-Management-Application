const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, maxlength: 2000 },
  status: { 
    type: String, 
    enum: ['todo', 'in_progress', 'in_review', 'done'], 
    default: 'todo' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  due_date: { type: Date },
  tags: [{ type: String }],
  assigned_to: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  owner_username: { type: String, required: true }
}, { timestamps: true });

// Virtual for id to match frontend expectation if needed
taskSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

taskSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Task', taskSchema);
