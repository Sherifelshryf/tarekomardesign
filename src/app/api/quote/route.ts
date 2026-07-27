import { NextResponse } from 'next/server';
import type { QuoteRequest } from '@/types';

/**
 * Quote intake.
 *
 * Validates and acknowledges an enquiry carrying the complete project. There is
 * no mail service or database wired up yet, so this deliberately does not
 * pretend to deliver anything — it validates the payload, logs it server-side,
 * and returns a reference. Adding persistence or email later means replacing
 * the body of `record()` and nothing else; the client contract is already set.
 */

export const runtime = 'nodejs';

interface QuoteResponse {
  ok: boolean;
  reference?: string;
  error?: string;
}

function isQuoteRequest(value: unknown): value is QuoteRequest {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<QuoteRequest>;
  return (
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0 &&
    (typeof candidate.phone === 'string' || typeof candidate.email === 'string') &&
    typeof candidate.project === 'object' &&
    candidate.project !== null
  );
}

async function record(quote: QuoteRequest): Promise<string> {
  const reference = `TOD-${new Date().getFullYear()}-${quote.id.slice(-6).toUpperCase()}`;

  // Replace this with a database insert and a notification to the studio.
  console.info('[TOD] Quote request', {
    reference,
    name: quote.name,
    location: quote.location,
    modules: quote.project.objects.length,
    room: `${quote.project.room.width}×${quote.project.room.length} mm`,
    subtotal: quote.bom?.subtotal,
  });

  return reference;
}

export async function POST(request: Request): Promise<NextResponse<QuoteResponse>> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Malformed request body.' }, { status: 400 });
  }

  if (!isQuoteRequest(payload)) {
    return NextResponse.json(
      { ok: false, error: 'A name and either a phone number or an email address are required.' },
      { status: 422 },
    );
  }

  const reference = await record(payload);
  return NextResponse.json({ ok: true, reference });
}
