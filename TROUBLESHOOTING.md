# Payment Troubleshooting Guide

## Quick Diagnosis

### 1. **Are you logged in?**
- Go to `/auth` page and login with phone number
- Use OTP: `123456` (test mode)
- Check if you see user info in browser console

### 2. **Test Razorpay Configuration**
- Visit: `http://localhost:3001/api/test/razorpay`
- Should show success with test order created

### 3. **Check Database**
- Visit: `http://localhost:3001/api/test/database`
- Should show events and tickets available

### 4. **Debug Payment Flow**
- Visit: `http://localhost:3001/debug-payment`
- Run all tests to identify the failing step

## Common Issues & Solutions

### Issue: "Payment system is loading"
**Solution:** 
- Refresh the page
- Check browser console for errors
- Verify internet connection

### Issue: "Booking failed" 
**Causes:**
- Not logged in (go to `/auth`)
- Event not published
- Tickets sold out
- Invalid event/ticket ID

### Issue: "Payment verification failed"
**Causes:**
- Webhook URL not configured
- Invalid Razorpay signature
- Database connection issue

### Issue: Razorpay modal doesn't open
**Causes:**
- Script loading failed
- Invalid order amount
- Network connectivity

## Test Flow

1. **Login:** `/auth` → Use phone: `+1234567890`, OTP: `123456`
2. **Browse Events:** `/events` → Select any event
3. **Book Ticket:** Click "Book Now" → Confirm booking
4. **Pay:** Razorpay modal should open → Use test card
5. **Verify:** Should redirect to dashboard with success message

## Test Cards (Razorpay Test Mode)

**Success:**
- Card: `4111 1111 1111 1111`
- CVV: `123`
- Expiry: Any future date

**Failure:**
- Card: `4000 0000 0000 0002`

## Debug Commands

**Browser Console:**
```javascript
// Check auth status
console.log('Token:', localStorage.getItem('token'))

// Test Razorpay availability
console.log('Razorpay loaded:', !!window.Razorpay)

// Test API
fetch('/api/test/razorpay').then(r => r.json()).then(console.log)
```

## API Endpoints for Testing

- `/api/test` - Basic API test
- `/api/test/razorpay` - Razorpay configuration test
- `/api/test/database` - Database connectivity test
- `/api/test/auth` - Authentication test
- `/debug-payment` - Complete debug dashboard

## Contact Points

If payment still fails after these steps:
1. Check browser console for errors
2. Verify all environment variables are set
3. Ensure database has events with PUBLISHED status
4. Confirm Razorpay test keys are valid
