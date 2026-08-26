import { StyleSheet } from "react-native";
import { AppColors } from "../../../theme/colors";

export const createAgendamientoStyles = (colors: AppColors) => 
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 15,
      paddingVertical: 10,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 5,
    },
    backText: {
      fontSize: 24,
      color: colors.primary,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
    },
    saveButton: {
      padding: 8,
      backgroundColor: colors.primary,
      borderRadius: 8,
    },
    saveButtonText: {
      color: colors.onPrimary,
      fontWeight: "bold",
    },
    content: {
      padding: 15,
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 15,
      marginBottom: 15,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginBottom: 10,
      color: colors.text,
    },
    inputLabel: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
      marginTop: 10,
      marginBottom: 5,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: colors.inputBackground,
      color: colors.text,
    },
    pickerContainer: {
      marginBottom: 10,
      // Los colores del contenedor se controlan a través de ThemedPickerContainer o the view wrapper directly
    },
    buttonSecondary: {
      backgroundColor: colors.surfaceElevated,
      padding: 10,
      borderRadius: 8,
      alignItems: "center",
      marginTop: 10,
    },
    buttonSecondaryText: {
      color: colors.primary,
      fontWeight: "bold",
    },
    productRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    productName: {
      flex: 2,
      fontSize: 14,
      color: colors.text,
    },
    productInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 8,
      marginHorizontal: 5,
      textAlign: "center",
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.inputBackground,
    },
    removeButton: {
      padding: 5,
    },
    removeButtonText: {
      color: colors.danger,
      fontSize: 18,
      fontWeight: "bold",
    },
    errorText: {
      color: colors.danger,
      marginTop: 5,
      marginBottom: 10,
      textAlign: "center",
    },
  });
