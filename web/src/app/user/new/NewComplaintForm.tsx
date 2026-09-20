'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Department } from '@/lib/types';

export function NewComplaintForm({
  departments,
  defaultDepartmentId,
}: {
  departments: Department[];
  defaultDepartmentId: string | null;
}) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [departmentId, setDepartmentId] = useState(defaultDepartmentId ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function uploadImage(): Promise<string | null> {
    if (!file) return null;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('prefix', 'complaint');
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    if (!res.ok) return null;
    const data = await res.json();
    return data.path ?? null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (description.trim().length < 10) {
      setError('Please describe the issue in at least 10 characters.');
      return;
    }
    setLoading(true);
    try {
      let imagePath: string | null = null;
      try {
        imagePath = await uploadImage();
      } catch {
        /* image optional */
      }

      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          location,
          department_id: departmentId || null,
          image_path: imagePath,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to submit complaint');
        return;
      }
      router.push(`/user/complaints/${data.complaint.id}`);
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6">
      <div>
        <label className="label" htmlFor="title">Title</label>
        <input id="title" className="input" required value={title}
          onChange={(e) => setTitle(e.target.value)} placeholder="e.g. WiFi not working in CSE Lab 3" />
      </div>
      <div>
        <label className="label" htmlFor="description">Description</label>
        <textarea id="description" className="input min-h-28" required value={description}
          onChange={(e) => setDescription(e.target.value)} placeholder="Describe the problem in detail…" />
        <p className="mt-1 text-xs text-slate-400">A meaningful description helps automatic classification.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="location">Location</label>
          <input id="location" className="input" required value={location}
            onChange={(e) => setLocation(e.target.value)} placeholder="e.g. CSE Block, Room 302" />
        </div>
        <div>
          <label className="label" htmlFor="department">Department</label>
          <select id="department" className="input" value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}>
            <option value="">— Select —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="image">Image (optional)</label>
        <input id="image" type="file" accept="image/*"
          className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? 'Submitting…' : 'Submit complaint'}
      </button>
    </form>
  );
}
