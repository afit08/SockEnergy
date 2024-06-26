const crypto = require('crypto');

// Function to generate CSRF token
function generateCSRFToken(req, res) {
  try {
    const expirationTime = Date.now() + 3600000; // Token expires in 1 hour (3600000 milliseconds)
    if (!req.session.csrfToken || req.session.csrfToken.expiry < Date.now()) {
      // Generate a new CSRF token
      req.session.csrfToken = {
        token: crypto.randomBytes(20).toString('hex'),
        expiry: expirationTime,
      };
    }

    // Set CSRF token in a cookie
    res.cookie('csrfToken', req.session.csrfToken.token, {
      expires: new Date(expirationTime),
      httpOnly: true,
    });

    return res.status(200).json({
      message: 'Generate csrf token',
      csrfToken: req.session.csrfToken.token,
      status: 200,
    });
  } catch (error) {
    return res.status(500).json({
      message: error.message,
      status: 500,
    });
  }
}

function validateCSRFToken(req, res, next) {
  // Check if the request method is safe (GET, HEAD, OPTIONS)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  console.log(req.cookies.csrfToken);
  // Check if the CSRF token in the request body matches the one in session
  const csrfToken = req.body.csrfToken || req.headers['x-csrf-token'];
  if (!req.headers['x-csrf-token'] || !csrfToken) {
    return res.status(403).json({ message: 'Invalid CSRF token', status: 403 });
  }

  next();
}

export default {
  generateCSRFToken,
  validateCSRFToken,
};
