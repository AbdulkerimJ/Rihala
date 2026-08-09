import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

export const sendPasswordResetEmail = async (to, resetLink) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email Service] RESEND_API_KEY is not set. Skipping email send.");
    return;
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: "Password Reset Request",
      html: `<p>You requested a password reset. Click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p><p>This link will expire in 1 hour.</p>`,
    });
    console.log(`[Email Service] Password reset email sent to ${to}`);
  } catch (error) {
    console.error("[Email Service] Failed to send password reset email:", error);
  }
};

export const sendInvitationEmail = async (to, invitationLink) => {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email Service] RESEND_API_KEY is not set. Skipping email send.");
    return;
  }

  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: "You are invited to join Rihala",
      html: `<p>You have been invited to join the Rihala Furniture Workshop Management System.</p>
             <p>Click the link below to accept your invitation:</p>
             <p><a href="${invitationLink}">${invitationLink}</a></p>
             <p>Your administrator will provide you with your secure verification code.</p>
             <p>This invitation will expire soon.</p>`,
    });
    console.log(`[Email Service] Invitation email sent to ${to}`);
  } catch (error) {
    console.error("[Email Service] Failed to send invitation email:", error);
  }
};
