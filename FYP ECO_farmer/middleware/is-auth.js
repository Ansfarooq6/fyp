module.exports = (req, res, next) => {
    if (!req.session.isLoggedIn || !req.session.user) {
      console.error('User not authenticated');
      return res.redirect('/login');
    } 
    
    // Optional: Log user information for debugging
    console.log('Authenticated user:', req.session.user);
  
    next();
  };
  