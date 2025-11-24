import { task } from "@trigger.dev/sdk/v3";
import { runAgent } from "@repo/agent";
import { generatePDF } from "@repo/pdf";
import { logger, GenerateReportPayload } from "@repo/shared";
import path from "path";

export const generateReport = task({
  id: "generate-report",
  run: async (payload: GenerateReportPayload) => {
    logger.info(`Starting report generation for ${payload.originalName}`);

    // 1. Run Agent
    logger.info("Running agent...");
    // Ensure absolute path for the agent if needed, but shared vol access in local dev is easier
    // In a real V3 worker, we might need to upload the file to S3 or similar.
    // For local dev, we assume the path is accessible (monorepo local disk).
    const reportSpec = await runAgent(payload.imagePath);
    logger.info("Agent finished", reportSpec);

    // 2. Generate PDF
    logger.info("Generating PDF...");
    const pdfFilename = `report-${Date.now()}.pdf`;
    const pdfPath = await generatePDF(reportSpec, pdfFilename);
    
    logger.info("PDF Generated", { pdfPath });

    // Return the PDF path so the frontend can pick it up
    return {
      status: 'success',
      pdfPath,
      reportSpec
    };
  },
});

