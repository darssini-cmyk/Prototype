export const THRESHOLD = 0.85;
export const regions = [
  { id: 'name', text: 'Sample Trading Company' },
  { id: 'reference', text: 'SYN-2026-014' },
  { id: 'amount', text: '1250.00' }
];

// PUBLIC_INTERFACE
export function resetDemo() {
  /** Return fresh synthetic state; nothing is persisted or fetched. */
  const fields = [
    { id: 'name', label: 'Applicant', value: '', confidence: 0.84, regionId: 'name', validated: false },
    { id: 'reference', label: 'Reference', value: 'SYN-2026-014', confidence: 0.85, regionId: 'reference', validated: false },
    { id: 'amount', label: 'Amount', value: '1250.00', confidence: 0.86, regionId: 'amount', validated: false }
  ];
  return {
    cases: [
      { id: 'SYN-001', team: 'Operations', role: 'Validator', priority: 'High', status: 'Queued', claimedBy: '', documentType: '', classificationFailed: true, fields: structuredClone(fields) },
      { id: 'SYN-002', team: 'Finance', role: 'Analyst', priority: 'Normal', status: 'Queued', claimedBy: '', documentType: 'Invoice', classificationFailed: false, fields: structuredClone(fields) },
      { id: 'SYN-003', team: 'Operations', role: 'Analyst', priority: 'Low', status: 'Reviewed', claimedBy: 'Synthetic operator', documentType: 'Invoice', classificationFailed: false, fields: fields.map(f => ({ ...f, value: regions.find(r => r.id === f.regionId).text, validated: true })) }
    ],
    events: [],
    refreshedAt: null
  };
}

function event(state, caseId, action) {
  return [...state.events, { id: state.events.length + 1, caseId, action, actorLabel: 'Demo operator', timestamp: new Date().toISOString() }];
}

// PUBLIC_INTERFACE
export function claimCase(state, id) {
  /** Pick up once within this state instance; this is not a distributed lock. */
  const item = state.cases.find(c => c.id === id);
  if (!item || item.status !== 'Queued' || item.claimedBy) return state;
  return { ...state, cases: state.cases.map(c => c.id === id ? { ...c, status: 'In Review', claimedBy: 'Demo operator' } : c), events: event(state, id, 'Picked up locally') };
}

// PUBLIC_INTERFACE
export function reviewErrors(item) {
  /** Return specific unmet local review conditions without changing state. */
  if (!item || item.status !== 'In Review') return ['Pick up a queued case before confirming.'];
  const errors = [];
  for (const field of item.fields) {
    if (!field.value.trim()) errors.push(`${field.label}: enter a value.`);
    if (field.confidence < THRESHOLD && !field.validated) errors.push(`${field.label}: validate the low-confidence value.`);
  }
  if (!item.documentType) errors.push('Document type: resolve simulated classification failure.');
  return errors;
}

// PUBLIC_INTERFACE
export function saveReview(state, id) {
  /** Complete one valid local review and append exactly one confirmation event. */
  const item = state.cases.find(c => c.id === id);
  if (reviewErrors(item).length) return state;
  return { ...state, cases: state.cases.map(c => c.id === id ? { ...c, status: 'Reviewed' } : c), events: event(state, id, 'Review confirmed locally') };
}

// PUBLIC_INTERFACE
export function metrics(state) {
  /** Derive monitoring counts from the same queue state shown by the UI. */
  return Object.fromEntries(['Queued', 'In Review', 'Reviewed'].map(status => [status, state.cases.filter(c => c.status === status).length]));
}
