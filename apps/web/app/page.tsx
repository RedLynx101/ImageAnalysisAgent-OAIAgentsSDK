"use client";

import { useState, useEffect } from 'react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('idle');
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setStatus('uploading');
    addLog('Uploading image...');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.id) {
        setJobId(data.id);
        setStatus('processing');
        addLog(`Job started: ${data.id}`);
      } else {
        setStatus('error');
        addLog('Upload failed');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      addLog('Upload error');
    }
  };

  const handleApprove = async () => {
    if (!jobId || !pdfPath) return;
    addLog('Approving report...');
    try {
      await fetch(`/api/jobs/${jobId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfPath })
      });
      addLog('Approval sent. Emailing report...');
      setStatus('completed'); // Or 'emailing'
    } catch (err) {
      addLog('Approval failed');
    }
  };

  useEffect(() => {
    if (!jobId || status === 'completed' || status === 'failed') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${jobId}`);
        const data = await res.json();
        
        // Trigger.dev status mapping
        // If the generateReport job is completed, we are ready for review
        if (data.status === 'COMPLETED') {
          setStatus('review');
          setPdfPath(data.output?.pdfPath);
          addLog('Report generated. Waiting for approval.');
          clearInterval(interval);
        } else if (data.status === 'FAILED') {
          setStatus('failed');
          addLog('Job failed.');
          clearInterval(interval);
        } else {
          // still running
          addLog(`Status: ${data.status}`);
        }
      } catch (err) {
        console.error(err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [jobId, status]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">AI Image Analyst</h1>
        
        {status === 'idle' && (
          <form onSubmit={handleUpload} className="flex flex-col gap-4">
            <input 
              type="file" 
              accept="image/*" 
              onChange={(e) => setFile(e.target.files?.[0] || null)} 
              className="border p-2 rounded"
            />
            <button 
              type="submit" 
              disabled={!file}
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
            >
              Analyze Image
            </button>
          </form>
        )}

        {status === 'uploading' && <p>Uploading...</p>}
        
        {status === 'processing' && (
           <div className="mt-4">
             <p className="animate-pulse">Agent is analyzing image and researching...</p>
           </div>
        )}

        {status === 'review' && pdfPath && (
          <div className="mt-4 p-4 border rounded bg-green-50">
            <h2 className="text-xl font-bold mb-2">Report Ready!</h2>
            <p className="mb-4">The PDF has been generated at: {pdfPath}</p>
            {/* In a real app, we'd serve the file via an endpoint. For local dev, we just show path */}
            
            <div className="flex gap-4">
              <button 
                onClick={handleApprove}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Approve & Email
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
              >
                Reject & Reset
              </button>
            </div>
          </div>
        )}

        {status === 'completed' && (
          <div className="mt-4 text-green-600 font-bold">
            Email sent successfully!
            <button onClick={() => window.location.reload()} className="block mt-4 text-blue-500 underline">Start Over</button>
          </div>
        )}

        <div className="mt-8 p-4 bg-gray-100 rounded w-full h-64 overflow-y-auto">
          <h3 className="font-bold mb-2">Logs:</h3>
          {logs.map((log, i) => <div key={i}>{log}</div>)}
        </div>
      </div>
    </main>
  );
}

