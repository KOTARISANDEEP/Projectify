# Email Notification Setup for Projectify

## Overview
This backend now supports automatic email notifications when new projects are created. All users with `role: "user"` will receive email notifications about new job postings.

## Required Environment Variables

Add these to your `.env` file in the backend directory:

```bash
# Email Configuration (Gmail SMTP)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:5173
```

## Gmail Setup Instructions

### 1. Enable 2-Factor Authentication
- Go to your Google Account settings
- Enable 2-factor authentication if not already enabled

### 2. Generate App Password
- Go to Google Account → Security → App passwords
- Select "Mail" and "Other (Custom name)"
- Name it "Projectify Backend"
- Copy the generated 16-character password

### 3. Use App Password
- Set `EMAIL_USER` to your Gmail address
- Set `EMAIL_PASS` to the generated App Password (not your regular password)

## How It Works

### 1. Project Creation
When an admin creates a new project:
- Project is saved to `adminProjects` collection
- Backend fetches all active users with `role: "user"`
- Email notifications are sent to all eligible users

### 2. Email Content
Each email includes:
- Project title and role
- Project description
- Timeline and deadline
- Direct link to dashboard
- Professional styling with Projectify branding

### 3. Error Handling
- If email sending fails, project creation still succeeds
- Detailed logging shows success/failure counts
- Admin sees notification results in success message

## Testing

1. Start the backend server
2. Create a new project as admin
3. Check console logs for email sending status
4. Verify users receive emails
5. Check success message shows notification count

## Troubleshooting

### Common Issues:
- **"Invalid credentials"**: Check your App Password, not regular password
- **"Less secure app access"**: Gmail no longer supports this, use App Passwords
- **"Authentication failed"**: Ensure 2FA is enabled and App Password is correct

### Debug Steps:
1. Check backend console logs for email service errors
2. Verify environment variables are loaded correctly
3. Test with a single email first
4. Check Gmail's "Sent" folder for delivery confirmation
