import { Section, Row, Column, Text, Hr } from "@react-email/components";

interface InvoiceSummaryProps {
  invoiceNumber: string;
  issueDate?: string;
  dueDate?: string;
  total: string;
  balanceDue?: string;
  accentColor?: string;
}

export function InvoiceSummary({
  invoiceNumber,
  issueDate,
  dueDate,
  total,
  balanceDue,
  accentColor = "#111827",
}: InvoiceSummaryProps) {
  return (
    <Section style={{ marginTop: 16, marginBottom: 8 }}>
      {issueDate && (
        <Row style={{ marginBottom: 8 }}>
          <Column>
            <Text style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Issue date</Text>
          </Column>
          <Column align="right">
            <Text style={{ fontSize: 13, color: "#111827", margin: 0 }}>{issueDate}</Text>
          </Column>
        </Row>
      )}
      {dueDate && (
        <Row style={{ marginBottom: 8 }}>
          <Column>
            <Text style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Due date</Text>
          </Column>
          <Column align="right">
            <Text style={{ fontSize: 13, color: "#111827", margin: 0 }}>{dueDate}</Text>
          </Column>
        </Row>
      )}
      <Row style={{ marginBottom: 8 }}>
        <Column>
          <Text style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Invoice</Text>
        </Column>
        <Column align="right">
          <Text style={{ fontSize: 13, color: "#111827", margin: 0 }}>{invoiceNumber}</Text>
        </Column>
      </Row>
      <Hr style={{ borderColor: "#e5e7eb", margin: "8px 0" }} />
      <Row>
        <Column>
          <Text style={{ fontSize: 15, fontWeight: 700, color: "#111827", margin: 0 }}>
            {balanceDue !== undefined ? "Balance due" : "Total"}
          </Text>
        </Column>
        <Column align="right">
          <Text
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: accentColor,
              margin: 0,
            }}
          >
            {balanceDue !== undefined ? balanceDue : total}
          </Text>
        </Column>
      </Row>
    </Section>
  );
}
