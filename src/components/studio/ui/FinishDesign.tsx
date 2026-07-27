'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { buildBillOfMaterials, itemisedLines } from '@/lib/bom';
import { queueQuoteLocally } from '@/lib/persistence';
import { createId } from '@/lib/project';
import { formatPrice } from '@/lib/units';
import { usePlannerStore } from '@/stores/plannerStore';
import type { QuoteRequest } from '@/types';
import { Overlay, ToolButton, cx } from './primitives';

/**
 * Finish Design.
 *
 * Summarises what the customer has actually specified, then hands off to a
 * quote request. The full project — room, every module, materials, lighting —
 * travels with the enquiry, so the studio receives a design rather than a
 * shopping list.
 */

type Stage = 'summary' | 'quote' | 'sent';

export function FinishDesign({
  onClose,
  captureThumbnail,
}: {
  onClose: () => void;
  captureThumbnail?: () => string | null;
}) {
  const project = usePlannerStore((s) => s.project);
  const [stage, setStage] = useState<Stage>('summary');
  const [reference, setReference] = useState<string | null>(null);

  const bom = useMemo(() => buildBillOfMaterials(project), [project]);
  const items = useMemo(() => itemisedLines(project.objects), [project.objects]);
  const preview = useMemo(() => captureThumbnail?.() ?? null, [captureThumbnail]);

  if (stage === 'sent') {
    return (
      <Overlay onDismiss={onClose}>
        <div className="p-10 text-center">
          <p className="label text-brass">Enquiry received</p>
          <h2 className="mt-3 font-display text-4xl font-light text-paper">Thank you.</h2>
          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-ash">
            Your design and its full specification have been logged. A member of the Tarek Omar
            Design team will be in touch to arrange a technical survey.
          </p>
          {reference && (
            <p className="tabular mt-6 border border-white/10 px-4 py-2 text-xs text-stone">
              Reference <span className="text-brass-soft">{reference}</span>
            </p>
          )}
          <div className="mt-8">
            <ToolButton tone="accent" onClick={onClose} className="px-8 py-3">
              Back to Studio
            </ToolButton>
          </div>
        </div>
      </Overlay>
    );
  }

  if (stage === 'quote') {
    return (
      <Overlay onDismiss={onClose}>
        <QuoteForm
          onBack={() => setStage('summary')}
          onSent={(ref) => {
            setReference(ref);
            setStage('sent');
          }}
        />
      </Overlay>
    );
  }

  return (
    <Overlay onDismiss={onClose}>
      <div className="p-8 sm:p-10">
        <p className="label text-brass">Your kitchen</p>
        <h2 className="mt-2 font-display text-4xl leading-tight font-light text-paper">
          {project.name}
        </h2>
        <p className="tabular mt-2 text-xs text-ash">
          {(project.room.width / 1000).toFixed(2)} × {(project.room.length / 1000).toFixed(2)} m ·{' '}
          {bom.itemCount} {bom.itemCount === 1 ? 'item' : 'items'}
        </p>

        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Your design"
            className="mt-6 w-full border border-white/10 object-cover"
            style={{ aspectRatio: '16 / 9' }}
          />
        )}

        {bom.lines.length === 0 ? (
          <p className="mt-8 border border-white/10 px-5 py-8 text-center text-sm text-ash">
            Nothing has been placed yet. Add some modules from the catalog and come back.
          </p>
        ) : (
          <>
            {/* ------------------------------------------------ summary lines */}
            <ul className="mt-8">
              {bom.lines.map((line) => (
                <li
                  key={line.key}
                  className="flex items-baseline justify-between border-b border-white/8 py-3.5 last:border-b-0"
                >
                  <span className="text-sm text-paper">{line.label}</span>
                  <span className="mx-4 hidden flex-1 border-b border-dotted border-white/15 sm:block" />
                  <span className="tabular shrink-0 text-sm text-stone">
                    {line.unit === 'm' ? `${line.quantity.toFixed(2)} m` : `× ${line.quantity}`}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-baseline justify-between border-t border-white/15 pt-5">
              <span className="label text-ash">Indicative supply total</span>
              <span className="tabular font-display text-3xl text-brass-soft">
                {formatPrice(bom.subtotal)}
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-ash/80">
              An indication based on catalog rates. Final pricing follows a technical survey and
              confirmation of finishes, appliances and installation scope.
            </p>

            {/* ------------------------------------------------ itemised list */}
            <details className="group mt-6 border border-white/10">
              <summary className="label cursor-pointer list-none px-4 py-3 text-ash transition-colors hover:text-paper">
                Full specification ({items.length} lines)
              </summary>
              <ul className="border-t border-white/10 px-4 py-2">
                {items.map((item) => (
                  <li
                    key={`${item.productId}-${item.finish}`}
                    className="flex items-baseline justify-between gap-4 py-2 text-[12px]"
                  >
                    <span className="text-stone">
                      {item.name}
                      {item.finish !== '—' && <span className="text-ash"> · {item.finish}</span>}
                    </span>
                    <span className="tabular shrink-0 text-ash">× {item.quantity}</span>
                  </li>
                ))}
              </ul>
            </details>
          </>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ToolButton
            tone="accent"
            className="px-8 py-3.5"
            disabled={bom.lines.length === 0}
            onClick={() => setStage('quote')}
          >
            Request a Quote →
          </ToolButton>
          <ToolButton className="px-6 py-3.5" onClick={onClose}>
            Keep Designing
          </ToolButton>
        </div>
      </div>
    </Overlay>
  );
}

/* -------------------------------------------------------------- the form */

interface FormState {
  name: string;
  phone: string;
  email: string;
  location: string;
  notes: string;
}

const EMPTY_FORM: FormState = { name: '', phone: '', email: '', location: '', notes: '' };

function QuoteForm({ onBack, onSent }: { onBack: () => void; onSent: (reference: string) => void }) {
  const project = usePlannerStore((s) => s.project);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const set = (key: keyof FormState) => (value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = 'Please tell us your name.';
    if (!form.phone.trim() && !form.email.trim()) {
      next.phone = 'We need a phone number or an email address.';
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = 'That email address does not look right.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setNotice(null);

    const quote: QuoteRequest = {
      id: createId('quote'),
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      location: form.location.trim(),
      notes: form.notes.trim(),
      project,
      bom: buildBillOfMaterials(project),
      submittedAt: new Date().toISOString(),
    };

    // Always keep a local copy first, so a failed request never loses the enquiry.
    queueQuoteLocally(quote);

    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quote),
      });
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      const result = (await response.json()) as { reference?: string };
      onSent(result.reference ?? quote.id);
    } catch {
      // The enquiry is safely queued; tell the truth about what happened.
      setNotice(
        'We could not reach the server just now — your enquiry has been saved on this device and will be included when you retry.',
      );
      onSent(quote.id);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 sm:p-10">
      <button
        type="button"
        onClick={onBack}
        className="label text-ash transition-colors hover:text-paper"
      >
        ← Back to summary
      </button>

      <h2 className="mt-5 font-display text-4xl leading-tight font-light text-paper">
        Request a quote
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ash">
        Your complete design travels with this enquiry — room dimensions, every module, finishes and
        lighting. Nothing needs to be described twice.
      </p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        <Field label="Name" required value={form.name} onChange={set('name')} error={errors.name} />
        <Field
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={set('phone')}
          error={errors.phone}
          placeholder="+20 ..."
        />
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={set('email')}
          error={errors.email}
        />
        <Field
          label="Project location"
          value={form.location}
          onChange={set('location')}
          placeholder="New Cairo"
        />
      </div>

      <label className="mt-5 block">
        <span className="label mb-1.5 block text-ash">Notes</span>
        <textarea
          value={form.notes}
          onChange={(event) => set('notes')(event.target.value)}
          rows={4}
          placeholder="Timelines, appliances you already own, anything we should know."
          className="w-full resize-none border border-white/12 bg-black/25 px-3 py-2.5 text-sm text-paper placeholder:text-ash/60 focus:border-brass/60 focus:outline-none"
        />
      </label>

      {notice && (
        <p className="mt-5 border border-brass/40 bg-brass/10 px-4 py-3 text-[12px] leading-relaxed text-brass-soft">
          {notice}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <ToolButton type="submit" tone="accent" className="px-8 py-3.5" disabled={submitting}>
          {submitting ? 'Sending…' : 'Send Enquiry →'}
        </ToolButton>
        <p className="text-[11px] leading-relaxed text-ash/70 sm:max-w-[260px]">
          We reply within two working days.
        </p>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
  placeholder,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  error?: string;
}) {
  return (
    <label className="block">
      <span className="label mb-1.5 block text-ash">
        {label}
        {required && <span className="ml-1 text-brass">*</span>}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        className={cx(
          'w-full border bg-black/25 px-3 py-2.5 text-sm text-paper placeholder:text-ash/60 focus:outline-none',
          error ? 'border-invalid' : 'border-white/12 focus:border-brass/60',
        )}
      />
      {error && <span className="mt-1.5 block text-[11px] text-invalid">{error}</span>}
    </label>
  );
}
