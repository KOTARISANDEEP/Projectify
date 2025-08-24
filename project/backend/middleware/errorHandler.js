const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  };

  // Firebase Auth errors
  if (err.code && err.code.startsWith('auth/')) {
    error.message = 'Authentication error';
    error.error = err.message;
    return res.status(401).json(error);
  }

  // Firestore errors
  if (err.code && (err.code.includes('firestore') || err.code.includes('permission-denied'))) {
    error.message = 'Database operation failed';
    error.error = err.message;
    return res.status(400).json(error);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = 'Validation failed';
    error.error = err.message;
    return res.status(400).json(error);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    return res.status(401).json(error);
  }

  // Rate limit errors
  if (err.status === 429) {
    error.message = 'Too many requests';
    return res.status(429).json(error);
  }

  // Default to 500 server error
  res.status(err.status || 500).json(error);
};

module.exports = errorHandler;