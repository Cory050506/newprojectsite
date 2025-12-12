import emailjs from "@emailjs/browser";

export function sendAlertEmail({
  toEmail,
  toName,
  subject,
  message,
}: {
  toEmail: string;
  toName: string;
  subject: string;
  message: string;
}) {
  return emailjs.send(
    process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
    process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
    {
      to_email: toEmail,
      to_name: toName,
      subject,
      message,
    },
    process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY!
  );
}