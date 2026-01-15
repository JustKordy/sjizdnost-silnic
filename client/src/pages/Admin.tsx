import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth.ts';
import ky from 'ky';
import { CheckCircle, XCircle, Clock, MapPin } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

type PendingMarker = {
  id: number;
  lat: number;
  lng: number;
  type: string;
  description: string;
  userId: number;
  approved: number;
  createdAt: string;
};

export default function AdminPage() {
  const { token } = useAuthStore();
  const [pendingMarkers, setPendingMarkers] = useState<PendingMarker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPending = async () => {
    try {
      setLoading(true);
      const data = await ky
        .get(`${API_BASE}/api/admin/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .json<PendingMarker[]>();
      setPendingMarkers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await ky.post(`${API_BASE}/api/admin/approve/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPending();
    } catch {
      alert('Failed to approve');
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Are you sure you want to reject this marker?')) return;
    try {
      await ky.delete(`${API_BASE}/api/admin/reject/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchPending();
    } catch {
      alert('Failed to reject');
    }
  };

  const mapper = (type: string) => {
    const map: Record<string, string> = {
      good: 'Sjízdná',
      medium: 'Pozor',
      bad: 'Špatná',
      snow: 'Sníh',
      ice: 'Led',
      closed: 'Uzavřeno',
    };
    return map[type] || type;
  };

  return (
    <div className="h-full w-full bg-slate-900 text-gray-100 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-slate-400">Správa čekajících hlášení</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="mt-4 text-slate-400">Načítám...</p>
          </div>
        ) : pendingMarkers.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-8 text-center border border-slate-700">
            <Clock className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">Žádná čekající hlášení</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingMarkers.map((marker) => (
              <div
                key={marker.id}
                className="bg-slate-800 rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <MapPin className="w-5 h-5 text-blue-400" />
                      <h3 className="text-lg font-semibold text-white">
                        {mapper(marker.type)}
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full">
                        Čeká na schválení
                      </span>
                    </div>
                    <p className="text-slate-300 mb-3">
                      {marker.description || 'Bez popisu'}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span>ID: {marker.id}</span>
                      <span>User ID: {marker.userId}</span>
                      <span>
                        📍 {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
                      </span>
                      <span>{new Date(marker.createdAt).toLocaleString('cs-CZ')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(marker.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition font-medium"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Schválit
                    </button>
                    <button
                      onClick={() => handleReject(marker.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium"
                    >
                      <XCircle className="w-4 h-4" />
                      Zamítnout
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
