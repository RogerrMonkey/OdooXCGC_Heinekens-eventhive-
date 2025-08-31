# 🎪 EventHive - Digital Event Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1.0-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.15.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

EventHive is a comprehensive digital event management platform that enables seamless event creation, ticket booking, payment processing, and attendee management. Built with modern web technologies and featuring professional ticket generation, multi-channel delivery, and robust payment integration.

## 🌟 Key Features

### 🎫 **Professional Ticket System**
- **PDF Ticket Generation**: High-quality, Adobe Reader compatible PDF tickets with professional branding
- **QR Code Integration**: Secure QR codes for seamless venue entry and verification
- **Multi-Channel Delivery**: Email, WhatsApp, SMS, and direct download options
- **Real-time Verification**: Instant ticket validation system with anti-fraud protection

### 💳 **Secure Payment Processing**
- **Razorpay Integration**: Complete payment gateway with test and live modes
- **Multiple Payment Methods**: Cards, UPI, Net Banking, and Digital Wallets
- **Webhook Security**: Real-time payment confirmation with signature verification
- **Automatic Ticket Generation**: Instant ticket creation upon successful payment

### 🎯 **Event Management**
- **Comprehensive Event Creation**: Detailed event setup with multiple ticket types
- **Advanced Analytics**: Real-time dashboard with booking insights and revenue tracking
- **Role-based Access**: Organizer, Admin, and Attendee role management
- **Loyalty System**: Points-based rewards for regular attendees

### 📱 **Modern User Experience**
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Real-time Updates**: Live booking status and payment confirmations
- **Intuitive Dashboard**: Centralized management for events, bookings, and analytics
- **Professional Navigation**: Global navigation with authentication state management

## 🚀 Tech Stack

### **Frontend**
- **Next.js 15.5.2** - React framework with App Router
- **React 19.1.0** - Component-based UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS 4.0** - Utility-first styling framework

### **Backend**
- **Next.js API Routes** - Serverless backend functions
- **Prisma 6.15.0** - Modern database ORM
- **PostgreSQL** - Robust relational database
- **JWT Authentication** - Secure user authentication

### **Payment & Communication**
- **Razorpay** - Payment gateway integration
- **Twilio** - SMS and WhatsApp messaging
- **NodeMailer** - Email delivery system
- **jsPDF** - Professional PDF generation

### **Additional Tools**
- **QRCode.js** - QR code generation
- **bcrypt** - Password hashing
- **Puppeteer** - Web scraping and automation
- **ESLint** - Code linting and formatting

## 📋 Prerequisites

Before running this project, ensure you have:

- **Node.js** (v18.0.0 or higher)
- **PostgreSQL** database
- **Razorpay** account (test/live keys)
- **Twilio** account (for SMS/WhatsApp)
- **Email SMTP** credentials (Gmail, SendGrid, etc.)

## ⚡ Quick Start

### 1. **Clone & Install**
```bash
git clone https://github.com/RogerrMonkey/OdooXCGC_Heinekens-eventhive-.git
cd OdooXCGC_Heinekens-eventhive-
npm install
```

### 2. **Environment Setup**
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/eventhive"

# Application
NEXT_PUBLIC_BASE_URL="http://localhost:3001"
JWT_SECRET="your-super-secret-jwt-key"

# Razorpay Payment Gateway
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxxxxxx"
RAZORPAY_WEBHOOK_SECRET="your-webhook-secret"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxxxxx"

# Twilio (SMS/WhatsApp)
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_PHONE_NUMBER="your-twilio-phone-number"
TWILIO_WHATSAPP_NUMBER="whatsapp:+your-number"

# Email Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
EMAIL_FROM="your-email@gmail.com"
```

### 3. **Database Setup**
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Seed the database (optional)
npm run seed
```

### 4. **Development Server**
```bash
npm run dev
```

Visit `http://localhost:3001` to see the application.

## 🗂️ Project Structure

```
eventhive/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── events/        # Event management
│   │   ├── bookings/      # Booking operations
│   │   ├── payments/      # Payment processing
│   │   ├── ticket/        # Ticket operations
│   │   └── admin/         # Admin functions
│   ├── auth/              # Authentication pages
│   ├── events/            # Event pages
│   ├── dashboard/         # User dashboard
│   ├── profile/           # User profile
│   └── admin/             # Admin panel
├── components/            # Reusable components
│   ├── Navigation.tsx     # Global navigation
│   ├── PaymentGateway.tsx # Payment component
│   └── ui/                # UI components
├── lib/                   # Utility libraries
│   ├── prisma.ts          # Database client
│   ├── razorpay.ts        # Payment gateway
│   ├── mailer.ts          # Email service
│   ├── twilio.ts          # SMS/WhatsApp service
│   └── ticketUtils.ts     # Ticket generation
├── prisma/                # Database schema & migrations
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Migration files
│   └── seed.ts            # Database seeding
└── public/                # Static assets
```

## 🔧 Configuration

### **Razorpay Setup**
1. Create a [Razorpay account](https://razorpay.com/)
2. Get your test/live API keys
3. Configure webhook URL: `https://yourdomain.com/api/payments/webhook`
4. Enable required payment methods

### **Database Configuration**
The application uses PostgreSQL with Prisma ORM. The schema includes:
- **Users** with role-based access (ORGANIZER, ATTENDEE, ADMIN)
- **Events** with comprehensive details and status tracking
- **Bookings** with payment integration
- **Tickets** with QR code generation
- **Loyalty System** with points and transactions

### **Email Configuration**
Supports multiple email providers:
- **Gmail SMTP** (recommended for development)
- **SendGrid** (recommended for production)
- **Custom SMTP** servers

## 🧪 Testing

### **Payment Testing**
Use these test cards with Razorpay:
- **Success**: 4111 1111 1111 1111, CVV: 123
- **Failure**: 4000 0000 0000 0002, CVV: 123

### **Authentication Testing**
- Phone: `+1234567890`
- OTP: `123456` (test mode)

### **API Testing Endpoints**
- `/api/test/razorpay` - Test payment configuration
- `/api/test/database` - Test database connectivity
- `/debug-payment` - Debug payment flow

## 📚 API Documentation

### **Authentication**
- `POST /api/auth/send-otp` - Send OTP for authentication
- `POST /api/auth/verify-otp` - Verify OTP and login

### **Events**
- `GET /api/events/list` - List all events
- `POST /api/events/create` - Create new event
- `GET /api/events/[id]` - Get event details

### **Bookings**
- `POST /api/bookings/create` - Create booking
- `GET /api/user/bookings` - Get user bookings

### **Payments**
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/webhook` - Payment webhook handler

### **Tickets**
- `GET /api/ticket/[id]` - Get ticket details
- `POST /api/ticket/download` - Download/Send ticket

## 🛡️ Security Features

### **Authentication & Authorization**
- JWT token-based authentication
- Role-based access control (RBAC)
- Secure OTP verification with Twilio

### **Payment Security**
- Razorpay signature verification
- Server-side payment validation
- Webhook security with secret verification

### **Data Protection**
- Password hashing with bcrypt
- Input validation and sanitization
- SQL injection prevention with Prisma

## 🚀 Deployment

### **Environment Configuration**
1. Set up production database (PostgreSQL)
2. Configure production environment variables
3. Set up domain and SSL certificates

### **Razorpay Production**
1. Switch to live API keys
2. Configure production webhook URL
3. Enable required payment methods

### **Recommended Platforms**
- **Vercel** (recommended for Next.js)
- **Railway** (for database and full-stack)
- **AWS/GCP** (for enterprise deployment)

## 🎯 Features Overview

### **For Event Organizers**
- Create and manage events with multiple ticket types
- Real-time analytics and booking insights
- Automated ticket generation and delivery
- QR code-based check-in system
- Revenue tracking and reporting

### **For Attendees**
- Browse and search events by category
- Secure payment processing with multiple options
- Instant ticket delivery via email, SMS, or WhatsApp
- Digital wallet for storing tickets
- Loyalty points and rewards system

### **For Administrators**
- Complete platform management
- User and event moderation
- Payment and booking oversight
- Analytics and reporting dashboard
- System configuration and settings

## 📈 Analytics & Insights

- **Real-time Dashboard**: Live booking statistics and revenue tracking
- **Event Performance**: Detailed metrics for each event
- **User Analytics**: Attendee behavior and preferences
- **Payment Insights**: Transaction success rates and methods
- **Loyalty Tracking**: Points distribution and usage patterns

## 🔮 Future Enhancements

### **Planned Features**
- [ ] Mobile app (React Native)
- [ ] Apple Wallet / Google Pay integration
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Social media integration
- [ ] Calendar synchronization
- [ ] Push notifications
- [ ] Bulk operations for organizers

### **Technical Improvements**
- [ ] Redis caching for performance
- [ ] CDN integration for assets
- [ ] Advanced search with Elasticsearch
- [ ] Real-time chat support
- [ ] API rate limiting
- [ ] Advanced monitoring and logging

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: support@eventhive.com
- 📱 Phone: +91 98765 43210
- 💬 Discord: [EventHive Community](https://discord.gg/eventhive)
- 📖 Documentation: [docs.eventhive.com](https://docs.eventhive.com)

## 🙏 Acknowledgments

- **Next.js Team** for the amazing framework
- **Vercel** for hosting and deployment platform
- **Prisma** for the excellent database toolkit
- **Razorpay** for reliable payment processing
- **Twilio** for communication services
- **Tailwind CSS** for the utility-first styling

---

## 🎬 Demo Videos

### Part 1: Platform Overview & Core Features
🎥 **[Watch Demo Part 1](https://www.loom.com/share/1a4c760bbc214b2c9acff5bea5ae3cd6?sid=cf091237-4af6-41c2-a343-e409e68a43b8)**

This video demonstrates:
- Platform overview and navigation
- Event browsing and discovery
- User authentication system
- Event creation workflow
- Dashboard functionality

### Part 2: Payment Integration & Ticket System
🎥 **[Watch Demo Part 2](https://www.loom.com/share/526c067e6f4243e9964a0393cdafaafe?sid=4b120d5f-f041-4238-84a9-9208eaf7254a)**

This video showcases:
- Complete payment flow with Razorpay
- Professional PDF ticket generation
- Multi-channel ticket delivery (Email, SMS, WhatsApp)
- QR code verification system
- Admin panel and analytics

---

<div align="center">

**Built with ❤️ for the event management community**

[⭐ Star this repository](https://github.com/RogerrMonkey/OdooXCGC_Heinekens-eventhive-) if you find it helpful!

</div>
