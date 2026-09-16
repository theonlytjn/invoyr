import { Section, Row, Column, Text, Hr } from "@react-email/components";
import { discountLabel } from "@/lib/invoice-totals";

interface InvoiceSummaryProps {
  invoiceNumber: string;
  issueDate?: string;
  dueDate?: string;
  total: string;
  balanceDue?: string;
  /** Amount before the discount (VAT included). Only rendered alongside `discount`. */
  totalBeforeDiscount?: string;
  /** Formatted discount amount, e.g. "£337.50". Omit when there is no discount. */
  discount?: string;
  discountReason?: string | null;
  accentColor?: string;
}

export function InvoiceSummary({
  invoiceNumber,
  issueDate,
  dueDate,
  total,
  balanceDue,
  totalBeforeDiscount,
  discount,
  discountReason,
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
      {discount && totalBeforeDiscount && (
        <Row style={{ marginBottom: 8 }}>
          <Column>
            <Text style={{ fontSize: 13, color: "#6b7280", margin: 0 }}>Before discount</Text>
          </Column>
          <Column align="right">
            <Text style={{ fontSize: 13, color: "#111827", margin: 0 }}>{totalBeforeDiscount}</Text>
          </Column>
        </Row>
      )}
      {discount && (
        <Row style={{ marginBottom: 8 }}>
          <Column>
            <Text style={{ fontSize: 13, color: "#6b7280", margin: 0, paddingRight: 12 }}>
              {discountLabel(discountReason)}
            </Text>
          </Column>
          <Column align="right" style={{ verticalAlign: "top" }}>
            <Text style={{ fontSize: 13, color: "#111827", margin: 0, whiteSpace: "nowrap" }}>
              −{discount}
            </Text>
          </Column>
        </Row>
      )}
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
