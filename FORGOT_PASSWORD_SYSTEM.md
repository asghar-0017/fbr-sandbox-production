# Forgot Password System Implementation

## Overview
This document describes the complete forgot password system that has been implemented in the FBR Integration System. The system provides a secure way for users to reset their passwords through email verification.

## System Flow

### 1. Email Verification (Step 1)
- **Route**: `POST /api/auth/forgot-password`
- **Component**: `EmailVerification.jsx`
- **Function**: `forgotPassword()` in `authController.js`

**Process:**
1. User enters their email address
2. System validates email format
3. System checks if user exists in database
4. If user exists:
   - Generates a 6-digit verification code
   - Saves code to database with 10-minute expiration
   - Sends email with verification code
5. User is redirected to OTP verification page

**Security Features:**
- Email existence is not revealed (same response for valid/invalid emails)
- Verification codes expire after 10 minutes
- Codes are marked as used after successful password reset

### 2. OTP Verification (Step 2)
- **Route**: `POST /api/auth/verify-reset-code`
- **Component**: `OTP.jsx`
- **Function**: `verifyResetCode()` in `authController.js`

**Process:**
1. User enters the 6-digit verification code received via email
2. System validates the code against the stored code
3. System checks if code is expired or already used
4. If valid:
   - Code is stored in localStorage for the next step
   - User is redirected to password reset page
5. If invalid:
   - Error message is displayed

**Security Features:**
- Code verification requires both email and code
- Expired codes are automatically marked as used
- Used codes cannot be reused

### 3. Password Reset (Step 3)
- **Route**: `PUT /api/auth/reset-password`
- **Component**: `ResetPassword.jsx`
- **Function**: `resetPassword()` in `authController.js`

**Process:**
1. User enters new password and confirms it
2. System validates password requirements:
   - Minimum 8 characters
   - Must contain uppercase letter
   - Must contain lowercase letter
   - Must contain number
3. System verifies the stored verification code
4. If all validations pass:
   - New password is hashed using bcrypt
   - User's password is updated in database
   - Verification code is marked as used
   - All existing sessions are invalidated
   - User is redirected to login page

**Security Features:**
- Password is hashed using bcrypt with salt rounds of 12
- All existing sessions are invalidated after password change
- Verification code is marked as used to prevent reuse

## API Endpoints

### POST /api/auth/forgot-password
**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "If the email exists, a reset code has been sent.",
  "data": null,
  "timestamp": "2025-08-18T09:15:07.802Z",
  "statusCode": 200
}
```

### POST /api/auth/verify-reset-code
**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reset code verified successfully",
  "data": null,
  "timestamp": "2025-08-18T09:15:07.802Z",
  "statusCode": 200
}
```

### PUT /api/auth/reset-password
**Request Body:**
```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "NewPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password.",
  "data": null,
  "timestamp": "2025-08-18T09:15:07.802Z",
  "statusCode": 200
}
```

## Database Schema

### ResetCode Table
```sql
CREATE TABLE reset_codes (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Frontend Components

### EmailVerification.jsx
- Clean, professional UI with FBR branding
- Email input validation
- Loading states and error handling
- "Back to Login" button for better UX

### OTP.jsx
- 6-digit OTP input using MUI OTP component
- Email retrieval from localStorage
- Code verification with backend
- "Back to Email Verification" button

### ResetPassword.jsx
- New password and confirm password inputs
- Client-side password validation
- Password strength requirements display
- "Back to OTP Verification" button

## Security Features

1. **Rate Limiting**: Login attempts are rate-limited to prevent brute force attacks
2. **Secure Code Generation**: 6-digit codes are randomly generated
3. **Code Expiration**: Codes expire after 10 minutes
4. **One-time Use**: Codes are marked as used after successful password reset
5. **Session Invalidation**: All existing sessions are invalidated after password change
6. **Password Hashing**: Passwords are hashed using bcrypt with high salt rounds
7. **Input Validation**: All inputs are validated on both frontend and backend
8. **Error Handling**: Generic error messages prevent information leakage

## Environment Variables Required

```env
# Database Configuration
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password
MYSQL_MASTER_DB=your_database

# Email Configuration
EMAIL=your_email@gmail.com
EMAIL_PASS=your_app_password

# JWT Configuration
JWT_SECRET=your_jwt_secret
```

## Testing

The system has been tested and verified to work correctly:
- ✅ Database connection established
- ✅ ResetCode model synchronized
- ✅ CRUD operations working
- ✅ Email sending functionality ready
- ✅ Frontend components properly integrated
- ✅ API endpoints correctly configured

## Usage Instructions

1. **User initiates password reset**: Navigate to `/email-verification`
2. **Enter email**: User enters their registered email address
3. **Check email**: User receives 6-digit verification code
4. **Verify code**: User enters code on `/otp` page
5. **Set new password**: User sets new password on `/reset-password` page
6. **Login**: User can now login with their new password

## Error Handling

The system provides comprehensive error handling:
- Invalid email format
- User not found (without revealing existence)
- Invalid verification code
- Expired verification code
- Password validation failures
- Database connection issues
- Email sending failures

## Future Enhancements

1. **SMS Verification**: Add SMS-based verification as an alternative
2. **Multiple Code Attempts**: Allow limited attempts for verification codes
3. **Audit Logging**: Log all password reset attempts for security monitoring
4. **Email Templates**: Customizable email templates for different organizations
5. **Two-Factor Authentication**: Integrate with existing 2FA system

## Support

For technical support or questions about the forgot password system, please refer to the backend logs or contact the development team.
