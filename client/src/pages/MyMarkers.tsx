import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth.ts';
import ky from 'ky';
import { CheckCircle, Clock, Trash2, MapPin } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';

type MyMarker = {
  id: number;
  lat: number;
  lng: number;
  type: string;
  description: string;
  approved: number;
  createdAt: string;
};

export default function MyMarkersPage() {
  const { token, userId } = useAuthStore();
  const [markers, setMarkers] = useState<MyMarker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMyMarkers = async () => {
    try {
      setLoading(true);
      const data = await ky
        .get(`${API_BASE}/api/markers/search?userId=${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .json<MyMarker[]>();
      setMarkers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Opravdu smazat toto hlášení?')) return;
    try {
      await ky.delete(`${API_BASE}/api/markers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchMyMarkers();
    } catch {
      alert('Nepodařilo se smazat');
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

  const pending = markers.filter((m) => m.approved === 0);
  const approved = markers.filter((m) => m.approved === 1);

  return (
    <div className="h-full w-full bg-slate-900 text-gray-100 p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Moje hlášení</h1>
          <p className="text-slate-400">Přehled vašich reportů</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <p className="mt-4 text-slate-400">Načítám...</p>
          </div>
        ) : markers.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-8 text-center border border-slate-700">
            <MapPin className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-400">Zatím nemáte žádná hlášení</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pending Markers */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                Čekající na schválení ({pending.length})
              </h2>
              {pending.length === 0 ? (
                <p className="text-slate-500 text-sm">Žádná čekající hlášení</p>
              ) : (
                <div className="grid gap-3">
                  {pending.map((marker) => (
                    <div
                      key={marker.id}
                      className="bg-slate-800 rounded-xl p-4 border border-yellow-500/30 hover:border-yellow-500/50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              {mapper(marker.type)}
                            </h3>
                            <span className="px-2 py-1 text-xs font-medium bg-yellow-500/20 text-yellow-400 rounded-full">
                              Čeká
                            </span>
                          </div>
                          <p className="text-slate-300 mb-2">
                            {marker.description || 'Bez popisu'}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span>
                              📍 {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
                            </span>
                            <span>{new Date(marker.createdAt).toLocaleString('cs-CZ')}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(marker.id)}
                          className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Smazat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Approved Markers */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                Schválené ({approved.length})
              </h2>
              {approved.length === 0 ? (
                <p className="text-slate-500 text-sm">Žádná schválená hlášení</p>
              ) : (
                <div className="grid gap-3">
                  {approved.map((marker) => (
                    <div
                      key={marker.id}
                      className="bg-slate-800 rounded-xl p-4 border border-green-500/30 hover:border-green-500/50 transition"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              {mapper(marker.type)}
                            </h3>
                            <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-full">
                              Schváleno
                            </span>
                          </div>
                          <p className="text-slate-300 mb-2">
                            {marker.description || 'Bez popisu'}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-slate-400">
                            <span>
                              📍 {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
                            </span>
                            <span>{new Date(marker.createdAt).toLocaleString('cs-CZ')}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleDelete(marker.id)}
                          className="flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Smazat
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
