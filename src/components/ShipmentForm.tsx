import { useState, useEffect } from 'react';

interface ShipmentFormProps {
  initialData?: any;
  shipmentId?: string; // If provided, fetch data from API
  isEditMode?: boolean;
  isUserMode?: boolean; // true for regular users, false for admin
}

// Helper to format timestamp to "MMM DD" format for display
const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return timestamp;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  } catch {
    return timestamp;
  }
};

// Helper to parse "MMM DD" format to ISO timestamp for saving
const parseTimestampToISO = (timestamp: string): string => {
  if (!timestamp) return new Date().toISOString();

  // If already ISO format, return as-is
  if (timestamp.includes('T') || timestamp.includes('-')) {
    return timestamp;
  }

  // Try to parse "MMM DD" format (e.g., "Jan 10")
  const months: Record<string, number> = {
    'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
    'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
  };

  const parts = timestamp.trim().split(/\s+/);
  if (parts.length >= 2) {
    const monthStr = parts[0];
    const day = parseInt(parts[1], 10);
    const monthNum = months[monthStr];

    if (monthNum !== undefined && !isNaN(day)) {
      const year = new Date().getFullYear();
      const date = new Date(year, monthNum, day);
      return date.toISOString();
    }
  }

  // Fallback: return current time
  return new Date().toISOString();
};

export default function ShipmentForm({ initialData = null, shipmentId, isEditMode = false, isUserMode = false }: ShipmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(!!shipmentId); // Loading state for fetching data
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    trackingNumber: '',
    orderReferenceNumber: '',
    customerName: '',
    email: '',
    phoneNumber: '',
    statusDetails: '',
    statusColor: '#22c55e',

    // Origin Address
    senderName: '',
    originStreetAddress: '',
    originCity: '',
    originState: '',
    originCountry: '',
    originPostalCode: '',
    origin: '',

    // Destination Address
    receiverName: '',
    destinationStreetAddress: '',
    destinationCity: '',
    destinationState: '',
    destinationCountry: '',
    destinationPostalCode: '',
    destination: '',

    // Package Details
    weight: '',
    length: '',
    width: '',
    height: '',
    packageType: '',
    contentsDescription: '',
    declaredValue: '',
    shippingMethod: '',

    // Tracking Details
    trackingProgress: 'Pickup',
    shipmentStatus: '',
    currentLocation: '',
    currentCity: '',
    currentState: '',
    description: '',
    estimatedDeliveryDate: '',
    shipmentDate: '',

    // Additional Information
    insuranceDetails: '',
    specialInstructions: '',
    returnInstructions: '',
    customerNotes: '',
  });

  // Note: events are now stored in savedSteps for unified display/editing
  const [currentSteps, setCurrentSteps] = useState({
    step1: '',
    step2: '',
    step3: ''
  });
  const [savedSteps, setSavedSteps] = useState<Array<{
    step1: string;
    step2: string;
    step3: string;
  }>>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  useEffect(() => {
    checkAuth();
    // Only fetch users list for admin mode
    if (!isUserMode) {
      fetchUsers();
    }
    // Fetch shipment data if shipmentId is provided
    if (shipmentId) {
      fetchShipmentData();
    }
  }, [isUserMode, shipmentId]);

  const fetchShipmentData = async () => {
    if (!shipmentId) return;

    try {
      setDataLoading(true);
      const baseUrl = isUserMode ? '/api/user/shipments' : '/api/admin/shipments';
      const response = await fetch(`${baseUrl}/${shipmentId}`, { credentials: 'include' });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch shipment');
      }

      const data = result.data;
      const formattedData = {
        ...data,
        estimatedDeliveryDate: data.estimatedDeliveryDate ?
          new Date(data.estimatedDeliveryDate).toISOString().split('T')[0] : '',
        shipmentDate: data.shipmentDate ?
          new Date(data.shipmentDate).toISOString().split('T')[0] : '',
      };

      setFormData(formattedData);
      setSelectedUserId(data.userId || '');

      // Load existing events into savedSteps so they display in the UI
      if (data.events && Array.isArray(data.events)) {
        const loadedSteps = data.events.map((event: any) => ({
          step1: event.status || '',
          step2: event.location || '',
          step3: event.timestamp ? formatTimestamp(event.timestamp) : ''
        }));
        setSavedSteps(loadedSteps);
      }
    } catch (err) {
      console.error('Error loading shipment:', err);
      setError(err instanceof Error ? err.message : 'Failed to load shipment');
    } finally {
      setDataLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  useEffect(() => {
    if (isEditMode && initialData) {
      const formattedData = {
        ...initialData,
        estimatedDeliveryDate: initialData.estimatedDeliveryDate ?
          new Date(initialData.estimatedDeliveryDate).toISOString().split('T')[0] : '',
        shipmentDate: initialData.shipmentDate ?
          new Date(initialData.shipmentDate).toISOString().split('T')[0] : '',
      };

      setFormData(formattedData);
      setSelectedUserId(initialData.userId || '');

      // Load existing events into savedSteps so they display in the UI
      if (initialData.events && Array.isArray(initialData.events)) {
        const loadedSteps = initialData.events.map((event: any) => ({
          step1: event.status || '',
          step2: event.location || '',
          step3: event.timestamp ? formatTimestamp(event.timestamp) : ''
        }));
        setSavedSteps(loadedSteps);
      }
    }
  }, [isEditMode, initialData]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      if (data.user) {
        setUser(data.user);
      } else {
        window.location.href = '/login';
      }
    } catch (err) {
      window.location.href = '/login';
    }
  };

  const updateOriginAddress = (data: any) => {
    const address = [
      data.originStreetAddress,
      data.originCity,
      data.originState,
      data.originCountry,
      data.originPostalCode
    ].filter(Boolean).join(', ');

    setFormData(prev => ({
      ...prev,
      origin: address
    }));
  };

  const updateDestinationAddress = (data: any) => {
    const address = [
      data.destinationStreetAddress,
      data.destinationCity,
      data.destinationState,
      data.destinationCountry,
      data.destinationPostalCode
    ].filter(Boolean).join(', ');

    setFormData(prev => ({
      ...prev,
      destination: address
    }));
  };

  const updateCurrentLocation = (data: any) => {
    const location = [
      data.currentCity,
      data.currentState
    ].filter(Boolean).join(', ');

    setFormData(prev => ({
      ...prev,
      currentLocation: location
    }));
  };

  const handleStepChange = (field: string, value: string) => {
    setCurrentSteps(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === 'step1') {
      setFormData(prev => ({
        ...prev,
        shipmentStatus: value
      }));
    }
  };

  const saveSteps = () => {
    if (currentSteps.step1 || currentSteps.step2 || currentSteps.step3) {
      setSavedSteps(prev => [...prev, { ...currentSteps }]);
      setCurrentSteps({
        step1: '',
        step2: '',
        step3: ''
      });
    }
  };

  const deleteSteps = (index: number) => {
    setSavedSteps(prev => prev.filter((_, i) => i !== index));
  };

  const trackingProgressOptions = ['Pickup', 'Shipped', 'In Transit', 'Out for Delivery', 'Delivered'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      if (!user) {
        throw new Error('You must be logged in to create a shipment.');
      }

      if (!formData.trackingNumber) {
        throw new Error('Tracking number is required');
      }

      // Convert savedSteps to events format (filter out empty steps, convert timestamp)
      const eventsToSave = savedSteps
        .filter(step => step.step1) // Only save steps with a status
        .map((step, index) => ({
          id: `step-${index}`,
          status: step.step1,
          location: step.step2 || '',
          timestamp: parseTimestampToISO(step.step3),
          description: step.step1
        }));

      console.log('[ShipmentForm] Saving events:', eventsToSave);

      const shipmentData = {
        ...formData,
        events: eventsToSave,
        // Only include userId for admin mode
        ...(isUserMode ? {} : { userId: selectedUserId || null })
      };

      // Use different API endpoints based on mode
      const baseUrl = isUserMode ? '/api/user/shipments' : '/api/admin/shipments';
      const editId = shipmentId || initialData?.id;
      const isEditing = isEditMode || !!shipmentId;
      const url = isEditing
        ? `${baseUrl}/${editId}`
        : baseUrl;

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(shipmentData),
        credentials: 'include'
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || `Failed to ${isEditing ? 'update' : 'create'} shipment`);
      }

      setSuccess(true);

      // Redirect to appropriate dashboard
      setTimeout(() => {
        window.location.href = isUserMode ? '/dashboard' : '/admin';
      }, 2000);

    } catch (err: any) {
      setError(err.message || `Failed to ${isEditMode ? 'update' : 'create'} shipment`);
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = "mt-2 block w-full px-4 py-3 text-base rounded-xl border border-indigo-200 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white/90 transition duration-200 ease-in-out text-black";
  const textareaClassName = "mt-2 block w-full px-4 py-3 text-base rounded-xl border border-indigo-200 shadow-sm focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white/90 transition duration-200 ease-in-out text-black";

  // Show loading spinner while fetching data
  if (dataLoading) {
    return (
      <main className="min-h-screen p-8 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading shipment data...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 bg-gradient-to-br from-purple-100 via-indigo-100 to-blue-100">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <a
            href={isUserMode ? '/dashboard' : '/admin'}
            className="text-indigo-600 hover:text-indigo-900 font-medium"
          >
            ← Back to Dashboard
          </a>
        </div>

        <div className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-indigo-100">
          <h1 className="text-3xl font-bold text-indigo-900 mb-8">
            {isEditMode || shipmentId ? 'Edit Shipment' : 'Create New Shipment'}
          </h1>

          {error && (
            <div className="mb-6 p-4 text-red-700 bg-red-100/80 backdrop-blur-sm rounded-xl border border-red-200">
              {error}
              <a href={isUserMode ? '/dashboard' : '/admin'} className="block mt-2 text-indigo-600 underline">
                Back to Dashboard
              </a>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 text-green-700 bg-green-100/80 backdrop-blur-sm rounded-xl border border-green-200">
              Shipment {isEditMode || shipmentId ? 'updated' : 'created'} successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Form title */}
            <div className="border-b pb-2">
              <h2 className="text-2xl font-semibold text-gray-900">
                {isEditMode ? 'Edit Shipment' : 'Create New Shipment'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {isEditMode
                  ? 'Update the shipment information below'
                  : 'Fill out the information below to create a new shipment'}
              </p>
            </div>

            {/* Tracking History Steps */}
            <div className="space-y-6 bg-white/90 backdrop-blur-sm p-6 rounded-xl border border-indigo-50">
              <h2 className="text-xl font-semibold text-indigo-900">Tracking History Step</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status/Type</label>
                  <input
                    type="text"
                    value={currentSteps.step1}
                    onChange={(e) => handleStepChange('step1', e.target.value)}
                    className={inputClassName}
                    placeholder="e.g., Package Picked Up"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    value={currentSteps.step2}
                    onChange={(e) => handleStepChange('step2', e.target.value)}
                    className={inputClassName}
                    placeholder="e.g., Dallas, Texas"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Timestamp (MMM DD)</label>
                  <input
                    type="text"
                    value={currentSteps.step3}
                    onChange={(e) => handleStepChange('step3', e.target.value)}
                    className={inputClassName}
                    placeholder="e.g., Jan 10, Feb 10, Mar 10"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-4">
                <button
                  type="button"
                  onClick={saveSteps}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Add Step
                </button>
              </div>

              {/* Display saved steps */}
              {savedSteps.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Saved Steps</h3>
                  <div className="space-y-4">
                    {savedSteps.map((step, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-3 gap-4 flex-1">
                          <div>
                            <span className="text-sm text-gray-500">Status:</span>
                            <p className="text-gray-900">{step.step1}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Location:</span>
                            <p className="text-gray-900">{step.step2}</p>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Timestamp:</span>
                            <p className="text-gray-900">{step.step3}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteSteps(index)}
                          className="ml-4 text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Basic Information */}
            <div className="space-y-6 bg-white/90 backdrop-blur-sm p-6 rounded-xl border border-indigo-50">
              <h2 className="text-xl font-semibold text-indigo-900">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tracking Number</label>
                  <input
                    type="text"
                    value={formData.trackingNumber}
                    onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                    className={inputClassName}
                  />
                </div>
                {/* Only show user assignment for admin mode */}
                {!isUserMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assign to User</label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className={inputClassName}
                    >
                      <option value="">-- No user assigned --</option>
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.email} {u.name ? `(${u.name})` : ''}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Assign this shipment to a registered user so they can see it in their dashboard
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Order Reference Number</label>
                  <input
                    type="text"
                    value={formData.orderReferenceNumber}
                    onChange={(e) => setFormData({ ...formData, orderReferenceNumber: e.target.value })}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer Name</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className={inputClassName}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Status Details</label>
                  <input
                    type="text"
                    value={formData.statusDetails}
                    onChange={(e) => setFormData({ ...formData, statusDetails: e.target.value })}
                    className={inputClassName}
                    placeholder="Enter status details"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Status Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.statusColor || '#22c55e'}
                      onChange={(e) => setFormData({ ...formData, statusColor: e.target.value })}
                      className="h-10 w-20 p-1 rounded border border-gray-300"
                    />
                    <div
                      className="px-4 py-2 rounded text-white text-sm"
                      style={{ backgroundColor: formData.statusColor || '#22c55e' }}
                    >
                      Preview Status
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Origin Address */}
            <div className="space-y-6 bg-white/90 backdrop-blur-sm p-6 rounded-xl border border-indigo-50">
              <h2 className="text-xl font-semibold text-indigo-900">Origin Address (Where it leaves from)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Sender Name</label>
                  <input
                    type="text"
                    value={formData.senderName}
                    onChange={(e) => {
                      setFormData({ ...formData, senderName: e.target.value });
                      updateOriginAddress({ ...formData, senderName: e.target.value });
                    }}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Street Address</label>
                  <input
                    type="text"
                    value={formData.originStreetAddress}
                    onChange={(e) => {
                      setFormData({ ...formData, originStreetAddress: e.target.value });
                      updateOriginAddress({ ...formData, originStreetAddress: e.target.value });
                    }}
                    className={inputClassName}
                    placeholder="Enter street address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    value={formData.originCity}
                    onChange={(e) => {
                      setFormData({ ...formData, originCity: e.target.value });
                      updateOriginAddress({ ...formData, originCity: e.target.value });
                    }}
                    className={inputClassName}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State/Province</label>
                  <input
                    type="text"
                    value={formData.originState}
                    onChange={(e) => {
                      setFormData({ ...formData, originState: e.target.value });
                      updateOriginAddress({ ...formData, originState: e.target.value });
                    }}
                    className={inputClassName}
                    placeholder="Enter state/province"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <input
                    type="text"
                    value={formData.originCountry}
                    onChange={(e) => {
                      setFormData({ ...formData, originCountry: e.target.value });
                      updateOriginAddress({ ...formData, originCountry: e.target.value });
                    }}
                    className={inputClassName}
                    placeholder="Enter country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                  <input
                    type="text"
                    value={formData.originPostalCode}
                    onChange={(e) => {
                      setFormData({ ...formData, originPostalCode: e.target.value });
                      updateOriginAddress({ ...formData, originPostalCode: e.target.value });
                    }}
                    className={inputClassName}
                    placeholder="Enter postal code"
                  />
                </div>
              </div>
            </div>

            {/* Destination Address */}
            <div className="space-y-6 bg-white/90 backdrop-blur-sm p-6 rounded-xl border border-indigo-50">
              <h2 className="text-xl font-semibold text-indigo-900">Destination Address (Where it's going)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Receiver Name</label>
                  <input
                    type="text"
                    value={formData.receiverName}
                    onChange={(e) => {
                      setFormData({ ...formData, receiverName: e.target.value });
                      updateDestinationAddress({ ...formData, receiverName: e.target.value });
                    }}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Street Address</label>
                  <input
                    type="text"
                    value={formData.destinationStreetAddress}
                    onChange={(e) => {
                      setFormData({ ...formData, destinationStreetAddress: e.target.value });
                      updateDestinationAddress({ ...formData, destinationStreetAddress: e.target.value });
                    }}
                    className={inputClassName}
                    placeholder="Enter street address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    value={formData.destinationCity}
                    onChange={(e) => {
                      setFormData({ ...formData, destinationCity: e.target.value });
                      updateDestinationAddress({ ...formData, destinationCity: e.target.value });
                    }}
                    className={inputClassName}
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State/Province</label>
                  <input
                    type="text"
                    value={formData.destinationState}
                    onChange={(e) => {
                      setFormData({ ...formData, destinationState: e.target.value });
                      updateDestinationAddress({ ...formData, destinationState: e.target.value });
                    }}
                    className={inputClassName}
                    placeholder="Enter state/province"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Country</label>
                  <input
                    type="text"
                    value={formData.destinationCountry}
                    onChange={(e) => {
                      setFormData({ ...formData, destinationCountry: e.target.value });
                      updateDestinationAddress({ ...formData, destinationCountry: e.target.value });
                    }}
                    className={inputClassName}
                    placeholder="Enter country"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Postal Code</label>
                  <input
                    type="text"
                    value={formData.destinationPostalCode}
                    onChange={(e) => {
                      setFormData({ ...formData, destinationPostalCode: e.target.value });
                      updateDestinationAddress({ ...formData, destinationPostalCode: e.target.value });
                    }}
                    className={inputClassName}
                    placeholder="Enter postal code"
                  />
                </div>
              </div>
            </div>

            {/* Current Location */}
            <div className="space-y-6 bg-white/90 backdrop-blur-sm p-6 rounded-xl border border-indigo-50">
              <h2 className="text-xl font-semibold text-indigo-900">Current Location</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">City</label>
                  <input
                    type="text"
                    value={formData.currentCity || ''}
                    onChange={(e) => {
                      const newCity = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        currentCity: newCity,
                        currentLocation: `${newCity}${prev.currentState ? `, ${prev.currentState}` : ''}`
                      }));
                      updateCurrentLocation({
                        ...formData,
                        currentCity: newCity
                      });
                    }}
                    className={inputClassName}
                    placeholder="Enter current city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State/Province</label>
                  <input
                    type="text"
                    value={formData.currentState || ''}
                    onChange={(e) => {
                      const newState = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        currentState: newState,
                        currentLocation: `${prev.currentCity ? `${prev.currentCity}, ` : ''}${newState}`
                      }));
                      updateCurrentLocation({
                        ...formData,
                        currentState: newState
                      });
                    }}
                    className={inputClassName}
                    placeholder="Enter current state/province"
                  />
                </div>
              </div>
            </div>

            {/* Package Details */}
            <div className="space-y-6 bg-white/90 backdrop-blur-sm p-6 rounded-xl border border-indigo-50">
              <h2 className="text-xl font-semibold text-indigo-900">Package Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Length (cm)</label>
                  <input
                    type="number"
                    value={formData.length}
                    onChange={(e) => setFormData({ ...formData, length: e.target.value })}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Width (cm)</label>
                  <input
                    type="number"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: e.target.value })}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Package Type</label>
                  <input
                    type="text"
                    value={formData.packageType}
                    onChange={(e) => setFormData({ ...formData, packageType: e.target.value })}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Contents Description</label>
                  <textarea
                    value={formData.contentsDescription}
                    onChange={(e) => setFormData({ ...formData, contentsDescription: e.target.value })}
                    className={textareaClassName}
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Shipping Details */}
            <div className="space-y-6 bg-white/90 backdrop-blur-sm p-6 rounded-xl border border-indigo-50">
              <h2 className="text-xl font-semibold text-indigo-900">Shipping Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Origin</label>
                  <input
                    type="text"
                    value={formData.origin}
                    onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Destination</label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Tracking Progress</label>
                  <select
                    value={formData.trackingProgress}
                    onChange={(e) => setFormData({ ...formData, trackingProgress: e.target.value })}
                    className={inputClassName}
                  >
                    {trackingProgressOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Shipment Status</label>
                  <input
                    type="text"
                    value={formData.shipmentStatus}
                    onChange={(e) => setFormData({ ...formData, shipmentStatus: e.target.value })}
                    className={inputClassName}
                    placeholder="Enter shipment status"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Location</label>
                  <input
                    type="text"
                    value={formData.currentLocation}
                    onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className={textareaClassName}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Shipping Date</label>
                  <input
                    type="date"
                    value={formData.shipmentDate || ''}
                    onChange={(e) => setFormData({ ...formData, shipmentDate: e.target.value })}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Delivery Date</label>
                  <input
                    type="date"
                    value={formData.estimatedDeliveryDate || ''}
                    onChange={(e) => setFormData({ ...formData, estimatedDeliveryDate: e.target.value })}
                    className={inputClassName}
                  />
                </div>
              </div>
            </div>

            {/* Submit button */}
            <div className="flex justify-end space-x-4">
              <a
                href={isUserMode ? '/dashboard' : '/admin'}
                className="bg-gray-200 text-gray-800 hover:bg-gray-300 px-4 py-2 rounded-md font-medium"
              >
                Cancel
              </a>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md font-medium disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : isEditMode ? 'Update Shipment' : 'Create Shipment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
