# Image Analysis Agent

A multi-service application that analyzes images using OpenAI Agents, performs web research, generates PDF reports, and emails them via Gmail.

## Setup

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Copy `.env.sample` to `.env` and fill in the required keys.
    ```bash
    cp .env.sample .env
    ```
    - **OpenAI**: API Key from platform.openai.com
    - **Perplexity**: API Key for web research.
    - **Gmail**: OAuth2 credentials (Client ID, Secret, Refresh Token).
    - **Trigger.dev**: API keys for background jobs.

3.  **Run Locally**:

    - Start the Web UI:
      ```bash
      npm run dev:web
      ```
    - Start the Worker (in a separate terminal):
      ```bash
      npm run dev:worker
      ```

## Architecture

- `apps/web`: Next.js frontend for uploads and status tracking.
- `apps/worker`: Trigger.dev worker orchestrating the workflow.
- `packages/agent`: OpenAI Agent definition (Vision + Web Search).
- `packages/pdf`: PDF generation service.
- `packages/email`: Gmail sending service.

## Workflow

1.  **Upload**: User uploads an image via the Web UI.
2.  **Analysis**: The Agent analyzes the image and performs web research (Trigger.dev job `generate-report`).
3.  **Review**: A PDF report is generated. The UI shows a "Review" status.
4.  **Approval**: User clicks "Approve & Email" in the UI.
5.  **Delivery**: The PDF is emailed to the recipient (Trigger.dev job `send-approved-email`).
