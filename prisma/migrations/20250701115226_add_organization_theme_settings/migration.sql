-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationThemeSettings_organizationId_key" ON "OrganizationThemeSettings"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationThemeSettings_organizationId_idx" ON "OrganizationThemeSettings"("organizationId");

-- AddForeignKey
ALTER TABLE "OrganizationThemeSettings" ADD CONSTRAINT "OrganizationThemeSettings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
