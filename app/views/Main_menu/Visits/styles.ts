import { StyleSheet, Platform } from "react-native";
import { AppColors } from "../../../theme/colors";

export const createVisitsStyles = (colors: AppColors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 15,
      paddingTop: Platform.OS === "ios" ? 20 : 15,
      paddingBottom: 15,
      backgroundColor: colors.surface,
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      zIndex: 10,
    },
    backButton: {
      padding: 10,
      marginRight: 10,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "bold",
      color: colors.text,
      flex: 1,
    },
    toggleButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.primary,
      marginLeft: 10,
    },
    toggleText: {
      color: colors.onPrimary,
      fontWeight: "bold",
      fontSize: 14,
    },
    searchBar: {
      backgroundColor: colors.inputBackground,
      padding: 12,
      borderRadius: 8,
      marginBottom: 10,
      marginTop: 10,
      marginHorizontal: 15,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
    },
    content: {
      flex: 1,
    },
    list: {
      padding: 15,
    },
    card: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      marginBottom: 15,
      elevation: 2,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      borderLeftWidth: 5,
      borderLeftColor: colors.primary,
    },
    cardTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 5,
    },
    cardText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    statusBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginTop: 5,
    },
    statusText: {
      fontSize: 12,
      color: colors.onPrimary,
      fontWeight: "bold",
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: "flex-end",
    },
    modalContainer: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: "80%",
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.25,
      shadowRadius: 5,
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 10,
    },
    modalSubtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 15,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginTop: 15,
      marginBottom: 5,
    },
    modalText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 5,
    },
    modalButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 25,
    },
    modalButton: {
      flex: 1,
      padding: 14,
      borderRadius: 8,
      alignItems: "center",
      marginHorizontal: 5,
    },
    cancelButton: {
      backgroundColor: colors.textMuted,
    },
    actionButton: {
      backgroundColor: colors.primary,
    },
    checkInButton: {
      backgroundColor: colors.warning,
    },
    completeButton: {
      backgroundColor: colors.success,
    },
    modalButtonText: {
      color: colors.onPrimary,
      fontWeight: "bold",
      fontSize: 14,
    },
  });
