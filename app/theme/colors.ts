export type AppColors = {
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  placeholder: string;
  border: string;
  inputBackground: string;
  primary: string;
  onPrimary: string;
  success: string;
  warning: string;
  danger: string;
  overlay: string;
  pickerIcon: string;
};

export const lightColors: AppColors = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  text: '#1F2937',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  placeholder: '#6B7280',
  border: '#D1D5DB',
  inputBackground: '#F9FAFB',
  primary: '#007BFF',
  onPrimary: '#FFFFFF',
  success: '#28A745',
  warning: '#D97706',
  danger: '#DC3545',
  overlay: 'rgba(0, 0, 0, 0.5)',
  pickerIcon: '#1F2937',
};

export const darkColors: AppColors = {
  background: '#111827',
  surface: '#1F2937',
  surfaceElevated: '#273449',
  text: '#F9FAFB',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  placeholder: '#9CA3AF',
  border: '#4B5563',
  inputBackground: '#273449',
  primary: '#60A5FA',
  onPrimary: '#111827',
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#F87171',
  overlay: 'rgba(0, 0, 0, 0.7)',
  pickerIcon: '#F9FAFB',
};
