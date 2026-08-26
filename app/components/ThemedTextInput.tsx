import React from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';

export const ThemedTextInput: React.FC<TextInputProps> = ({ style, placeholderTextColor, ...props }) => {
  const { colors } = useAppTheme();
  return (
    <TextInput
      {...props}
      style={[{ color: colors.text }, style]}
      placeholderTextColor={placeholderTextColor ?? colors.placeholder}
    />
  );
};
