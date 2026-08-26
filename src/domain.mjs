import { conflict, forbidden, missing } from './errors.mjs';
import { commitmentScope, text } from './validation.mjs';

const transitions = {
  profileCommitment: { from: 'submitted', to: 'commitment_profiled', role: 'commitment_profile_analyst', event: 'commitment_profiled' },
  verifyAvailability: { from: 'commitment_profiled', to: 'availability_verified', role: 'commitment_availability_verifier', event: 'commitment_availability_verified' },
  validateCapacity: { from: 'availability_verified', to: 'capacity_validated', role: 'commitment_capacity_validator', event: 'commitment_capacity_validated' },
  authorizeCommitment: { from: 'capacity_validated', to: 'commitment_authorized', role: 'commitment_authority', event: 'commitment_authorized' },
  releaseCommitment: { from: 'commitment_authorized', to: 'commitment_released', role: 'commitment_registrar', event: 'commitment_released' }
};
const timestamp = () => new Date().toISOString();
const requireRole = (actor, role) => { if (!actor?.id || actor.role !== role) throw forbidden(`role ${role} is required`); };
const requestSeen = (record, requestId) => record.events.some((event) => event.requestId === requestId);

export class AccessPerformanceCommitmentService {
  constructor(store) { this.store = store; }
  submit(input, actor, requestId) {
    requireRole(actor, 'evidence_owner'); const database = this.store.read(); if (database.accessPerformanceCommitmentReviews.some((record) => requestSeen(record, requestId))) throw conflict('request identifier was already used');
    const now = timestamp(); const record = { id: crypto.randomUUID(), supplierId: text(input.supplierId, 'supplier id'), evidenceReference: text(input.evidenceReference, 'evidence reference'), commitmentReference: text(input.commitmentReference, 'commitment reference'), commitmentScope: commitmentScope(input.commitmentScope), status: 'submitted', createdAt: now, updatedAt: now, events: [{ type: 'access_performance_commitment_submitted', actorId: actor.id, requestId, at: now }] };
    database.accessPerformanceCommitmentReviews.push(record); this.store.write(database); return record;
  }
  transition(id, action, input, actor, requestId) {
    const policy = transitions[action]; if (!policy) throw missing('action was not found'); requireRole(actor, policy.role); const database = this.store.read(); const record = database.accessPerformanceCommitmentReviews.find((entry) => entry.id === id);
    if (!record) throw missing('access-performance commitment review was not found'); if (requestSeen(record, requestId)) throw conflict('request identifier was already used'); if (record.status !== policy.from) throw conflict(`access-performance commitment review must be ${policy.from}`);
    const note = text(input.note, 'note'); const now = timestamp(); record.status = policy.to; record.updatedAt = now; record.events.push({ type: policy.event, actorId: actor.id, requestId, note, at: now }); database.accessPerformanceCommitmentReviews = database.accessPerformanceCommitmentReviews.map((entry) => entry.id === id ? record : entry); this.store.write(database); return record;
  }
  get(id) { const record = this.store.read().accessPerformanceCommitmentReviews.find((entry) => entry.id === id); if (!record) throw missing('access-performance commitment review was not found'); return record; }
}
