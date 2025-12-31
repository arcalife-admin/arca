// Remove the top-level Prisma import and only import it when needed on the server side
// import { prisma } from './prisma'

export interface LogData {
  action: string
  entityType: string
  entityId?: string
  description: string
  details?: Record<string, any>
  page?: string
  severity?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'
  patientId?: string
  appointmentId?: string
  taskId?: string
}

export interface LogContext {
  userId: string
  organizationId: string
  ipAddress?: string
  userAgent?: string
}

/**
 * Log an activity to the database
 */
export async function logActivity(data: LogData, context: LogContext): Promise<void> {
  try {
    // Only import Prisma on the server side
    if (typeof window !== 'undefined') {
      throw new Error('logActivity can only be used on the server side');
    }

    const { prisma } = await import('./prisma');

    await prisma.activityLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        description: data.description,
        details: data.details || {},
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        page: data.page,
        severity: data.severity || 'INFO',
        userId: context.userId,
        organizationId: context.organizationId,
        patientId: data.patientId,
        appointmentId: data.appointmentId,
        taskId: data.taskId,
      },
    })
  } catch (error) {
    console.error('Error logging activity:', error)
    // Don't throw error to prevent breaking the main functionality
  }
}

/**
 * Client-side logging function that sends logs to the API
 */
export async function logActivityClient(data: LogData): Promise<void> {
  try {
    const response = await fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      console.error('Failed to log activity:', response.statusText)
    }
  } catch (error) {
    console.error('Error logging activity on client:', error)
    // Don't throw error to prevent breaking the main functionality
  }
}

// Predefined action types for consistency
export const LOG_ACTIONS = {
  // Appointment actions
  CREATE_APPOINTMENT: 'CREATE_APPOINTMENT',
  UPDATE_APPOINTMENT: 'UPDATE_APPOINTMENT',
  DELETE_APPOINTMENT: 'DELETE_APPOINTMENT',
  RESCHEDULE_APPOINTMENT: 'RESCHEDULE_APPOINTMENT',
  RESIZE_APPOINTMENT: 'RESIZE_APPOINTMENT',
  DRAG_APPOINTMENT: 'DRAG_APPOINTMENT',
  CONFIRM_APPOINTMENT: 'CONFIRM_APPOINTMENT',
  CANCEL_APPOINTMENT: 'CANCEL_APPOINTMENT',

  // Patient actions
  CREATE_PATIENT: 'CREATE_PATIENT',
  UPDATE_PATIENT: 'UPDATE_PATIENT',
  VIEW_PATIENT: 'VIEW_PATIENT',
  UPDATE_DENTAL_CHART: 'UPDATE_DENTAL_CHART',
  UPDATE_PERIODONTAL_CHART: 'UPDATE_PERIODONTAL_CHART',
  ADD_PATIENT_NOTE: 'ADD_PATIENT_NOTE',
  UPDATE_PATIENT_NOTE: 'UPDATE_PATIENT_NOTE',
  DELETE_PATIENT_NOTE: 'DELETE_PATIENT_NOTE',
  ADD_PATIENT_FILE: 'ADD_PATIENT_FILE',
  DELETE_PATIENT_FILE: 'DELETE_PATIENT_FILE',

  // Task actions
  CREATE_TASK: 'CREATE_TASK',
  UPDATE_TASK: 'UPDATE_TASK',
  DELETE_TASK: 'DELETE_TASK',
  COMPLETE_TASK: 'COMPLETE_TASK',
  ASSIGN_TASK: 'ASSIGN_TASK',
  ADD_TASK_MESSAGE: 'ADD_TASK_MESSAGE',

  // Communication actions
  START_CALL: 'START_CALL',
  END_CALL: 'END_CALL',
  SEND_MESSAGE: 'SEND_MESSAGE',
  SEND_EMAIL: 'SEND_EMAIL',

  // Authentication actions
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',

  // User management actions
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER: 'UPDATE_USER',
  DISABLE_USER: 'DISABLE_USER',
  ENABLE_USER: 'ENABLE_USER',
  DELETE_USER: 'DELETE_USER',

  // Financial actions
  ADD_PAYMENT: 'ADD_PAYMENT',
  UPDATE_PAYMENT: 'UPDATE_PAYMENT',
  DELETE_PAYMENT: 'DELETE_PAYMENT',
  GENERATE_INVOICE: 'GENERATE_INVOICE',

  // System actions
  BACKUP_DATA: 'BACKUP_DATA',
  RESTORE_DATA: 'RESTORE_DATA',
  EXPORT_DATA: 'EXPORT_DATA',
  IMPORT_DATA: 'IMPORT_DATA',

  // Dental procedure actions
  CREATE_DENTAL_PROCEDURE: 'CREATE_DENTAL_PROCEDURE',
  UPDATE_DENTAL_PROCEDURE: 'UPDATE_DENTAL_PROCEDURE',
  DELETE_DENTAL_PROCEDURE: 'DELETE_DENTAL_PROCEDURE',
} as const

// Entity types for consistency
export const ENTITY_TYPES = {
  APPOINTMENT: 'APPOINTMENT',
  PATIENT: 'PATIENT',
  USER: 'USER',
  TASK: 'TASK',
  DENTAL_CHART: 'DENTAL_CHART',
  PERIODONTAL_CHART: 'PERIODONTAL_CHART',
  NOTE: 'NOTE',
  FILE: 'FILE',
  PAYMENT: 'PAYMENT',
  INVOICE: 'INVOICE',
  CALL: 'CALL',
  MESSAGE: 'MESSAGE',
  SYSTEM: 'SYSTEM',
  DENTAL_PROCEDURE: 'DENTAL_PROCEDURE',
} as const

// Severity levels
export const LOG_SEVERITY = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
} as const 