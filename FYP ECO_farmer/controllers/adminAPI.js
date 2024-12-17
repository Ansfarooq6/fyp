const Product = require('../models/product')

exports.adminproducts= async (req, res, next) => {
  try {
    // The userId should already be available from the authorization middleware
    const userId = req.user.user 
    console.log(userId)
  

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized access' });
    }

    // Fetch products for the authenticated user
    const products = await Product.find({ userId: userId });
    console.log(products)

    // Respond with the products
    return res.status(200).json({
      message: 'Products fetched successfully',
      products: products
    });
  } catch (err) {
    console.error(err);
    next(err); // Pass the error to the error-handling middleware
  }
};
