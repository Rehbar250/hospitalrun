/**
 * Role-Based Access Control (RBAC) Client Utilities
 * HospitalRun - Hospital Information & Healthcare Management System
 */

export const ROLES = {
  ADMIN: 'ADMIN',
  DOCTOR: 'DOCTOR',
  NURSE: 'NURSE',
  RECEPTIONIST: 'RECEPTIONIST',
  PHARMACIST: 'PHARMACIST',
  LAB_TECH: 'LAB_TECH',
};

export const ROLE_INFO = {
  [ROLES.ADMIN]: {
    label: 'System Admin',
    fullName: 'System Administrator',
    badgeClass: 'role-badge-admin',
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.12)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    icon: '👑',
    description: 'Full administrative access and security audits',
  },
  [ROLES.DOCTOR]: {
    label: 'Doctor',
    fullName: 'Medical Doctor / Physician',
    badgeClass: 'role-badge-doctor',
    color: '#2563eb',
    bgColor: 'rgba(37, 99, 235, 0.12)',
    borderColor: 'rgba(37, 99, 235, 0.3)',
    icon: '👨‍⚕️',
    description: 'Clinical diagnoses, AI decision support, prescriptions',
  },
  [ROLES.NURSE]: {
    label: 'Nurse',
    fullName: 'Staff Nurse',
    badgeClass: 'role-badge-nurse',
    color: '#0d9488',
    bgColor: 'rgba(13, 148, 136, 0.12)',
    borderColor: 'rgba(13, 148, 136, 0.3)',
    icon: '👩‍⚕️',
    description: 'Vitals recording, patient care, appointment management',
  },
  [ROLES.RECEPTIONIST]: {
    label: 'Receptionist',
    fullName: 'Front Desk Receptionist',
    badgeClass: 'role-badge-receptionist',
    color: '#d97706',
    bgColor: 'rgba(217, 119, 6, 0.12)',
    borderColor: 'rgba(217, 119, 6, 0.3)',
    icon: '🏢',
    description: 'Patient registration, appointment booking, billing & invoices',
  },
  [ROLES.PHARMACIST]: {
    label: 'Pharmacist',
    fullName: 'Chief Pharmacist',
    badgeClass: 'role-badge-pharmacist',
    color: '#059669',
    bgColor: 'rgba(5, 150, 105, 0.12)',
    borderColor: 'rgba(5, 150, 105, 0.3)',
    icon: '💊',
    description: 'Pharmacy inventory, stock management, dispensing',
  },
  [ROLES.LAB_TECH]: {
    label: 'Lab Tech',
    fullName: 'Laboratory Technician',
    badgeClass: 'role-badge-labtech',
    color: '#4f46e5',
    bgColor: 'rgba(79, 70, 229, 0.12)',
    borderColor: 'rgba(79, 70, 229, 0.3)',
    icon: '🧪',
    description: 'Diagnostic investigation, specimen testing, results entry',
  },
};

export const PERMISSIONS = {
  // Navigation & Page Permissions
  VIEW_DASHBOARD: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST, ROLES.PHARMACIST, ROLES.LAB_TECH],
  VIEW_PATIENT_DIRECTORY: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST, ROLES.PHARMACIST, ROLES.LAB_TECH],
  VIEW_APPOINTMENTS: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST],
  VIEW_DOCTORS: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST, ROLES.PHARMACIST, ROLES.LAB_TECH],
  VIEW_LAB_REPORTS: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.LAB_TECH],
  VIEW_PHARMACY: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.PHARMACIST],
  VIEW_CLINICAL_AI: [ROLES.ADMIN, ROLES.DOCTOR],
  VIEW_BILLING: [ROLES.ADMIN, ROLES.RECEPTIONIST],
  VIEW_SETTINGS: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST, ROLES.PHARMACIST, ROLES.LAB_TECH],
  VIEW_AUDIT_LOGS: [ROLES.ADMIN],

  // Specific Actions & Workflows
  PATIENT_INTAKE: [ROLES.ADMIN, ROLES.RECEPTIONIST],
  PATIENT_EDIT: [ROLES.ADMIN, ROLES.RECEPTIONIST],
  PATIENT_DELETE: [ROLES.ADMIN],
  RECORD_VITALS: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE],
  CLINICAL_NOTES_DIAGNOSIS: [ROLES.ADMIN, ROLES.DOCTOR],
  CREATE_PRESCRIPTION: [ROLES.ADMIN, ROLES.DOCTOR],
  AI_DECISION_SUPPORT: [ROLES.ADMIN, ROLES.DOCTOR],
  SCHEDULE_APPOINTMENT: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST],
  RESCHEDULE_APPOINTMENT: [ROLES.ADMIN, ROLES.DOCTOR, ROLES.NURSE, ROLES.RECEPTIONIST],
  CANCEL_APPOINTMENT: [ROLES.ADMIN, ROLES.RECEPTIONIST],
  MANAGE_MEDICINE_STOCK: [ROLES.ADMIN, ROLES.PHARMACIST],
  DISPENSE_PRESCRIPTION: [ROLES.ADMIN, ROLES.PHARMACIST],
  ORDER_LAB_TEST: [ROLES.ADMIN, ROLES.DOCTOR],
  ENTER_LAB_RESULTS: [ROLES.ADMIN, ROLES.LAB_TECH],
  MANAGE_BILLING: [ROLES.ADMIN, ROLES.RECEPTIONIST],
  RECORD_PAYMENT: [ROLES.ADMIN, ROLES.RECEPTIONIST],
  MANAGE_SYSTEM_SETTINGS: [ROLES.ADMIN],
  MANAGE_DOCTORS: [ROLES.ADMIN],
};

/**
 * Checks if the current user object or role string satisfies the allowed roles.
 * @param {Object|string} userOrRole 
 * @param  {...string} allowedRoles 
 * @returns {boolean}
 */
export function hasRole(userOrRole, ...allowedRoles) {
  if (!userOrRole) return false;
  const role = (typeof userOrRole === 'object' ? userOrRole.role : userOrRole) || '';
  const flatAllowed = allowedRoles.flat().map(r => String(r).toUpperCase());
  return flatAllowed.includes(role.toUpperCase());
}

/**
 * Checks if the user has permission to perform a specific action or view a section.
 * @param {Object|string} userOrRole 
 * @param {string} permissionKey 
 * @returns {boolean}
 */
export function hasPermission(userOrRole, permissionKey) {
  if (!userOrRole) return false;
  const allowed = PERMISSIONS[permissionKey];
  if (!allowed) return false;
  return hasRole(userOrRole, allowed);
}

/**
 * Returns role presentation metadata (name, badge style, color, icon)
 * @param {string} role 
 * @returns {Object}
 */
export function getRoleInfo(role) {
  const normRole = (role || '').toUpperCase();
  return ROLE_INFO[normRole] || {
    label: role || 'Staff',
    fullName: role || 'Hospital Staff',
    badgeClass: 'role-badge-default',
    color: '#64748b',
    bgColor: 'rgba(100, 116, 139, 0.12)',
    borderColor: 'rgba(100, 116, 139, 0.3)',
    icon: '👤',
    description: 'Hospital user',
  };
}
