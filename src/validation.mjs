import { inputError } from './errors.mjs';

export const text = (value, name) => {
  if (typeof value !== 'string' || !value.trim()) throw inputError(`${name} is required`);
  return value.trim();
};

export const commitmentScope = (value) => {
  value = text(value, 'commitment scope');
  if (!['access_entitlement_commitment', 'evidence_capacity_commitment', 'exception_route_commitment'].includes(value)) throw inputError('commitment scope is invalid');
  return value;
};

export const actor = (headers) => ({ id: headers['x-actor-id'], role: headers['x-actor-role'] });
