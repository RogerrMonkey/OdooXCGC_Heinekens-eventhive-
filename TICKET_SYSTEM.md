# 🎫 EventHive Ticket Management System

## Overview

This comprehensive ticket management system provides complete functionality for generating, downloading, sharing, and verifying digital event tickets with QR codes, multi-channel delivery, and professional PDF generation.

## 🚀 Features

### 1. **Enhanced Ticket Generation**
- Professional PDF tickets with event branding
- High-quality QR codes for verification
- Detailed event and booking information
- Payment confirmation details
- Organizer information

### 2. **Multi-Channel Delivery**
- **Email**: Send tickets as PDF attachments with beautiful HTML templates
- **WhatsApp**: Share ticket details and download links via WhatsApp
- **SMS**: Send ticket information via text message
- **Direct Download**: Download PDF tickets directly

### 3. **QR Code Functionality**
- Generated verification URLs
- Multiple QR code formats (small, medium, large, print)
- Online ticket verification
- Secure check-in system

### 4. **Verification System**
- Real-time ticket validity checking
- Event status validation (upcoming, ongoing, expired, cancelled)
- Anti-fraud protection
- Check-in tracking

## 📁 File Structure

```
lib/
├── ticketUtils.ts          # Enhanced PDF & QR generation
├── mailer.ts              # Email templates & sending
└── twilio.ts              # SMS & WhatsApp functionality

app/api/ticket/
├── download/
│   └── route.ts           # Download & sharing endpoints
└── verify/
    └── [bookingId]/
        └── route.ts       # Verification & check-in

app/ticket/verify/[bookingId]/
└── page.tsx               # Public verification page

components/
└── TicketManager.tsx      # React component for ticket management

app/test-tickets/
└── page.tsx               # Testing interface
```

## 🔗 API Endpoints

### Download & Sharing

#### `GET /api/ticket/download`
Downloads ticket as PDF or returns ticket data as JSON.

**Query Parameters:**
- `bookingId` (required): The booking ID
- `format` (optional): `pdf` (default) or `json`

**Headers:**
- `Authorization: Bearer <token>` (optional): For user authentication

**Response (PDF):**
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="ticket-{bookingId}.pdf"
```

**Response (JSON):**
```json
{
  "success": true,
  "ticket": {
    "booking": { ... },
    "event": { ... },
    "user": { ... },
    "ticketType": { ... },
    "payment": { ... },
    "qrCode": "data:image/png;base64,...",
    "verificationUrl": "..."
  }
}
```

#### `POST /api/ticket/download`
Send ticket via email, WhatsApp, or SMS.

**Body:**
```json
{
  "bookingId": "booking-id",
  "action": "email|whatsapp|sms",
  "recipient": "optional-email-or-phone"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Ticket sent via {method} successfully"
}
```

### Verification

#### `GET /api/ticket/verify/[bookingId]`
Verify ticket validity and get event details.

**Response:**
```json
{
  "valid": true,
  "ticket": {
    "bookingId": "...",
    "status": "valid|upcoming|ongoing|expired|cancelled",
    "statusMessage": "Ticket is valid for upcoming event",
    "event": { ... },
    "user": { ... },
    "ticketType": { ... }
  }
}
```

#### `POST /api/ticket/verify/[bookingId]`
Check-in functionality for event organizers.

**Body:**
```json
{
  "scannerId": "optional-scanner-id",
  "action": "checkin"
}
```

**Headers:**
- `Authorization: Bearer <token>` (required): Organizer authentication

**Response:**
```json
{
  "success": true,
  "message": "Check-in successful",
  "checkIn": {
    "id": "...",
    "checkedAt": "...",
    "scannerId": "..."
  }
}
```

## 🧪 Testing

### Access the Test Interface
Visit `http://localhost:3000/test-tickets` to access the comprehensive testing interface.

### Testing Steps

1. **Create a Booking**
   - First create a booking through the payment system
   - Note the booking ID from the successful response

2. **Load Ticket**
   - Enter the booking ID in the test interface
   - Click "Load Ticket" to display the ticket manager

3. **Test Features**
   - **Download**: Test PDF generation and download
   - **Email**: Send ticket via email (requires SMTP setup)
   - **WhatsApp**: Send ticket details via WhatsApp (requires Twilio)
   - **SMS**: Send ticket details via SMS (requires Twilio)
   - **QR Code**: View and test QR code functionality
   - **Verification**: Test online ticket verification

### Quick API Tests
Use the built-in API test buttons to:
- Test JSON API response
- Test ticket verification
- Test direct download

## 🔧 Configuration

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://..."

# JWT Secret
JWT_SECRET="your-jwt-secret"

# SMTP Configuration (for email)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Twilio Configuration (for SMS/WhatsApp)
TWILIO_ACCOUNT_SID="your-twilio-sid"
TWILIO_AUTH_TOKEN="your-twilio-token"
TWILIO_PHONE_NUMBER="your-twilio-phone"
TWILIO_WHATSAPP_NUMBER="whatsapp:your-twilio-whatsapp"

# Base URL for verification links
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

### Database Schema
The system uses the existing Prisma schema with these key relationships:
- `Booking` -> `Event`, `User`, `TicketType`, `Payment`
- `CheckIn` -> `Booking`

## 🎨 UI Components

### TicketManager Component
A comprehensive React component that provides:
- Ticket information display
- QR code visualization
- Download functionality
- Multi-channel sharing options
- Professional styling with Tailwind CSS

**Usage:**
```tsx
import TicketManager from '@/components/TicketManager';

<TicketManager 
  bookingId="your-booking-id"
  token="optional-jwt-token"
  className="custom-classes"
/>
```

## 📱 Public Verification

### Verification Page
Access public ticket verification at:
`/ticket/verify/[bookingId]`

Features:
- Real-time ticket validity checking
- Event status display
- Professional verification interface
- Mobile-friendly design
- Security indicators

## 🔒 Security Features

### Authentication
- JWT token authentication for user-specific operations
- Organizer-only access for check-in functionality
- Public verification without authentication

### Validation
- Booking ownership verification
- Event status checking
- Anti-duplicate check-in protection
- Secure QR code generation

### Error Handling
- Comprehensive error messages
- Graceful fallback for failed operations
- Input validation and sanitization

## 🚀 Usage Examples

### Download Ticket PDF
```javascript
const response = await fetch(`/api/ticket/download?bookingId=${bookingId}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const blob = await response.blob();
// Create download link
```

### Send Ticket via Email
```javascript
await fetch('/api/ticket/download', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    bookingId: 'booking-id',
    action: 'email',
    recipient: 'user@example.com'
  })
});
```

### Verify Ticket
```javascript
const response = await fetch(`/api/ticket/verify/${bookingId}`);
const verification = await response.json();
console.log('Valid:', verification.valid);
```

## 📧 Email Templates

The system includes professional HTML email templates for:
- **Ticket Delivery**: Send tickets with PDF attachments
- **Booking Confirmation**: Confirm successful payments
- **OTP Verification**: Send verification codes

Templates feature:
- EventHive branding
- Responsive design
- Clear call-to-action buttons
- Important instruction highlights
- Professional styling

## 🔧 Customization

### PDF Styling
Modify `lib/ticketUtils.ts` to customize:
- PDF layout and design
- Color schemes
- Font sizes and styles
- QR code positioning
- Additional information fields

### Email Templates
Update `lib/mailer.ts` to customize:
- Email styling and branding
- Template content
- Call-to-action buttons
- Attachment handling

### UI Components
Customize `components/TicketManager.tsx` for:
- Visual design
- Button layouts
- Information display
- Interactive features

## 🛟 Troubleshooting

### Common Issues

1. **PDF Generation Fails**
   - Ensure `stream-buffers` is installed
   - Check QR code data URL format
   - Verify all required data is present

2. **Email Sending Fails**
   - Verify SMTP configuration
   - Check authentication credentials
   - Ensure attachment size limits

3. **SMS/WhatsApp Fails**
   - Verify Twilio credentials
   - Check phone number formats
   - Ensure Twilio account has sufficient balance

4. **Verification Fails**
   - Check booking ID format
   - Verify database connectivity
   - Ensure booking exists and is valid

### Debug Mode
Enable detailed logging by setting:
```env
NODE_ENV=development
```

This provides comprehensive console logs for debugging API calls and errors.

## 🎯 Next Steps

### Potential Enhancements
1. **Real-time Updates**: WebSocket integration for live ticket status
2. **Bulk Operations**: Mass ticket generation and delivery
3. **Analytics**: Ticket usage and event analytics
4. **Mobile App**: Native mobile app integration
5. **Advanced QR**: Dynamic QR codes with additional security
6. **Multi-language**: Internationalization support
7. **Advanced Templates**: More email and PDF template options

### Integration
- **Calendar Integration**: Add events to calendar apps
- **Social Sharing**: Share events on social media
- **Payment Gateways**: Additional payment provider support
- **CRM Integration**: Customer relationship management
- **Marketing Tools**: Email marketing integration

---

## 🎉 Conclusion

This comprehensive ticket management system provides enterprise-grade functionality for digital event tickets with professional PDF generation, multi-channel delivery, secure verification, and a beautiful user interface. The system is production-ready and can handle the complete ticket lifecycle from generation to verification.

For support or questions, refer to the test interface at `/test-tickets` or check the API endpoints directly.
