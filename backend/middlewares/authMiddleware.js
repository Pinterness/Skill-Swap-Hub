const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    const token = req.header('Authorization');

    // In ra xem Backend có thực sự nhận được chữ Bearer không
    console.log("👉 Token nhận được từ Frontend:", token);

    if (!token) {
        return res.status(401).json({ success: false, message: 'Từ chối truy cập. Không tìm thấy Token.' });
    }

    try {
        const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
        req.user = decoded; 
        next(); 
    } catch (error) {
        // In ra lỗi chi tiết để xem tại sao giải mã thất bại
        console.log("❌ Lỗi giải mã JWT:", error.message);
        res.status(401).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn.' });
    }
};