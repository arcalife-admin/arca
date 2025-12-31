export interface OrganizationThemeSettings {
  id: string
  organizationId: string

  // Colors - Primary Theme
  primaryColor: string
  primaryForeground: string
  secondaryColor: string
  secondaryForeground: string
  accentColor: string
  accentForeground: string

  // Background Colors
  backgroundColor: string
  surfaceColor: string
  borderColor: string

  // Text Colors
  textPrimary: string
  textSecondary: string
  textMuted: string

  // State Colors
  successColor: string
  warningColor: string
  errorColor: string
  infoColor: string

  // Typography
  fontFamily: string
  headingFontFamily: string
  fontSize: string
  headingScale: string
  lineHeight: string
  letterSpacing: string

  // Spacing & Layout
  borderRadius: string
  spacing: string
  maxWidth: string
  sidebarWidth: string

  // Component Sizes
  buttonSize: string
  inputSize: string
  avatarSize: string
  iconSize: string

  // Shadows & Effects
  shadowLevel: string
  animationSpeed: string

  // Calendar Specific
  calendarTodayBg: string
  calendarAccentBg: string

  // Custom CSS Variables
  customVariables?: Record<string, string>

  // Metadata
  createdAt: string
  updatedAt: string
}

export interface PersonalThemeSettings {
  id: string
  userId: string

  // Colors - Primary Theme
  primaryColor: string
  primaryForeground: string
  secondaryColor: string
  secondaryForeground: string
  accentColor: string
  accentForeground: string

  // Background Colors
  backgroundColor: string
  surfaceColor: string
  borderColor: string

  // Text Colors
  textPrimary: string
  textSecondary: string
  textMuted: string

  // State Colors
  successColor: string
  warningColor: string
  errorColor: string
  infoColor: string

  // Typography
  fontFamily: string
  headingFontFamily: string
  fontSize: string
  headingScale: string
  lineHeight: string
  letterSpacing: string

  // Spacing & Layout
  borderRadius: string
  spacing: string
  maxWidth: string
  sidebarWidth: string

  // Component Sizes
  buttonSize: string
  inputSize: string
  avatarSize: string
  iconSize: string

  // Shadows & Effects
  shadowLevel: string
  animationSpeed: string

  // Calendar Specific
  calendarTodayBg: string
  calendarAccentBg: string

  // Custom CSS Variables
  customVariables?: Record<string, string>

  // Metadata
  createdAt: string
  updatedAt: string
} 