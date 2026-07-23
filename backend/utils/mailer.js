const nodemailer = require("nodemailer");

const smtpConfigured = Boolean(
  process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS,
);

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

async function sendVerificationEmail({ email, username, otp }) {
  if (!transporter) {
    console.warn(
      `[Email verification] SMTP is not configured. OTP for ${email}: ${otp}`,
    );
    return;
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Xác thực email SkillSwap Hub",
    text: `Chào ${username}, mã xác thực SkillSwap Hub của bạn là ${otp}. Mã có hiệu lực trong 10 phút.`,
    html: `<p>Chào <strong>${username}</strong>,</p><p>Mã xác thực SkillSwap Hub của bạn là:</p><h2>${otp}</h2><p>Mã có hiệu lực trong 10 phút.</p>`,
  });
}

module.exports = { sendVerificationEmail };
