import type { getMyAccount } from './account.functions';

type Account = Awaited<ReturnType<typeof getMyAccount>>;
export async function downloadInvoice(order: Account['orders'][number], product: string, email: string | null) {
  if (order.status !== 'paid') throw new Error('Only paid orders have invoices.');
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF();
  const reference = order.invoice_id ?? order.id;
  pdf.setFontSize(24); pdf.text('GHOSTAE', 20, 25);
  pdf.setFontSize(14); pdf.text('PAYMENT INVOICE', 20, 38);
  pdf.setFontSize(11);
  const rows = [
    ['Invoice', reference], ['Product', product], ['Plan', order.plan],
    ['Customer', email ?? 'Ghostae customer'],
    ['Paid on', new Date(order.paid_at ?? order.created_at).toLocaleString('en-GB')],
    ['Amount paid', `${order.currency} ${order.amount.toLocaleString('en-US')}`],
    ['Payment method', order.payment_method ?? '-'], ['Transaction ID', order.transaction_id ?? '-'],
    ['Status', 'PAID'],
  ];
  let y = 58;
  for (const [label, value] of rows) { pdf.text(label, 20, y); const lines = pdf.splitTextToSize(value, 115); pdf.text(lines, 75, y); y += Math.max(12, lines.length * 6 + 6); }
  pdf.text('Support: +880 1345 407572 | support@ghostae.com', 20, y + 15);
  pdf.save(`Ghostae-Invoice-${reference.replace(/[^a-zA-Z0-9_-]/g, '')}.pdf`);
}