const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');

// Multer Setup for Profile Image Upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// SIGN UP
router.post('/signup', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;
    if (!email || !password || password.length < 6) {
      return res.status(400).json({ msg: 'Please enter valid details. Password min 6 chars.' });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ msg: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ fullName, email, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, fullName: user.fullName, email: user.email, avatar: user.avatar } });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// SIGN IN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, fullName: user.fullName, email: user.email, avatar: user.avatar } });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// UPLOAD PROFILE AVATAR
router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ msg: 'Unauthorized' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const avatarPath = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(decoded.userId, { avatar: avatarPath }, { new: true });
    res.json({ avatar: user.avatar });
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

module.exports = router;
