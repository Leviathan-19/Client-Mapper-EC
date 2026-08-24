import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingTop: 50, // For status bar
  },
  backButton: {
    padding: 5,
  },
  backText: {
    fontSize: 24,
    color: "#007bff",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  saveButton: {
    padding: 8,
    backgroundColor: "#007bff",
    borderRadius: 8,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  content: {
    padding: 15,
  },
  section: {
    backgroundColor: "#fff",
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
    color: "#333",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: "#000000ff",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#000000",
    borderRadius: 8,
    backgroundColor: "#ffffff", // Fondo blanco
    marginBottom: 10,
  },
  buttonSecondary: {
    backgroundColor: "#e9ecef",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonSecondaryText: {
    color: "#007bff",
    fontWeight: "bold",
  },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  productName: {
    flex: 2,
    fontSize: 14,
  },
  productInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 8,
    marginHorizontal: 5,
    textAlign: "center",
    fontSize: 14,
  },
  removeButton: {
    padding: 5,
  },
  removeButtonText: {
    color: "#dc3545",
    fontSize: 18,
    fontWeight: "bold",
  },
  errorText: {
    color: "#dc3545",
    marginTop: 5,
    marginBottom: 10,
    textAlign: "center",
  },
});
