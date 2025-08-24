# Projectify Backend

A Node.js + Express.js backend using Firebase/Firestore for the Projectify application.

## Features

- **Authentication**: Firebase Auth with ID token verification
- **Database**: Firestore for all data operations
- **Email**: Nodemailer with Gmail SMTP
- **Security**: Helmet, CORS, rate limiting
- **Validation**: Express-validator for input validation
- **Real-time**: Firestore onSnapshot() support

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and fill in your Firebase credentials:

```bash
cp .env.example .env
```

Required environment variables:
- `FIREBASE_PROJECT_ID`: Your Firebase project ID
- `FIREBASE_CLIENT_EMAIL`: Service account client email
- `FIREBASE_PRIVATE_KEY`: Service account private key (with proper newline escaping)
- `EMAIL_USER`: Gmail address for sending emails
- `EMAIL_PASS`: Gmail app password

### 3. Firebase Setup

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Authentication with Email/Password
3. Create a Firestore database
4. Generate a service account key:
   - Go to Project Settings > Service Accounts
   - Generate new private key
   - Use the credentials in your `.env` file

### 4. Gmail Setup

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security > 2-Step Verification > App passwords
   - Generate password for "Mail"
   - Use this password in `EMAIL_PASS`

## Running the Server

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

The server will run on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - Get projects (filtered by role)
- `POST /api/projects` - Create project (admin only)
- `GET /api/projects/:id` - Get single project
- `PUT /api/projects/:id/approve` - Approve project (admin only)
- `PUT /api/projects/:id/reject` - Reject project (admin only)
- `DELETE /api/projects/:id` - Delete project (admin only)

### Applications
- `POST /api/applications` - Apply to project
- `GET /api/applications/my` - Get user's applications
- `GET /api/applications` - Get all applications (admin only)
- `PUT /api/applications/:id/approve` - Approve application (admin only)
- `PUT /api/applications/:id/reject` - Reject application (admin only)

### Analytics
- `GET /api/analytics/dashboard` - Dashboard statistics (admin only)
- `GET /api/analytics/projects-by-status` - Project status counts (admin only)
- `GET /api/analytics/applications-by-status` - Application status counts (admin only)
- `GET /api/analytics/user-activity` - User activity metrics (admin only)

## Database Schema

### Collections

#### users
```javascript
{
  id: string,
  name: string,
  email: string,
  role: 'admin' | 'user',
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### projects
```javascript
{
  id: string,
  name: string,
  description: string,
  startDate: string,
  endDate: string,
  budget: number,
  status: 'pending' | 'approved' | 'rejected',
  createdBy: string,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### applications
```javascript
{
  id: string,
  projectId: string,
  userId: string,
  userName: string,
  userEmail: string,
  projectName: string,
  status: 'pending' | 'approved' | 'rejected',
  appliedAt: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

## Email Templates

The system sends automated emails for:
- Welcome email on registration
- Project approval notifications
- Application approval/rejection notifications

## Security Features

- Firebase ID token verification
- Input validation and sanitization
- Rate limiting
- CORS configuration
- Security headers with Helmet
- Admin role authorization

## Error Handling

Consistent error responses:
```javascript
{
  success: false,
  message: "Error description",
  error: "Detailed error info" // in development only
}
```

## Testing

```bash
npm test
```

## Deployment

1. Set up environment variables on your hosting platform
2. Ensure Firebase service account credentials are properly configured
3. Configure Gmail SMTP settings
4. Deploy using your preferred method (PM2, Docker, etc.)

## Health Check

The server provides a health check endpoint at `/api/health` for monitoring.