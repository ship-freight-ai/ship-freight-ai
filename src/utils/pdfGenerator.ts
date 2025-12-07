import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

interface LoadData {
  id: string;
  load_number: number;
  origin_address: string;
  origin_city: string;
  origin_state: string;
  origin_zip: string;
  origin_facility_name?: string;
  destination_address: string;
  destination_city: string;
  destination_state: string;
  destination_zip: string;
  destination_facility_name?: string;
  pickup_date: string;
  delivery_date: string;
  equipment_type: string;
  commodity?: string;
  weight?: number;
  temperature_min?: number;
  temperature_max?: number;
  special_requirements?: string;
}

interface BidData {
  id: string;
  bid_amount: number;
  tracking_url?: string;
  created_at: string;
}

interface ProfileData {
  full_name?: string;
  company_name?: string;
  email: string;
}

interface CarrierData {
  company_name: string;
  dot_number?: string;
  mc_number?: string;
}

export const generateLoadConfirmationPDF = (
  load: LoadData,
  bid: BidData,
  shipper: ProfileData,
  carrier: CarrierData
): Blob => {
  const doc = new jsPDF();
  
  // Colors
  const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
  const darkColor: [number, number, number] = [31, 41, 55];
  
  // Header with logo placeholder
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('SHIP AI', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('LOAD CONFIRMATION AGREEMENT', 105, 30, { align: 'center' });
  
  // Reset text color
  doc.setTextColor(...darkColor);
  
  let yPos = 50;
  
  // Load Number and Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Load Number: #${load.load_number}`, 20, yPos);
  doc.text(`Confirmation Date: ${format(new Date(), 'MM/dd/yyyy')}`, 140, yPos);
  
  yPos += 10;
  
  // Shipper Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SHIPPER INFORMATION', 20, yPos);
  yPos += 7;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Company: ${shipper.company_name || 'N/A'}`, 20, yPos);
  yPos += 5;
  doc.text(`Contact: ${shipper.full_name || 'N/A'}`, 20, yPos);
  yPos += 5;
  doc.text(`Email: ${shipper.email}`, 20, yPos);
  yPos += 10;
  
  // Carrier Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('CARRIER INFORMATION', 20, yPos);
  yPos += 7;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Company: ${carrier.company_name}`, 20, yPos);
  yPos += 5;
  if (carrier.dot_number) {
    doc.text(`DOT Number: ${carrier.dot_number}`, 20, yPos);
    yPos += 5;
  }
  if (carrier.mc_number) {
    doc.text(`MC Number: ${carrier.mc_number}`, 20, yPos);
    yPos += 5;
  }
  yPos += 5;
  
  // Load Details Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('LOAD DETAILS', 20, yPos);
  yPos += 5;
  
  autoTable(doc, {
    startY: yPos,
    head: [['Field', 'Value']],
    body: [
      ['Equipment Type', load.equipment_type.replace('_', ' ').toUpperCase()],
      ['Commodity', load.commodity || 'General Freight'],
      ['Weight', load.weight ? `${load.weight} lbs` : 'N/A'],
      ...(load.temperature_min || load.temperature_max ? [[
        'Temperature Range',
        `${load.temperature_min || 'N/A'}°F - ${load.temperature_max || 'N/A'}°F`
      ]] : []),
    ],
    theme: 'striped',
    headStyles: { fillColor: primaryColor },
    margin: { left: 20, right: 20 },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  // Route Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ROUTE INFORMATION', 20, yPos);
  yPos += 7;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ORIGIN:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 5;
  if (load.origin_facility_name) {
    doc.text(load.origin_facility_name, 20, yPos);
    yPos += 5;
  }
  doc.text(`${load.origin_address}`, 20, yPos);
  yPos += 5;
  doc.text(`${load.origin_city}, ${load.origin_state} ${load.origin_zip}`, 20, yPos);
  yPos += 5;
  doc.text(`Pickup Date: ${format(new Date(load.pickup_date), 'MM/dd/yyyy')}`, 20, yPos);
  yPos += 10;
  
  doc.setFont('helvetica', 'bold');
  doc.text('DESTINATION:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  yPos += 5;
  if (load.destination_facility_name) {
    doc.text(load.destination_facility_name, 20, yPos);
    yPos += 5;
  }
  doc.text(`${load.destination_address}`, 20, yPos);
  yPos += 5;
  doc.text(`${load.destination_city}, ${load.destination_state} ${load.destination_zip}`, 20, yPos);
  yPos += 5;
  doc.text(`Delivery Date: ${format(new Date(load.delivery_date), 'MM/dd/yyyy')}`, 20, yPos);
  yPos += 10;
  
  // Rate Information
  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos, 170, 15, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`AGREED RATE: $${bid.bid_amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 105, yPos + 10, { align: 'center' });
  yPos += 20;
  
  // Special Requirements
  if (load.special_requirements) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SPECIAL REQUIREMENTS:', 20, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const splitText = doc.splitTextToSize(load.special_requirements, 170);
    doc.text(splitText, 20, yPos);
    yPos += (splitText.length * 5) + 5;
  }
  
  // Terms and Conditions
  if (yPos > 240) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TERMS & CONDITIONS', 20, yPos);
  yPos += 7;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const terms = [
    '1. The carrier agrees to transport the shipment as described above in a timely and professional manner.',
    '2. Payment will be held in escrow and released upon delivery confirmation and BOL approval.',
    '3. The carrier maintains full insurance coverage as required by law and agrees to provide proof upon request.',
    '4. Any damages or delays must be reported immediately to the shipper.',
    '5. This agreement is subject to standard carrier-shipper contract terms under federal transportation law.',
    '6. Both parties agree to resolve disputes through arbitration if necessary.',
  ];
  
  terms.forEach(term => {
    const splitTerm = doc.splitTextToSize(term, 170);
    doc.text(splitTerm, 20, yPos);
    yPos += (splitTerm.length * 4) + 3;
  });
  
  yPos += 10;
  
  // Signatures section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DIGITAL SIGNATURES:', 20, yPos);
  yPos += 7;
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Shipper: ${shipper.full_name || shipper.company_name || 'N/A'}`, 20, yPos);
  doc.text(`Date: ${format(new Date(), 'MM/dd/yyyy HH:mm:ss')}`, 20, yPos + 5);
  
  doc.text(`Carrier: ${carrier.company_name}`, 110, yPos);
  doc.text(`Date: ${format(new Date(bid.created_at), 'MM/dd/yyyy HH:mm:ss')}`, 110, yPos + 5);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('This document was generated electronically by Ship AI platform', 105, 285, { align: 'center' });
  doc.text(`Confirmation ID: ${bid.id}`, 105, 290, { align: 'center' });
  
  // Return as Blob
  return doc.output('blob');
};

export const generateBOLPDF = (
  load: LoadData,
  shipper: ProfileData,
  carrier: CarrierData
): Blob => {
  const doc = new jsPDF();
  
  const primaryColor: [number, number, number] = [59, 130, 246];
  const darkColor: [number, number, number] = [31, 41, 55];
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL OF LADING', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`BOL #${load.load_number}`, 105, 30, { align: 'center' });
  
  doc.setTextColor(...darkColor);
  
  let yPos = 50;
  
  // Shipper Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SHIPPER', 20, yPos);
  yPos += 7;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${shipper.company_name || 'N/A'}`, 20, yPos);
  yPos += 5;
  if (load.origin_facility_name) {
    doc.text(load.origin_facility_name, 20, yPos);
    yPos += 5;
  }
  doc.text(`${load.origin_address}`, 20, yPos);
  yPos += 5;
  doc.text(`${load.origin_city}, ${load.origin_state} ${load.origin_zip}`, 20, yPos);
  yPos += 10;
  
  // Consignee Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('CONSIGNEE', 20, yPos);
  yPos += 7;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (load.destination_facility_name) {
    doc.text(load.destination_facility_name, 20, yPos);
    yPos += 5;
  }
  doc.text(`${load.destination_address}`, 20, yPos);
  yPos += 5;
  doc.text(`${load.destination_city}, ${load.destination_state} ${load.destination_zip}`, 20, yPos);
  yPos += 10;
  
  // Carrier Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('CARRIER', 20, yPos);
  yPos += 7;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${carrier.company_name}`, 20, yPos);
  yPos += 5;
  if (carrier.dot_number) {
    doc.text(`DOT: ${carrier.dot_number}`, 20, yPos);
    yPos += 5;
  }
  if (carrier.mc_number) {
    doc.text(`MC: ${carrier.mc_number}`, 20, yPos);
    yPos += 5;
  }
  yPos += 5;
  
  // Shipment Details
  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Weight', 'Pieces', 'Equipment Type']],
    body: [
      [
        load.commodity || 'General Freight',
        load.weight ? `${load.weight} lbs` : 'N/A',
        '1',
        load.equipment_type.replace('_', ' ').toUpperCase()
      ]
    ],
    theme: 'striped',
    headStyles: { fillColor: primaryColor },
    margin: { left: 20, right: 20 },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  // Special Instructions
  if (load.special_requirements) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SPECIAL INSTRUCTIONS:', 20, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const splitText = doc.splitTextToSize(load.special_requirements, 170);
    doc.text(splitText, 20, yPos);
    yPos += (splitText.length * 5) + 10;
  }
  
  // Signature blocks
  if (yPos > 200) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  // Shipper signature
  doc.text('SHIPPER SIGNATURE:', 20, yPos);
  doc.line(20, yPos + 15, 90, yPos + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${format(new Date(), 'MM/dd/yyyy')}`, 20, yPos + 20);
  
  // Carrier signature
  doc.setFont('helvetica', 'bold');
  doc.text('CARRIER SIGNATURE:', 110, yPos);
  doc.line(110, yPos + 15, 180, yPos + 15);
  doc.setFont('helvetica', 'normal');
  doc.text('Date: _______________', 110, yPos + 20);
  
  yPos += 30;
  
  // Receiver signature
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIVER SIGNATURE:', 20, yPos);
  doc.line(20, yPos + 15, 90, yPos + 15);
  doc.setFont('helvetica', 'normal');
  doc.text('Date: _______________', 20, yPos + 20);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Generated by Ship AI', 105, 285, { align: 'center' });
  
  return doc.output('blob');
};

export const generateInvoicePDF = (
  load: LoadData,
  bid: BidData,
  shipper: ProfileData,
  carrier: CarrierData
): Blob => {
  const doc = new jsPDF();
  
  const primaryColor: [number, number, number] = [59, 130, 246];
  const darkColor: [number, number, number] = [31, 41, 55];
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('FREIGHT INVOICE', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice #INV-${load.load_number}`, 105, 30, { align: 'center' });
  
  doc.setTextColor(...darkColor);
  
  let yPos = 50;
  
  // Invoice info
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Invoice Date: ${format(new Date(), 'MM/dd/yyyy')}`, 20, yPos);
  doc.text(`Due Date: ${format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'MM/dd/yyyy')}`, 140, yPos);
  yPos += 10;
  
  // Bill To
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 20, yPos);
  yPos += 7;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${shipper.company_name || 'N/A'}`, 20, yPos);
  yPos += 5;
  doc.text(`${shipper.full_name || ''}`, 20, yPos);
  yPos += 5;
  doc.text(`${shipper.email}`, 20, yPos);
  yPos += 10;
  
  // Service From
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SERVICE FROM:', 20, yPos);
  yPos += 7;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${carrier.company_name}`, 20, yPos);
  yPos += 5;
  if (carrier.mc_number) {
    doc.text(`MC: ${carrier.mc_number}`, 20, yPos);
    yPos += 5;
  }
  yPos += 10;
  
  // Service Details
  autoTable(doc, {
    startY: yPos,
    head: [['Description', 'Qty', 'Rate', 'Amount']],
    body: [
      [
        `Freight Transportation\nLoad #${load.load_number}\n${load.origin_city}, ${load.origin_state} to ${load.destination_city}, ${load.destination_state}`,
        '1',
        `$${bid.bid_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        `$${bid.bid_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      ]
    ],
    theme: 'striped',
    headStyles: { fillColor: primaryColor },
    margin: { left: 20, right: 20 },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  // Total
  doc.setFillColor(240, 240, 240);
  doc.rect(120, yPos, 70, 20, 'F');
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL DUE:', 125, yPos + 10);
  doc.text(`$${bid.bid_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 180, yPos + 10, { align: 'right' });
  
  yPos += 30;
  
  // Payment Terms
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT TERMS:', 20, yPos);
  yPos += 7;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Net 30 days from invoice date', 20, yPos);
  yPos += 5;
  doc.text('Payment held in escrow via Ship AI platform', 20, yPos);
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(128, 128, 128);
  doc.text('Generated by Ship AI', 105, 285, { align: 'center' });
  doc.text(`Invoice ID: ${bid.id}`, 105, 290, { align: 'center' });
  
  return doc.output('blob');
};
