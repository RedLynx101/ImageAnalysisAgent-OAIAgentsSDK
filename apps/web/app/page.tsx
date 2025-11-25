"use client";

import { useState, useEffect, useCallback } from 'react';

type Status = 'idle' | 'uploading' | 'processing' | 'review' | 'sending' | 'completed' | 'failed';

interface LogEntry {
  time: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'processing';
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      message,
      type
    }]);
  };

  const handleFile = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type.startsWith('image/')) {
      handleFile(droppedFile);
    }
  }, [handleFile]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setStatus('uploading');
    addLog('Uploading image to server...', 'processing');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (data.id) {
        setJobId(data.id);
        setStatus('processing');
        addLog('Upload complete', 'success');
        addLog(`Job ID: ${data.id}`, 'info');
        addLog('AI agent analyzing image...', 'processing');
      } else {
        setStatus('failed');
        addLog('Upload failed', 'error');
      }
    } catch (err) {
      console.error(err);
      setStatus('failed');
      addLog('Connection error', 'error');
    }
  };

  const handleApprove = async () => {
    if (!jobId || !pdfPath) return;
    setStatus('sending');
    addLog('Sending approval...', 'processing');
    
    try {
      await fetch(`/api/jobs/${jobId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfPath })
      });
      addLog('Report approved', 'success');
      addLog('Sending email...', 'processing');
      setTimeout(() => {
        setStatus('completed');
        addLog('Email sent successfully!', 'success');
      }, 1500);
    } catch (err) {
      addLog('Approval failed', 'error');
      setStatus('review');
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setJobId(null);
    setStatus('idle');
    setPdfPath(null);
    setLogs([]);
  };

  useEffect(() => {
    if (!jobId || status === 'completed' || status === 'failed' || status === 'review') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();
        
        if (data.status === 'COMPLETED') {
          setStatus('review');
          setPdfPath(data.output?.pdfPath);
          addLog('Analysis complete', 'success');
          addLog('Report generated successfully', 'success');
          clearInterval(interval);
        } else if (data.status === 'FAILED') {
          setStatus('failed');
          addLog('Analysis failed', 'error');
          clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, status]);

  const steps = [
    { id: 1, label: 'Upload', done: status !== 'idle' },
    { id: 2, label: 'Analyze', done: ['review', 'sending', 'completed'].includes(status) },
    { id: 3, label: 'Review', done: ['sending', 'completed'].includes(status) },
    { id: 4, label: 'Deliver', done: status === 'completed' },
  ];

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border-color)] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-dim)] flex items-center justify-center">
              <svg className="w-6 h-6 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold">Image Analyst</h1>
              <p className="text-xs text-[var(--text-muted)]">AI-powered visual intelligence</p>
            </div>
          </div>
          
          {/* Progress Steps */}
          <div className="hidden md:flex items-center gap-2">
            {steps.map((step, i) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300
                  ${step.done 
                    ? 'bg-[var(--accent)] text-[var(--bg-primary)]' 
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-muted)] border border-[var(--border-color)]'}
                `}>
                  {step.done ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : step.id}
                </div>
                <span className={`ml-2 text-sm ${step.done ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'}`}>
                  {step.label}
                </span>
                {i < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-3 ${step.done ? 'bg-[var(--accent)]' : 'bg-[var(--border-color)]'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Panel - Upload/Preview */}
        <div className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            {status === 'idle' && !preview && (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`
                  animate-fade-in relative rounded-2xl border-2 border-dashed p-12 text-center transition-all duration-300 cursor-pointer
                  ${isDragging 
                    ? 'border-[var(--accent)] bg-[var(--accent-dim)]' 
                    : 'border-[var(--border-color)] hover:border-[var(--text-muted)] bg-[var(--bg-secondary)]'}
                `}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  className="hidden"
                />
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center">
                  <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Drop your image here</h3>
                <p className="text-[var(--text-secondary)] mb-4">or click to browse files</p>
                <p className="text-sm text-[var(--text-muted)]">Supports JPG, PNG, WebP up to 10MB</p>
              </div>
            )}

            {(preview || status !== 'idle') && (
              <div className="animate-slide-up space-y-6">
                {/* Image Preview Card */}
                <div className="glass rounded-2xl overflow-hidden">
                  <div className="relative aspect-video bg-[var(--bg-tertiary)]">
                    {preview && (
                      <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                    )}
                    {['processing', 'uploading'].includes(status) && (
                      <div className="absolute inset-0 bg-[var(--bg-primary)]/80 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-12 h-12 mx-auto mb-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                          <p className="text-[var(--text-secondary)]">
                            {status === 'uploading' ? 'Uploading...' : 'AI is analyzing...'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {file && (
                    <div className="p-4 border-t border-[var(--border-color)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium truncate max-w-xs">{file.name}</p>
                          <p className="text-sm text-[var(--text-muted)]">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        {status === 'idle' && (
                          <button
                            onClick={() => { setFile(null); setPreview(null); }}
                            className="p-2 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {status === 'idle' && preview && (
                  <button
                    onClick={handleUpload}
                    className="w-full py-4 rounded-xl bg-[var(--accent)] text-[var(--bg-primary)] font-semibold text-lg hover:bg-[var(--accent-hover)] transition-all duration-300 animate-pulse-glow"
                  >
                    Analyze Image
                  </button>
                )}

                {status === 'review' && (
                  <div className="glass rounded-2xl p-6 space-y-4">
                    <div className="flex items-center gap-3 text-[var(--success)]">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-semibold">Report Ready for Review</span>
                    </div>
                    <p className="text-[var(--text-secondary)]">
                      Your AI-generated report is ready. Review and approve to send via email.
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleApprove}
                        className="flex-1 py-3 rounded-xl bg-[var(--accent)] text-[var(--bg-primary)] font-semibold hover:bg-[var(--accent-hover)] transition-colors"
                      >
                        Approve & Send
                      </button>
                      <button
                        onClick={handleReset}
                        className="px-6 py-3 rounded-xl bg-[var(--danger-dim)] text-[var(--danger)] font-semibold hover:bg-[var(--danger)]/20 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}

                {status === 'sending' && (
                  <div className="glass rounded-2xl p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                    <p className="text-[var(--text-secondary)]">Sending report via email...</p>
                  </div>
                )}

                {status === 'completed' && (
                  <div className="glass rounded-2xl p-6 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-[var(--accent-dim)] flex items-center justify-center">
                      <svg className="w-8 h-8 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-[var(--success)]">Report Delivered!</h3>
                      <p className="text-[var(--text-secondary)] mt-1">Check your email for the PDF report.</p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="px-8 py-3 rounded-xl border border-[var(--border-color)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-tertiary)] transition-colors"
                    >
                      Analyze Another Image
                    </button>
                  </div>
                )}

                {status === 'failed' && (
                  <div className="glass rounded-2xl p-6 text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-[var(--danger-dim)] flex items-center justify-center">
                      <svg className="w-8 h-8 text-[var(--danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-[var(--danger)]">Analysis Failed</h3>
                      <p className="text-[var(--text-secondary)] mt-1">Something went wrong. Please try again.</p>
                    </div>
                    <button
                      onClick={handleReset}
                      className="px-8 py-3 rounded-xl bg-[var(--danger-dim)] text-[var(--danger)] font-medium hover:bg-[var(--danger)]/20 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Logs */}
        <div className="w-96 border-l border-[var(--border-color)] bg-[var(--bg-secondary)] p-6 hidden lg:block">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-[var(--text-secondary)]">Activity Log</h2>
            {logs.length > 0 && (
              <span className="text-xs text-[var(--text-muted)] mono">{logs.length} events</span>
            )}
          </div>
          
          <div className="space-y-2 max-h-[calc(100vh-180px)] overflow-y-auto pr-2">
            {logs.length === 0 ? (
              <p className="text-[var(--text-muted)] text-sm text-center py-8">
                Upload an image to get started
              </p>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className="animate-fade-in flex items-start gap-3 p-3 rounded-lg bg-[var(--bg-tertiary)]"
                >
                  <div className={`
                    w-2 h-2 rounded-full mt-1.5 flex-shrink-0
                    ${log.type === 'success' ? 'bg-[var(--success)]' : ''}
                    ${log.type === 'error' ? 'bg-[var(--danger)]' : ''}
                    ${log.type === 'processing' ? 'bg-[var(--warning)]' : ''}
                    ${log.type === 'info' ? 'bg-[var(--text-muted)]' : ''}
                  `} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)]">{log.message}</p>
                    <p className="text-xs text-[var(--text-muted)] mono mt-0.5">{log.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
