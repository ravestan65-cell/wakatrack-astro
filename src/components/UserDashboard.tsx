import { useState, useEffect } from 'react';
import { Package, TrendingUp, CheckCircle, Plus, Eye, Edit, Trash2 } from 'lucide-react';

interface Shipment {
  id: string;
  trackingNumber: string;
  origin: string;
  destination: string;
  shipmentStatus: string;
  createdAt: string;
}

export default function UserDashboard() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    // Check auth first, then fetch shipments
    checkAuth().then(() => {
      fetchShipments();
    });
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session', { credentials: 'include' });
      const data = await response.json();
      if (data.user) {
        setUser(data.user);
        // If admin, redirect to admin dashboard
        if (data.user.isAdmin) {
          window.location.href = '/admin';
        }
      } else {
        window.location.href = '/login';
      }
    } catch (err) {
      window.location.href = '/login';
    }
  };

  const fetchShipments = async () => {
    try {
      const response = await fetch('/api/user/shipments', { credentials: 'include' });
      const data = await response.json();
      if (data.success) {
        setShipments(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch shipments');
      }
    } catch (err) {
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/';
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      try {
        const response = await fetch(`/api/user/shipments/${id}`, {
          method: 'DELETE',
          credentials: 'include'
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to delete shipment');
        }

        // Refresh the shipments list
        fetchShipments();
      } catch (err) {
        console.error('Error deleting shipment:', err);
        alert('Failed to delete shipment. Please try again.');
      } finally {
        setDeleteConfirm(null);
      }
    } else {
      setDeleteConfirm(id);
      // Auto-reset after 3 seconds
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">My Shipments</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-indigo-100 rounded-full">
                <Package className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">My Shipments</p>
                <p className="text-2xl font-semibold text-gray-900">{shipments.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">In Transit</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {shipments.filter(s => s.shipmentStatus === 'In Transit').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Delivered</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {shipments.filter(s => s.shipmentStatus === 'Delivered').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Your Shipments</h2>
          <a
            href="/dashboard/shipments/new"
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-md hover:bg-orange-500 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create New Shipment
          </a>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
            {error}
          </div>
        )}

        {/* Shipments Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tracking Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Origin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Destination
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {shipments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No shipments yet</p>
                    <p className="text-sm mt-1">Your shipments will appear here once created</p>
                  </td>
                </tr>
              ) : (
                shipments.map((shipment) => (
                  <tr key={shipment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {shipment.trackingNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shipment.origin || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {shipment.destination || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        shipment.shipmentStatus === 'Delivered' ? 'bg-green-100 text-green-800' :
                        shipment.shipmentStatus === 'In Transit' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {shipment.shipmentStatus || 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-3">
                        {/* View/Track */}
                        <button
                          onClick={async () => {
                            const response = await fetch('/api/track', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ trackingNumber: shipment.trackingNumber }),
                            });
                            const data = await response.json();
                            if (data.success) {
                              window.location.href = `/tracking/${shipment.trackingNumber}`;
                            }
                          }}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded"
                          title="View tracking"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Edit */}
                        <a
                          href={`/dashboard/shipments/${shipment.id}/edit`}
                          className="p-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded"
                          title="Edit shipment"
                        >
                          <Edit className="h-4 w-4" />
                        </a>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(shipment.id)}
                          className={`p-1.5 rounded ${
                            deleteConfirm === shipment.id
                              ? 'text-red-600 bg-red-100'
                              : 'text-gray-600 hover:text-red-600 hover:bg-red-100'
                          }`}
                          title={deleteConfirm === shipment.id ? 'Click again to confirm' : 'Delete shipment'}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
