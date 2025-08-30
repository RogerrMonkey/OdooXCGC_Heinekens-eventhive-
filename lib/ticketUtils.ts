import QRCode from "qrcode";
// Using jsPDF for proper PDF generation without font dependencies
import { jsPDF } from 'jspdf';

interface BookingData {
  bookingId: string;
  quantity: number;
  status: string;
  createdAt: Date | string;
}

interface EventData {
  title: string;
  description?: string;
  startAt: Date | string;
  endAt?: Date | string;
  location: string;
  category?: string;
  organizer?: {
    name: string;
    email: string;
  };
}

interface UserData {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface TicketTypeData {
  name: string;
  price: number;
}

interface PaymentData {
  amount: number;
  status: string;
  createdAt: Date | string;
}

export async function generateQrDataUrl(url: string, options?: {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}): Promise<string> {
  return QRCode.toDataURL(url, {
    width: options?.width || 600, // Higher resolution for PDF
    margin: options?.margin || 4, // More margin for better scanning
    color: {
      dark: options?.color?.dark || '#000000',
      light: options?.color?.light || '#FFFFFF'
    },
    errorCorrectionLevel: 'M' // Medium error correction for reliability
  });
}

export async function generateTicketPdfBuffer({ 
  booking, 
  event, 
  user, 
  ticketType, 
  payment,
  qrDataUrl 
}: {
  booking: BookingData;
  event: EventData;
  user?: UserData;
  ticketType?: TicketTypeData;
  payment?: PaymentData;
  qrDataUrl?: string;
}): Promise<Buffer> {
  try {
    // Create a new PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Set default font
    doc.setFont('helvetica');
    
    // HEADER SECTION
    doc.setFillColor(41, 98, 255); // Blue header
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    // Company name and title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('EVENTHIVE', margin, 18);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Digital Event Ticket', margin, 26);
    
    // Ticket ID on the right
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('TICKET ID: ' + booking.bookingId, margin + 100, 18);
    
    // Status
    doc.setFontSize(9);
    doc.text('STATUS: ' + booking.status.toUpperCase(), margin + 100, 26);

    // Reset to black text
    doc.setTextColor(0, 0, 0);
    
    let currentY = 50;

    // EVENT INFORMATION SECTION
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('EVENT INFORMATION', margin, currentY);
    
    // Draw line under section title
    doc.setLineWidth(0.5);
    doc.line(margin, currentY + 2, margin + contentWidth, currentY + 2);
    
    currentY += 10;

    // Event title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const eventTitleLines = doc.splitTextToSize(event.title, contentWidth);
    doc.text(eventTitleLines, margin, currentY);
    currentY += eventTitleLines.length * 6 + 5;

    // Event description (if available)
    if (event.description) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(event.description, contentWidth);
      const maxLines = 3; // Limit description to 3 lines
      const displayLines = descLines.slice(0, maxLines);
      doc.text(displayLines, margin, currentY);
      currentY += displayLines.length * 4 + 8;
    }

    // Event details in organized layout
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', margin, currentY);
    doc.setFont('helvetica', 'normal');
    const eventDate = new Date(event.startAt).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    doc.text(eventDate, margin + 25, currentY);

    doc.setFont('helvetica', 'bold');
    doc.text('Time:', margin + 100, currentY);
    doc.setFont('helvetica', 'normal');
    const eventTime = new Date(event.startAt).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
    doc.text(eventTime, margin + 120, currentY);
    currentY += 8;

    doc.setFont('helvetica', 'bold');
    doc.text('Location:', margin, currentY);
    doc.setFont('helvetica', 'normal');
    const locationLines = doc.splitTextToSize(event.location, contentWidth - 30);
    doc.text(locationLines, margin + 30, currentY);
    currentY += Math.max(locationLines.length * 4, 6) + 5;

    if (event.category) {
      doc.setFont('helvetica', 'bold');
      doc.text('Category:', margin, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(event.category, margin + 30, currentY);
      currentY += 10;
    }

    currentY += 5;

    // TICKET HOLDER SECTION
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TICKET HOLDER INFORMATION', margin, currentY);
    
    // Draw line under section title
    doc.line(margin, currentY + 2, margin + contentWidth, currentY + 2);
    currentY += 12;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Name:', margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(user?.name || 'Guest', margin + 25, currentY);
    currentY += 8;

    if (user?.email) {
      doc.setFont('helvetica', 'bold');
      doc.text('Email:', margin, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(user.email, margin + 25, currentY);
      currentY += 8;
    }

    if (user?.phone) {
      doc.setFont('helvetica', 'bold');
      doc.text('Phone:', margin, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(user.phone, margin + 25, currentY);
      currentY += 8;
    }

    currentY += 5;

    // TICKET DETAILS SECTION
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('TICKET DETAILS', margin, currentY);
    
    // Draw line under section title
    doc.line(margin, currentY + 2, margin + contentWidth, currentY + 2);
    currentY += 12;

    // Ticket information in two columns
    doc.setFontSize(11);
    
    // Left column
    doc.setFont('helvetica', 'bold');
    doc.text('Quantity:', margin, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(booking.quantity.toString() + ' ticket(s)', margin + 30, currentY);

    // Right column
    if (ticketType) {
      doc.setFont('helvetica', 'bold');
      doc.text('Type:', margin + 90, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(ticketType.name, margin + 110, currentY);
    }
    currentY += 8;

    if (ticketType) {
      doc.setFont('helvetica', 'bold');
      doc.text('Price:', margin, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text('Rs. ' + ticketType.price.toLocaleString(), margin + 30, currentY);
    }

    doc.setFont('helvetica', 'bold');
    doc.text('Booking Date:', margin + 90, currentY);
    doc.setFont('helvetica', 'normal');
    doc.text(new Date(booking.createdAt).toLocaleDateString(), margin + 110, currentY);
    currentY += 15;

    // PAYMENT INFORMATION (if available)
    if (payment) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT INFORMATION', margin, currentY);
      
      // Draw line under section title
      doc.line(margin, currentY + 2, margin + contentWidth, currentY + 2);
      currentY += 12;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Amount Paid:', margin, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text('Rs. ' + payment.amount.toLocaleString(), margin + 40, currentY);

      doc.setFont('helvetica', 'bold');
      doc.text('Payment Status:', margin + 90, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(payment.status, margin + 120, currentY);
      currentY += 8;

      doc.setFont('helvetica', 'bold');
      doc.text('Payment Date:', margin, currentY);
      doc.setFont('helvetica', 'normal');
      doc.text(new Date(payment.createdAt).toLocaleDateString(), margin + 40, currentY);
      currentY += 15;
    }

    // QR CODE SECTION - Ensure proper spacing and full visibility
    const qrSectionHeight = 60;
    
    // Check if we need a new page for QR code
    if (currentY + qrSectionHeight > pageHeight - 30) {
      doc.addPage();
      currentY = 30;
    }

    if (qrDataUrl) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ENTRY QR CODE', margin, currentY);
      
      // Draw line under section title
      doc.line(margin, currentY + 2, margin + contentWidth, currentY + 2);
      currentY += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Present this QR code at the venue entrance for verification', margin, currentY);
      currentY += 10;

      // QR Code - Properly sized and positioned to be fully visible
      try {
        const qrSize = 40; // Conservative size to ensure full visibility
        const qrX = margin + ((contentWidth - qrSize) / 2); // Center horizontally
        const qrY = currentY;
        
        // Ensure QR code fits within page boundaries
        if (qrY + qrSize <= pageHeight - 30) {
          doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
          
          // Add a simple border around QR code
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.5);
          doc.rect(qrX - 1, qrY - 1, qrSize + 2, qrSize + 2);
          
          currentY += qrSize + 10;
        }
        
      } catch (error) {
        console.log('Could not add QR code image:', error);
        doc.setFontSize(10);
        doc.text('QR Code generation failed. Please contact support.', margin, currentY);
        currentY += 15;
      }
    }

    // IMPORTANT NOTES
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('IMPORTANT NOTES', margin, currentY);
    
    // Draw line under section title
    doc.line(margin, currentY + 2, margin + contentWidth, currentY + 2);
    currentY += 10;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('1. Please arrive at the venue 15-30 minutes before the event starts', margin, currentY);
    currentY += 5;
    doc.text('2. Present this QR code for entry verification at the venue', margin, currentY);
    currentY += 5;
    doc.text('3. Keep your booking ID safe for reference: ' + booking.bookingId, margin, currentY);
    currentY += 5;
    doc.text('4. This ticket is non-transferable and valid only for the specified event', margin, currentY);
    currentY += 10;

    // FOOTER
    if (currentY > pageHeight - 25) {
      doc.addPage();
      currentY = 30;
    }

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Verification URL: ' + (process.env.NEXT_PUBLIC_BASE_URL || 'https://eventhive.com') + '/ticket/verify/' + booking.bookingId, margin, currentY);
    currentY += 5;
    doc.text('Generated on: ' + new Date().toLocaleString(), margin, currentY);
    currentY += 5;
    
    if (event.organizer) {
      doc.text('Event Organizer: ' + event.organizer.name + ' (' + event.organizer.email + ')', margin, currentY);
      currentY += 5;
    }
    
    doc.text('Powered by EventHive - Digital Event Management System', margin, currentY);

    // Convert to buffer
    const pdfArrayBuffer = doc.output('arraybuffer');
    return Buffer.from(pdfArrayBuffer);

  } catch (error) {
    console.error('Error generating PDF ticket:', error);
    
    // Simple fallback PDF
    const doc = new jsPDF();
    const margin = 20;
    
    // Header
    doc.setFillColor(41, 98, 255);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('EVENTHIVE - EVENT TICKET', margin, 20);
    
    // Content
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text('Booking ID: ' + booking.bookingId, margin, 50);
    doc.setFontSize(11);
    doc.text('Event: ' + event.title, margin, 65);
    doc.text('Date: ' + new Date(event.startAt).toLocaleDateString(), margin, 80);
    doc.text('Time: ' + new Date(event.startAt).toLocaleTimeString(), margin, 95);
    doc.text('Location: ' + event.location, margin, 110);
    doc.text('Holder: ' + (user?.name || 'Guest'), margin, 125);
    doc.text('Quantity: ' + booking.quantity, margin, 140);
    doc.text('Status: ' + booking.status, margin, 155);
    
    if (ticketType) {
      doc.text('Type: ' + ticketType.name + ' - Rs. ' + ticketType.price, margin, 170);
    }

    // Add QR code if available
    if (qrDataUrl) {
      try {
        doc.addImage(qrDataUrl, 'PNG', margin, 185, 35, 35);
      } catch (qrError) {
        doc.text('QR Code: Please scan at venue', margin, 200);
      }
    }
    
    const fallbackBuffer = doc.output('arraybuffer');
    return Buffer.from(fallbackBuffer);
  }
}

// Generate high-quality ticket images for sharing
export async function generateTicketImageBuffer({
  booking,
  event,
  user,
  ticketType,
  qrDataUrl
}: {
  booking: BookingData;
  event: EventData;
  user?: UserData;
  ticketType?: TicketTypeData;
  qrDataUrl?: string;
}): Promise<Buffer> {
  // For now, we'll use PDF generation and convert to image
  // In a full implementation, you might use canvas or sharp for image generation
  return generateTicketPdfBuffer({ booking, event, user, ticketType, qrDataUrl });
}

// Generate ticket verification URL
export function generateTicketVerificationUrl(bookingId: string): string {
  return `${process.env.NEXT_PUBLIC_BASE_URL}/ticket/verify/${bookingId}`;
}

// Generate different QR code formats
export async function generateQRCodeVariants(url: string) {
  const variants = {
    small: await QRCode.toDataURL(url, { 
      width: 300, 
      margin: 2,
      errorCorrectionLevel: 'M'
    }),
    medium: await QRCode.toDataURL(url, { 
      width: 500, 
      margin: 3,
      errorCorrectionLevel: 'M'
    }),
    large: await QRCode.toDataURL(url, { 
      width: 800, 
      margin: 4,
      errorCorrectionLevel: 'H'
    }),
    print: await QRCode.toDataURL(url, { 
      width: 1000, 
      margin: 6,
      color: { dark: '#000000', light: '#FFFFFF' },
      errorCorrectionLevel: 'H'
    })
  };

  return variants;
}
