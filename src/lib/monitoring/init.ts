import monitoringService from './service';

let isInitialized = false;

export function initializeMonitoring() {
  if (isInitialized) {
    return;
  }

  console.log('Starting monitoring service...');
  monitoringService.start().catch(error => {
    console.error('Failed to start monitoring service:', error);
  });

  isInitialized = true;

  // Handle cleanup on shutdown
  const cleanup = () => {
    console.log('Shutting down monitoring service...');
    monitoringService.stop();
  };

  if (typeof window === 'undefined') {
    // Server-side
    process.on('SIGTERM', cleanup);
    process.on('SIGINT', cleanup);
  } else {
    // Client-side
    window.addEventListener('beforeunload', cleanup);
  }
}

// Initialize immediately if we're on the server side
if (typeof window === 'undefined') {
  initializeMonitoring();
} 