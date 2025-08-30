# Razorpay Payment Gateway Implementation

## Overview
This implementation provides a complete Razorpay payment gateway integration for the EventHive application, including secure payment processing, webhook handling, and ticket generation.

## Features Implemented

### 1. Environment Configuration
- Added `NEXT_PUBLIC_RAZORPAY_KEY_ID` for frontend integration
- Configured Razorpay credentials in `.env` file
- Updated base URL to reflect correct port (3001)

### 2. Backend API Endpoints

#### `/api/payments/create-order` (POST)
- Creates Razorpay payment orders
- Includes booking metadata in order notes
- Proper error handling and validation

#### `/api/payments/verify` (POST)
- Verifies payment signatures using Razorpay's security mechanism
- Confirms bookings and generates tickets upon successful payment
- Sends confirmation emails with PDF tickets

#### `/api/payments/webhook` (POST)
- Handles Razorpay webhooks for `payment.captured` and `payment.failed` events
- Automatic ticket generation and email sending
- Duplicate payment prevention
- Proper logging and error handling

#### `/api/bookings/create` (POST)
- Enhanced with JWT authentication
- Improved coupon and group discount calculations
- Better error handling and validation
- Automatic ticket reservation

#### `/api/ticket/[id]` (GET)
- Retrieves ticket information for display
- Includes event, user, and payment details

#### `/api/test/razorpay` (GET)
- Test endpoint to verify Razorpay configuration
- Creates a test order to validate credentials

### 3. Frontend Enhancements

#### Event Detail Page (`/events/[id]`)
- Integrated Razorpay checkout with proper script loading
- Enhanced payment flow with verification
- Better error handling and user feedback
- Payment modal with cancellation handling
- Improved user experience

### 4. Security Features
- JWT token authentication for booking creation
- Razorpay signature verification for webhooks
- Server-side payment verification
- Secure handling of payment data

### 5. Error Handling
- Comprehensive error messages
- Fallback mechanisms
- Logging for debugging
- User-friendly error feedback

## Environment Variables Required

```env
# Razorpay (for payments)
RAZORPAY_KEY_ID="rzp_test_aMX2ufAx4sVQkj"
RAZORPAY_KEY_SECRET="w4yDws3XgZG0FS9tJ0mDUpDm"
RAZORPAY_WEBHOOK_SECRET="your-razorpay-webhook-secret"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_aMX2ufAx4sVQkj"
```

## Payment Flow

1. **User selects tickets** on event page
2. **Booking creation** with authentication
3. **Payment order creation** with Razorpay
4. **Razorpay checkout** opens in modal
5. **Payment verification** on success
6. **Ticket generation** and email sending
7. **Webhook confirmation** (backup mechanism)

## Testing

### Test the Configuration
Visit: `http://localhost:3001/api/test/razorpay`

This endpoint will:
- Verify all credentials are configured
- Test Razorpay API connectivity
- Create a test order

### Test Payment Flow
1. Navigate to any event page
2. Select tickets and quantity
3. Click "Book Now"
4. Complete payment through Razorpay
5. Verify booking confirmation and email

## Security Considerations

1. **Environment Variables**: Keep credentials secure and never commit to version control
2. **Webhook Security**: Verify signatures for all webhook calls
3. **Payment Verification**: Always verify payments server-side
4. **Authentication**: Require JWT tokens for booking creation
5. **Data Validation**: Validate all inputs and amounts

## Production Deployment

Before going live:
1. Replace test keys with live Razorpay keys
2. Set up proper webhook endpoints in Razorpay dashboard
3. Configure production domain in environment variables
4. Set up proper email service (current uses Gmail SMTP)
5. Consider file storage service (S3) for PDF tickets instead of base64

## Webhook Setup in Razorpay Dashboard

Configure these webhook events:
- `payment.captured`
- `payment.failed`

Webhook URL: `https://yourdomain.com/api/payments/webhook`

## Troubleshooting

1. **Payment not completing**: Check browser console for errors
2. **Webhook not firing**: Verify webhook URL and secret in Razorpay dashboard
3. **Emails not sending**: Check SMTP configuration
4. **Orders not creating**: Check Razorpay credentials and API connectivity

## Support

For issues with the implementation:
1. Check the test endpoint for configuration validation
2. Review browser console for frontend errors
3. Check server logs for backend errors
4. Verify all environment variables are set correctly
