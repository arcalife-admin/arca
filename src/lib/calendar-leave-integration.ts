import { format, parseISO, isWithinInterval, startOfDay, endOfDay, addDays, differenceInDays } from 'date-fns'

// Types for leave integration
export interface LeaveBlock {
  id: string
  title: string
  start: Date
  end: Date
  userId: string
  userName: string
  leaveType: string
  isPartialDay: boolean
  startTime?: string
  endTime?: string
  resourceId?: string // practitioner ID
}

export interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  resourceId?: string
  appointment?: any
  isLeaveBlock?: boolean
  style?: {
    backgroundColor?: string
    borderColor?: string
    color?: string
    cursor?: string
    opacity?: number
  }
}

/**
 * Fetches approved leave requests and converts them to calendar events
 */
export async function fetchLeaveBlocks(): Promise<LeaveBlock[]> {
  try {
    const response = await fetch('/api/leave-requests?view=calendar')
    if (!response.ok) {
      throw new Error('Failed to fetch leave requests')
    }

    const data = await response.json()
    const leaveRequests = data.leaveRequests || []

    // Filter for approved leave requests (both APPROVED and ALTERNATIVE_ACCEPTED)
    const approvedRequests = leaveRequests.filter((request: any) =>
      request.status === 'APPROVED' || request.status === 'ALTERNATIVE_ACCEPTED'
    )

    return approvedRequests.map((request: any) => {
      // Handle personal blocked times (PERSONAL leave type) with custom titles
      const isPersonalBlock = request.leaveType === 'PERSONAL'
      const userName = `${request.user.firstName} ${request.user.lastName}`

      // For personal blocks, use the custom title, otherwise use standard format
      const displayTitle = isPersonalBlock
        ? request.title // Use custom title for personal blocked times
        : `${userName} - ${formatLeaveType(request.leaveType)}` // Standard format for regular leave

      return {
        id: request.id,
        title: displayTitle,
        start: parseISO(request.startDate),
        end: parseISO(request.endDate),
        userId: request.user.id,
        userName: userName,
        leaveType: request.leaveType,
        isPartialDay: request.isPartialDay,
        startTime: request.startTime,
        endTime: request.endTime,
        resourceId: request.user.practitionerId || request.user.id, // Use practitioner ID if available, otherwise user ID
      }
    })
  } catch (error) {
    console.error('Error fetching leave blocks:', error)
    return []
  }
}

/**
 * Converts leave blocks to calendar events with appropriate styling
 */
export function convertLeaveBlocksToEvents(leaveBlocks: LeaveBlock[]): CalendarEvent[] {
  return leaveBlocks.flatMap((block) => {
    const events: CalendarEvent[] = []
    const isPersonalBlock = block.leaveType === 'PERSONAL'

    // Different styling for personal blocked times vs regular leave
    const blockStyle = isPersonalBlock ? {
      backgroundColor: '#6366f1', // Indigo for personal blocks
      borderColor: '#4f46e5',
      color: '#ffffff',
      cursor: 'not-allowed',
      opacity: 0.8,
    } : {
      backgroundColor: '#ef4444', // Red for regular leave
      borderColor: '#dc2626',
      color: '#ffffff',
      cursor: 'not-allowed',
      opacity: 0.8,
    }

    if (block.isPartialDay && block.startTime && block.endTime) {
      // Handle partial day leave
      const startDateTime = new Date(block.start)
      const [startHour, startMinute] = block.startTime.split(':').map(Number)
      startDateTime.setHours(startHour, startMinute, 0, 0)

      const endDateTime = new Date(block.start)
      const [endHour, endMinute] = block.endTime.split(':').map(Number)
      endDateTime.setHours(endHour, endMinute, 0, 0)

      events.push({
        id: `leave-${block.id}`,
        title: isPersonalBlock ? `🚫 ${block.title}` : `🚫 ${block.userName} - ${formatLeaveType(block.leaveType)}`,
        start: startDateTime,
        end: endDateTime,
        resourceId: block.resourceId,
        isLeaveBlock: true,
        style: blockStyle,
      })
    } else {
      // Handle full day(s) leave
      const daysDiff = differenceInDays(block.end, block.start) + 1

      for (let i = 0; i < daysDiff; i++) {
        const currentDay = addDays(block.start, i)
        const dayStart = startOfDay(currentDay)
        const dayEnd = endOfDay(currentDay)

        events.push({
          id: `leave-${block.id}-day-${i}`,
          title: isPersonalBlock ? `🚫 ${block.title}` : `🚫 ${block.userName} - ${formatLeaveType(block.leaveType)}`,
          start: dayStart,
          end: dayEnd,
          resourceId: block.resourceId,
          isLeaveBlock: true,
          style: { ...blockStyle, opacity: 0.6 }, // Slightly more transparent for full days
        })
      }
    }

    return events
  })
}

/**
 * Merges regular calendar events with leave block events
 */
export function mergeEventsWithLeaveBlocks(
  regularEvents: CalendarEvent[],
  leaveBlocks: LeaveBlock[]
): CalendarEvent[] {
  const leaveEvents = convertLeaveBlocksToEvents(leaveBlocks)
  return [...regularEvents, ...leaveEvents]
}

/**
 * Checks if a given time slot conflicts with any approved leave
 */
export function isTimeSlotBlocked(
  date: Date,
  startTime: Date,
  endTime: Date,
  practitionerId?: string,
  leaveBlocks: LeaveBlock[] = []
): { isBlocked: boolean; reason?: string; leaveDetails?: LeaveBlock } {
  for (const block of leaveBlocks) {
    // Skip if it's for a different practitioner
    if (practitionerId && block.resourceId && block.resourceId !== practitionerId) {
      continue
    }

    // Skip if it's not for the same user (if no practitioner specified)
    if (!practitionerId && block.resourceId) {
      continue
    }

    if (block.isPartialDay && block.startTime && block.endTime) {
      // Check partial day overlap
      const blockStart = new Date(block.start)
      const [startHour, startMinute] = block.startTime.split(':').map(Number)
      blockStart.setHours(startHour, startMinute, 0, 0)

      const blockEnd = new Date(block.start)
      const [endHour, endMinute] = block.endTime.split(':').map(Number)
      blockEnd.setHours(endHour, endMinute, 0, 0)

      // Check if the appointment time overlaps with the leave time
      if (
        format(date, 'yyyy-MM-dd') === format(block.start, 'yyyy-MM-dd') &&
        ((startTime >= blockStart && startTime < blockEnd) ||
          (endTime > blockStart && endTime <= blockEnd) ||
          (startTime <= blockStart && endTime >= blockEnd))
      ) {
        return {
          isBlocked: true,
          reason: `${block.userName} is on ${formatLeaveType(block.leaveType)} from ${block.startTime} to ${block.endTime}`,
          leaveDetails: block,
        }
      }
    } else {
      // Check full day overlap
      const appointmentDate = startOfDay(date)
      const leaveStart = startOfDay(block.start)
      const leaveEnd = startOfDay(block.end)

      if (appointmentDate >= leaveStart && appointmentDate <= leaveEnd) {
        return {
          isBlocked: true,
          reason: `${block.userName} is on ${formatLeaveType(block.leaveType)} until ${format(block.end, 'MM/dd/yyyy')}`,
          leaveDetails: block,
        }
      }
    }
  }

  return { isBlocked: false }
}

/**
 * Enhanced slot prop getter that adds leave blocking styles
 */
export function getSlotPropGetterWithLeaveBlocking(
  leaveBlocks: LeaveBlock[]
) {
  return (date: Date, resourceId?: string) => {
    // Check if this slot is blocked by leave
    const slotStart = new Date(date)
    const slotEnd = new Date(date.getTime() + 30 * 60 * 1000) // 30 minutes later

    const blockCheck = isTimeSlotBlocked(date, slotStart, slotEnd, resourceId, leaveBlocks)

    if (blockCheck.isBlocked) {
      return {
        className: 'leave-blocked-slot',
        style: {
          backgroundColor: '#fef2f2',
          borderTop: '2px solid #ef4444',
          cursor: 'not-allowed',
          opacity: 0.7,
        },
        title: blockCheck.reason || 'This time slot is blocked due to approved leave',
      }
    }

    return {}
  }
}

/**
 * Enhanced day prop getter that highlights days with leave
 */
export function getDayPropGetterWithLeaveBlocking(
  leaveBlocks: LeaveBlock[]
) {
  return (date: Date, resourceId?: string) => {
    // Check if this day has any leave blocks
    const dayStart = startOfDay(date)
    const hasLeave = leaveBlocks.some(block => {
      if (resourceId && block.resourceId && block.resourceId !== resourceId) {
        return false
      }

      const leaveStart = startOfDay(block.start)
      const leaveEnd = startOfDay(block.end)
      return dayStart >= leaveStart && dayStart <= leaveEnd
    })

    if (hasLeave) {
      return {
        className: 'day-with-leave',
        style: {
          backgroundColor: '#fef2f2',
          borderLeft: '4px solid #ef4444',
        },
      }
    }

    return {}
  }
}

/**
 * Hook to use in appointment forms for validation
 */
export function validateAppointmentAgainstLeave(
  date: Date,
  startTime: Date,
  endTime: Date,
  practitionerId?: string,
  leaveBlocks: LeaveBlock[] = []
): { isValid: boolean; error?: string } {
  const blockCheck = isTimeSlotBlocked(date, startTime, endTime, practitionerId, leaveBlocks)

  if (blockCheck.isBlocked) {
    return {
      isValid: false,
      error: blockCheck.reason,
    }
  }

  return { isValid: true }
}

/**
 * Helper function to format leave types for display
 */
function formatLeaveType(type: string): string {
  return type.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

/**
 * CSS styles to inject for leave blocking (can be added to global styles)
 */
export const leaveBlockingStyles = `
  .leave-blocked-slot {
    position: relative;
  }

  .leave-blocked-slot:before {
    content: '🚫';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 12px;
    z-index: 1;
  }

  .day-with-leave {
    position: relative;
  }

  .rbc-event.leave-block {
    background-color: #ef4444 !important;
    border-color: #dc2626 !important;
    color: white !important;
    cursor: not-allowed !important;
    opacity: 0.8 !important;
  }

  .rbc-event.leave-block:hover {
    background-color: #dc2626 !important;
  }

  .rbc-addons-dnd .rbc-addons-dnd-drag-preview.leave-block {
    cursor: not-allowed !important;
  }
` 