import React from 'react';
import {
  Picker,
  PickerItemProps,
  PickerProps,
} from '@react-native-picker/picker';
import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '../context/ThemeContext';

export const ThemedPicker: React.FC<PickerProps> = ({ style, ...props }) => {
  const { colors } = useAppTheme();
  return (
    <Picker
      {...props}
      style={[{ color: colors.text, backgroundColor: colors.inputBackground }, style]}
      dropdownIconColor={colors.pickerIcon}
    />
  );
};

export const ThemedPickerItem: React.FC<PickerItemProps> = (props) => {
  const { colors } = useAppTheme();
  return <Picker.Item {...props} color={colors.text} />;
};

export const ThemedPickerContainer: React.FC<React.ComponentProps<typeof View>> = ({
  style,
  ...props
}) => {
  const { colors } = useAppTheme();
  return (
    <View
      {...props}
      style={[
        pickerStyles.container,
        { backgroundColor: colors.inputBackground, borderColor: colors.border },
        style,
      ]}
    />
  );
};

const pickerStyles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
