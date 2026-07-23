require("dotenv").config();
const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../models/User");
const authMiddleware = require("../middlewares/authMiddleware");
const { sendVerificationEmail } = require("../utils/mailer");

const EMAIL_REGEX = /^[^\s@]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/;
const OTP_TTL_MS = 10 * 60 * 1000;

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();
const hashOtp = (otp) =>
  crypto.createHash("sha256").update(otp).digest("hex");

// isNewUser xác định có cần xóa tài khoản nếu Gmail không gửi được hay không.
async function issueVerificationOtp(user, isNewUser = true) {
  const otp = crypto.randomInt(100000, 1000000).toString();
  user.verificationOtp = hashOtp(otp);
  user.verificationOtpExpires = new Date(Date.now() + OTP_TTL_MS);

  // Lưu OTP trước để có thể xác thực ngay khi email đã được Gmail tiếp nhận.
  await user.save();

  try {
    await sendVerificationEmail({
      email: user.email,
      username: user.username,
      otp,
    });
  } catch (error) {
    if (isNewUser) {
      await User.findByIdAndDelete(user._id);
      console.log(
        `[Rollback] Đã xóa tài khoản ${user.email} do gửi mail thất bại.`,
      );
    }
    throw error;
  }
}

// API Đăng nhập: POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
    }
    if (user.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "Tài khoản của bạn đã bị khóa",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc mật khẩu không đúng",
      });
    }
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        message: "Vui lòng xác thực email trước khi đăng nhập",
      });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.json({
      success: true,
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// API Đăng ký: POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!username?.trim() || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Vui lòng nhập đầy đủ thông tin" });
    }
    if (!EMAIL_REGEX.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Địa chỉ email không hợp lệ" });
    }
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email đã được sử dụng" });
    }

    const salt = await bcrypt.genSalt(10);
    const newUser = new User({
      username: username.trim(),
      email,
      password: await bcrypt.hash(password, salt),
    });
    await issueVerificationOtp(newUser);

    res.status(201).json({
      success: true,
      message: "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã xác thực.",
      email: newUser.email,
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    res.status(500).json({ success: false, message: "Không thể gửi mã xác thực" });
  }
});

// API xác thực email: POST /api/auth/verify-email
router.post("/verify-email", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = String(req.body.otp || "").trim();

    if (!EMAIL_REGEX.test(email) || !/^\d{6}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: "Email hoặc mã xác thực không hợp lệ",
      });
    }

    const user = await User.findOne({ email }).select(
      "+verificationOtp +verificationOtpExpires",
    );
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy tài khoản" });
    }
    if (user.isVerified) {
      return res.json({ success: true, message: "Email đã được xác thực" });
    }
    if (
      !user.verificationOtp ||
      !user.verificationOtpExpires ||
      user.verificationOtpExpires < new Date() ||
      user.verificationOtp !== hashOtp(otp)
    ) {
      return res.status(400).json({
        success: false,
        message: "Mã xác thực không đúng hoặc đã hết hạn",
      });
    }

    user.isVerified = true;
    user.verificationOtp = null;
    user.verificationOtpExpires = null;
    await user.save();

    res.json({
      success: true,
      message: "Xác thực email thành công. Bạn có thể đăng nhập ngay.",
    });
  } catch (error) {
    console.error("VERIFY EMAIL ERROR:", error);
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

// API gửi lại mã khi người dùng chưa nhận được email hoặc mã đã hết hạn.
router.post("/resend-verification", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!EMAIL_REGEX.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Địa chỉ email không hợp lệ" });
    }

    const user = await User.findOne({ email });
    if (!user || user.isVerified) {
      return res.json({
        success: true,
        message: "Nếu tài khoản cần xác thực, mã mới đã được gửi.",
      });
    }

    await issueVerificationOtp(user, false);
    res.json({
      success: true,
      message: "Mã xác thực mới đã được gửi đến email của bạn.",
    });
  } catch (error) {
    console.error("RESEND VERIFICATION ERROR:", error);
    res.status(500).json({ success: false, message: "Không thể gửi mã xác thực" });
  }
});

// API Đổi mật khẩu: PUT /api/auth/change-password (cần đăng nhập)
router.put("/change-password", authMiddleware, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ mật khẩu cũ và mới",
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải từ 6 ký tự trở lên",
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    }
    if (!(await bcrypt.compare(oldPassword, user.password))) {
      return res
        .status(400)
        .json({ success: false, message: "Mật khẩu cũ không đúng" });
    }

    user.password = await bcrypt.hash(newPassword, await bcrypt.genSalt(10));
    await user.save();
    res.json({ success: true, message: "Đổi mật khẩu thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});

module.exports = router;
