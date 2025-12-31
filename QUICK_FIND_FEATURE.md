# Quick Find Empty Spot Feature

## Overview

The Quick Find Empty Spot feature allows users to efficiently find available time slots for appointments in the calendar. It supports both single appointments and combination appointments with multiple practitioners.

## Features

### 1. Single Appointment Search
- Find available slots for one appointment with one practitioner
- Specify patient, treatment type, duration, and practitioner
- Search within a configurable date range and time window

### 2. Combination Appointment Search
- Schedule multiple appointments with different practitioners sequentially
- Example: Cleaning (30min) + Check-up (15min) with different practitioners
- All appointments must be available in sequence for a spot to be found

### 3. Search Criteria
- **Patient**: Required - select from existing patients
- **Date Range**: Optional - search specific date or range of days (1-30 days)
- **Time Window**: Configurable start and end times (default: 8:00-17:00)
- **Practitioner**: Optional for single appointments, required for combination appointments

## How to Use

### Accessing the Feature

1. **From Appointments Page**: Click the "Quick Find" button in the top toolbar
2. **From Pending Appointments**: Click the search icon (🔍) on any pending appointment card

### Single Appointment Mode

1. Select "Single Appointment" mode
2. Choose a patient
3. Select treatment type and duration
4. Choose a practitioner (optional - will search all practitioners if not specified)
5. Configure search criteria (date, time range, search days)
6. Click "Find Available Spots"
7. Review results and click "Select This Time" to schedule

### Combination Appointment Mode

1. Select "Combination Appointment" mode
2. Choose a patient
3. Configure multiple appointments:
   - **Order**: Sequence of appointments (1, 2, 3...)
   - **Treatment**: Type of treatment for each appointment
   - **Duration**: Length of each appointment
   - **Practitioner**: Different practitioner for each appointment
4. Add/remove appointments as needed
5. Configure search criteria
6. Click "Find Available Spots"
7. Review results and click "Select This Time" to schedule all appointments

## Example Use Cases

### Example 1: Single Appointment
- Patient needs a dental cleaning
- Duration: 30 minutes
- Practitioner: Dr. Smith
- Search: Next 7 days, 9:00-16:00
- Result: Finds available 30-minute slots with Dr. Smith

### Example 2: Combination Appointment
- Patient needs cleaning + check-up
- Appointment 1: Dental cleaning (30min) with Dr. Smith
- Appointment 2: Check-up (15min) with Dr. Johnson
- Search: Next 14 days, 8:00-17:00
- Result: Finds slots where both appointments can be scheduled sequentially

## Technical Details

### Search Algorithm
1. Iterates through each day in the search range
2. For each day, generates time slots at 15-minute intervals
3. Checks each slot against:
   - Existing appointments for the practitioner
   - Leave blocks and blocked times
   - Working hours and availability
4. For combination appointments, ensures all appointments can fit sequentially

### Integration
- Integrates with existing appointment system
- Respects leave blocks and personal blocked times
- Automatically removes pending appointments when scheduled
- Updates calendar in real-time

## Benefits

1. **Efficiency**: Quickly find available slots without manual calendar browsing
2. **Flexibility**: Support for both simple and complex appointment scenarios
3. **Accuracy**: Considers all scheduling constraints (leave, existing appointments, working hours)
4. **User-Friendly**: Intuitive interface with visual feedback
5. **Time-Saving**: Automatically schedules multiple appointments in sequence

## Future Enhancements

- Priority-based scheduling
- Recurring appointment patterns
- Integration with patient preferences
- Advanced filtering options
- Batch scheduling for multiple patients 