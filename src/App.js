const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

// Initialize Express app
const app = express()
app.use(bodyParser.json())

// MongoDB connection string (replace <username>, <password>, and <dbname> with actual values)
const MONGO_URI =
  'mongodb+srv://<username>:<password>@cluster.mongodb.net/<dbname>?retryWrites=true&w=majority'

// Connect to MongoDB
mongoose
  .connect(MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err))

// Define Transaction schema
const transactionSchema = new mongoose.Schema({
  amount: {type: Number, required: true},
  transaction_type: {
    type: String,
    enum: ['DEPOSIT', 'WITHDRAWAL'],
    required: true,
  },
  user: {type: String, required: true}, // Using string for simplicity, replace with ObjectId in real-world apps
  status: {
    type: String,
    enum: ['PENDING', 'COMPLETED', 'FAILED'],
    default: 'PENDING',
  },
  timestamp: {type: Date, default: Date.now},
})

// Create Transaction model
const Transaction = mongoose.model('Transaction', transactionSchema)

// POST /api/transactions/ - Create a new transaction
app.post('/api/transactions', async (req, res) => {
  const {amount, transaction_type, user} = req.body
  try {
    const transaction = await Transaction.create({
      amount,
      transaction_type,
      user,
    })
    res.status(201).json(transaction)
  } catch (err) {
    res.status(400).json({error: err.message})
  }
})

// GET /api/transactions/ - Retrieve all transactions for a specific user
app.get('/api/transactions', async (req, res) => {
  const {user_id} = req.query
  if (!user_id) {
    return res.status(400).json({error: 'user_id is required'})
  }
  try {
    const transactions = await Transaction.find({user: user_id})
    res.status(200).json({transactions})
  } catch (err) {
    res.status(400).json({error: err.message})
  }
})

// GET /api/transactions/:transaction_id - Retrieve a specific transaction by ID
app.get('/api/transactions/:transaction_id', async (req, res) => {
  const {transaction_id} = req.params
  try {
    const transaction = await Transaction.findById(transaction_id)
    if (!transaction) {
      return res.status(404).json({error: 'Transaction not found'})
    }
    res.status(200).json(transaction)
  } catch (err) {
    res.status(400).json({error: err.message})
  }
})

// PUT /api/transactions/:transaction_id - Update the status of a transaction
app.put('/api/transactions/:transaction_id', async (req, res) => {
  const {transaction_id} = req.params
  const {status} = req.body

  if (!['COMPLETED', 'FAILED'].includes(status)) {
    return res.status(400).json({error: 'Invalid status'})
  }

  try {
    const transaction = await Transaction.findByIdAndUpdate(
      transaction_id,
      {status},
      {new: true},
    )
    if (!transaction) {
      return res.status(404).json({error: 'Transaction not found'})
    }
    res.status(200).json(transaction)
  } catch (err) {
    res.status(400).json({error: err.message})
  }
})

// Start the server
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
