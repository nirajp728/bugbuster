import nodemailer from 'nodemailer';

export const sendAuthEmail = async (toEmail, type, userName = 'User') => {
    
    // 1. Move the transporter INSIDE the function
    const transporter = nodemailer.createTransport({
        service: 'gmail', 
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    let subject = '';
    let htmlContent = '';

    if (type === 'register') {
        subject = 'Welcome to STM32 Lab! 🚀';
        htmlContent = `
            <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
                <h2 style="color: #4CAF50;">Welcome aboard, ${userName}!</h2>
                <p>Your account for the STM32 Hardware Lab has been successfully created.</p>
                <p>You can now connect to your hardware and start running experiments in real-time.</p>
                <br/>
                <p>Happy coding,</p>
                <p><strong>The STM32 Lab Team</strong></p>
            </div>
        `;
    } else if (type === 'login') {
        subject = 'New Login Detected - STM32 Lab 🔒';
        const time = new Date().toLocaleString();
        htmlContent = `
            <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
                <h2 style="color: #2196F3;">New Login Alert</h2>
                <p>Hello ${userName},</p>
                <p>We detected a new login to your STM32 Lab account at <strong>${time}</strong>.</p>
                <p>If this was you, no further action is needed. If you did not authorize this login, please contact the administrator immediately.</p>
            </div>
        `;
    }

    try {
        await transporter.sendMail({
            from: `"STM32 Lab Server" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: subject,
            html: htmlContent
        });
        console.log(`[MAILER] ${type} email sent successfully to ${toEmail}`);
    } catch (error) {
        console.error(`[MAILER] Failed to send email to ${toEmail}:`, error.message);
    }
};