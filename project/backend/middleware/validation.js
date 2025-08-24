const { body, param, query, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const validateProject = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Project title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('role')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Role must be between 2 and 100 characters'),
  body('timeline')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Timeline must be between 2 and 100 characters'),
  body('deadlineToApply')
    .trim()
    .notEmpty()
    .withMessage('Deadline to apply is required'),
  body('projectDetails')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Project details must be between 10 and 2000 characters'),
  handleValidationErrors
];

const validateApplication = [
  body('projectId')
    .trim()
    .notEmpty()
    .withMessage('Project ID is required'),
  body('username')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Username must be between 2 and 50 characters'),
  body('contact')
    .trim()
    .notEmpty()
    .withMessage('Contact information is required'),
  body('skillsDescription')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Skills description must be between 10 and 500 characters'),
  body('experience')
    .trim()
    .notEmpty()
    .withMessage('Experience is required'),
  body('deadline')
    .isInt({ min: 1 })
    .withMessage('Deadline must be a positive number of days'),
  handleValidationErrors
];

const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validateProjectId = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Project ID is required'),
  handleValidationErrors
];

const validateApplicationId = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('Application ID is required'),
  handleValidationErrors
];

module.exports = {
  validateProject,
  validateApplication,
  validateRegistration,
  validateLogin,
  validateProjectId,
  validateApplicationId,
  handleValidationErrors
};