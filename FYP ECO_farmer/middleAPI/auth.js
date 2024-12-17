const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.get('Authorization');
  if (!authHeader) {
   return res.status(401).json({
    message :"unAuthorize"
   })    
  }
  const token = authHeader.split(' ')[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, 'farmerandconsumersecrete');
    console.log(decodedToken)
  } catch (err) {
    return res.status(401).json({
        message: "Invalid Token"
        })
  }
  if (!decodedToken) {
      return res.status(401).json({
        message: "Invalid Token"
        })
  }
  
  // Add decoded token to request for further use
 
  req.user = {
    user: decodedToken.userId,// Adjust this based on your actual token payload
    role: decodedToken.role
  };

  console.log('User attached to req:', req.user);
  
  next();
};
