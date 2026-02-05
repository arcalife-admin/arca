-- ============================================================================
-- INITIALIZATION SQL FOR PLASTIC SURGERY CLINIC DATABASE
-- ============================================================================
-- This script creates the complete database schema from scratch
-- for the ArcaLIFE plastic surgery clinic management system
-- 
-- Run this on a fresh Supabase/PostgreSQL database
-- ============================================================================

BEGIN;

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE "UserRole" AS ENUM (
  'ORGANIZATION_OWNER',
  'MANAGER',
  'PLASTIC_SURGEON',
  'SURGEON',
  'NURSE',
  'RECEPTIONIST',
  'ASSISTANT',
  'ANESTHESIOLOGIST',
  'AESTHETIC_NURSE',
  'MEDICAL_ASSISTANT',
  'COUNSELOR',
  'PHOTOGRAPHER'
);

CREATE TYPE "Gender" AS ENUM (
  'MALE',
  'FEMALE',
  'OTHER'
);

CREATE TYPE "AppointmentStatus" AS ENUM (
  'SCHEDULED',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW'
);

CREATE TYPE "TreatmentStatus" AS ENUM (
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE "ImageType" AS ENUM (
  'BEFORE_PHOTO',
  'AFTER_PHOTO',
  'PRE_OPERATIVE',
  'POST_OPERATIVE',
  'XRAY',
  'CT_SCAN',
  'MRI',
  'ULTRASOUND',
  'DOCUMENTATION',
  'OTHER'
);

CREATE TYPE "ChatType" AS ENUM (
  'PRIVATE',
  'GROUP'
);

CREATE TYPE "MessageType" AS ENUM (
  'TEXT',
  'IMAGE',
  'FILE'
);

CREATE TYPE "FileType" AS ENUM (
  'XRAY',
  'DOCUMENT',
  'IMAGE',
  'OTHER'
);

CREATE TYPE "TaskType" AS ENUM (
  'TASK',
  'POLL',
  'PLAN'
);

CREATE TYPE "TaskVisibility" AS ENUM (
  'PRIVATE',
  'PUBLIC'
);

CREATE TYPE "BoardRole" AS ENUM (
  'ADMIN',
  'MEMBER'
);

CREATE TYPE "TaskStatus" AS ENUM (
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE "TaskPriority" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
);

CREATE TYPE "AppointmentTypeEnum" AS ENUM (
  'REGULAR',
  'RESERVATION',
  'FAMILY'
);

CREATE TYPE "WaitingListStatus" AS ENUM (
  'ACTIVE',
  'CALLED',
  'CONFIRMED',
  'CANCELLED'
);

CREATE TYPE "IncomeType" AS ENUM (
  'TREATMENT',
  'CONSULTATION',
  'INSURANCE',
  'OTHER'
);

CREATE TYPE "ExpenseCategory" AS ENUM (
  'MATERIALS',
  'EQUIPMENT',
  'RENT',
  'UTILITIES',
  'INSURANCE',
  'MARKETING',
  'PROFESSIONAL_DEVELOPMENT',
  'TRAVEL',
  'MEALS',
  'SOFTWARE',
  'OFFICE_SUPPLIES',
  'PROFESSIONAL_SERVICES',
  'PHONE_INTERNET',
  'OTHER'
);

CREATE TYPE "ReportType" AS ENUM (
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
  'CUSTOM'
);

CREATE TYPE "PaymentMethod" AS ENUM (
  'CASH',
  'CARD'
);

CREATE TYPE "RequestUrgency" AS ENUM (
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT'
);

CREATE TYPE "RequestStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'ORDERED',
  'RECEIVED',
  'CANCELLED'
);

CREATE TYPE "OrderStatus" AS ENUM (
  'DRAFT',
  'PENDING',
  'APPROVED',
  'ORDERED',
  'CONFIRMED',
  'SHIPPED',
  'DELIVERED',
  'COMPLETED',
  'CANCELLED'
);

CREATE TYPE "OrderPriority" AS ENUM (
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT'
);

CREATE TYPE "EquipmentCategory" AS ENUM (
  'DENTAL_CHAIR',
  'XRAY_MACHINE',
  'AUTOCLAVE',
  'COMPRESSOR',
  'VACUUM_SYSTEM',
  'LIGHTING',
  'HVAC',
  'INSTRUMENTS',
  'COMPUTER_EQUIPMENT',
  'PHONE_SYSTEM',
  'SECURITY_SYSTEM',
  'OTHER'
);

CREATE TYPE "RepairUrgency" AS ENUM (
  'LOW',
  'NORMAL',
  'HIGH',
  'URGENT',
  'EMERGENCY'
);

CREATE TYPE "RepairStatus" AS ENUM (
  'REPORTED',
  'ACKNOWLEDGED',
  'SCHEDULED',
  'IN_PROGRESS',
  'WAITING_PARTS',
  'COMPLETED',
  'TESTED',
  'CLOSED',
  'CANCELLED'
);

CREATE TYPE "IssueCategory" AS ENUM (
  'MECHANICAL',
  'ELECTRICAL',
  'SOFTWARE',
  'MAINTENANCE',
  'CALIBRATION',
  'CLEANING',
  'INSTALLATION',
  'UPGRADE',
  'EMERGENCY',
  'OTHER'
);

CREATE TYPE "LeaveType" AS ENUM (
  'VACATION',
  'SICK_LEAVE',
  'PERSONAL',
  'MATERNITY',
  'PATERNITY',
  'BEREAVEMENT',
  'EMERGENCY',
  'UNPAID',
  'COMPENSATORY',
  'STUDY',
  'OTHER'
);

CREATE TYPE "LeaveRequestStatus" AS ENUM (
  'PENDING',
  'APPROVED',
  'DENIED',
  'CANCELLED',
  'ALTERNATIVE_PROPOSED',
  'ALTERNATIVE_ACCEPTED',
  'ALTERNATIVE_REJECTED'
);

CREATE TYPE "LogSeverity" AS ENUM (
  'DEBUG',
  'INFO',
  'WARN',
  'ERROR',
  'CRITICAL'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Organization
CREATE TABLE "Organization" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "latitude" DOUBLE PRECISION NOT NULL,
  "longitude" DOUBLE PRECISION NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "employeeCount" INTEGER NOT NULL DEFAULT 1,
  "logoUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "roomCount" INTEGER NOT NULL DEFAULT 1,
  "openingDays" TEXT[] DEFAULT ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

  CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- User
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "password" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "organizationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "disabledAt" TIMESTAMP(3),
  "disabledBy" TEXT,
  "disabledReason" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isDisabled" BOOLEAN NOT NULL DEFAULT false,
  "lastLoginAt" TIMESTAMP(3),

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");
CREATE INDEX "User_isActive_idx" ON "User"("isActive");
CREATE INDEX "User_isDisabled_idx" ON "User"("isDisabled");
CREATE INDEX "User_role_idx" ON "User"("role");

-- Patient
CREATE TABLE "Patient" (
  "id" TEXT NOT NULL,
  "patientCode" TEXT NOT NULL,
  "familyHeadCode" TEXT,
  "familyPosition" INTEGER,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "dateOfBirth" TIMESTAMP(3) NOT NULL,
  "gender" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "address" JSONB NOT NULL,
  "bsn" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "healthInsurance" JSONB,
  "medicalHistory" JSONB,
  "surgicalHistory" JSONB,
  "asaScore" INTEGER,
  "statusPraesens" JSONB,
  "beforeAfterPhotos" JSONB,
  "surgicalNotes" JSONB,
  "organizationId" TEXT NOT NULL,
  "isDisabled" BOOLEAN NOT NULL DEFAULT false,
  "disabledReason" TEXT,
  "disabledAt" TIMESTAMP(3),
  "disabledBy" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "allowEarlySpotContact" BOOLEAN NOT NULL DEFAULT true,
  "isLongTermCareAct" BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "Patient_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Patient_patientCode_key" ON "Patient"("patientCode");
CREATE INDEX "Patient_organizationId_idx" ON "Patient"("organizationId");
CREATE INDEX "Patient_patientCode_idx" ON "Patient"("patientCode");
CREATE INDEX "Patient_familyHeadCode_idx" ON "Patient"("familyHeadCode");

-- SurgicalProcedureCode
CREATE TABLE "SurgicalProcedureCode" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "price" DOUBLE PRECISION,
  "category" TEXT NOT NULL,
  "requirements" JSONB NOT NULL,
  "section" TEXT NOT NULL,
  "subSection" TEXT NOT NULL,
  "patientType" TEXT,
  "duration" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SurgicalProcedureCode_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SurgicalProcedureCode_code_key" ON "SurgicalProcedureCode"("code");

-- SurgicalProcedure
CREATE TABLE "SurgicalProcedure" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "codeId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "practitionerId" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "invoiceEmail" BOOLEAN NOT NULL DEFAULT false,
  "invoicePrinted" BOOLEAN NOT NULL DEFAULT false,
  "isPaid" BOOLEAN NOT NULL DEFAULT false,
  "paidAt" TIMESTAMP(3),
  "paymentAmount" DOUBLE PRECISION,
  "paymentMethod" "PaymentMethod",
  "cost" DOUBLE PRECISION,
  "bodyArea" TEXT,
  "procedureType" TEXT,
  "anesthesiaType" TEXT,

  CONSTRAINT "SurgicalProcedure_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SurgicalProcedure_patientId_idx" ON "SurgicalProcedure"("patientId");
CREATE INDEX "SurgicalProcedure_codeId_idx" ON "SurgicalProcedure"("codeId");
CREATE INDEX "SurgicalProcedure_practitionerId_idx" ON "SurgicalProcedure"("practitionerId");
CREATE INDEX "SurgicalProcedure_bodyArea_idx" ON "SurgicalProcedure"("bodyArea");
CREATE INDEX "SurgicalProcedure_procedureType_idx" ON "SurgicalProcedure"("procedureType");

-- Appointment
CREATE TABLE "Appointment" (
  "id" TEXT NOT NULL,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3),
  "duration" INTEGER,
  "type" TEXT NOT NULL,
  "status" "AppointmentStatus" NOT NULL,
  "notes" TEXT,
  "appointmentType" "AppointmentTypeEnum" NOT NULL DEFAULT 'REGULAR',
  "reservationColor" TEXT,
  "isReservation" BOOLEAN NOT NULL DEFAULT false,
  "isFamilyAppointment" BOOLEAN NOT NULL DEFAULT false,
  "familyAppointmentId" TEXT,
  "patientId" TEXT,
  "practitionerId" TEXT NOT NULL,
  "treatmentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "appointmentStatus" JSONB,

  CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Appointment_patientId_idx" ON "Appointment"("patientId");
CREATE INDEX "Appointment_practitionerId_idx" ON "Appointment"("practitionerId");
CREATE INDEX "Appointment_treatmentId_idx" ON "Appointment"("treatmentId");
CREATE INDEX "Appointment_familyAppointmentId_idx" ON "Appointment"("familyAppointmentId");

-- Treatment
CREATE TABLE "Treatment" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "cost" DOUBLE PRECISION NOT NULL,
  "status" "TreatmentStatus" NOT NULL,
  "patientId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Treatment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Treatment_patientId_idx" ON "Treatment"("patientId");

-- Image
CREATE TABLE "Image" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "type" "ImageType" NOT NULL,
  "bodyArea" TEXT,
  "view" TEXT,
  "dateTaken" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,
  "patientId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Image_pkey" PRIMARY KEY ("id")
);

-- PendingAppointment
CREATE TABLE "PendingAppointment" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "practitionerId" TEXT,
  "startTime" TIMESTAMP(3),
  "endTime" TIMESTAMP(3),
  "duration" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "requestedBy" TEXT,
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PendingAppointment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PendingAppointment_patientId_idx" ON "PendingAppointment"("patientId");
CREATE INDEX "PendingAppointment_practitionerId_idx" ON "PendingAppointment"("practitionerId");

-- ScheduleRule
CREATE TABLE "ScheduleRule" (
  "id" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "repeatType" TEXT NOT NULL,
  "daysOfWeek" TEXT[] NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "schedule" JSONB,

  CONSTRAINT "ScheduleRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ScheduleRule_organizationId_idx" ON "ScheduleRule"("organizationId");

-- CalendarSettings
CREATE TABLE "CalendarSettings" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#cfdbff',
  "visibleDays" TEXT[] NOT NULL DEFAULT ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CalendarSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CalendarSettings_userId_key" ON "CalendarSettings"("userId");
CREATE INDEX "CalendarSettings_userId_idx" ON "CalendarSettings"("userId");

-- ChatRoom
CREATE TABLE "ChatRoom" (
  "id" TEXT NOT NULL,
  "name" TEXT,
  "type" "ChatType" NOT NULL DEFAULT 'PRIVATE',
  "organizationId" TEXT NOT NULL,
  "isGlobal" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ChatRoom_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ChatRoom_organizationId_idx" ON "ChatRoom"("organizationId");

-- ChatParticipant
CREATE TABLE "ChatParticipant" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "chatRoomId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ChatParticipant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChatParticipant_userId_chatRoomId_key" ON "ChatParticipant"("userId", "chatRoomId");
CREATE INDEX "ChatParticipant_userId_idx" ON "ChatParticipant"("userId");
CREATE INDEX "ChatParticipant_chatRoomId_idx" ON "ChatParticipant"("chatRoomId");

-- Message
CREATE TABLE "Message" (
  "id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "type" "MessageType" NOT NULL DEFAULT 'TEXT',
  "fileUrl" TEXT,
  "fileName" TEXT,
  "chatRoomId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),

  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Message_chatRoomId_idx" ON "Message"("chatRoomId");
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- File
CREATE TABLE "File" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "type" "FileType" NOT NULL,
  "size" INTEGER NOT NULL,
  "patientId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "File_patientId_idx" ON "File"("patientId");

-- AsaRecord
CREATE TABLE "AsaRecord" (
  "id" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "notes" TEXT,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "patientId" TEXT NOT NULL,
  "createdBy" TEXT NOT NULL,

  CONSTRAINT "AsaRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AsaRecord_patientId_idx" ON "AsaRecord"("patientId");

-- CarePlan
CREATE TABLE "CarePlan" (
  "id" TEXT NOT NULL,
  "careRequest" TEXT NOT NULL,
  "careGoal" TEXT NOT NULL,
  "policy" TEXT NOT NULL,
  "riskProfile" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,

  CONSTRAINT "CarePlan_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CarePlan_patientId_key" ON "CarePlan"("patientId");

-- NoteFolder
CREATE TABLE "NoteFolder" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "patientId" TEXT NOT NULL,

  CONSTRAINT "NoteFolder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NoteFolder_patientId_idx" ON "NoteFolder"("patientId");

-- Note
CREATE TABLE "Note" (
  "id" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "pinOrder" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "folderId" TEXT,
  "patientId" TEXT NOT NULL,

  CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Note_patientId_idx" ON "Note"("patientId");
CREATE INDEX "Note_folderId_idx" ON "Note"("folderId");
CREATE INDEX "Note_createdBy_idx" ON "Note"("createdBy");

-- PatientStatusRecord
CREATE TABLE "PatientStatusRecord" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "reason" TEXT,
  "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdBy" TEXT NOT NULL,

  CONSTRAINT "PatientStatusRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PatientStatusRecord_patientId_idx" ON "PatientStatusRecord"("patientId");
CREATE INDEX "PatientStatusRecord_createdBy_idx" ON "PatientStatusRecord"("createdBy");

-- Calibration
CREATE TABLE "Calibration" (
  "id" TEXT NOT NULL,
  "pixelWidth" DOUBLE PRECISION NOT NULL,
  "pixelHeight" DOUBLE PRECISION NOT NULL,
  "realWidth" DOUBLE PRECISION NOT NULL,
  "realHeight" DOUBLE PRECISION NOT NULL,
  "unit" TEXT NOT NULL,
  "imageId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Calibration_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Calibration_imageId_key" ON "Calibration"("imageId");

-- Annotation
CREATE TABLE "Annotation" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "points" JSONB NOT NULL,
  "text" TEXT,
  "color" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "measurement" DOUBLE PRECISION,
  "imageId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Annotation_pkey" PRIMARY KEY ("id")
);

-- OrganizationThemeSettings
CREATE TABLE "OrganizationThemeSettings" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "primaryColor" TEXT NOT NULL DEFAULT '#3b82f6',
  "primaryForeground" TEXT NOT NULL DEFAULT '#ffffff',
  "secondaryColor" TEXT NOT NULL DEFAULT '#f1f5f9',
  "secondaryForeground" TEXT NOT NULL DEFAULT '#0f172a',
  "accentColor" TEXT NOT NULL DEFAULT '#10b981',
  "accentForeground" TEXT NOT NULL DEFAULT '#ffffff',
  "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
  "surfaceColor" TEXT NOT NULL DEFAULT '#f8fafc',
  "borderColor" TEXT NOT NULL DEFAULT '#e2e8f0',
  "textPrimary" TEXT NOT NULL DEFAULT '#0f172a',
  "textSecondary" TEXT NOT NULL DEFAULT '#64748b',
  "textMuted" TEXT NOT NULL DEFAULT '#94a3b8',
  "successColor" TEXT NOT NULL DEFAULT '#10b981',
  "warningColor" TEXT NOT NULL DEFAULT '#f59e0b',
  "errorColor" TEXT NOT NULL DEFAULT '#ef4444',
  "infoColor" TEXT NOT NULL DEFAULT '#3b82f6',
  "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
  "headingFontFamily" TEXT NOT NULL DEFAULT 'Inter',
  "fontSize" TEXT NOT NULL DEFAULT '14',
  "headingScale" TEXT NOT NULL DEFAULT '1.25',
  "lineHeight" TEXT NOT NULL DEFAULT '1.5',
  "letterSpacing" TEXT NOT NULL DEFAULT '0',
  "borderRadius" TEXT NOT NULL DEFAULT '6',
  "spacing" TEXT NOT NULL DEFAULT '1',
  "maxWidth" TEXT NOT NULL DEFAULT '1200',
  "sidebarWidth" TEXT NOT NULL DEFAULT '280',
  "buttonSize" TEXT NOT NULL DEFAULT 'md',
  "inputSize" TEXT NOT NULL DEFAULT 'md',
  "avatarSize" TEXT NOT NULL DEFAULT 'md',
  "iconSize" TEXT NOT NULL DEFAULT '20',
  "shadowLevel" TEXT NOT NULL DEFAULT 'md',
  "animationSpeed" TEXT NOT NULL DEFAULT '200',
  "calendarTodayBg" TEXT NOT NULL DEFAULT '#ddd6fe',
  "calendarAccentBg" TEXT NOT NULL DEFAULT '#f3f4f6',
  "customVariables" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OrganizationThemeSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OrganizationThemeSettings_organizationId_key" ON "OrganizationThemeSettings"("organizationId");
CREATE INDEX "OrganizationThemeSettings_organizationId_idx" ON "OrganizationThemeSettings"("organizationId");

-- PersonalThemeSettings
CREATE TABLE "PersonalThemeSettings" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "primaryColor" TEXT NOT NULL DEFAULT '#3b82f6',
  "primaryForeground" TEXT NOT NULL DEFAULT '#ffffff',
  "secondaryColor" TEXT NOT NULL DEFAULT '#f1f5f9',
  "secondaryForeground" TEXT NOT NULL DEFAULT '#0f172a',
  "accentColor" TEXT NOT NULL DEFAULT '#10b981',
  "accentForeground" TEXT NOT NULL DEFAULT '#ffffff',
  "backgroundColor" TEXT NOT NULL DEFAULT '#ffffff',
  "surfaceColor" TEXT NOT NULL DEFAULT '#f8fafc',
  "borderColor" TEXT NOT NULL DEFAULT '#e2e8f0',
  "textPrimary" TEXT NOT NULL DEFAULT '#0f172a',
  "textSecondary" TEXT NOT NULL DEFAULT '#64748b',
  "textMuted" TEXT NOT NULL DEFAULT '#94a3b8',
  "successColor" TEXT NOT NULL DEFAULT '#10b981',
  "warningColor" TEXT NOT NULL DEFAULT '#f59e0b',
  "errorColor" TEXT NOT NULL DEFAULT '#ef4444',
  "infoColor" TEXT NOT NULL DEFAULT '#3b82f6',
  "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
  "headingFontFamily" TEXT NOT NULL DEFAULT 'Inter',
  "fontSize" TEXT NOT NULL DEFAULT '14',
  "headingScale" TEXT NOT NULL DEFAULT '1.25',
  "lineHeight" TEXT NOT NULL DEFAULT '1.5',
  "letterSpacing" TEXT NOT NULL DEFAULT '0',
  "borderRadius" TEXT NOT NULL DEFAULT '6',
  "spacing" TEXT NOT NULL DEFAULT '1',
  "maxWidth" TEXT NOT NULL DEFAULT '1200',
  "sidebarWidth" TEXT NOT NULL DEFAULT '280',
  "buttonSize" TEXT NOT NULL DEFAULT 'md',
  "inputSize" TEXT NOT NULL DEFAULT 'md',
  "avatarSize" TEXT NOT NULL DEFAULT 'md',
  "iconSize" TEXT NOT NULL DEFAULT '20',
  "shadowLevel" TEXT NOT NULL DEFAULT 'md',
  "animationSpeed" TEXT NOT NULL DEFAULT '200',
  "calendarTodayBg" TEXT NOT NULL DEFAULT '#ddd6fe',
  "calendarAccentBg" TEXT NOT NULL DEFAULT '#f3f4f6',
  "customVariables" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PersonalThemeSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PersonalThemeSettings_userId_key" ON "PersonalThemeSettings"("userId");
CREATE INDEX "PersonalThemeSettings_userId_idx" ON "PersonalThemeSettings"("userId");

-- UserDashboard
CREATE TABLE "UserDashboard" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "quickNote" TEXT,
  "quickLinks" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserDashboard_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserDashboard_userId_key" ON "UserDashboard"("userId");

-- Task
CREATE TABLE "Task" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
  "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
  "deadline" TIMESTAMP(3),
  "patientId" TEXT,
  "createdBy" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "completedBy" TEXT,
  "boardId" TEXT,
  "type" "TaskType" NOT NULL DEFAULT 'TASK',
  "visibility" "TaskVisibility" NOT NULL DEFAULT 'PRIVATE',

  CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Task_patientId_idx" ON "Task"("patientId");
CREATE INDEX "Task_boardId_idx" ON "Task"("boardId");
CREATE INDEX "Task_createdBy_idx" ON "Task"("createdBy");
CREATE INDEX "Task_organizationId_idx" ON "Task"("organizationId");
CREATE INDEX "Task_status_idx" ON "Task"("status");
CREATE INDEX "Task_deadline_idx" ON "Task"("deadline");
CREATE INDEX "Task_visibility_idx" ON "Task"("visibility");
CREATE INDEX "Task_type_idx" ON "Task"("type");

-- TaskBoard
CREATE TABLE "TaskBoard" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT false,
  "createdBy" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TaskBoard_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TaskBoard_createdBy_idx" ON "TaskBoard"("createdBy");
CREATE INDEX "TaskBoard_organizationId_idx" ON "TaskBoard"("organizationId");
CREATE INDEX "TaskBoard_isPublic_idx" ON "TaskBoard"("isPublic");

-- BoardMember
CREATE TABLE "BoardMember" (
  "id" TEXT NOT NULL,
  "boardId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "role" "BoardRole" NOT NULL DEFAULT 'MEMBER',
  "addedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BoardMember_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BoardMember_boardId_userId_key" ON "BoardMember"("boardId", "userId");
CREATE INDEX "BoardMember_boardId_idx" ON "BoardMember"("boardId");
CREATE INDEX "BoardMember_userId_idx" ON "BoardMember"("userId");

-- TaskOption
CREATE TABLE "TaskOption" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TaskOption_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TaskOption_taskId_idx" ON "TaskOption"("taskId");

-- TaskVote
CREATE TABLE "TaskVote" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "optionId" TEXT,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TaskVote_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TaskVote_taskId_userId_key" ON "TaskVote"("taskId", "userId");
CREATE INDEX "TaskVote_taskId_idx" ON "TaskVote"("taskId");
CREATE INDEX "TaskVote_optionId_idx" ON "TaskVote"("optionId");
CREATE INDEX "TaskVote_userId_idx" ON "TaskVote"("userId");

-- TaskAssignment
CREATE TABLE "TaskAssignment" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "assignedBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isSelfAssigned" BOOLEAN NOT NULL DEFAULT false,

  CONSTRAINT "TaskAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TaskAssignment_taskId_userId_key" ON "TaskAssignment"("taskId", "userId");
CREATE INDEX "TaskAssignment_taskId_idx" ON "TaskAssignment"("taskId");
CREATE INDEX "TaskAssignment_userId_idx" ON "TaskAssignment"("userId");

-- TaskMessage
CREATE TABLE "TaskMessage" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "TaskMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TaskMessage_taskId_idx" ON "TaskMessage"("taskId");
CREATE INDEX "TaskMessage_senderId_idx" ON "TaskMessage"("senderId");

-- TaskReminder
CREATE TABLE "TaskReminder" (
  "id" TEXT NOT NULL,
  "taskId" TEXT NOT NULL,
  "reminderTime" TIMESTAMP(3) NOT NULL,
  "message" TEXT,
  "sent" BOOLEAN NOT NULL DEFAULT false,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "TaskReminder_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TaskReminder_taskId_idx" ON "TaskReminder"("taskId");
CREATE INDEX "TaskReminder_reminderTime_idx" ON "TaskReminder"("reminderTime");

-- WaitingListEntry
CREATE TABLE "WaitingListEntry" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "practitionerId" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,
  "waitingAppointmentId" TEXT,
  "status" "WaitingListStatus" NOT NULL DEFAULT 'ACTIVE',

  CONSTRAINT "WaitingListEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WaitingListEntry_waitingAppointmentId_key" ON "WaitingListEntry"("waitingAppointmentId");
CREATE INDEX "WaitingListEntry_patientId_idx" ON "WaitingListEntry"("patientId");
CREATE INDEX "WaitingListEntry_practitionerId_idx" ON "WaitingListEntry"("practitionerId");
CREATE INDEX "WaitingListEntry_createdBy_idx" ON "WaitingListEntry"("createdBy");
CREATE INDEX "WaitingListEntry_status_idx" ON "WaitingListEntry"("status");

-- WaitingAppointment
CREATE TABLE "WaitingAppointment" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "duration" INTEGER NOT NULL,
  "notes" TEXT,
  "status" TEXT NOT NULL DEFAULT 'WAITING',
  "priority" TEXT NOT NULL DEFAULT 'medium',
  "startTime" TIMESTAMP(3),
  "endTime" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "createdBy" TEXT NOT NULL,

  CONSTRAINT "WaitingAppointment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WaitingAppointment_patientId_idx" ON "WaitingAppointment"("patientId");
CREATE INDEX "WaitingAppointment_createdBy_idx" ON "WaitingAppointment"("createdBy");

-- UserFinanceSettings
CREATE TABLE "UserFinanceSettings" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "vatPercentage" DOUBLE PRECISION NOT NULL DEFAULT 21.0,
  "incomeTaxReservePercentage" DOUBLE PRECISION NOT NULL DEFAULT 30.0,
  "monthlyIncomeGoal" DOUBLE PRECISION,
  "quarterlyIncomeGoal" DOUBLE PRECISION,
  "preferredCurrency" TEXT NOT NULL DEFAULT 'EUR',
  "accountantName" TEXT,
  "accountantEmail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserFinanceSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "UserFinanceSettings_userId_key" ON "UserFinanceSettings"("userId");
CREATE INDEX "UserFinanceSettings_userId_idx" ON "UserFinanceSettings"("userId");

-- UserIncome
CREATE TABLE "UserIncome" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "description" TEXT,
  "source" TEXT,
  "type" "IncomeType" NOT NULL DEFAULT 'TREATMENT',
  "date" TIMESTAMP(3) NOT NULL,
  "invoiceNumber" TEXT,
  "clientName" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserIncome_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserIncome_userId_idx" ON "UserIncome"("userId");
CREATE INDEX "UserIncome_date_idx" ON "UserIncome"("date");

-- UserExpense
CREATE TABLE "UserExpense" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "description" TEXT NOT NULL,
  "category" "ExpenseCategory" NOT NULL,
  "vendor" TEXT,
  "isTaxDeductible" BOOLEAN NOT NULL DEFAULT true,
  "taxDeductiblePercentage" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
  "receiptUrl" TEXT,
  "receiptFileName" TEXT,
  "date" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "UserExpense_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "UserExpense_userId_idx" ON "UserExpense"("userId");
CREATE INDEX "UserExpense_date_idx" ON "UserExpense"("date");
CREATE INDEX "UserExpense_category_idx" ON "UserExpense"("category");

-- FinancialReport
CREATE TABLE "FinancialReport" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" "ReportType" NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "totalIncome" DOUBLE PRECISION NOT NULL,
  "totalExpenses" DOUBLE PRECISION NOT NULL,
  "netIncome" DOUBLE PRECISION NOT NULL,
  "estimatedTax" DOUBLE PRECISION NOT NULL,
  "pdfUrl" TEXT,
  "csvUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FinancialReport_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FinancialReport_userId_idx" ON "FinancialReport"("userId");
CREATE INDEX "FinancialReport_type_idx" ON "FinancialReport"("type");

-- InstructionVideo
CREATE TABLE "InstructionVideo" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "embedUrl" TEXT NOT NULL,
  "isCustom" BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InstructionVideo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InstructionVideo_order_idx" ON "InstructionVideo"("order");
CREATE INDEX "InstructionVideo_isCustom_idx" ON "InstructionVideo"("isCustom");

-- InstructionImage
CREATE TABLE "InstructionImage" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "isCustom" BOOLEAN NOT NULL DEFAULT true,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "InstructionImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InstructionImage_order_idx" ON "InstructionImage"("order");
CREATE INDEX "InstructionImage_isCustom_idx" ON "InstructionImage"("isCustom");

-- Product
CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "defaultPrice" DOUBLE PRECISION NOT NULL,
  "category" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "organizationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Product_organizationId_idx" ON "Product"("organizationId");
CREATE INDEX "Product_category_idx" ON "Product"("category");
CREATE INDEX "Product_isActive_idx" ON "Product"("isActive");

-- ShopPurchase
CREATE TABLE "ShopPurchase" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "totalAmount" DOUBLE PRECISION NOT NULL,
  "notes" TEXT,
  "isPaid" BOOLEAN NOT NULL DEFAULT false,
  "paymentMethod" "PaymentMethod",
  "paidAt" TIMESTAMP(3),
  "invoiceEmail" BOOLEAN NOT NULL DEFAULT false,
  "invoicePrinted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ShopPurchase_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ShopPurchase_patientId_idx" ON "ShopPurchase"("patientId");
CREATE INDEX "ShopPurchase_productId_idx" ON "ShopPurchase"("productId");
CREATE INDEX "ShopPurchase_isPaid_idx" ON "ShopPurchase"("isPaid");

-- Vendor
CREATE TABLE "Vendor" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "category" TEXT,
  "contactEmail" TEXT,
  "contactPhone" TEXT,
  "website" TEXT,
  "orderingUrl" TEXT,
  "accountNumber" TEXT,
  "paymentTerms" TEXT,
  "deliveryTime" INTEGER,
  "minimumOrder" DOUBLE PRECISION,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isPreferred" BOOLEAN NOT NULL DEFAULT false,
  "organizationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Vendor_organizationId_idx" ON "Vendor"("organizationId");
CREATE INDEX "Vendor_category_idx" ON "Vendor"("category");
CREATE INDEX "Vendor_isActive_idx" ON "Vendor"("isActive");
CREATE INDEX "Vendor_isPreferred_idx" ON "Vendor"("isPreferred");

-- ItemCategory
CREATE TABLE "ItemCategory" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT,
  "organizationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ItemCategory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ItemCategory_organizationId_idx" ON "ItemCategory"("organizationId");

-- OrderRequest
CREATE TABLE "OrderRequest" (
  "id" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "description" TEXT,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  "urgency" "RequestUrgency" NOT NULL DEFAULT 'NORMAL',
  "reason" TEXT,
  "requestedById" TEXT NOT NULL,
  "categoryId" TEXT,
  "vendorId" TEXT,
  "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
  "processedById" TEXT,
  "processedAt" TIMESTAMP(3),
  "orderId" TEXT,
  "organizationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OrderRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderRequest_organizationId_idx" ON "OrderRequest"("organizationId");
CREATE INDEX "OrderRequest_requestedById_idx" ON "OrderRequest"("requestedById");
CREATE INDEX "OrderRequest_status_idx" ON "OrderRequest"("status");
CREATE INDEX "OrderRequest_urgency_idx" ON "OrderRequest"("urgency");

-- Order
CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "orderNumber" TEXT NOT NULL,
  "vendorId" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
  "priority" "OrderPriority" NOT NULL DEFAULT 'NORMAL',
  "expectedDelivery" TIMESTAMP(3),
  "actualDelivery" TIMESTAMP(3),
  "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "taxAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "trackingNumber" TEXT,
  "externalOrderId" TEXT,
  "orderedById" TEXT NOT NULL,
  "approvedById" TEXT,
  "approvedAt" TIMESTAMP(3),
  "notes" TEXT,
  "attachments" TEXT[],
  "organizationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX "Order_organizationId_idx" ON "Order"("organizationId");
CREATE INDEX "Order_vendorId_idx" ON "Order"("vendorId");
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_orderedById_idx" ON "Order"("orderedById");
CREATE INDEX "Order_expectedDelivery_idx" ON "Order"("expectedDelivery");

-- OrderItem
CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "itemName" TEXT NOT NULL,
  "description" TEXT,
  "productCode" TEXT,
  "brand" TEXT,
  "quantity" INTEGER NOT NULL,
  "unitPrice" DOUBLE PRECISION NOT NULL,
  "totalPrice" DOUBLE PRECISION NOT NULL,
  "categoryId" TEXT,
  "stockLevel" INTEGER,
  "minimumStock" INTEGER,
  "maxStock" INTEGER,
  "location" TEXT,
  "quantityReceived" INTEGER NOT NULL DEFAULT 0,
  "isReceived" BOOLEAN NOT NULL DEFAULT false,
  "receivedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "notes" TEXT,

  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_categoryId_idx" ON "OrderItem"("categoryId");
CREATE INDEX "OrderItem_isReceived_idx" ON "OrderItem"("isReceived");

-- Location
CREATE TABLE "Location" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT,
  "organizationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Location_organizationId_idx" ON "Location"("organizationId");

-- Equipment
CREATE TABLE "Equipment" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "brand" TEXT,
  "model" TEXT,
  "serialNumber" TEXT,
  "purchaseDate" TIMESTAMP(3),
  "warrantyExpiry" TIMESTAMP(3),
  "category" "EquipmentCategory" NOT NULL,
  "locationId" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "organizationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Equipment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Equipment_organizationId_idx" ON "Equipment"("organizationId");
CREATE INDEX "Equipment_locationId_idx" ON "Equipment"("locationId");
CREATE INDEX "Equipment_category_idx" ON "Equipment"("category");

-- ContactPerson
CREATE TABLE "ContactPerson" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "company" TEXT,
  "role" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "mobile" TEXT,
  "specialties" TEXT[],
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "isPreferred" BOOLEAN NOT NULL DEFAULT false,
  "organizationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ContactPerson_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactPerson_organizationId_idx" ON "ContactPerson"("organizationId");
CREATE INDEX "ContactPerson_isActive_idx" ON "ContactPerson"("isActive");

-- LocationContact
CREATE TABLE "LocationContact" (
  "id" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "contactPersonId" TEXT NOT NULL,
  "isPrimary" BOOLEAN NOT NULL DEFAULT false,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "LocationContact_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LocationContact_locationId_contactPersonId_key" ON "LocationContact"("locationId", "contactPersonId");
CREATE INDEX "LocationContact_locationId_idx" ON "LocationContact"("locationId");
CREATE INDEX "LocationContact_contactPersonId_idx" ON "LocationContact"("contactPersonId");

-- RepairRequest
CREATE TABLE "RepairRequest" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "urgency" "RepairUrgency" NOT NULL DEFAULT 'NORMAL',
  "equipmentId" TEXT,
  "locationId" TEXT NOT NULL,
  "issueCategory" "IssueCategory" NOT NULL,
  "symptoms" TEXT[],
  "requestedById" TEXT NOT NULL,
  "status" "RepairStatus" NOT NULL DEFAULT 'REPORTED',
  "contactPersonId" TEXT,
  "assignedAt" TIMESTAMP(3),
  "scheduledDate" TIMESTAMP(3),
  "scheduledTime" TEXT,
  "estimatedDuration" INTEGER,
  "arrivedAt" TIMESTAMP(3),
  "startedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "workPerformed" TEXT,
  "partsUsed" TEXT,
  "cost" DOUBLE PRECISION,
  "notes" TEXT,
  "followUpDate" TIMESTAMP(3),
  "warrantyUntil" TIMESTAMP(3),
  "organizationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RepairRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RepairRequest_organizationId_idx" ON "RepairRequest"("organizationId");
CREATE INDEX "RepairRequest_locationId_idx" ON "RepairRequest"("locationId");
CREATE INDEX "RepairRequest_equipmentId_idx" ON "RepairRequest"("equipmentId");
CREATE INDEX "RepairRequest_contactPersonId_idx" ON "RepairRequest"("contactPersonId");
CREATE INDEX "RepairRequest_status_idx" ON "RepairRequest"("status");
CREATE INDEX "RepairRequest_urgency_idx" ON "RepairRequest"("urgency");
CREATE INDEX "RepairRequest_scheduledDate_idx" ON "RepairRequest"("scheduledDate");

-- OrderTimelineEvent
CREATE TABLE "OrderTimelineEvent" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "orderItemId" TEXT,
  "type" TEXT NOT NULL,
  "message" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OrderTimelineEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderTimelineEvent_orderId_idx" ON "OrderTimelineEvent"("orderId");
CREATE INDEX "OrderTimelineEvent_orderItemId_idx" ON "OrderTimelineEvent"("orderItemId");
CREATE INDEX "OrderTimelineEvent_createdById_idx" ON "OrderTimelineEvent"("createdById");

-- LeaveRequest
CREATE TABLE "LeaveRequest" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "leaveType" "LeaveType" NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "isPartialDay" BOOLEAN NOT NULL DEFAULT false,
  "startTime" TEXT,
  "endTime" TEXT,
  "totalDays" DOUBLE PRECISION NOT NULL,
  "userId" TEXT NOT NULL,
  "status" "LeaveRequestStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "reviewComments" TEXT,
  "hasAlternative" BOOLEAN NOT NULL DEFAULT false,
  "alternativeStartDate" TIMESTAMP(3),
  "alternativeEndDate" TIMESTAMP(3),
  "alternativeComments" TEXT,
  "alternativeAccepted" BOOLEAN,
  "alternativeRespondedAt" TIMESTAMP(3),
  "organizationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "LeaveRequest_userId_idx" ON "LeaveRequest"("userId");
CREATE INDEX "LeaveRequest_organizationId_idx" ON "LeaveRequest"("organizationId");
CREATE INDEX "LeaveRequest_status_idx" ON "LeaveRequest"("status");
CREATE INDEX "LeaveRequest_startDate_idx" ON "LeaveRequest"("startDate");
CREATE INDEX "LeaveRequest_endDate_idx" ON "LeaveRequest"("endDate");
CREATE INDEX "LeaveRequest_reviewedById_idx" ON "LeaveRequest"("reviewedById");

-- ActivityLog
CREATE TABLE "ActivityLog" (
  "id" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "description" TEXT NOT NULL,
  "details" JSONB,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "page" TEXT,
  "severity" "LogSeverity" NOT NULL DEFAULT 'INFO',
  "userId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "patientId" TEXT,
  "appointmentId" TEXT,
  "taskId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");
CREATE INDEX "ActivityLog_organizationId_idx" ON "ActivityLog"("organizationId");
CREATE INDEX "ActivityLog_action_idx" ON "ActivityLog"("action");
CREATE INDEX "ActivityLog_entityType_idx" ON "ActivityLog"("entityType");
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");
CREATE INDEX "ActivityLog_page_idx" ON "ActivityLog"("page");
CREATE INDEX "ActivityLog_severity_idx" ON "ActivityLog"("severity");

-- ClinicSchedule
CREATE TABLE "ClinicSchedule" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "roomCount" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ClinicSchedule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClinicSchedule_organizationId_idx" ON "ClinicSchedule"("organizationId");
CREATE INDEX "ClinicSchedule_isActive_idx" ON "ClinicSchedule"("isActive");
CREATE INDEX "ClinicSchedule_startDate_endDate_idx" ON "ClinicSchedule"("startDate", "endDate");

-- RoomAssignment
CREATE TABLE "RoomAssignment" (
  "id" TEXT NOT NULL,
  "scheduleId" TEXT NOT NULL,
  "roomNumber" INTEGER NOT NULL,
  "mainPractitionerId" TEXT,
  "sidePractitionerId" TEXT,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "workingDays" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RoomAssignment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RoomAssignment_scheduleId_roomNumber_key" ON "RoomAssignment"("scheduleId", "roomNumber");
CREATE INDEX "RoomAssignment_scheduleId_idx" ON "RoomAssignment"("scheduleId");
CREATE INDEX "RoomAssignment_roomNumber_idx" ON "RoomAssignment"("roomNumber");
CREATE INDEX "RoomAssignment_mainPractitionerId_idx" ON "RoomAssignment"("mainPractitionerId");
CREATE INDEX "RoomAssignment_sidePractitionerId_idx" ON "RoomAssignment"("sidePractitionerId");

-- ScheduleOverride
CREATE TABLE "ScheduleOverride" (
  "id" TEXT NOT NULL,
  "scheduleId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "roomNumber" INTEGER,
  "practitionerId" TEXT,
  "startTime" TEXT,
  "endTime" TEXT,
  "isUnavailable" BOOLEAN NOT NULL DEFAULT false,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ScheduleOverride_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ScheduleOverride_scheduleId_date_roomNumber_practitionerId_key" ON "ScheduleOverride"("scheduleId", "date", "roomNumber", "practitionerId");
CREATE INDEX "ScheduleOverride_scheduleId_idx" ON "ScheduleOverride"("scheduleId");
CREATE INDEX "ScheduleOverride_date_idx" ON "ScheduleOverride"("date");
CREATE INDEX "ScheduleOverride_practitionerId_idx" ON "ScheduleOverride"("practitionerId");

-- OtherWorkerSchedule
CREATE TABLE "OtherWorkerSchedule" (
  "id" TEXT NOT NULL,
  "scheduleId" TEXT NOT NULL,
  "practitionerId" TEXT NOT NULL,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "workingDays" TEXT[] NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "OtherWorkerSchedule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OtherWorkerSchedule_scheduleId_practitionerId_key" ON "OtherWorkerSchedule"("scheduleId", "practitionerId");
CREATE INDEX "OtherWorkerSchedule_scheduleId_idx" ON "OtherWorkerSchedule"("scheduleId");
CREATE INDEX "OtherWorkerSchedule_practitionerId_idx" ON "OtherWorkerSchedule"("practitionerId");

-- RoomShift
CREATE TABLE "RoomShift" (
  "id" TEXT NOT NULL,
  "scheduleId" TEXT NOT NULL,
  "roomNumber" INTEGER NOT NULL,
  "practitionerId" TEXT NOT NULL,
  "sidePractitionerId" TEXT,
  "startTime" TEXT NOT NULL,
  "endTime" TEXT NOT NULL,
  "date" TIMESTAMP(3),
  "dayOfWeek" TEXT,
  "priority" INTEGER NOT NULL DEFAULT 0,
  "isOverride" BOOLEAN NOT NULL DEFAULT false,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "RoomShift_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "RoomShift_scheduleId_idx" ON "RoomShift"("scheduleId");
CREATE INDEX "RoomShift_roomNumber_idx" ON "RoomShift"("roomNumber");
CREATE INDEX "RoomShift_practitionerId_idx" ON "RoomShift"("practitionerId");
CREATE INDEX "RoomShift_sidePractitionerId_idx" ON "RoomShift"("sidePractitionerId");
CREATE INDEX "RoomShift_date_idx" ON "RoomShift"("date");
CREATE INDEX "RoomShift_dayOfWeek_idx" ON "RoomShift"("dayOfWeek");
CREATE INDEX "RoomShift_scheduleId_roomNumber_date_idx" ON "RoomShift"("scheduleId", "roomNumber", "date");
CREATE INDEX "RoomShift_scheduleId_roomNumber_dayOfWeek_idx" ON "RoomShift"("scheduleId", "roomNumber", "dayOfWeek");

-- ManagerPersonalNotes
CREATE TABLE "ManagerPersonalNotes" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ManagerPersonalNotes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ManagerPersonalNotes_userId_organizationId_key" ON "ManagerPersonalNotes"("userId", "organizationId");
CREATE INDEX "ManagerPersonalNotes_userId_idx" ON "ManagerPersonalNotes"("userId");
CREATE INDEX "ManagerPersonalNotes_organizationId_idx" ON "ManagerPersonalNotes"("organizationId");

-- ManagerPersonalLink
CREATE TABLE "ManagerPersonalLink" (
  "id" TEXT NOT NULL,
  "personalNotesId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ManagerPersonalLink_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ManagerPersonalLink_personalNotesId_idx" ON "ManagerPersonalLink"("personalNotesId");

-- ProcedureBackup
CREATE TABLE "ProcedureBackup" (
  "id" TEXT NOT NULL,
  "procedureId" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "backupType" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "ProcedureBackup_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ProcedureBackup_id_key" ON "ProcedureBackup"("id");

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- User
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_disabledBy_fkey" FOREIGN KEY ("disabledBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Patient
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Patient" ADD CONSTRAINT "Patient_disabledBy_fkey" FOREIGN KEY ("disabledBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- SurgicalProcedure
ALTER TABLE "SurgicalProcedure" ADD CONSTRAINT "SurgicalProcedure_codeId_fkey" FOREIGN KEY ("codeId") REFERENCES "SurgicalProcedureCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SurgicalProcedure" ADD CONSTRAINT "SurgicalProcedure_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SurgicalProcedure" ADD CONSTRAINT "SurgicalProcedure_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Appointment
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "Treatment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Treatment
ALTER TABLE "Treatment" ADD CONSTRAINT "Treatment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Image
ALTER TABLE "Image" ADD CONSTRAINT "Image_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- PendingAppointment
ALTER TABLE "PendingAppointment" ADD CONSTRAINT "PendingAppointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PendingAppointment" ADD CONSTRAINT "PendingAppointment_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ScheduleRule
ALTER TABLE "ScheduleRule" ADD CONSTRAINT "ScheduleRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CalendarSettings
ALTER TABLE "CalendarSettings" ADD CONSTRAINT "CalendarSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ChatRoom
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ChatParticipant
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ChatParticipant" ADD CONSTRAINT "ChatParticipant_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Message
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- File
ALTER TABLE "File" ADD CONSTRAINT "File_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AsaRecord
ALTER TABLE "AsaRecord" ADD CONSTRAINT "AsaRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CarePlan
ALTER TABLE "CarePlan" ADD CONSTRAINT "CarePlan_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- NoteFolder
ALTER TABLE "NoteFolder" ADD CONSTRAINT "NoteFolder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Note
ALTER TABLE "Note" ADD CONSTRAINT "Note_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Note" ADD CONSTRAINT "Note_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "NoteFolder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Note" ADD CONSTRAINT "Note_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- PatientStatusRecord
ALTER TABLE "PatientStatusRecord" ADD CONSTRAINT "PatientStatusRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Calibration
ALTER TABLE "Calibration" ADD CONSTRAINT "Calibration_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Annotation
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- OrganizationThemeSettings
ALTER TABLE "OrganizationThemeSettings" ADD CONSTRAINT "OrganizationThemeSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- PersonalThemeSettings
ALTER TABLE "PersonalThemeSettings" ADD CONSTRAINT "PersonalThemeSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- UserDashboard
ALTER TABLE "UserDashboard" ADD CONSTRAINT "UserDashboard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Task
ALTER TABLE "Task" ADD CONSTRAINT "Task_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "TaskBoard"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_completedBy_fkey" FOREIGN KEY ("completedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TaskBoard
ALTER TABLE "TaskBoard" ADD CONSTRAINT "TaskBoard_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskBoard" ADD CONSTRAINT "TaskBoard_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- BoardMember
ALTER TABLE "BoardMember" ADD CONSTRAINT "BoardMember_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BoardMember" ADD CONSTRAINT "BoardMember_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "TaskBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BoardMember" ADD CONSTRAINT "BoardMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- TaskOption
ALTER TABLE "TaskOption" ADD CONSTRAINT "TaskOption_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TaskVote
ALTER TABLE "TaskVote" ADD CONSTRAINT "TaskVote_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "TaskOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskVote" ADD CONSTRAINT "TaskVote_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskVote" ADD CONSTRAINT "TaskVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- TaskAssignment
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskAssignment" ADD CONSTRAINT "TaskAssignment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- TaskMessage
ALTER TABLE "TaskMessage" ADD CONSTRAINT "TaskMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TaskMessage" ADD CONSTRAINT "TaskMessage_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- TaskReminder
ALTER TABLE "TaskReminder" ADD CONSTRAINT "TaskReminder_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- WaitingListEntry
ALTER TABLE "WaitingListEntry" ADD CONSTRAINT "WaitingListEntry_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WaitingListEntry" ADD CONSTRAINT "WaitingListEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WaitingListEntry" ADD CONSTRAINT "WaitingListEntry_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WaitingListEntry" ADD CONSTRAINT "WaitingListEntry_waitingAppointmentId_fkey" FOREIGN KEY ("waitingAppointmentId") REFERENCES "WaitingAppointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- WaitingAppointment
ALTER TABLE "WaitingAppointment" ADD CONSTRAINT "WaitingAppointment_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WaitingAppointment" ADD CONSTRAINT "WaitingAppointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- UserFinanceSettings
ALTER TABLE "UserFinanceSettings" ADD CONSTRAINT "UserFinanceSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- UserIncome
ALTER TABLE "UserIncome" ADD CONSTRAINT "UserIncome_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- UserExpense
ALTER TABLE "UserExpense" ADD CONSTRAINT "UserExpense_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- FinancialReport
ALTER TABLE "FinancialReport" ADD CONSTRAINT "FinancialReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Product
ALTER TABLE "Product" ADD CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ShopPurchase
ALTER TABLE "ShopPurchase" ADD CONSTRAINT "ShopPurchase_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ShopPurchase" ADD CONSTRAINT "ShopPurchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Vendor
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ItemCategory
ALTER TABLE "ItemCategory" ADD CONSTRAINT "ItemCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- OrderRequest
ALTER TABLE "OrderRequest" ADD CONSTRAINT "OrderRequest_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ItemCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderRequest" ADD CONSTRAINT "OrderRequest_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderRequest" ADD CONSTRAINT "OrderRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderRequest" ADD CONSTRAINT "OrderRequest_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderRequest" ADD CONSTRAINT "OrderRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderRequest" ADD CONSTRAINT "OrderRequest_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Order
ALTER TABLE "Order" ADD CONSTRAINT "Order_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_orderedById_fkey" FOREIGN KEY ("orderedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- OrderItem
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ItemCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Location
ALTER TABLE "Location" ADD CONSTRAINT "Location_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Equipment
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Equipment" ADD CONSTRAINT "Equipment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ContactPerson
ALTER TABLE "ContactPerson" ADD CONSTRAINT "ContactPerson_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- LocationContact
ALTER TABLE "LocationContact" ADD CONSTRAINT "LocationContact_contactPersonId_fkey" FOREIGN KEY ("contactPersonId") REFERENCES "ContactPerson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LocationContact" ADD CONSTRAINT "LocationContact_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RepairRequest
ALTER TABLE "RepairRequest" ADD CONSTRAINT "RepairRequest_contactPersonId_fkey" FOREIGN KEY ("contactPersonId") REFERENCES "ContactPerson"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RepairRequest" ADD CONSTRAINT "RepairRequest_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "Equipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RepairRequest" ADD CONSTRAINT "RepairRequest_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RepairRequest" ADD CONSTRAINT "RepairRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RepairRequest" ADD CONSTRAINT "RepairRequest_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- OrderTimelineEvent
ALTER TABLE "OrderTimelineEvent" ADD CONSTRAINT "OrderTimelineEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderTimelineEvent" ADD CONSTRAINT "OrderTimelineEvent_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderTimelineEvent" ADD CONSTRAINT "OrderTimelineEvent_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "OrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- LeaveRequest
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ActivityLog
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ClinicSchedule
ALTER TABLE "ClinicSchedule" ADD CONSTRAINT "ClinicSchedule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RoomAssignment
ALTER TABLE "RoomAssignment" ADD CONSTRAINT "RoomAssignment_mainPractitionerId_fkey" FOREIGN KEY ("mainPractitionerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RoomAssignment" ADD CONSTRAINT "RoomAssignment_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ClinicSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoomAssignment" ADD CONSTRAINT "RoomAssignment_sidePractitionerId_fkey" FOREIGN KEY ("sidePractitionerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ScheduleOverride
ALTER TABLE "ScheduleOverride" ADD CONSTRAINT "ScheduleOverride_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ScheduleOverride" ADD CONSTRAINT "ScheduleOverride_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ClinicSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- OtherWorkerSchedule
ALTER TABLE "OtherWorkerSchedule" ADD CONSTRAINT "OtherWorkerSchedule_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OtherWorkerSchedule" ADD CONSTRAINT "OtherWorkerSchedule_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ClinicSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RoomShift
ALTER TABLE "RoomShift" ADD CONSTRAINT "RoomShift_practitionerId_fkey" FOREIGN KEY ("practitionerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoomShift" ADD CONSTRAINT "RoomShift_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "ClinicSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoomShift" ADD CONSTRAINT "RoomShift_sidePractitionerId_fkey" FOREIGN KEY ("sidePractitionerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ManagerPersonalNotes
ALTER TABLE "ManagerPersonalNotes" ADD CONSTRAINT "ManagerPersonalNotes_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ManagerPersonalNotes" ADD CONSTRAINT "ManagerPersonalNotes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ManagerPersonalLink
ALTER TABLE "ManagerPersonalLink" ADD CONSTRAINT "ManagerPersonalLink_personalNotesId_fkey" FOREIGN KEY ("personalNotesId") REFERENCES "ManagerPersonalNotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;

-- ============================================================================
-- END OF INITIALIZATION SCRIPT
-- ============================================================================
-- After running this script, you can:
-- 1. Run: npx prisma generate
-- 2. Start using the database with your application
-- ============================================================================

