'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, Check, AlertCircle, Loader2, Users, Trash2, RefreshCw, LogOut, ArrowLeft, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Attendee {
  id: string;
  name: string;
  ticketId: string;
  createdAt: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'manage'>('upload');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [stats, setStats] = useState({ total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const router = useRouter();

  const fetchAttendees = async () => {
    setLoadingAttendees(true);
    try {
      const res = await fetch('/api/attendees');
      if (res.ok) {
        const data = await res.json();
        setAttendees(data.attendees);
        setStats({ total: data.count });
      } else if (res.status === 401) {
        router.push('/login');
      }
    } catch (error) {
      console.error('Failed to fetch attendees');
    } finally {
      setLoadingAttendees(false);
    }
  };

  useEffect(() => {
    fetchAttendees();
  }, []);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: 'success', text: data.message });
        (e.target as HTMLFormElement).reset();
        fetchAttendees();
      } else {
        setMessage({ type: 'error', text: data.error || 'Upload failed' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this attendee record?')) return;

    try {
      const res = await fetch(`/api/attendees?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAttendees();
      } else {
        alert('Failed to delete attendee');
      }
    } catch (error) {
      alert('Error deleting attendee');
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFBF0] text-[#111] font-sans flex flex-col">
      {/* Header Bar */}
      <header className="w-full bg-[#FFFBF0] border-b-2 border-black sticky top-0 z-50">
        <div className="google-stripe" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full border-2 border-black bg-[#4285F4] text-white flex items-center justify-center font-black text-xs shadow-[2px_2px_0_0_#000]">
                GDG
              </div>
              <div>
                <span className="font-black text-sm uppercase tracking-tight text-[#111]">
                  DevFest Ranchi 2026
                </span>
                <span className="block text-[10px] font-bold text-[#555] -mt-0.5">
                  Admin & Management Console
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black bg-white hover:bg-[#FFF8E7] text-[#111] font-black text-xs uppercase tracking-wider shadow-[1.5px_1.5px_0_0_#000] transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public View</span>
            </Link>

            <button
              onClick={async () => {
                await fetch('/api/auth/logout', { method: 'POST' });
                router.push('/login');
                router.refresh();
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-black bg-[#EA4335] text-white font-black text-xs uppercase tracking-wider shadow-[1.5px_1.5px_0_0_#000] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-[20px] border-[3px] border-black bg-white p-5 shadow-[4px_4px_0_0_#000] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-black bg-[#4285F4] text-white flex items-center justify-center font-black shadow-[2px_2px_0_0_#000]">
              <Users className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-[#666]">
                Total Checked-In Attendees
              </p>
              <h3 className="text-2xl font-black text-[#111]">{stats.total}</h3>
            </div>
          </div>

          <div className="rounded-[20px] border-[3px] border-black bg-white p-5 shadow-[4px_4px_0_0_#000] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-black bg-[#34A853] text-white flex items-center justify-center font-black shadow-[2px_2px_0_0_#000]">
              <FileText className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-[#666]">
                Template Status
              </p>
              <h3 className="text-sm font-black text-[#34A853]">Active (Base64 Database)</h3>
            </div>
          </div>

          <div className="rounded-[20px] border-[3px] border-black bg-white p-5 shadow-[4px_4px_0_0_#000] flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-black bg-[#FBBC05] text-[#111] flex items-center justify-center font-black shadow-[2px_2px_0_0_#000]">
              <Check className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-[#666]">
                Verification Engine
              </p>
              <h3 className="text-sm font-black text-[#111]">100% Online & Cryptographic</h3>
            </div>
          </div>
        </div>

        {/* Neo-Brutalist Tabs */}
        <div className="flex gap-3">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-5 py-2.5 rounded-full border-2 border-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-[#4285F4] text-white shadow-[3px_3px_0_0_#000]'
                : 'bg-white text-[#111] shadow-[2px_2px_0_0_#000] hover:bg-[#FFF8E7]'
            }`}
          >
            Upload Data & Templates
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-5 py-2.5 rounded-full border-2 border-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'manage'
                ? 'bg-[#4285F4] text-white shadow-[3px_3px_0_0_#000]'
                : 'bg-white text-[#111] shadow-[2px_2px_0_0_#000] hover:bg-[#FFF8E7]'
            }`}
          >
            Manage Attendees ({stats.total})
          </button>
        </div>

        {/* Tab 1: Upload */}
        {activeTab === 'upload' ? (
          <div className="rounded-[24px] border-[3px] border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0_0_#000] max-w-2xl space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-[0.08em] text-[#4285F4]">
                BATCH IMPORT
              </span>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#111]">
                Upload Attendee List & PDF Template
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-[#555]">
                Upload CSV/Excel check-in records and custom certificate PDF templates.
              </p>
            </div>

            <form onSubmit={handleUpload} className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-[#111]">
                  Attendee Spreadsheet (Excel .xlsx, .xls or CSV)
                </label>
                <div className="rounded-xl border-2 border-black bg-[#FFF8E7] p-4 shadow-[2px_2px_0_0_#000]">
                  <input
                    type="file"
                    name="file"
                    accept=".xlsx, .xls, .csv"
                    className="block w-full text-xs font-mono font-bold text-[#111] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-2 file:border-black file:text-xs file:font-black file:uppercase file:bg-[#4285F4] file:text-white file:shadow-[2px_2px_0_0_#000] hover:file:bg-[#1a73e8]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-black uppercase tracking-wider text-[#111]">
                  Certificate PDF Template
                </label>
                <div className="rounded-xl border-2 border-black bg-[#FFF8E7] p-4 shadow-[2px_2px_0_0_#000]">
                  <input
                    type="file"
                    name="template"
                    accept=".pdf"
                    className="block w-full text-xs font-mono font-bold text-[#111] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-2 file:border-black file:text-xs file:font-black file:uppercase file:bg-[#FBBC05] file:text-[#111] file:shadow-[2px_2px_0_0_#000] hover:file:bg-[#e2a800]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-[#4285F4] hover:bg-[#1a73e8] text-white font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-black shadow-[3.5px_3.5px_0_0_#000] hover:shadow-[1.5px_1.5px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-y-[3.5px] transition-all cursor-pointer disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                    <span>Processing & Updating Database...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload & Process Data</span>
                  </>
                )}
              </button>
            </form>

            {message && (
              <div
                className={`rounded-xl border-2 border-black p-4 text-xs font-bold shadow-[2px_2px_0_0_#000] flex items-center gap-2.5 ${
                  message.type === 'success'
                    ? 'bg-[#E6F4EA] text-[#137333]'
                    : 'bg-[#FCE8E6] text-[#C5221F]'
                }`}
              >
                {message.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <p>{message.text}</p>
              </div>
            )}
          </div>
        ) : (
          /* Tab 2: Manage Attendees */
          (() => {
            const cleanQuery = searchQuery.toLowerCase().trim();
            const filteredAttendees = attendees.filter(
              (a) =>
                !cleanQuery ||
                a.name.toLowerCase().includes(cleanQuery) ||
                a.ticketId.toLowerCase().includes(cleanQuery)
            );
            const totalPages = Math.max(1, Math.ceil(filteredAttendees.length / pageSize));
            const paginatedAttendees = filteredAttendees.slice(
              (currentPage - 1) * pageSize,
              currentPage * pageSize
            );

            return (
              <div className="rounded-[24px] border-[3px] border-black bg-white shadow-[6px_6px_0_0_#000] overflow-hidden space-y-0">
                {/* Search & Actions Header */}
                <div className="p-5 sm:p-6 border-b-2 border-black flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-[#FFFBF0]">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-[#111]">
                      Registered Attendees ({filteredAttendees.length}
                      {filteredAttendees.length !== attendees.length && ` of ${attendees.length}`})
                    </h2>
                    <p className="text-xs font-semibold text-[#555]">
                      Live database records for DevFest Ranchi 2026.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Live Search Input */}
                    <div className="relative flex-1 sm:w-64">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        placeholder="Search name or ticket ID..."
                        className="w-full h-9 pl-9 pr-3 rounded-full border-2 border-black bg-white text-xs font-mono font-bold text-[#111] placeholder:text-[#888] shadow-[2px_2px_0_0_#000] outline-none focus:border-[#4285F4]"
                      />
                      <Search className="w-3.5 h-3.5 text-black absolute left-3 top-2.5 pointer-events-none" />
                    </div>

                    <button
                      onClick={fetchAttendees}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-black bg-white hover:bg-[#FFF8E7] text-[#111] font-black text-xs uppercase tracking-wider shadow-[1.5px_1.5px_0_0_#000] transition-all cursor-pointer shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingAttendees ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>
                </div>

                {/* Attendees Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead className="bg-[#FFF8E7] border-b-2 border-black font-black uppercase text-[11px] text-[#111]">
                      <tr>
                        <th className="px-6 py-3.5">Attendee Name</th>
                        <th className="px-6 py-3.5">Ticket Order ID</th>
                        <th className="px-6 py-3.5">Registration Date</th>
                        <th className="px-6 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/10">
                      {paginatedAttendees.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-[#888] font-bold">
                            {searchQuery ? 'No attendees match your search query.' : 'No attendee records found.'}
                          </td>
                        </tr>
                      ) : (
                        paginatedAttendees.map((attendee) => (
                          <tr key={attendee.id} className="hover:bg-[#FFFBF0] transition-colors">
                            <td className="px-6 py-3.5 font-black text-sm text-[#111]">
                              {attendee.name}
                            </td>
                            <td className="px-6 py-3.5 font-mono font-bold text-xs text-[#4285F4]">
                              {attendee.ticketId}
                            </td>
                            <td className="px-6 py-3.5 text-[#555]">
                              {new Date(attendee.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-3.5 text-right">
                              <button
                                onClick={() => handleDelete(attendee.id)}
                                className="p-2 rounded-full border border-black bg-white text-[#EA4335] hover:bg-[#FCE8E6] shadow-[1px_1px_0_0_#000] transition-all cursor-pointer"
                                title="Delete Attendee"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="p-4 border-t-2 border-black bg-[#FFFBF0] flex flex-col sm:flex-row items-center justify-between gap-3">
                    <p className="text-xs font-bold text-[#666]">
                      Showing {(currentPage - 1) * pageSize + 1} to{' '}
                      {Math.min(currentPage * pageSize, filteredAttendees.length)} of{' '}
                      {filteredAttendees.length} attendees
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-black bg-white hover:bg-[#FFF8E7] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-black uppercase tracking-wider shadow-[1.5px_1.5px_0_0_#000]"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Prev</span>
                      </button>

                      <span className="text-xs font-black font-mono px-3 py-1 rounded-full border border-black bg-[#FBBC05] text-[#111] shadow-[1.5px_1.5px_0_0_#000]">
                        {currentPage} / {totalPages}
                      </span>

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-black bg-white hover:bg-[#FFF8E7] disabled:opacity-40 disabled:cursor-not-allowed text-xs font-black uppercase tracking-wider shadow-[1.5px_1.5px_0_0_#000]"
                      >
                        <span>Next</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })()
        )}
      </main>
    </div>
  );
}
