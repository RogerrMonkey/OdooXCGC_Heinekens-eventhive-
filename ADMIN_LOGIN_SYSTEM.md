# Admin Login System Documentation

## Overview
A dedicated admin login system has been implemented for EventHive, providing secure access to the admin panel with role-based authentication.

## Admin Login Flow

### 1. Access Points
Admin login can be accessed through multiple entry points:

- **Main Auth Page**: `/auth` - Includes "Admin Login" link
- **Role-Based Auth**: `/auth/role-based` - Has "👑 Admin Login" button in Administrator Access section
- **Home Page Footer**: `/` - Subtle "Admin Access" link in footer
- **Direct Access**: `/auth/admin` - Direct admin login page

### 2. Authentication Process

#### Step 1: Email Verification
- Admin enters their registered email address
- System verifies the email belongs to a user with ADMIN role
- If valid, sends 6-digit OTP to email

#### Step 2: OTP Verification
- Admin enters the 6-digit verification code
- System validates OTP and admin privileges
- On success, creates JWT token and redirects to admin panel

### 3. Security Features
- **Role Verification**: Only users with ADMIN role can access
- **Email Validation**: Must use registered admin email
- **OTP Expiry**: Verification codes expire in 10 minutes
- **Secure Tokens**: JWT tokens with 30-day expiry
- **HTTP-Only Cookies**: Secure token storage

## API Endpoints

### Admin OTP Generation
**Endpoint**: `POST /api/auth/admin-otp`

**Request Body**:
```json
{
  "email": "admin@example.com"
}
```

**Response**:
```json
{
  "ok": true,
  "message": "Admin verification code sent successfully"
}
```

**Error Responses**:
- `400`: Email is required
- `404`: Admin account not found
- `403`: Access denied. Admin privileges required
- `500`: Failed to send verification email

### Admin OTP Verification
**Endpoint**: `POST /api/auth/admin-verify`

**Request Body**:
```json
{
  "email": "admin@example.com",
  "code": "123456"
}
```

**Response**:
```json
{
  "ok": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "name": "Admin Name",
    "email": "admin@example.com",
    "role": "ADMIN"
  },
  "message": "Admin login successful"
}
```

**Error Responses**:
- `400`: Email and verification code are required / Invalid verification code / Verification code expired
- `404`: Admin account not found
- `403`: Access denied. Admin privileges required
- `500`: Internal server error

## Database Requirements

### Prerequisites
- User with ADMIN role must exist in database
- User must have valid email address
- SMTP configuration must be set up for OTP delivery

### Creating Admin User
To create an admin user, run this SQL in your database:

```sql
-- Update existing user to admin
UPDATE "User" SET role = 'ADMIN' WHERE email = 'your-admin@example.com';

-- Or create new admin user
INSERT INTO "User" (id, name, email, role, "createdAt") 
VALUES (gen_random_uuid(), 'Admin Name', 'admin@example.com', 'ADMIN', NOW());
```

## UI Components

### Admin Login Page (`/auth/admin`)
- **Design**: Red theme to distinguish from regular user login
- **Features**: 
  - Email input with validation
  - OTP input with 6-digit format
  - Loading states and error handling
  - Navigation back to user login
  - Resend OTP functionality

### Integration Points
- **Navigation**: Admin Panel link appears when user has ADMIN role
- **Role-Based Auth**: Separate admin access section
- **Home Page**: Subtle footer link for admin access

## Testing the Admin Flow

### Test Scenario 1: Valid Admin Login
1. Go to `/auth/admin`
2. Enter valid admin email
3. Check email for OTP
4. Enter OTP on verification page
5. Should redirect to `/admin` dashboard

### Test Scenario 2: Invalid Email
1. Enter non-existent email
2. Should show "Admin account not found" error

### Test Scenario 3: Non-Admin User
1. Enter email of user with non-ADMIN role
2. Should show "Access denied. Admin privileges required" error

### Test Scenario 4: Expired OTP
1. Generate OTP but wait 10+ minutes
2. Try to verify expired OTP
3. Should show "Verification code expired" error

## Configuration

### Environment Variables Required
```env
JWT_SECRET=your_jwt_secret_here
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
```

## Security Considerations

1. **Email Security**: OTP sent via secure SMTP
2. **Token Security**: JWT tokens stored in HTTP-only cookies
3. **Role Verification**: Multiple checks ensure only admins can access
4. **OTP Expiry**: Time-limited verification codes
5. **Error Handling**: No sensitive information leaked in error messages

## Future Enhancements

- **Two-Factor Authentication**: Add additional security layer
- **Admin Session Management**: Track active admin sessions
- **Audit Logging**: Log all admin access attempts
- **IP Restrictions**: Limit admin access to specific IPs
- **Admin Role Hierarchy**: Different admin permission levels

## Troubleshooting

### Common Issues

1. **OTP Not Received**
   - Check SMTP configuration
   - Verify email in spam folder
   - Ensure user has ADMIN role

2. **Login Fails After OTP**
   - Check JWT_SECRET is set
   - Verify user role in database
   - Check browser console for errors

3. **Access Denied**
   - Confirm user has ADMIN role
   - Check email matches database exactly
   - Verify account exists

### Debug Steps
1. Check server logs for detailed error messages
2. Verify database user role: `SELECT role FROM "User" WHERE email = 'admin@example.com'`
3. Test SMTP configuration separately
4. Validate JWT_SECRET environment variable

This admin login system provides secure, role-based access to the admin panel while maintaining separation from regular user authentication flows.
