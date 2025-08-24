# Projectify Backend Requirements

## Tech Stack
- **Backend**: Node.js + Express.js
- **Database**: MongoDB or PostgreSQL (your choice)
- **Authentication**: JWT tokens
- **Email**: Nodemailer with Gmail SMTP
- **Real-time**: Socket.io (optional for real-time updates)
- **Environment**: Use dotenv for environment variables

## Database Schema

### Users Collection/Table
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ['admin', 'user'], default: 'user'),
  createdAt: Date,
  updatedAt: Date
}
```

### Projects Collection/Table
```javascript
{
  _id: ObjectId,
  name: String (required),
  description: String (required),
  startDate: Date (required),
  endDate: Date (required),
  budget: Number (required),
  status: String (enum: ['pending', 'approved', 'rejected'], default: 'pending'),
  createdBy: ObjectId (reference to admin user),
  createdAt: Date,
  updatedAt: Date
}
```

### Applications Collection/Table
```javascript
{
  _id: ObjectId,
  projectId: ObjectId (reference to project),
  userId: ObjectId (reference to user),
  userName: String,
  userEmail: String,
  projectName: String,
  status: String (enum: ['pending', 'approved', 'rejected'], default: 'pending'),
  appliedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## API Routes Required

### Authentication Routes
```
POST /api/auth/register
- Body: { name, email, password }
- Response: { success, message, user: { id, name, email, role }, token }
- Action: Create new user, hash password, generate JWT
- Email: Send welcome email to user

POST /api/auth/login
- Body: { email, password }
- Response: { success, message, user: { id, name, email, role }, token }
- Action: Validate credentials, generate JWT

POST /api/auth/logout
- Headers: Authorization: Bearer <token>
- Response: { success, message }
- Action: Invalidate token (optional - can be handled client-side)

GET /api/auth/me
- Headers: Authorization: Bearer <token>
- Response: { success, user: { id, name, email, role } }
- Action: Get current user info from token
```

### Projects Routes
```
GET /api/projects
- Headers: Authorization: Bearer <token>
- Query: ?status=approved (for users), ?status=all (for admin)
- Response: { success, projects: [...] }
- Action: 
  - For users: Return only approved projects
  - For admin: Return all projects based on query

POST /api/projects
- Headers: Authorization: Bearer <token>
- Body: { name, description, startDate, endDate, budget }
- Response: { success, message, project }
- Action: Create new project with status 'pending'
- Auth: Admin only

PUT /api/projects/:id/approve
- Headers: Authorization: Bearer <token>
- Response: { success, message, project }
- Action: Update project status to 'approved'
- Auth: Admin only
- Email: Send approval notification to all users who applied

PUT /api/projects/:id/reject
- Headers: Authorization: Bearer <token>
- Response: { success, message, project }
- Action: Update project status to 'rejected'
- Auth: Admin only
- Email: Send rejection notification to all users who applied

GET /api/projects/:id
- Headers: Authorization: Bearer <token>
- Response: { success, project }
- Action: Get single project details

DELETE /api/projects/:id
- Headers: Authorization: Bearer <token>
- Response: { success, message }
- Action: Delete project
- Auth: Admin only
```

### Applications Routes
```
POST /api/applications
- Headers: Authorization: Bearer <token>
- Body: { projectId }
- Response: { success, message, application }
- Action: Create new application for user
- Validation: Check if user already applied to this project

GET /api/applications/my
- Headers: Authorization: Bearer <token>
- Response: { success, applications: [...] }
- Action: Get all applications for current user

GET /api/applications
- Headers: Authorization: Bearer <token>
- Query: ?projectId=<id> (optional)
- Response: { success, applications: [...] }
- Action: Get all applications (admin only)
- Auth: Admin only

PUT /api/applications/:id/approve
- Headers: Authorization: Bearer <token>
- Response: { success, message, application }
- Action: Update application status to 'approved'
- Auth: Admin only
- Email: Send approval email to applicant

PUT /api/applications/:id/reject
- Headers: Authorization: Bearer <token>
- Response: { success, message, application }
- Action: Update application status to 'rejected'
- Auth: Admin only
- Email: Send rejection email to applicant
```

### Analytics Routes (Admin only)
```
GET /api/analytics/dashboard
- Headers: Authorization: Bearer <token>
- Response: { 
    success, 
    data: {
      totalProjects,
      approvedProjects,
      pendingProjects,
      totalApplications,
      pendingApplications,
      approvedApplications,
      rejectedApplications,
      monthlyStats: [...]
    }
  }
- Action: Get dashboard statistics
- Auth: Admin only

GET /api/analytics/projects-by-status
- Headers: Authorization: Bearer <token>
- Response: { success, data: [{ status, count }] }
- Action: Get project counts by status for charts
- Auth: Admin only
```

## Middleware Required

### Authentication Middleware
```javascript
// Verify JWT token and attach user to request
const authenticateToken = (req, res, next) => {
  // Extract token from Authorization header
  // Verify JWT token
  // Attach user info to req.user
  // Call next() or return 401 if invalid
}
```

### Admin Authorization Middleware
```javascript
// Check if user is admin
const requireAdmin = (req, res, next) => {
  // Check if req.user.role === 'admin'
  // Call next() or return 403 if not admin
}
```

### Validation Middleware
```javascript
// Validate request body using Joi or express-validator
const validateProject = (req, res, next) => {
  // Validate project creation/update data
}

const validateApplication = (req, res, next) => {
  // Validate application data
}
```

## Email Templates & Functionality

### Email Configuration
```javascript
// Use Nodemailer with Gmail SMTP
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS // Use App Password
  }
});
```

### Email Templates Required

#### 1. Welcome Email (on user registration)
```
Subject: Welcome to Projectify!
Body: 
- Welcome message
- Brief about the platform
- Next steps to browse projects
```

#### 2. Project Approval Email (to users who applied)
```
Subject: Great News! Project "{projectName}" has been approved
Body:
- Project has been approved
- Project details (name, description, dates)
- Next steps or contact information
```

#### 3. Application Approved Email
```
Subject: Your application for "{projectName}" has been approved!
Body:
- Application approved message
- Project details
- Next steps or contact information
```

#### 4. Application Rejected Email
```
Subject: Update on your application for "{projectName}"
Body:
- Application status update
- Encouragement to apply for other projects
- Link to browse more projects
```

## Environment Variables Required
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/projectify
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

## CORS Configuration
```javascript
// Allow requests from frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

## Error Handling
- Implement global error handler middleware
- Return consistent error responses
- Log errors appropriately
- Handle validation errors, authentication errors, etc.

## Security Requirements
- Hash passwords using bcrypt
- Validate and sanitize all inputs
- Implement rate limiting
- Use helmet for security headers
- Validate JWT tokens properly

## Frontend Integration Notes
The frontend expects these response formats:

### Success Response
```javascript
{
  success: true,
  message: "Operation successful",
  data: {...} // or user, project, applications, etc.
}
```

### Error Response
```javascript
{
  success: false,
  message: "Error description",
  error: "Detailed error info" // optional
}
```

## Testing Requirements
- Test all API endpoints
- Test authentication and authorization
- Test email functionality
- Test error scenarios
- Test data validation

## Deployment Notes
- Use PM2 for process management
- Set up proper logging
- Configure environment variables
- Set up database connection pooling
- Implement health check endpoint: GET /api/health

## Additional Features (Optional)
- Real-time notifications using Socket.io
- File upload for project attachments
- Pagination for large datasets
- Search and filtering capabilities
- API documentation using Swagger

This backend should integrate seamlessly with the React frontend and provide all necessary functionality for the Projectify application.