require('dotenv').config();
const express = require('express');
const router = express.Router(); 
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');  
const User = require('../models/User'); 

// API Đăng nhập: POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });
        
        if (user.status === 'blocked') {
            return res.status(403).json({ success: false, message: 'Tài khoản của bạn đã bị khóa' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ success: false, message: 'Email hoặc mật khẩu không đúng' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            token,
            // THÊM role: user.role VÀO ĐÂY:
            user: { 
                id: user._id, 
                username: user.username, 
                email: user.email, 
                role: user.role // <-- Đây là chìa khóa còn thiếu
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
});

// API Đăng ký: POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Kiểm tra email đã tồn tại chưa
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email đã được sử dụng' });
        }

        // Mã hóa mật khẩu
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Tạo user mới
        const newUser = new User({
            username,
            email,
            password: hashedPassword
        });
        await newUser.save();

        // Tạo token luôn sau khi đăng ký
        const token = jwt.sign({ id: newUser._id, role: newUser.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.status(201).json({
            success: true,
            message: 'Đăng ký thành công',
            token,
            user: { id: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role }
        });
    } catch (error) {
        console.error('LỖI REGISTER:', error);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
});
module.exports = router; // 