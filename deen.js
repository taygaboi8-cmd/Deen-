const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Person = require('../models/Person');

// Auth Middleware
const auth = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// GET ALL DATA FOR LOGGED IN USER ONLY
router.get('/', auth, async (req, res) => {
  try {
    const people = await Person.find({ userId: req.userId });
    res.json(people);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// ADD NEW PERSON / TRANSACTION
router.post('/', auth, async (req, res) => {
  try {
    const { name, type, amount, date, dateTime } = req.body;
    let person = await Person.findOne({ userId: req.userId, name: new RegExp(`^${name}$`, 'i') });

    if (person) {
      person.type = type;
      person.amount += parseFloat(amount);
      person.history.unshift({ action: 'add', amount, dateTime });
      await person.save();
    } else {
      person = new Person({
        userId: req.userId,
        name,
        type,
        amount,
        date,
        history: [{ action: 'add', amount, dateTime }]
      });
      await person.save();
    }
    res.json(person);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// QUICK UPDATE (ADD / PAY)
router.put('/:id/action', auth, async (req, res) => {
  try {
    const { action, amount, dateTime } = req.body;
    const person = await Person.findOne({ _id: req.params.id, userId: req.userId });
    if (!person) return res.status(404).json({ msg: 'Person not found' });

    let numAmt = parseFloat(amount);
    if (action === 'add') {
      person.amount += numAmt;
    } else {
      person.amount -= numAmt;
      if (person.amount < 0) person.amount = 0;
    }

    person.history.unshift({ action, amount: numAmt, dateTime });
    await person.save();
    res.json(person);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
