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
      "Chemical order approved",
      "",
      `Chemical name: ${chemicalName}`,
      `Formula: ${chemicalFormula}`,
      `Quantity: ${quantity}L`,
      `Approved by: ${adminEmail}`,
    ].join("\n"),
    html: `
      <h2>Chemical Order Approved</h2>
      <p><strong>Chemical name:</strong> ${chemicalName}</p>
      <p><strong>Formula:</strong> ${chemicalFormula}</p>
      <p><strong>Quantity:</strong> ${quantity}L</p>
      <p><strong>Approved by:</strong> ${adminEmail}</p>
    `,
  });
}
