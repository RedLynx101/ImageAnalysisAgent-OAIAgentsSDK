import { google } from 'googleapis';
import nodemailer from 'nodemailer';
import { env, logger, SendEmailPayload } from '@repo/shared';

const createTransporter = async () => {
  // --- OAuth2 Method (Commented out for now) ---
  /*
  const oauth2Client = new google.auth.OAuth2(
    env.GMAIL_CLIENT_ID,
    env.GMAIL_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground' // Redirect URL often used for playground/cli
  );

  oauth2Client.setCredentials({
    refresh_token: env.GMAIL_REFRESH_TOKEN
  });

  // Get access token
  const accessToken = await new Promise<string>((resolve, reject) => {
    oauth2Client.getAccessToken((err, token) => {
      if (err) {
        logger.error("Failed to create access token for Gmail", err);
        reject("Failed to create access token");
      }
      resolve(token || ""); 
    });
  });

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: env.GMAIL_SENDER_EMAIL,
      clientId: env.GMAIL_CLIENT_ID,
      clientSecret: env.GMAIL_CLIENT_SECRET,
      refreshToken: env.GMAIL_REFRESH_TOKEN,
      accessToken
    }
  });
  return transporter;
  */

  // --- App Password Method (Active) ---
  if (!env.GMAIL_APP_PASSWORD) {
    throw new Error("GMAIL_APP_PASSWORD is not set in environment variables.");
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: env.GMAIL_SENDER_EMAIL,
      pass: env.GMAIL_APP_PASSWORD
    }
  });

  return transporter;
};

export const sendEmail = async ({ recipient, pdfPath }: SendEmailPayload) => {
  logger.info(`Sending email to ${recipient || env.GMAIL_SENDER_EMAIL} with attachment ${pdfPath}`);
  try {
    const transporter = await createTransporter();
    const mailOptions = {
      from: env.GMAIL_SENDER_EMAIL,
      to: recipient || env.GMAIL_SENDER_EMAIL,
      subject: 'Your AI Generated Image Report',
      text: 'Attached is the research report generated for your image.',
      attachments: [
        {
          path: pdfPath
        }
      ]
    };

    await transporter.sendMail(mailOptions);
    logger.info('Email sent successfully');
  } catch (error) {
    logger.error("Error sending email:", error);
    throw error;
  }
};

