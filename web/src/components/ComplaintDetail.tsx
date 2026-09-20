import Image from 'next/image';
import type { Complaint, ComplaintHistory } from '@/lib/types';
import { CATEGORY_LABELS } from '@/lib/constants';
import { PriorityBadge, StatusBadge } from './StatusBadge';
import { SlaCountdown } from './SlaCountdown';
import { Timeline } from './Timeline';

// Shared read-only complaint detail. `imageUrl`/`proofUrl` are pre-signed URLs
// resolved server-side by the caller. `actions` slot renders role-specific
// buttons.
export function ComplaintDetail({
  complaint,
  history,
  imageUrl,
  proofUrl,
  actions,
}: {
  complaint: Complaint;
  history: ComplaintHistory[];
  imageUrl?: string | null;
  proofUrl?: string | null;
  actions?: React.ReactNode;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-mono text-xs text-slate-400">{complaint.code}</p>
              <h1 className="mt-1 text-xl font-semibold text-slate-900">
                {complaint.title}
              </h1>
              <p className="mt-1 text-sm text-slate-500">{complaint.location}</p>
            </div>
            <StatusBadge status={complaint.status} />
          </div>

          <p className="mt-4 whitespace-pre-wrap text-sm text-slate-700">
            {complaint.description}
          </p>

          {complaint.ai_summary && (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              <span className="font-medium">Summary:</span> {complaint.ai_summary}
            </div>
          )}

          {imageUrl && (
            <div className="mt-4">
              <p className="label">Attached image</p>
              <Image
                src={imageUrl}
                alt="Complaint attachment"
                width={480}
                height={320}
                className="rounded-lg border border-slate-200"
              />
            </div>
          )}

          {(complaint.resolution_notes || proofUrl) && (
            <div className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
              <p className="text-sm font-medium text-emerald-800">Resolution</p>
              {complaint.resolution_notes && (
                <p className="mt-1 text-sm text-emerald-700">
                  {complaint.resolution_notes}
                </p>
              )}
              {proofUrl && (
                <a
                  href={proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-sm text-emerald-700 underline"
                >
                  View resolution proof
                </a>
              )}
            </div>
          )}
        </div>

        {actions && <div className="card p-6">{actions}</div>}

        <div className="card p-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">Timeline</h2>
          <Timeline events={history} />
        </div>
      </div>

      <aside className="space-y-4">
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Details</h2>
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Category</dt>
              <dd className="text-slate-800">
                {complaint.category ? CATEGORY_LABELS[complaint.category] : '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Priority</dt>
              <dd><PriorityBadge priority={complaint.priority} /></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">SLA</dt>
              <dd><SlaCountdown deadline={complaint.sla_deadline_at} /></dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Escalation level</dt>
              <dd className="text-slate-800">{complaint.escalation_level}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Source</dt>
              <dd className="text-slate-800">
                {complaint.classification_source ?? '—'}
                {complaint.ai_confidence != null &&
                  ` (${Math.round(complaint.ai_confidence * 100)}%)`}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Created</dt>
              <dd className="text-slate-800">
                {new Date(complaint.created_at).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>
      </aside>
    </div>
  );
}
