// Real-time processing status service
import { EventEmitter } from 'events';

export interface ProcessingStatus {
  jobId: string;
  summaryId: string;
  status: 'pending' | 'extracting' | 'transcribing' | 'analyzing' | 'completed' | 'failed';
  progress: number;
  currentStep: string;
  error?: string;
  startTime: Date;
  endTime?: Date;
}

export class ProcessingStatusService extends EventEmitter {
  private static instance: ProcessingStatusService;
  private jobs: Map<string, ProcessingStatus> = new Map();

  static getInstance(): ProcessingStatusService {
    if (!ProcessingStatusService.instance) {
      ProcessingStatusService.instance = new ProcessingStatusService();
    }
    return ProcessingStatusService.instance;
  }

  createJob(jobId: string, summaryId: string): ProcessingStatus {
    const status: ProcessingStatus = {
      jobId,
      summaryId,
      status: 'pending',
      progress: 0,
      currentStep: 'Initializing processing...',
      startTime: new Date()
    };

    this.jobs.set(jobId, status);
    this.emit('statusUpdate', status);
    return status;
  }

  updateJob(jobId: string, updates: Partial<ProcessingStatus>): ProcessingStatus | null {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    Object.assign(job, updates);
    
    if (updates.status === 'completed' || updates.status === 'failed') {
      job.endTime = new Date();
    }

    this.jobs.set(jobId, job);
    this.emit('statusUpdate', job);
    return job;
  }

  getJob(jobId: string): ProcessingStatus | null {
    return this.jobs.get(jobId) || null;
  }

  getAllJobs(): ProcessingStatus[] {
    return Array.from(this.jobs.values());
  }

  removeJob(jobId: string): boolean {
    return this.jobs.delete(jobId);
  }

  // Helper methods for common status updates
  setExtracting(jobId: string): void {
    this.updateJob(jobId, {
      status: 'extracting',
      progress: 10,
      currentStep: 'Extracting audio from content...'
    });
  }

  setTranscribing(jobId: string): void {
    this.updateJob(jobId, {
      status: 'transcribing',
      progress: 30,
      currentStep: 'Transcribing audio with AI...'
    });
  }

  setAnalyzing(jobId: string): void {
    this.updateJob(jobId, {
      status: 'analyzing',
      progress: 70,
      currentStep: 'Generating AI summary and insights...'
    });
  }

  setCompleted(jobId: string): void {
    this.updateJob(jobId, {
      status: 'completed',
      progress: 100,
      currentStep: 'Processing completed successfully!'
    });
  }

  setFailed(jobId: string, error: string): void {
    this.updateJob(jobId, {
      status: 'failed',
      progress: 0,
      currentStep: 'Processing failed',
      error
    });
  }
}