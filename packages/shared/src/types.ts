export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PENDING_APPROVAL = 'pending_approval',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface ReportSpec {
  title: string;
  summary: string;
  sections: Array<{
    heading: string;
    content: string;
  }>;
  imageAnnotations?: Array<{
    caption: string;
    description: string;
  }>;
  references?: Array<{
    title: string;
    url: string;
  }>;
}

export interface GenerateReportPayload {
  imagePath: string;
  originalName: string;
}

export interface SendEmailPayload {
  pdfPath: string;
  recipient?: string;
}

