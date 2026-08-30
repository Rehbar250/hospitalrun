/**
 * Role-Based Access Control (RBAC) Constants & Utilities
 * HospitalRun Multi-Role Authorization Engine
 */

const ROLES = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  NURSE: 'NURSE',
  RECEPTIONIST: 'RECEPTIONIST',
  PHARMACIST: 'PHARMACIST',
  LAB_TECH: 'LAB_TECH',
};

const ALL_ROLES = Object.values(ROLES);

/**
 * Checks if a given role is valid in the system
 * @param {string} role 
 * @returns {boolean}
 */
function isValidRole(role) {
  return ALL_ROLES.includes(role);
}

module.exports = {
  ROLES,
  ALL_ROLES,
  isValidRole,
};
