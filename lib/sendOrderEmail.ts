import nodemailer from "nodemailer";

type OrderEmailData = {
  providerEmail: string;
  adminEmail: string;
  chemicalName: string;
  chemicalFormula: string;
  quantity: number;
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendChemicalOrderEmail({
  providerEmail,
  adminEmail,
  chemicalName,
  chemicalFormula,
  quantity,
}: OrderEmailData) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP environment variables are not configured.");
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: providerEmail,
    replyTo: adminEmail,
    subject: `Chemical order approved: ${chemicalName}`,
    text: [
      "Dear Supplier,",
      "",
      "A new chemical order has been officially approved and requires fulfillment. Below are the order details:",
      "",
      `• Chemical Name: ${chemicalName}`,
      `• Formula: ${chemicalFormula}`,
      `• Quantity: ${quantity}L`,
      `• Approved By: ${adminEmail}`,
      "",
      "Please process and dispatch this shipment at your earliest convenience.",
      "",
      "Best regards,",
      "Laboratory Management Team",
    ].join("\n"),
    html: `
      <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-top: 0;">Chemical Order Approved</h2>
        
        <p>Dear Supplier,</p>
        <p>A new chemical order has been officially approved and requires fulfillment. Below are the order details:</p>
        
        <ul style="list-style-type: none; padding: 0; background-color: #f8fafc; padding: 15px; border-radius: 6px; border: 1px solid #e2e8f0;">
          <li style="margin-bottom: 8px;"><strong>Chemical Name:</strong> ${chemicalName}</li>
          <li style="margin-bottom: 8px;"><strong>Formula:</strong> ${chemicalFormula}</li>
          <li style="margin-bottom: 8px;"><strong>Quantity:</strong> ${quantity}L</li>
          <li><strong>Approved By:</strong> <a href="mailto:${adminEmail}" style="color: #2563eb; text-decoration: none;">${adminEmail}</a></li>
        </ul>

        <p>Please process and dispatch this shipment at your earliest convenience.</p>
        
        <p style="margin-top: 30px; margin-bottom: 0;">Best regards,</p>
        <p style="margin-top: 4px; color: #64748b;"><strong>Laboratory Management Team</strong></p>
      </div>
    `,
  });
}
