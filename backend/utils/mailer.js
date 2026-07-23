const nodemailer = require("nodemailer");

const gmailConfigured = Boolean(
  process.env.EMAIL_USER && process.env.EMAIL_PASS,
);

const transporter = gmailConfigured
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null;

async function sendVerificationEmail({ email, username, otp }) {
  // Dùng mã này để test thủ công khi SMTP/Gmail chưa hoạt động.
  console.log(`[Email verification] OTP for ${email}: ${otp}`);

  if (!transporter) {
    console.warn(
      "[Email verification] Chưa có EMAIL_USER hoặc EMAIL_PASS; email không được gửi.",
    );
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: "Xác thực email SkillSwap Hub",
      text: `Chào ${username}, mã xác thực SkillSwap Hub của bạn là ${otp}. Mã có hiệu lực trong 10 phút.`,
      html: `<p>Chào <strong>${username}</strong>,</p><p>Mã xác thực SkillSwap Hub của bạn là:</p><h2>${otp}</h2><p>Mã có hiệu lực trong 10 phút.</p>`,
    });
    console.log(
      `[Email verification] Gmail accepted message ${info.messageId} for ${email}`,
    );
    return info;
  } catch (error) {
    console.error("[Email verification] Gửi Gmail thất bại:", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
    throw error;
  }
}

module.exports = { sendVerificationEmail };
