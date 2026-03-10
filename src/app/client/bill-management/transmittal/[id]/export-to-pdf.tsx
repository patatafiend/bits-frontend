import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { TransmittalWithItems } from "@/lib/types";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica" },
  header: { fontSize: 18, fontWeight: "bold", marginBottom: 16 },
  section: { marginBottom: 12 },
  label: { fontSize: 10, color: "#6b7280", marginBottom: 2 },
  value: { fontSize: 12, fontWeight: "medium" },
  divider: { borderBottom: "1 solid #e5e7eb", marginVertical: 12 },
  row: { flexDirection: "row", gap: 16, marginBottom: 8 },
  col: { flex: 1 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: "6 8",
    fontSize: 10,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1 solid #e5e7eb",
    padding: "6 8",
    fontSize: 10,
  },
  colFile: { flex: 3 },
  colSize: { flex: 1 },
  colDate: { flex: 2 },
  badge: {
    padding: "2 6",
    borderRadius: 4,
    fontSize: 10,
    textTransform: "capitalize",
  },
});

const STATUS_COLORS: Record<string, string> = {
  draft: "#d1d5db",
  accepted: "#bbf7d0",
  rejected: "#fecaca",
  pending: "#fed7aa",
};

export function TransmittalPDF({
  transmittalData,
}: {
  transmittalData: TransmittalWithItems;
}) {
  const statusColor = STATUS_COLORS[transmittalData.status] ?? "#e5e7eb";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Title */}
        <Text style={styles.header}>Transmittal Details</Text>
        <View style={styles.divider} />

        {/* Details Grid */}
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Transmittal Number</Text>
            <Text style={styles.value}>
              {transmittalData.transmittal_number}
            </Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{transmittalData.transmittal_date}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>
              {transmittalData.billing_receiver_email
                ? "Receiver"
                : "Billing Officer"}
            </Text>
            <Text style={styles.value}>
              {transmittalData.billing_receiver_email ??
                transmittalData.user_assigned?.username ??
                "No officer assigned"}
            </Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Status</Text>
            <View style={[styles.badge, { backgroundColor: statusColor }]}>
              <Text>{transmittalData.status}</Text>
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Files Table */}
        <Text style={[styles.value, { marginBottom: 8 }]}>Uploaded Files</Text>

        {transmittalData.transmittal_items?.length > 0 ? (
          <View>
            <View style={styles.tableHeader}>
              <Text style={styles.colFile}>File Name</Text>
              <Text style={styles.colSize}>Size (MB)</Text>
              <Text style={styles.colDate}>Uploaded At</Text>
            </View>
            {transmittalData.transmittal_items.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.colFile}>{item.file_name}</Text>
                <Text style={styles.colSize}>
                  {(parseInt(item.file_size) / 1024 / 1024).toFixed(2)}
                </Text>
                <Text style={styles.colDate}>
                  {new Date(item.uploaded_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={{ fontSize: 11, color: "#9ca3af" }}>
            No files uploaded yet.
          </Text>
        )}
      </Page>
    </Document>
  );
}
