/**
 * Global design system constants.
 *
 * Provides a single source of truth for colors, typography, and spacing
 * to ensure consistency across the application.
 */

export const colors = {
  /** Deep green - primary brand color. Conveys trust and growth. */
  primary: '#0B6E4F',
  /** Accent gold - used for highlights, calls to action, and Verified badges. */
  accent: '#F4A825',
  
  background: '#F8F9FA',
  surface: '#FFFFFF',
  
  text: '#1C1C1E',
  textSecondary: '#6C757D',
  
  error: '#DC3545',
  success: '#28A745',
  warning: '#FFC107',
  border: '#E9ECEF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const typography = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    bold: '700' as const,
  },
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  pill: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
};
