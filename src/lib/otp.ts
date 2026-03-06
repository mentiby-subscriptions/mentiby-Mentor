import { createHash, randomInt } from 'crypto'

export function generateOTP(): string {
  return randomInt(100000, 999999).toString()
}

export function hashOTP(otp: string): string {
  return createHash('sha256').update(otp).digest('hex')
}

export function generateOTPEmailHTML(mentorName: string, otp: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f4f4;">
  <div style="max-width:500px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
    <div style="background:linear-gradient(135deg,#8b5cf6,#6366f1);padding:30px;text-align:center;">
      <h1 style="color:white;margin:0;font-size:28px;">
        <span style="font-weight:bold;">Menti</span><span style="font-weight:normal;">BY</span>
      </h1>
      <p style="color:rgba(255,255,255,0.9);margin-top:8px;font-size:14px;">Mentor Login Verification</p>
    </div>
    <div style="padding:30px;text-align:center;">
      <h2 style="color:#333;margin-top:0;">Hi ${mentorName}!</h2>
      <p style="color:#666;font-size:16px;">Your login verification code is:</p>
      <div style="margin:24px 0;padding:20px;background:#f8f5ff;border-radius:12px;border:2px dashed #8b5cf6;">
        <span style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#5b21b6;">${otp}</span>
      </div>
      <p style="color:#999;font-size:14px;">This code expires in <strong>5 minutes</strong>.</p>
      <p style="color:#999;font-size:13px;">If you did not request this, please ignore this email.</p>
    </div>
    <div style="background:#1f2937;padding:16px;text-align:center;">
      <p style="color:#9ca3af;margin:0;font-size:12px;">2025 MentiBY. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`
}
