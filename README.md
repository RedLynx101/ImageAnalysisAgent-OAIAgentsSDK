# Image Analysis Agent

A multi-service application that analyzes images using OpenAI Agents, performs web research, generates PDF reports, and emails them via Gmail.

## Quick Start with Docker (Recommended)

1.  **Prerequisites**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)

2.  **Environment Variables**:
    ```bash
    cp .env.sample .env
    ```
    Fill in your API keys in `.env`

3.  **Run**:
    ```bash
    docker-compose up
    ```
    
    This starts both the web app (http://localhost:3000) and the Trigger.dev worker.

4.  **Stop**:
    ```bash
    docker-compose down
    ```

## Manual Setup (Without Docker)

Requires Node.js 20 or 22 (Node 21 is NOT supported).

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Run Locally** (two terminals):
    ```bash
    # Terminal 1 - Web UI
    npm run dev:web
    
    # Terminal 2 - Worker
    npm run dev:worker
    ```

## Environment Variables

Copy `.env.sample` to `.env` and configure:

- **OPENAI_API_KEY**: From platform.openai.com
- **PERPLEXITY_API_KEY**: For web research
- **GMAIL_APP_PASSWORD**: App password from Google Account settings
- **GMAIL_SENDER_EMAIL**: Your Gmail address
- **TRIGGER_SECRET_KEY**: From trigger.dev dashboard

## Architecture

- `apps/web`: Next.js frontend (upload + status tracking)
- `apps/worker`: Trigger.dev worker (AI workflow orchestration)
- `packages/agent`: OpenAI Agent (Vision + Web Search)
- `packages/pdf`: PDF generation service
- `packages/email`: Gmail sending service

## Workflow

1.  **Upload**: User uploads an image
2.  **Analysis**: Agent analyzes image + web research
3.  **Review**: PDF generated, user reviews
4.  **Approval**: User clicks "Approve & Email"
5.  **Delivery**: PDF emailed to recipient
