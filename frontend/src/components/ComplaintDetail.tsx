import type { ReactNode } from 'react';
import type { Complaint, ComplaintHistory } from '../lib/types';
import { CATEGORY_LABELS } from '../lib/constants';
import { PriorityBadge, StatusBadge } from './StatusBadge';
import { SlaCountdown } from './SlaCountdown';
import { Timeline } from './Timeline';
import { Icon } from './Icon';

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-amber-100 py-2.5 last:border-0">
      <dt className="text-xs font-medium text-stone-500">{label}</dt>
      <dd className="text-right text-sm font-medium text-stone-800">{children}</dd>
    </div>
  );
}

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
  actions?: ReactNode;
}) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-amber-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-800 ring-1 ring-inset ring-amber-200">
              {complaint.code}
            </span>
            <span className="text-[11px] text-stone-400">
              Updated {new Date(complaint.updated_at).toLocaleString()}
            </span>
          </div>
          <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-stone-900">
            {complaint.title}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500">
            <Icon name="building" className="h-4 w-4 text-amber-600" />
            {complaint.location}
          </p>
        </div>
        <StatusBadge status={complaint.status} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* Issue */}
          <section className="card overflow-hidden">
            <div className="panel-head">
              <Icon name="document" className="h-4 w-4 text-amber-700" />
              <h2 className="font-display text-sm font-bold text-stone-800">Issue details</h2>
            </div>
            <div className="p-5">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
                {complaint.description}
              </p>

              {complaint.ai_summary && (
                <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                  <Icon name="spark" className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" />
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                      AI summary
                    </p>
                    <p className="mt-0.5 text-sm text-amber-900/80">{complaint.ai_summary}</p>
                  </div>
                </div>
              )}

              {imageUrl && (
                <div className="mt-5">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-stone-500">
                    Attached evidence
                  </p>
                  <div className="overflow-hidden rounded-xl border border-amber-200 bg-amber-50">
                    <img
                      src={imageUrl}
                      alt="Complaint attachment"
                      className="h-auto w-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Resolution */}
          {(complaint.resolution_notes || proofUrl) && (
            <section className="card overflow-hidden border-emerald-200">
              <div className="flex items-center gap-2 border-b border-emerald-100 bg-emerald-50/60 px-5 py-3">
                <Icon name="checkCircle" className="h-4 w-4 text-emerald-700" />
                <h2 className="font-display text-sm font-bold text-emerald-900">Resolution</h2>
              </div>
              <div className="p-5">
                {complaint.resolution_notes && (
                  <p className="text-sm leading-relaxed text-stone-700">
                    {complaint.resolution_notes}
                  </p>
                )}
                {proofUrl && (
                  <a
                    href={proofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
                  >
                    <Icon name="external" className="h-4 w-4" />
                    View completion proof
                  </a>
                )}
              </div>
            </section>
          )}

          {/* Actions */}
          {actions && (
            <section className="card overflow-hidden">
              <div className="panel-head">
                <Icon name="settings" className="h-4 w-4 text-amber-700" />
                <h2 className="font-display text-sm font-bold text-stone-800">Available actions</h2>
              </div>
              <div className="p-5">{actions}</div>
            </section>
          )}

          {/* Timeline */}
          <section className="card overflow-hidden">
            <div className="panel-head">
              <Icon name="clock" className="h-4 w-4 text-amber-700" />
              <h2 className="font-display text-sm font-bold text-stone-800">Lifecycle timeline</h2>
            </div>
            <div className="p-5">
              <Timeline events={history} />
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between bg-gradient-to-r from-amber-500 to-yellow-500 px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/80">
                  Current status
                </p>
                <p className="mt-0.5 font-display text-lg font-extrabold text-white">
                  {complaint.status.replaceAll('_', ' ')}
                </p>
              </div>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white/20 text-white ring-1 ring-white/30">
                <Icon name="shield" className="h-5 w-5" />
              </span>
            </div>
            <dl className="px-5 py-2">
              <MetaRow label="Priority">
                <PriorityBadge priority={complaint.priority} />
              </MetaRow>
              <MetaRow label="Category">
                {complaint.category ? CATEGORY_LABELS[complaint.category] : '—'}
              </MetaRow>
              <MetaRow label="SLA deadline">
                <SlaCountdown deadline={complaint.sla_deadline_at} />
              </MetaRow>
              <MetaRow label="Escalation level">
                <span className="inline-flex items-center gap-1">
                  <span className="flex gap-0.5">
                    {[1, 2, 3].map((level) => (
                      <span
                        key={level}
                        className={`h-1.5 w-4 rounded-full ${
                          level <= complaint.escalation_level ? 'bg-amber-500' : 'bg-amber-100'
                        }`}
                      />
                    ))}
                  </span>
                  L{complaint.escalation_level}
                </span>
              </MetaRow>
              <MetaRow label="Classified by">
                <span className="inline-flex items-center gap-1">
                  {complaint.classification_source ?? '—'}
                  {complaint.ai_confidence != null && (
                    <span className="text-xs font-normal text-stone-400">
                      {Math.round(complaint.ai_confidence * 100)}%
                    </span>
                  )}
                </span>
              </MetaRow>
              <MetaRow label="Submitted">
                {new Date(complaint.created_at).toLocaleString()}
              </MetaRow>
            </dl>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800">
              <Icon name="shield" className="h-4 w-4" />
              Closed-loop policy
            </div>
            <p className="mt-2 text-xs leading-relaxed text-amber-900/70">
              A technician cannot close this complaint. Only the complainant can confirm the fix
              or reopen it.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
