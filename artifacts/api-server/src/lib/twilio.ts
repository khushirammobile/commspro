import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;

export function getTwilioClient() {
  return twilio(accountSid, authToken);
}

export const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER ?? "";
export const TWILIO_WHATSAPP = process.env.TWILIO_WHATSAPP_NUMBER ?? `whatsapp:${TWILIO_PHONE}`;
