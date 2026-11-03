'use client';

import { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  Check,
  AlertCircle,
  Loader2,
  Users,
  Trash2,
  RefreshCw,
  LogOut,
  ArrowLeft,
  Search,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  ShieldAlert,
  ExternalLink,
  Database,
  Activity,
  Eye,
  FileSpreadsheet,
  CheckCircle2,
  X,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Attendee {
  id: string;
  name: string;
  ticketId: string;
  createdAt: string;
}

interface TemplateInfo {
  isCustom: boolean;
  sizeBytes: number;
}

interface SpreadsheetPreviewRow {
  ticketId: string;
  name: string;
  isNew: boolean;
  existingName?: string | null;
}

interface SpreadsheetPreviewData {
  fileName: string;
  fileSizeBytes: number;
  totalCount: number;
  newCount: number;
  updateCount: number;
  skippedCount: number;
  previewRows: SpreadsheetPreviewRow[];
  allRows: Array<{ ticketId: string; name: string }>;
}

interface DbStatus {
  status: 'connected' | 'error' | 'checking';
  latencyMs?: number;
  host?: string;
  error?: string;
  hint?: string;
  warning?: string | null;
  isDirectSupabase?: boolean;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'manual' | 'manage'>('upload');

  // Template upload state
  const [uploadingTemplate, setUploadingTemplate] = useState(false);
  const [templateMessage, setTemplateMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [templateInfo, setTemplateInfo] = useState<TemplateInfo | null>(null);

  // Spreadsheet upload & preview states
  const [uploadingSpreadsheet, setUploadingSpreadsheet] = useState(false);
  const [spreadsheetMessage, setSpreadsheetMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [spreadsheetPreview, setSpreadsheetPreview] = useState<SpreadsheetPreviewData | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [committingImport, setCommittingImport] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSwapped, setIsSwapped] = useState(false);

  // Manual single attendee entry states
  const [manualName, setManualName] = useState('');
  const [manualTicketId, setManualTicketId] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualMessage, setManualMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete all states
  const [deletingAll, setDeletingAll] = useState(false);

  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [attendeesError, setAttendeesError] = useState<{ message: string; hint?: string } | null>(null);
  const [dbStatus, setDbStatus] = useState<DbStatus>({ status: 'checking' });
  const [stats, setStats] = useState({ total: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const router = useRouter();

  const checkDbStatus = async () => {
    setDbStatus((prev) => ({ ...prev, status: 'checking' }));
    try {
      const res = await fetch('/api/db-status');
      const data = await res.json();
      if (res.ok) {
        setDbStatus(data);
      } else {
        setDbStatus({
          status: 'error',
          latencyMs: data.latencyMs,
          host: data.host,
          error: data.error || 'Failed to connect to database.',
          hint: data.hint,
          isDirectSupabase: data.isDirectSupabase,
        });
      }
    } catch {
      setDbStatus({
        status: 'error',
        error: 'Network failure when testing database connection.',
      });
    }
  };

  const fetchAttendees = async () => {
    setLoadingAttendees(true);
    setAttendeesError(null);
    try {
      const res = await fetch('/api/attendees');
      if (res.ok) {
        const data = await res.json();
        setAttendees(data.attendees || []);
        setStats({ total: data.count || 0 });
      } else if (res.status === 401) {
        router.push('/login');
      } else {
        const errData = await res.json().catch(() => ({}));
        setAttendeesError({
          message: errData.details || errData.error || 'Failed to load attendee records from database.',
          hint: errData.hint,
        });
      }
    } catch {
      console.error('Failed to fetch attendees');
      setAttendeesError({
        message: 'Network error communicating with the attendees API.',
      });
    } finally {
      setLoadingAttendees(false);
    }
  };

  const fetchTemplateInfo = async () => {
    try {
      const res = await fetch('/api/template');
      if (res.ok) {
        const data = await res.json();
        setTemplateInfo(data.info);
      }
    } catch {
      console.error('Failed to fetch template info');
    }
  };

  useEffect(() => {
    fetchAttendees();
    fetchTemplateInfo();
    checkDbStatus();
  }, []);

  // Handle PDF Template Upload
  const handleTemplateUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUploadingTemplate(true);
    setTemplateMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('template') as File | null;

    if (!file || file.size === 0) {
      setTemplateMessage({ type: 'error', text: 'Please select a PDF template file before submitting.' });
      setUploadingTemplate(false);
      return;
    }

    try {
      const res = await fetch('/api/template', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (res.ok) {
        setTemplateMessage({ type: 'success', text: data.message });
        form.reset();
        fetchTemplateInfo();
      } else {
        setTemplateMessage({ type: 'error', text: data.error || 'Failed to upload template.' });
      }
    } catch {
      setTemplateMessage({ type: 'error', text: 'An unexpected error occurred during template upload.' });
    } finally {
      setUploadingTemplate(false);
    }
  };

  // Analyze & Preview Spreadsheet
  const handleAnalyzeSpreadsheet = async (file: File) => {
    if (!file || file.size === 0) return;
    setSelectedFile(file);
    setLoadingPreview(true);
    setSpreadsheetMessage(null);
    setSpreadsheetPreview(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload?preview=true', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.preview) {
        setSpreadsheetPreview(data);
      } else {
        setSpreadsheetMessage({
          type: 'error',
          text: data.error || 'Failed to analyze spreadsheet.',
        });
      }
    } catch {
      setSpreadsheetMessage({
        type: 'error',
        text: 'Network error while analyzing spreadsheet.',
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  // Confirm and Commit the Previewed Attendees
  const handleConfirmImport = async () => {
    if (!spreadsheetPreview || spreadsheetPreview.allRows.length === 0) return;
    setCommittingImport(true);
    setSpreadsheetMessage(null);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'commit',
          entries: spreadsheetPreview.allRows,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSpreadsheetMessage({
          type: 'success',
          text: data.message || `Successfully imported ${data.count} attendees!`,
        });
        setSpreadsheetPreview(null);
        setSelectedFile(null);
        fetchAttendees();
      } else {
        setSpreadsheetMessage({
          type: 'error',
          text: data.error || 'Failed to commit attendees.',
        });
      }
    } catch {
      setSpreadsheetMessage({
        type: 'error',
        text: 'Network error while committing spreadsheet import.',
      });
    } finally {
      setCommittingImport(false);
    }
  };

  const handleCancelPreview = () => {
    setSpreadsheetPreview(null);
    setSelectedFile(null);
    setIsSwapped(false);
  };

  // Swap Column 1 and Column 2 (Ticket ID <-> Name)
  const handleSwapColumns = async () => {
    if (!selectedFile) return;
    const nextSwap = !isSwapped;
    setIsSwapped(nextSwap);
    setLoadingPreview(true);
    setSpreadsheetMessage(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await fetch(`/api/upload?preview=true${nextSwap ? '&swap=true' : ''}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.preview) {
        setSpreadsheetPreview(data);
      }
    } catch {
      console.error('Failed to swap columns');
    } finally {
      setLoadingPreview(false);
    }
  };

  // Handle Spreadsheet Bulk Upload (Direct fallback)
  const handleSpreadsheetUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('file') as File | null;

    if (!file || file.size === 0) {
      setSpreadsheetMessage({ type: 'error', text: 'Please select an Excel (.xlsx, .xls) or CSV file.' });
      return;
    }

    // Trigger preview first
    handleAnalyzeSpreadsheet(file);
  };

  // Handle single attendee manual entry
  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualTicketId.trim()) return;

    setManualSubmitting(true);
    setManualMessage(null);

    try {
      const res = await fetch('/api/attendees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: manualName.trim(),
          ticketId: manualTicketId.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setManualMessage({
          type: 'success',
          text: data.message || `Attendee "${manualName}" added successfully!`,
        });
        setManualName('');
        setManualTicketId('');
        fetchAttendees();
      } else {
        setManualMessage({
          type: 'error',
          text: data.error || 'Failed to save attendee.',
        });
      }
    } catch {
      setManualMessage({
        type: 'error',
        text: 'An error occurred while adding the attendee.',
      });
    } finally {
      setManualSubmitting(false);
    }
  };

  // Delete single attendee
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete attendee "${name}"?`)) return;

    try {
      const res = await fetch(`/api/attendees?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchAttendees();
      } else {
        alert('Failed to delete attendee');
      }
    } catch {
      alert('Error deleting attendee');
    }
  };

  // Delete ALL imported attendees with safety confirmation
  const handleDeleteAll = async () => {
    if (stats.total === 0) {
      alert('No attendee records exist to delete.');
      return;
    }

    const firstConfirm = confirm(
      `⚠️ WARNING: You are about to permanently delete ALL ${stats.total} attendee records!\n\nThis cannot be undone. Do you wish to proceed?`
    );
    if (!firstConfirm) return;

    const typedConfirmation = prompt(
      `To confirm permanent deletion of all ${stats.total} attendees, please type "DELETE ALL" below:`
    );

    if (typedConfirmation !== 'DELETE ALL') {
      alert('Action canceled. You must type "DELETE ALL" exactly to wipe the database.');
      return;
    }

    setDeletingAll(true);
    try {
      const res = await fetch('/api/attendees?all=true', { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        alert(data.message || 'All attendee records have been deleted.');
        fetchAttendees();
        setCurrentPage(1);
      } else {
        alert(data.error || 'Failed to delete all attendees.');
      }
    } catch {
      alert('Network error while attempting to delete all attendees.');
    } finally {
      setDeletingAll(false);
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
                  GDG CLOUD MOTIHARI
                </span>
                <span className="block text-[10px] font-bold text-[#555] -mt-0.5">
                  Admin & Management Console
                </span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Live Database Status Pill in Header */}
            <button
              onClick={() => {
                checkDbStatus();
                fetchAttendees();
              }}
              title={dbStatus.error ? `Error: ${dbStatus.error}` : `Host: ${dbStatus.host || 'Unknown'}`}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-black font-black text-xs uppercase tracking-wider shadow-[2px_2px_0_0_#000] transition-all cursor-pointer select-none ${
                dbStatus.status === 'connected'
                  ? 'bg-[#E6F4EA] text-[#137333] hover:bg-[#ceead6]'
                  : dbStatus.status === 'checking'
                  ? 'bg-[#FEF7E0] text-[#B06000]'
                  : 'bg-[#FCE8E6] text-[#C5221F] hover:bg-[#fad2cf]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  dbStatus.status === 'connected'
                    ? 'bg-[#34A853]'
                    : dbStatus.status === 'checking'
                    ? 'bg-[#FBBC05] animate-pulse'
                    : 'bg-[#EA4335] animate-ping'
                }`}
              />
              <Database className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>
                {dbStatus.status === 'connected'
                  ? `DB Online (${dbStatus.latencyMs}ms)`
                  : dbStatus.status === 'checking'
                  ? 'Testing DB...'
                  : 'DB Offline'}
              </span>
            </button>

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
        {/* Prominent Database Diagnostics Alert if Error */}
        {(dbStatus.status === 'error' || attendeesError) && (
          <div className="rounded-[20px] border-[3px] border-[#EA4335] bg-[#FFF5F5] p-5 sm:p-6 shadow-[5px_5px_0_0_#EA4335] space-y-3">
            <div className="flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-full bg-[#EA4335] text-white flex items-center justify-center font-black flex-shrink-0 mt-0.5 shadow-[1.5px_1.5px_0_0_#000]">
                !
              </div>
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-black text-sm uppercase tracking-wide text-[#C5221F]">
                    Database Connection Issue Detected
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EA4335] text-white text-[10px] font-black uppercase tracking-wider">
                    {dbStatus.host || 'Direct Supabase'}
                  </span>
                </div>
                
                <p className="text-xs font-semibold text-black/85 leading-relaxed font-mono break-all bg-white/70 p-2.5 rounded-lg border border-[#EA4335]/30">
                  {dbStatus.error || attendeesError?.message}
                </p>
                
                {(dbStatus.hint || attendeesError?.hint) && (
                  <div className="p-3.5 bg-white border-2 border-[#EA4335] rounded-xl text-xs space-y-1.5">
                    <p className="font-black text-[#EA4335] uppercase text-[11px] tracking-wider flex items-center gap-1.5">
                      <span>💡</span>
                      <span>How to Fix on Vercel:</span>
                    </p>
                    <p className="text-black/80 font-medium leading-relaxed">
                      {dbStatus.hint || attendeesError?.hint}
                    </p>
                  </div>
                )}

                <div className="pt-1 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      checkDbStatus();
                      fetchAttendees();
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border-2 border-black bg-white hover:bg-[#FFFBF0] text-black font-black text-xs uppercase shadow-[2px_2px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] cursor-pointer transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${dbStatus.status === 'checking' ? 'animate-spin' : ''}`} />
                    <span>Retry Connection</span>
                  </button>
                  <span className="text-[11px] text-black/60 font-semibold">
                    Changes made in Vercel require a Redeploy to take effect.
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

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

          <div className="rounded-[20px] border-[3px] border-black bg-white p-5 shadow-[4px_4px_0_0_#000] flex items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-black bg-[#34A853] text-white flex items-center justify-center font-black shadow-[2px_2px_0_0_#000]">
                <FileText className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-[#666]">
                  Template Status
                </p>
                <h3 className="text-sm font-black text-[#34A853]">
                  {templateInfo?.isCustom ? 'Custom Database Template' : 'Default Template'}
                </h3>
                {templateInfo && templateInfo.sizeBytes > 0 && (
                  <p className="text-[10px] font-mono font-bold text-[#888]">
                    {(templateInfo.sizeBytes / 1024).toFixed(1)} KB
                  </p>
                )}
              </div>
            </div>

            <a
              href="/api/template?preview=true"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full border border-black bg-[#FFF8E7] hover:bg-[#FBBC05] text-[#111] shadow-[1.5px_1.5px_0_0_#000] transition-all"
              title="Preview Active PDF Template"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Database Connection Status Card */}
          <div className="rounded-[20px] border-[3px] border-black bg-white p-5 shadow-[4px_4px_0_0_#000] flex items-center justify-between gap-3">
            <div className="flex items-center gap-4 min-w-0">
              <div
                className={`w-12 h-12 rounded-full border-2 border-black flex items-center justify-center font-black shadow-[2px_2px_0_0_#000] flex-shrink-0 ${
                  dbStatus.status === 'connected'
                    ? 'bg-[#34A853] text-white'
                    : dbStatus.status === 'checking'
                    ? 'bg-[#FBBC05] text-[#111]'
                    : 'bg-[#EA4335] text-white'
                }`}
              >
                <Database className="w-6 h-6 stroke-[2.5]" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-black uppercase tracking-wider text-[#666]">
                  Database Status
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      dbStatus.status === 'connected'
                        ? 'bg-[#34A853]'
                        : dbStatus.status === 'checking'
                        ? 'bg-[#FBBC05] animate-pulse'
                        : 'bg-[#EA4335]'
                    }`}
                  />
                  <h3
                    className={`text-sm font-black truncate ${
                      dbStatus.status === 'connected'
                        ? 'text-[#34A853]'
                        : dbStatus.status === 'checking'
                        ? 'text-[#FBBC05]'
                        : 'text-[#EA4335]'
                    }`}
                  >
                    {dbStatus.status === 'connected'
                      ? `Connected (${dbStatus.latencyMs}ms)`
                      : dbStatus.status === 'checking'
                      ? 'Checking...'
                      : 'Connection Failed'}
                  </h3>
                </div>
                {dbStatus.host && (
                  <p className="text-[10px] font-mono text-[#777] truncate mt-0.5" title={dbStatus.host}>
                    {dbStatus.host}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                checkDbStatus();
                fetchAttendees();
              }}
              disabled={dbStatus.status === 'checking'}
              className="p-2.5 rounded-full border-2 border-black bg-[#FFF8E7] hover:bg-[#FBBC05] text-[#111] shadow-[2px_2px_0_0_#000] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all cursor-pointer flex-shrink-0"
              title="Refresh / Test Database Connection"
            >
              <RefreshCw className={`w-4 h-4 ${dbStatus.status === 'checking' ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Neo-Brutalist Navigation Tabs */}
        <div className="flex flex-wrap gap-2.5 sm:gap-3">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-5 py-2.5 rounded-full border-2 border-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'bg-[#4285F4] text-white shadow-[3px_3px_0_0_#000]'
                : 'bg-white text-[#111] shadow-[2px_2px_0_0_#000] hover:bg-[#FFF8E7]'
            }`}
          >
            Templates & Batch Data
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`px-5 py-2.5 rounded-full border-2 border-black font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'manual'
                ? 'bg-[#FBBC05] text-[#111] shadow-[3px_3px_0_0_#000]'
                : 'bg-white text-[#111] shadow-[2px_2px_0_0_#000] hover:bg-[#FFF8E7]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Manual Single Entry</span>
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

        {/* TAB 1: Independent Template Upload & Spreadsheet Upload */}
        {activeTab === 'upload' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Card A: Certificate PDF Template Upload */}
            <div className="rounded-[24px] border-[3px] border-black bg-white p-6 sm:p-7 shadow-[6px_6px_0_0_#000] space-y-5">
              <div className="flex items-start justify-between gap-3 pb-3 border-b-2 border-black/10">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[#34A853] text-white px-2.5 py-0.5 rounded-full border border-black shadow-[1px_1px_0_0_#000] inline-block mb-1">
                    CERTIFICATE DESIGN
                  </span>
                  <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-[#111]">
                    Certificate PDF Template
                  </h2>
                </div>

                <a
                  href="/api/template?preview=true"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-black bg-[#FFF8E7] hover:bg-[#FBBC05] text-[#111] text-[10px] font-black uppercase tracking-wider shadow-[1px_1px_0_0_#000] transition-all shrink-0"
                >
                  <span>Preview</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <p className="text-xs font-semibold text-[#555] leading-relaxed">
                Upload your official high-resolution certificate template in PDF format. Newly uploaded templates immediately take effect across all generated certificates.
              </p>

              <form onSubmit={handleTemplateUpload} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-[#111]">
                    Select PDF Template (.pdf)
                  </label>
                  <div className="rounded-xl border-2 border-black bg-[#FFF8E7] p-3.5 shadow-[2px_2px_0_0_#000]">
                    <input
                      type="file"
                      name="template"
                      accept=".pdf,application/pdf"
                      required
                      className="block w-full text-xs font-mono font-bold text-[#111] file:mr-3 file:py-1.5 file:px-3.5 file:rounded-full file:border-2 file:border-black file:text-xs file:font-black file:uppercase file:bg-[#34A853] file:text-white file:shadow-[2px_2px_0_0_#000] hover:file:bg-[#2d9147] cursor-pointer"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploadingTemplate}
                  className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#34A853] hover:bg-[#2d9147] text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0_0_#000] hover:shadow-[1.5px_1.5px_0_0_#000] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-y-[3px] transition-all cursor-pointer disabled:opacity-60"
                >
                  {uploadingTemplate ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                      <span>Saving PDF Template...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload & Apply PDF Template</span>
                    </>
                  )}
                </button>
              </form>

              {templateMessage && (
                <div
                  className={`rounded-xl border-2 border-black p-3.5 text-xs font-bold shadow-[2px_2px_0_0_#000] flex items-center gap-2.5 ${
                    templateMessage.type === 'success'
                      ? 'bg-[#E6F4EA] text-[#137333]'
                      : 'bg-[#FCE8E6] text-[#C5221F]'
                  }`}
                >
                  {templateMessage.type === 'success' ? (
                    <Check className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <p>{templateMessage.text}</p>
                </div>
              )}
            </div>

            {/* Card B: Bulk Spreadsheet Attendees Upload with Live Preview */}
            <div className="rounded-[24px] border-[3px] border-black bg-white p-6 sm:p-7 shadow-[6px_6px_0_0_#000] space-y-5">
              <div className="pb-3 border-b-2 border-black/10 flex items-start justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider bg-[#4285F4] text-white px-2.5 py-0.5 rounded-full border border-black shadow-[1px_1px_0_0_#000] inline-block mb-1">
                    ATTENDEE RECORDS
                  </span>
                  <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-[#111]">
                    Batch Spreadsheet Import
                  </h2>
                </div>

                {spreadsheetPreview && (
                  <span className="px-2.5 py-1 rounded-full border border-black bg-[#E6F4EA] text-[#137333] font-black text-[10px] uppercase tracking-wider shadow-[1px_1px_0_0_#000]">
                    Preview Mode
                  </span>
                )}
              </div>

              <p className="text-xs font-semibold text-[#555] leading-relaxed">
                Upload your event attendee check-in roster. Supports Excel (.xlsx, .xls) and CSV with Column 1 = Ticket Order ID, Column 2 = Full Name. A preview with exact record counts will appear before saving.
              </p>

              {/* State 1: File Selection & Analysis */}
              {!spreadsheetPreview && (
                <form onSubmit={handleSpreadsheetUpload} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-black uppercase tracking-wider text-[#111]">
                      Select Spreadsheet (.xlsx, .xls, .csv)
                    </label>
                    <div className="rounded-xl border-2 border-black bg-[#FFF8E7] p-3.5 shadow-[2px_2px_0_0_#000]">
                      <input
                        type="file"
                        name="file"
                        accept=".xlsx, .xls, .csv"
                        required
                        disabled={loadingPreview}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAnalyzeSpreadsheet(file);
                        }}
                        className="block w-full text-xs font-mono font-bold text-[#111] file:mr-3 file:py-1.5 file:px-3.5 file:rounded-full file:border-2 file:border-black file:text-xs file:font-black file:uppercase file:bg-[#4285F4] file:text-white file:shadow-[2px_2px_0_0_#000] hover:file:bg-[#1a73e8] cursor-pointer"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loadingPreview}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#4285F4] hover:bg-[#1a73e8] text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0_0_#000] hover:shadow-[1.5px_1.5px_0_0_#000] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-y-[3px] transition-all cursor-pointer disabled:opacity-60"
                  >
                    {loadingPreview ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                        <span>Analyzing Spreadsheet & Calculating Counts...</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" />
                        <span>Analyze & Preview Attendees</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* State 2: Active Preview with Counts & Data Table */}
              {spreadsheetPreview && (
                <div className="space-y-4 pt-1">
                  {/* File Info Header */}
                  <div className="flex items-center justify-between p-3 rounded-xl border-2 border-black bg-[#FFFBF0] shadow-[2px_2px_0_0_#000]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileSpreadsheet className="w-5 h-5 text-[#4285F4] flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-black text-[#111] truncate">
                          {spreadsheetPreview.fileName}
                        </p>
                        <p className="text-[10px] font-mono text-[#666]">
                          {(spreadsheetPreview.fileSizeBytes / 1024).toFixed(1)} KB • Ready for import
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleCancelPreview}
                      className="p-1.5 rounded-full border border-black bg-white hover:bg-[#FCE8E6] text-black hover:text-[#EA4335] shadow-[1px_1px_0_0_#000] transition-all cursor-pointer flex-shrink-0"
                      title="Discard and choose another file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Count Metrics Badges Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="p-2.5 rounded-xl border-2 border-black bg-[#E8F0FE] text-center shadow-[1.5px_1.5px_0_0_#000]">
                      <p className="text-[9px] font-black uppercase tracking-wider text-[#1967D2]">
                        Total To Import
                      </p>
                      <p className="text-lg font-black text-[#1967D2]">
                        {spreadsheetPreview.totalCount}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl border-2 border-black bg-[#E6F4EA] text-center shadow-[1.5px_1.5px_0_0_#000]">
                      <p className="text-[9px] font-black uppercase tracking-wider text-[#137333]">
                        New Attendees
                      </p>
                      <p className="text-lg font-black text-[#137333]">
                        +{spreadsheetPreview.newCount}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl border-2 border-black bg-[#FEF7E0] text-center shadow-[1.5px_1.5px_0_0_#000]">
                      <p className="text-[9px] font-black uppercase tracking-wider text-[#B06000]">
                        To Update
                      </p>
                      <p className="text-lg font-black text-[#B06000]">
                        {spreadsheetPreview.updateCount}
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl border-2 border-black bg-[#F1F3F4] text-center shadow-[1.5px_1.5px_0_0_#000]">
                      <p className="text-[9px] font-black uppercase tracking-wider text-[#5F6368]">
                        Headers/Empty
                      </p>
                      <p className="text-lg font-black text-[#5F6368]">
                        {spreadsheetPreview.skippedCount}
                      </p>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="rounded-xl border-2 border-black bg-white overflow-hidden shadow-[2px_2px_0_0_#000]">
                    <div className="px-3.5 py-2.5 bg-[#FFF8E7] border-b-2 border-black flex flex-wrap items-center justify-between gap-2 text-[11px] font-black uppercase text-[#111]">
                      <div className="flex items-center gap-2">
                        <span>Preview (First {Math.min(30, spreadsheetPreview.previewRows.length)} rows)</span>
                        <span className="font-mono text-[10px] text-[#666]">
                          • {spreadsheetPreview.totalCount} total entries
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleSwapColumns}
                        disabled={loadingPreview || committingImport}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-black bg-white hover:bg-[#FBBC05] text-[#111] font-black text-[10px] uppercase tracking-wider shadow-[1.5px_1.5px_0_0_#000] active:translate-y-0.5 transition-all cursor-pointer"
                        title="Click if Ticket ID and Name columns are reversed"
                      >
                        <RefreshCw className={`w-3 h-3 ${loadingPreview ? 'animate-spin' : ''}`} />
                        <span>Swap Columns (Name ↔ Ticket)</span>
                      </button>
                    </div>

                    <div className="max-h-[220px] overflow-y-auto divide-y divide-black/10 text-xs">
                      {spreadsheetPreview.previewRows.map((row, idx) => (
                        <div key={idx} className="px-3.5 py-2 flex items-center justify-between hover:bg-[#FFFBF0] transition-colors gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-[10px] text-[#888] w-5 text-right flex-shrink-0">
                              {idx + 1}.
                            </span>
                            <span className="font-mono font-bold text-[#4285F4] text-xs flex-shrink-0">
                              {row.ticketId}
                            </span>
                            <span className="font-black text-[#111] truncate text-xs">
                              {row.name}
                            </span>
                          </div>

                          <div className="flex-shrink-0">
                            {row.isNew ? (
                              <span className="px-2 py-0.5 rounded-full bg-[#E6F4EA] text-[#137333] border border-[#137333]/40 text-[9px] font-black uppercase tracking-wider">
                                + New
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-[#FEF7E0] text-[#B06000] border border-[#B06000]/40 text-[9px] font-black uppercase tracking-wider" title={row.existingName ? `Current name: ${row.existingName}` : 'Already exists'}>
                                ↻ Update
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Buttons: Confirm Import or Cancel */}
                  <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleConfirmImport}
                      disabled={committingImport}
                      className="w-full sm:flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-[#34A853] hover:bg-[#2d9147] text-white font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0_0_#000] hover:shadow-[1.5px_1.5px_0_0_#000] hover:translate-x-[1.5px] hover:translate-y-[1.5px] active:translate-y-[3px] transition-all cursor-pointer disabled:opacity-60"
                    >
                      {committingImport ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                          <span>Importing {spreadsheetPreview.totalCount} Attendees...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                          <span>Confirm & Import ({spreadsheetPreview.totalCount} Records)</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleCancelPreview}
                      disabled={committingImport}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-full bg-white hover:bg-[#FCE8E6] text-[#EA4335] font-black text-xs uppercase tracking-wider border-2 border-black shadow-[2px_2px_0_0_#000] transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              )}

              {spreadsheetMessage && (
                <div
                  className={`rounded-xl border-2 border-black p-3.5 text-xs font-bold shadow-[2px_2px_0_0_#000] flex items-center gap-2.5 ${
                    spreadsheetMessage.type === 'success'
                      ? 'bg-[#E6F4EA] text-[#137333]'
                      : 'bg-[#FCE8E6] text-[#C5221F]'
                  }`}
                >
                  {spreadsheetMessage.type === 'success' ? (
                    <Check className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <p>{spreadsheetMessage.text}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Manual Single Attendee Entry */}
        {activeTab === 'manual' && (
          <div className="rounded-[24px] border-[3px] border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0_0_#000] max-w-2xl space-y-6">
            <div className="space-y-1">
              <span className="text-xs font-black uppercase tracking-[0.08em] text-[#FBBC05] bg-black px-2.5 py-0.5 rounded-md inline-block">
                SINGLE ATTENDEE ENTRY
              </span>
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#111]">
                Add Attendee Manually
              </h2>
              <p className="text-xs sm:text-sm font-semibold text-[#555]">
                Directly add an individual attendee record or issue an on-spot certificate credential.
              </p>
            </div>

            <form onSubmit={handleManualAdd} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-[#111]">
                  Attendee Full Name
                </label>
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="e.g. Aman Dangi"
                  className="w-full h-11 px-4 rounded-xl border-2 border-black bg-white font-sans text-sm font-bold text-[#111] placeholder:text-[#999] shadow-[2.5px_2.5px_0_0_#000] focus:border-[#4285F4] focus:shadow-[3px_3px_0_0_#4285F4] outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-[#111]">
                  Ticket Order ID
                </label>
                <input
                  type="text"
                  value={manualTicketId}
                  onChange={(e) => setManualTicketId(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                  placeholder="e.g. GOOGE252748058 or DF26-9041"
                  className="w-full h-11 px-4 rounded-xl border-2 border-black bg-white font-mono text-sm font-bold text-[#111] placeholder:text-[#999] shadow-[2.5px_2.5px_0_0_#000] focus:border-[#4285F4] focus:shadow-[3px_3px_0_0_#4285F4] outline-none transition-all uppercase"
                  required
                />
                <p className="text-[11px] font-semibold text-[#666]">
                  Spaces are automatically removed. This ID will be used by the attendee to generate and verify their certificate.
                </p>
              </div>

              <button
                type="submit"
                disabled={manualSubmitting}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-[#34A853] hover:bg-[#2d9147] text-white font-black text-xs sm:text-sm uppercase tracking-wider border-2 border-black shadow-[3.5px_3.5px_0_0_#000] hover:shadow-[1.5px_1.5px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-y-[3.5px] transition-all cursor-pointer disabled:opacity-60"
              >
                {manualSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                    <span>Saving Attendee...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 stroke-[2.5]" />
                    <span>Save Attendee Record</span>
                  </>
                )}
              </button>
            </form>

            {manualMessage && (
              <div
                className={`rounded-xl border-2 border-black p-4 text-xs font-bold shadow-[2px_2px_0_0_#000] flex items-center gap-2.5 ${
                  manualMessage.type === 'success'
                    ? 'bg-[#E6F4EA] text-[#137333]'
                    : 'bg-[#FCE8E6] text-[#C5221F]'
                }`}
              >
                {manualMessage.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <p>{manualMessage.text}</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Manage Attendees & Purge All */}
        {activeTab === 'manage' &&
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
                <div className="p-5 sm:p-6 border-b-2 border-black flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#FFFBF0]">
                  <div>
                    <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-[#111]">
                      Registered Attendees ({filteredAttendees.length}
                      {filteredAttendees.length !== attendees.length && ` of ${attendees.length}`})
                    </h2>
                    <p className="text-xs font-semibold text-[#555]">
                      Live database records for GDG CLOUD MOTIHARI.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                    {/* Live Search Input */}
                    <div className="relative flex-1 sm:w-60">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCurrentPage(1);
                        }}
                        placeholder="Search name or ID..."
                        className="w-full h-9 pl-9 pr-3 rounded-full border-2 border-black bg-white text-xs font-mono font-bold text-[#111] placeholder:text-[#888] shadow-[2px_2px_0_0_#000] outline-none focus:border-[#4285F4]"
                      />
                      <Search className="w-3.5 h-3.5 text-black absolute left-3 top-2.5 pointer-events-none" />
                    </div>

                    {/* Quick Manual Add Button */}
                    <button
                      onClick={() => setActiveTab('manual')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black bg-[#FBBC05] hover:bg-[#e2a800] text-black font-black text-xs uppercase tracking-wider shadow-[1.5px_1.5px_0_0_#000] transition-all cursor-pointer shrink-0"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Single</span>
                    </button>

                    {/* Refresh Button */}
                    <button
                      onClick={fetchAttendees}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-black bg-white hover:bg-[#FFF8E7] text-[#111] font-black text-xs uppercase tracking-wider shadow-[1.5px_1.5px_0_0_#000] transition-all cursor-pointer shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingAttendees ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>

                    {/* Delete All Imported Data Button */}
                    <button
                      onClick={handleDeleteAll}
                      disabled={deletingAll || attendees.length === 0}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-black bg-[#EA4335] hover:bg-[#c93427] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs uppercase tracking-wider shadow-[2px_2px_0_0_#000] active:translate-y-0.5 transition-all cursor-pointer shrink-0"
                      title="Delete all attendee records"
                    >
                      {deletingAll ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Delete All Data</span>
                        </>
                      )}
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
                      {loadingAttendees ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-[#555] font-bold">
                            <div className="inline-flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin text-[#4285F4]" />
                              <span>Loading attendee records from database...</span>
                            </div>
                          </td>
                        </tr>
                      ) : attendeesError ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-8 text-center text-[#EA4335] font-bold">
                            <div className="space-y-1.5 max-w-md mx-auto">
                              <p className="font-black uppercase tracking-tight text-xs">⚠️ Database Connection Issue</p>
                              <p className="text-xs text-black/70 font-mono font-normal break-all">{attendeesError.message}</p>
                              <button
                                onClick={fetchAttendees}
                                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border-2 border-black bg-white hover:bg-[#FFFBF0] text-black text-xs font-black uppercase shadow-[2px_2px_0_0_#000] cursor-pointer active:translate-y-0.5 transition-all"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>Retry Fetch</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : paginatedAttendees.length === 0 ? (
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
                                onClick={() => handleDelete(attendee.id, attendee.name)}
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
          })()}
      </main>
    </div>
  );
}
