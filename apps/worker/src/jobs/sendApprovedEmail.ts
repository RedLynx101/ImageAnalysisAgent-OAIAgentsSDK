import { task } from "@trigger.dev/sdk/v3";
import { sendEmail } from "@repo/email";
import { logger, SendEmailPayload } from "@repo/shared";

export const sendApprovedEmail = task({
  id: "send-approved-email",
  run: async (payload: SendEmailPayload) => {
    logger.info(`Sending approved email to ${payload.recipient || 'default'}`);

    await sendEmail(payload);

    return {
      status: 'sent',
      timestamp: new Date().toISOString()
    };
  },
});

