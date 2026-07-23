const RESEND_EMAILS_URL = "https://api.resend.com/emails";

async function sendVerificationEmail({ email, username, otp }) {
  // Dùng mã này để test thủ công khi chưa cấu hình Resend.
  console.log(`[Email verification] OTP for ${email}: ${otp}`);

  if (!process.env.RESEND_API_KEY) {
    console.warn(
      "[Email verification] Chưa có RESEND_API_KEY; email không được gửi.",
    );
    return;
  }

  try {
    const response = await fetch(RESEND_EMAILS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || "SkillSwap Hub <onboarding@resend.dev>",
        to: [email],
        subject: "Xác thực email SkillSwap Hub",
        text: `Chào ${username}, mã xác thực SkillSwap Hub của bạn là ${otp}. Mã có hiệu lực trong 10 phút.`,
        html: `<p>Chào <strong>${username}</strong>,</p><p>Mã xác thực SkillSwap Hub của bạn là:</p><h2>${otp}</h2><p>Mã có hiệu lực trong 10 phút.</p>`,
      }),
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(
        data.message || `Resend API trả về HTTP ${response.status}`,
      );
      error.status = response.status;
      error.details = data;
      throw error;
    }

    console.log(`[Email verification] Resend accepted email ${data.id} for ${email}`);
    return data;
  } catch (error) {
    console.error("[Email verification] Gửi bằng Resend thất bại:", {
      message: error.message,
      status: error.status,
      details: error.details,
    });
    throw error;
  }
}

module.exports = { sendVerificationEmail };
