import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { ImagePicker } from '../../components/ImagePicker';
import { PageHeader } from '../../components/PageHeader';
import { get, post } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import type { Department } from '../../lib/types';
import { uploadImage, validateImage } from '../../lib/upload';
import { useAsync } from '../../lib/useAsync';

export function NewComplaint() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data } = useAsync(() => get<{ departments: Department[] }>('/api/departments'), []);
  const departments = data?.departments ?? [];

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [departmentId, setDepartmentId] = useState(user?.department_id ?? '');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      if (file) {
        const problem = validateImage(file);
        if (problem) {
          setError(problem);
          return;
        }
        try {
          imagePath = await uploadImage(file, 'complaint');
        } catch (err) {
          const detail = err instanceof Error ? err.message : 'Upload failed';
          setError(
            `Photo upload failed: ${detail}. Try again, or remove the photo to submit without it.`,
          );
          return;
        }
      }

      const data = await post<{ complaint: { id: string } }>('/api/complaints', {
        title,
        description,
        location,
        department_id: departmentId || null,
        image_path: imagePath,
      });
      navigate(`/user/complaints/${data.complaint.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="New grievance"
        title="Report an issue"
        description="Describe it clearly. Grievia classifies and routes it automatically."
        actions={
          <Link to="/user/complaints" className="btn-secondary">
            <Icon name="list" className="h-4 w-4" />
            My complaints
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <form onSubmit={onSubmit} className="card overflow-hidden">
          <div className="panel-head">
            <Icon name="document" className="h-4 w-4 text-amber-700" />
            <h2 className="font-display text-sm font-bold text-stone-800">Complaint details</h2>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div>
              <label className="label" htmlFor="title">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                className="input"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. WiFi not working in CSE Lab 3"
                maxLength={120}
              />
              <p className="mt-1 text-[11px] text-stone-400">Keep it short and specific.</p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="label" htmlFor="description">
                  Description <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-stone-400">
                  {description.length} characters
                </span>
              </div>
              <textarea
                id="description"
                className="input min-h-32 resize-y"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What exactly is wrong? When did it start? Who is affected?"
              />
              <p className="mt-1 text-[11px] text-stone-400">
                A meaningful description helps automatic classification.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label" htmlFor="location">
                  Location <span className="text-red-500">*</span>
                </label>
                <input
                  id="location"
                  className="input"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. CSE Block, Room 302"
                />
              </div>
              <div>
                <label className="label" htmlFor="department">
                  Department
                </label>
                <select
                  id="department"
                  className="input"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                >
                  <option value="">— Select —</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="label" htmlFor="image">
                Photo evidence <span className="font-normal text-stone-400">(optional)</span>
              </label>
              <ImagePicker
                id="image"
                file={file}
                onSelect={(next) => {
                  setError(null);
                  if (next) {
                    const problem = validateImage(next);
                    if (problem) {
                      setError(problem);
                      setFile(null);
                      return;
                    }
                  }
                  setFile(next);
                }}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
                <Icon name="alert" className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 border-t border-amber-100 pt-5 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? (
                  'Submitting…'
                ) : (
                  <>
                    Submit complaint
                    <Icon name="arrowRight" className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        <aside className="space-y-4">
          <div className="card p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
              <Icon name="spark" className="h-4 w-4" />
              What happens next
            </div>
            <ol className="mt-3 space-y-3">
              {[
                ['Classified', 'Category and priority are set in under 15ms.'],
                ['Assigned', 'The responsible technician gets it instantly.'],
                ['Tracked', 'An SLA timer starts and escalates if missed.'],
                ['Verified', 'You confirm the fix before it closes.'],
              ].map(([stepTitle, desc], i) => (
                <li key={stepTitle} className="flex gap-2.5">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-800">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-stone-800">{stepTitle}</p>
                    <p className="text-[11px] leading-relaxed text-stone-500">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
              <Icon name="shield" className="h-4 w-4" />
              Better reports
            </div>
            <p className="mt-2 text-xs leading-relaxed text-amber-900/70">
              Mention the exact block, floor, and room. Add a photo if the problem is visible.
              Clear details get fixed faster.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
