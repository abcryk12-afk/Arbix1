'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminKycPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
  const [isSaving, setIsSaving] = useState(false);

  const [notificationEmails, setNotificationEmails] = useState<string[]>([]);
  const [notificationEmailInput, setNotificationEmailInput] = useState('');
  const [emailsMessage, setEmailsMessage] = useState('');
  const [emailsMessageType, setEmailsMessageType] = useState<'success' | 'error' | ''>('');
  const [isLoadingEmails, setIsLoadingEmails] = useState(true);
  const [isSavingEmails, setIsSavingEmails] = useState(false);

  const hasExistingLogo = useMemo(() => Boolean(logoDataUrl), [logoDataUrl]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          router.push('/admin/login');
          return;
        }

        const res = await fetch('/api/admin/branding', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        if (!cancelled) {
          if (data?.success) {
            setLogoDataUrl(data?.branding?.logoDataUrl || null);
          } else {
            setLogoDataUrl(null);
          }
          setIsLoading(false);
        }
      } catch {
        if (!cancelled) {
          setLogoDataUrl(null);
          setIsLoading(false);
        }
      }
    };

    const loadEmails = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          router.push('/admin/login');
          return;
        }

        const res = await fetch('/api/admin/notification-emails', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => null);
        if (!cancelled) {
          if (data?.success) {
            setNotificationEmails(Array.isArray(data?.emails) ? data.emails : []);
          } else {
            setNotificationEmails([]);
          }
          setIsLoadingEmails(false);
        }
      } catch {
        if (!cancelled) {
          setNotificationEmails([]);
          setIsLoadingEmails(false);
        }
      }
    };

    load();
    loadEmails();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const normalizeEmail = (value: string) => {
    const v = String(value || '').trim().toLowerCase();
    if (!v) return '';
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    return ok ? v : '';
  };

  const handleAddEmail = () => {
    setEmailsMessage('');
    setEmailsMessageType('');

    const normalized = normalizeEmail(notificationEmailInput);
    if (!normalized) {
      setEmailsMessage('Please enter a valid email address.');
      setEmailsMessageType('error');
      return;
    }

    if (notificationEmails.map((e) => String(e).toLowerCase()).includes(normalized)) {
      setEmailsMessage('This email is already added.');
      setEmailsMessageType('error');
      return;
    }

    setNotificationEmails((prev) => [...prev, normalized]);
    setNotificationEmailInput('');
  };

  const handleRemoveEmail = (email: string) => {
    setEmailsMessage('');
    setEmailsMessageType('');
    setNotificationEmails((prev) => prev.filter((e) => e !== email));
  };

  const handleSaveEmails = async () => {
    try {
      setEmailsMessage('');
      setEmailsMessageType('');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      setIsSavingEmails(true);
      const res = await fetch('/api/admin/notification-emails', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ emails: notificationEmails }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        const msg = data?.message || `Failed (HTTP ${res.status})`;
        setEmailsMessage(msg);
        setEmailsMessageType('error');
        return;
      }

      setNotificationEmails(Array.isArray(data?.emails) ? data.emails : notificationEmails);
      setEmailsMessage(data?.message || 'Emails updated');
      setEmailsMessageType('success');
    } catch {
      setEmailsMessage('Failed to update emails. Please try again.');
      setEmailsMessageType('error');
    } finally {
      setIsSavingEmails(false);
    }
  };

  const fileToDataUrl = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handlePickFile = async (file: File | null) => {
    setMessage('');
    setMessageType('');
    setSelectedFile(file);

    if (!file) {
      setPreviewUrl(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setMessage('Please choose a valid image file (PNG/JPG/WebP/SVG).');
      setMessageType('error');
      return;
    }

    if (file.size > 800 * 1024) {
      setMessage('Image is large. For best performance, keep logo under 800KB.');
      setMessageType('error');
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setPreviewUrl(dataUrl);
    } catch {
      setSelectedFile(null);
      setPreviewUrl(null);
      setMessage('Failed to read image. Please try another file.');
      setMessageType('error');
    }
  };

  const handleUpload = async () => {
    try {
      setMessage('');
      setMessageType('');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      if (!selectedFile) {
        setMessage('Please select a logo image first.');
        setMessageType('error');
        return;
      }

      setIsSaving(true);
      const dataUrl = await fileToDataUrl(selectedFile);

      const res = await fetch('/api/admin/branding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ logoDataUrl: dataUrl }),
      });

      const data = await res.json();
      if (!data?.success) {
        setMessage(data?.message || 'Failed to upload logo');
        setMessageType('error');
        return;
      }

      setLogoDataUrl(data?.branding?.logoDataUrl || null);
      setSelectedFile(null);
      setPreviewUrl(null);
      setMessage('Logo updated successfully. It will appear on the website header automatically.');
      setMessageType('success');
    } catch {
      setMessage('Failed to upload logo. Please try again.');
      setMessageType('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    try {
      setMessage('');
      setMessageType('');

      const token = localStorage.getItem('adminToken');
      if (!token) {
        router.push('/admin/login');
        return;
      }

      setIsSaving(true);
      const res = await fetch('/api/admin/branding', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!data?.success) {
        setMessage(data?.message || 'Failed to remove logo');
        setMessageType('error');
        return;
      }

      setLogoDataUrl(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      setMessage('Logo removed. Default branding will be used.');
      setMessageType('success');
    } catch {
      setMessage('Failed to remove logo. Please try again.');
      setMessageType('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-50">
      <section className="border-b border-slate-800 bg-transparent">
        <div className="mx-auto max-w-6xl px-4 py-4 md:py-6">
          <h1 className="text-lg font-semibold tracking-tight md:text-xl">KYC & Branding</h1>
          <p className="mt-1 text-[11px] text-slate-400 md:text-xs">
            KYC review tools will appear here. For now, you can manage your website logo.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-4 md:py-6">
        <div className="arbix-card rounded-2xl p-4 md:p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 md:text-base">Website Logo</h2>
              <p className="mt-1 text-[11px] text-slate-400 md:text-xs">
                Upload a PNG/JPG/WebP/SVG logo. It will be shown on the public website header and dashboard header.
              </p>
            </div>
            <div className="text-[11px] text-slate-400">
              Recommended: 512x512, transparent PNG, under 800KB.
            </div>
          </div>

          {message && (
            <div
              className={
                'mt-3 rounded-lg border px-3 py-2 text-[11px] ' +
                (messageType === 'success'
                  ? 'border-emerald-500/60 bg-emerald-950/20 text-emerald-200'
                  : 'border-red-500/60 bg-red-950/20 text-red-200')
              }
            >
              {message}
            </div>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
              <p className="text-[11px] font-semibold text-slate-200">Current Logo</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-800 bg-slate-950">
                  {isLoading ? (
                    <div className="text-[10px] text-slate-500">...</div>
                  ) : logoDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoDataUrl} alt="Site logo" className="h-10 w-10 object-contain" />
                  ) : (
                    <div className="text-[12px] font-bold text-white">AX</div>
                  )}
                </div>
                <div className="text-[11px] text-slate-300">
                  <div>
                    <span className="text-slate-500">Status:</span>{' '}
                    {isLoading ? 'Loading...' : hasExistingLogo ? 'Custom logo set' : 'Using default'}
                  </div>
                  <div className="mt-1 text-[10px] text-slate-500">
                    Tip: After uploading, refresh the home page to see it immediately.
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRemove}
                  disabled={isSaving || !hasExistingLogo}
                  className="rounded-lg border border-rose-800 bg-rose-500/10 px-3 py-2 text-[11px] text-rose-100 hover:bg-rose-500/15 disabled:opacity-50"
                >
                  Remove Logo
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
              <p className="text-[11px] font-semibold text-slate-200">Upload / Replace Logo</p>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePickFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                className="mt-3 block w-full text-[11px] text-slate-300 file:mr-3 file:rounded-lg file:border file:border-slate-700 file:bg-slate-950 file:px-3 file:py-2 file:text-[11px] file:text-slate-100 hover:file:border-slate-500"
              />

              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-800 bg-slate-950">
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={previewUrl} alt="Logo preview" className="h-10 w-10 object-contain" />
                  ) : (
                    <div className="text-[10px] text-slate-500">Preview</div>
                  )}
                </div>
                <div className="text-[11px] text-slate-400">
                  {selectedFile ? (
                    <>
                      <div className="text-slate-200">{selectedFile.name}</div>
                      <div className="text-[10px] text-slate-500">{Math.round(selectedFile.size / 1024)} KB</div>
                    </>
                  ) : (
                    'Choose an image file to preview.'
                  )}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={isSaving || !selectedFile}
                  className="rounded-lg bg-primary px-4 py-2 text-[11px] font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Logo'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                    setMessage('');
                    setMessageType('');
                  }}
                  disabled={isSaving}
                  className="rounded-lg border border-slate-700 bg-slate-950/40 px-4 py-2 text-[11px] text-slate-100 hover:border-slate-500 disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 md:p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-100 md:text-base">Admin Email Controls</h2>
              <p className="mt-1 text-[11px] text-slate-400 md:text-xs">
                Add email recipients for automatic notifications on new registrations, deposit requests, and withdrawal requests.
              </p>
            </div>
            <div className="text-[11px] text-slate-400">
              {isLoadingEmails ? 'Loading...' : `${notificationEmails.length} email(s) configured`}
            </div>
          </div>

          {emailsMessage && (
            <div
              className={
                'mt-3 rounded-lg border px-3 py-2 text-[11px] ' +
                (emailsMessageType === 'success'
                  ? 'border-emerald-500/60 bg-emerald-950/20 text-emerald-200'
                  : 'border-red-500/60 bg-red-950/20 text-red-200')
              }
            >
              {emailsMessage}
            </div>
          )}

          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px]">
            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
              <p className="text-[11px] font-semibold text-slate-200">Recipients</p>
              <div className="mt-2">
                {isLoadingEmails ? (
                  <div className="text-[11px] text-slate-500">Loading emails...</div>
                ) : notificationEmails.length === 0 ? (
                  <div className="text-[11px] text-slate-500">No emails configured yet.</div>
                ) : (
                  <div className="space-y-2">
                    {notificationEmails.map((e) => (
                      <div key={e} className="flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                        <div className="text-[11px] text-slate-100">{e}</div>
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(e)}
                          disabled={isSavingEmails}
                          className="rounded-lg border border-slate-700 px-2 py-1 text-[10px] text-slate-200 hover:border-slate-500 disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
              <p className="text-[11px] font-semibold text-slate-200">Add Email</p>
              <input
                value={notificationEmailInput}
                onChange={(e) => setNotificationEmailInput(e.target.value)}
                placeholder="name@example.com"
                className="mt-3 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-[11px] text-slate-100 outline-none focus:border-primary"
              />
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddEmail}
                  disabled={isSavingEmails || isLoadingEmails}
                  className="rounded-lg border border-slate-700 bg-slate-950/40 px-3 py-2 text-[11px] text-slate-100 hover:border-slate-500 disabled:opacity-50"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={handleSaveEmails}
                  disabled={isSavingEmails || isLoadingEmails}
                  className="rounded-lg bg-primary px-3 py-2 text-[11px] font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {isSavingEmails ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
              <div className="mt-3 text-[10px] text-slate-500">
                Emails are used only for notifications and do not grant admin access.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
