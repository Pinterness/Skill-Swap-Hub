const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Session = require('../models/Session');
const User = require('../models/User');
const auth = require('../middlewares/authMiddleware');

// Gửi đánh giá (chỉ khi session đã completed)
router.post('/', auth, async (req, res) => {
    try {
        const { sessionId, revieweeId, rating, comment } = req.body;

        const session = await Session.findById(sessionId);
        if (!session || session.status !== 'completed') {
            return res.status(400).json({ success: false, message: 'Buổi học chưa hoàn thành' });
        }

        const isParticipant = [session.teacherId.toString(), session.studentId.toString()].includes(req.user.id);
        if (!isParticipant) {
            return res.status(403).json({ success: false, message: 'Không có quyền đánh giá' });
        }

        // Kiểm tra đã đánh giá chưa
        const existed = await Review.findOne({ sessionId, reviewer: req.user.id });
        if (existed) {
            return res.status(400).json({ success: false, message: 'Bạn đã đánh giá buổi học này rồi' });
        }

        const review = await Review.create({
            sessionId, reviewer: req.user.id, reviewee: revieweeId, rating, comment
        });

        // Cập nhật stats averageRating của người được đánh giá
        const reviews = await Review.find({ reviewee: revieweeId });
        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await User.findByIdAndUpdate(revieweeId, {
            'stats.averageRating': Math.round(avg * 10) / 10,
            'stats.totalReviews': reviews.length
        });

        res.status(201).json({ success: true, review });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
});

// Xem đánh giá của 1 user
router.get('/user/:userId', async (req, res) => {
    try {
        const reviews = await Review.find({ reviewee: req.params.userId })
            .populate('reviewer', 'username avatar')
            .sort({ createdAt: -1 });
        res.json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
});

module.exports = router;