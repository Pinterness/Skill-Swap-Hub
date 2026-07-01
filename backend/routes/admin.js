const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const Session = require('../models/Session');
const auth = require('../middlewares/authMiddleware');

// Middleware kiểm tra quyền admin
const adminOnly = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Chỉ admin mới có quyền truy cập' });
    }
    next();
};

// Thống kê tổng quan
router.get('/stats', auth, adminOnly, async (req, res) => {
    try {
        const totalUsers        = await User.countDocuments({ role: 'user' });
        const blockedUsers      = await User.countDocuments({ status: 'blocked' });
        const totalPosts        = await Post.countDocuments();
        const hiddenPosts       = await Post.countDocuments({ isHidden: true });
        const totalSessions     = await Session.countDocuments();
        const completedSessions = await Session.countDocuments({ status: 'completed' });

        res.json({ success: true, stats: { totalUsers, blockedUsers, totalPosts, hiddenPosts, totalSessions, completedSessions } });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
});

// Danh sách tất cả user
router.get('/users', auth, adminOnly, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const users = await User.find({ role: 'user' })
            .select('-password')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        const total = await User.countDocuments({ role: 'user' });
        res.json({ success: true, total, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
});

// Block / Unblock user
router.put('/users/:userId/block', auth, adminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy user' });

        user.status = user.status === 'active' ? 'blocked' : 'active';
        await user.save();

        res.json({ success: true, message: `Tài khoản đã được ${user.status === 'blocked' ? 'khóa' : 'mở khóa'}`, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
});

// Danh sách tất cả bài đăng
router.get('/posts', auth, adminOnly, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const posts = await Post.find()
            .populate('author', 'username email')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        const total = await Post.countDocuments();
        res.json({ success: true, total, posts });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
});

// Ẩn / Hiện bài đăng
router.put('/posts/:postId/hide', auth, adminOnly, async (req, res) => {
    try {
        const post = await Post.findById(req.params.postId);
        if (!post) return res.status(404).json({ success: false, message: 'Không tìm thấy bài đăng' });

        post.isHidden = !post.isHidden;
        await post.save();

        res.json({ success: true, message: `Bài đăng đã được ${post.isHidden ? 'ẩn' : 'hiện'}`, post });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
});

module.exports = router;