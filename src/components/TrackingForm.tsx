import { useState } from 'react';

export default function TrackingForm() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!trackingNumber.trim()) {
        throw new Error('Please enter a tracking number');
      }

      // Direct navigation to tracking page (works in iframes)
      // The tracking page will validate if the number exists
      const trackingUrl = `/tracking/${encodeURIComponent(trackingNumber.trim())}`;

      // Check if we're in an iframe
      const isInIframe = window.self !== window.top;

      if (isInIframe) {
        // Open in new tab/window when in iframe (avoids cookie/navigation issues)
        window.open(trackingUrl, '_blank');
      } else {
        // Normal navigation when not in iframe
        window.location.href = trackingUrl;
      }

    } catch (err: any) {
      console.error('[Client] Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white pt-20 px-4">
      <div className="w-full max-w-xl mx-auto space-y-6 p-5 rounded-lg border border-gray-200 shadow-sm">
        <div className="space-y-1 pb-2 border-b border-gray-200">
          <h1 className="text-2xl font-semibold text-gray-900">Track your package</h1>
          <p className="text-sm text-gray-700">Real-time shipment updates</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              className="w-full px-3 py-2.5 text-base font-medium rounded-md border border-gray-300 placeholder-gray-600 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition duration-200"
              placeholder="Enter tracking number"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 text-base font-medium text-white bg-black rounded-md hover:bg-orange-500 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Tracking...' : 'Track package'}
          </button>

          {error && (
            <div className="p-3 text-red-700 bg-red-50 rounded-md">
              {error}
            </div>
          )}
        </form>

        <p className="text-center text-gray-700 text-sm font-medium">
          Enter your tracking number to see the latest status of your shipment
        </p>
      </div>
    </main>
  );
}
