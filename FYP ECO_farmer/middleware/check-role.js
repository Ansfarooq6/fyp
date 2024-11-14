// middleware/is-admin.js

module.exports = (req, res, next) => {
    // Assuming you have stored user role information in the session or user object
    if (req.session.user && req.session.user.role === 'farmer') {
      next(); // User is admin, continue with the request
    } else {
      res.status(403).send('Unauthorized'); // User is not authorized to access admin routes
    }
  };
  