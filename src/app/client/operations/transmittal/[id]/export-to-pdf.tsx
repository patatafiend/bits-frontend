import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { TransmittalWithItems } from "@/lib/types";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10 },

  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  companyName: { fontSize: 18, fontWeight: "bold", letterSpacing: 1 },
  companySubtitle: { fontSize: 11, color: "#555" },
  titleBlock: { alignItems: "flex-end" },
  metaRow: { flexDirection: "row", borderWidth: 1, borderColor: "#000" },
  metaCell: {
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRightWidth: 1,
    borderRightColor: "#000",
    fontSize: 9,
  },
  metaCellLast: { paddingVertical: 3, paddingHorizontal: 6, fontSize: 9 },
  metaLabel: { fontWeight: "bold" },

  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginVertical: 10,
  },

  // Info grid
  infoTable: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 14,
  },
  infoCol: { flex: 1 },
  infoRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  infoRowLast: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  infoLabel: { fontWeight: "bold", width: 90, fontSize: 9 },
  infoValue: { flex: 1, fontSize: 9 },
  infoColDivider: { borderRightWidth: 1, borderRightColor: "#ccc" },

  // Files table
  tableTitle: { fontSize: 10, fontWeight: "bold", marginBottom: 4 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#000",
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontWeight: "bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
    paddingVertical: 4,
    paddingHorizontal: 4,
    fontSize: 9,
  },
  colItem: { width: 30, textAlign: "center" },
  colFilename: { flex: 3 },
  colFormat: { width: 40, textAlign: "center" },

  // From / To
  fromToSection: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 14,
  },
  fromToCol: { flex: 1, paddingVertical: 6, paddingHorizontal: 10 },
  fromToColDivider: { borderRightWidth: 1, borderRightColor: "#ccc" },
  fromToHeading: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 4,
    letterSpacing: 1,
  },
  fromToName: { fontSize: 11, fontWeight: "bold", marginBottom: 2 },
  fromToDetail: { fontSize: 9, color: "#444", marginBottom: 1 },

  // Signatures
  signatureSection: {
    flexDirection: "row",
    marginTop: 32,
  },
  signatureCol: {
    flex: 1,
    paddingHorizontal: 10,
  },
  signatureColDivider: {
    borderRightWidth: 1,
    borderRightColor: "#e5e7eb",
  },
  signatureHeading: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 32,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginBottom: 4,
  },
  signatureName: { fontSize: 9, fontWeight: "bold", marginBottom: 2 },
  signatureLabel: { fontSize: 8, color: "#6b7280" },
  signatureDateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
  },
  signatureDateBox: { flex: 1 },
  signatureDateLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginBottom: 4,
    marginRight: 16,
  },
  signatureDateLabel: { fontSize: 8, color: "#6b7280" },
});

export function TransmittalPDF({
  transmittalData,
}: {
  transmittalData: TransmittalWithItems;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.companyName}>TRANSMITTAL</Text>
            <Text style={styles.companySubtitle}>Document Transmittal Sheet</Text>
          </View>
          <View style={styles.titleBlock}>
            <View style={styles.metaRow}>
              <Text style={styles.metaCell}>
                <Text style={styles.metaLabel}># </Text>
                {transmittalData.transmittal_number}
              </Text>
              <Text style={styles.metaCellLast}>
                <Text style={styles.metaLabel}>Date </Text>
                {transmittalData.transmittal_date}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* From / To */}
        <View style={styles.fromToSection}>
          <View style={[styles.fromToCol, styles.fromToColDivider]}>
            <Text style={styles.fromToHeading}>From</Text>
            {/* <Text style={styles.fromToName}>
              {transmittalData.user_assigned?.username ?? "—"}
            </Text>
            <Text style={styles.fromToDetail}>Billing Officer</Text> */}
          </View>
          <View style={styles.fromToCol}>
            <Text style={styles.fromToHeading}>To</Text>
            <Text style={styles.fromToName}>
              {transmittalData.billing_receiver_name ?? "—"}
            </Text>
            <Text style={styles.fromToDetail}>
              {transmittalData.billing_receiver_company ?? "—"}
            </Text>
            <Text style={styles.fromToDetail}>
              {transmittalData.billing_receiver_email ?? "—"}
            </Text>
          </View>
        </View>

        {/* Info Grid */}
        <View style={styles.infoTable}>
          <View style={[styles.infoCol, styles.infoColDivider]}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Recipient Name:</Text>
              <Text style={styles.infoValue}>
                {transmittalData.billing_receiver_name ?? "—"}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Recipient Company:</Text>
              <Text style={styles.infoValue}>
                {transmittalData.billing_receiver_company ?? "—"}
              </Text>
            </View>
            <View style={styles.infoRowLast}>
              <Text style={styles.infoLabel}>Recipient Email:</Text>
              <Text style={styles.infoValue}>
                {transmittalData.billing_receiver_email ?? "—"}
              </Text>
            </View>
          </View>
          <View style={styles.infoCol}>
            <View style={styles.infoRow}>
              {/* <Text style={styles.infoLabel}>Billing Officer:</Text>
              <Text style={styles.infoValue}>
                {transmittalData.user_assigned?.username ?? "—"}
              </Text> */}
            </View>
            <View style={styles.infoRowLast}>
              <Text style={styles.infoLabel}>Transmittal #:</Text>
              <Text style={styles.infoValue}>
                {transmittalData.transmittal_number}
              </Text>
            </View>
          </View>
        </View>

        {/* Files Table */}
        <Text style={styles.tableTitle}>Transmitted Documents</Text>
        <View style={styles.tableHeader}>
          <Text style={styles.colItem}>Item</Text>
          <Text style={styles.colFilename}>Filename</Text>
          <Text style={styles.colFormat}>Format</Text>
        </View>

        {transmittalData.transmittal_items?.length > 0 ? (
          transmittalData.transmittal_items.map((item, index) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={styles.colItem}>{index + 1}</Text>
              <Text style={styles.colFilename}>{item.file_name}</Text>
              <Text style={styles.colFormat}>
                {item.file_type?.split("/")[1]?.toUpperCase() ?? "—"}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.tableRow}>
            <Text style={{ fontSize: 9, color: "#9ca3af", padding: 4 }}>
              No files uploaded yet.
            </Text>
          </View>
        )}

        {/* Signatures */}
        <View style={styles.divider} />
        <View style={styles.signatureSection}>

          {/* Sender */}
          <View style={[styles.signatureCol, styles.signatureColDivider]}>
            <Text style={styles.signatureHeading}>Issued By</Text>
            <View style={styles.signatureLine} />
            {/* <Text style={styles.signatureName}>
              {transmittalData.user_assigned?.username ?? "—"}
            </Text>
            <Text style={styles.signatureLabel}>Billing Officer</Text> */}
            <View style={styles.signatureDateRow}>
              <View style={styles.signatureDateBox}>
                <View style={styles.signatureDateLine} />
                <Text style={styles.signatureDateLabel}>Date</Text>
              </View>
            </View>
          </View>

          {/* Receiver */}
          <View style={styles.signatureCol}>
            <Text style={styles.signatureHeading}>Received By</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>
              {transmittalData.billing_receiver_name ?? "—"}
            </Text>
            <Text style={styles.signatureLabel}>
              {transmittalData.billing_receiver_company ?? ""}
            </Text>
            <View style={styles.signatureDateRow}>
              <View style={styles.signatureDateBox}>
                <View style={styles.signatureDateLine} />
                <Text style={styles.signatureDateLabel}>Date</Text>
              </View>
            </View>
          </View>

        </View>
      </Page>
    </Document>
  );
}