const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const FarmerSchema = new Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true },
  email: { 
    type: String, 
    required: true, 
    unique: true },
  password: { 
    type: String, 
    required: true },
    role :{
      type: String,
      required : true,
    },
  farmName: { 
    type: String, 
    default: '' },
  farmLocation: { 
    type: String, 
    default: '' },
  farmDescription: { 
    type: String, 
    default: '' },
  products: [{ type: Schema.Types.ObjectId, ref: 'Product' }], // Reference to Product model
  courses: [{ type: Schema.Types.ObjectId, ref: 'Course' }], // Reference to Course model
  farmTours: [{ type: Schema.Types.ObjectId, ref: 'FarmTour' }], // Reference to FarmTour model
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: { type: Number, required: true }
      }
    ]
  }
});


FarmerSchema.methods.addToCart = function(product) {
  const cartProductIndex = this.cart.items.findIndex(cp => {
    return cp.productId.toString() === product._id.toString();
  });
  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];

  if (cartProductIndex >= 0) {
    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
  } else {
    updatedCartItems.push({
      productId: product._id,
      quantity: newQuantity
    });
  }
  this.cart = { items: updatedCartItems };
  return this.save();
};

FarmerSchema.methods.removeFromCart = function(productId) {
  const updatedCartItems = this.cart.items.filter(item => {
    return item.productId.toString() !== productId.toString();
  });
  this.cart.items = updatedCartItems;
  return this.save();
};

FarmerSchema.methods.clearCart = function() {
  this.cart = { items: [] };
  return this.save();
};
module.exports = mongoose.model('Farmer', FarmerSchema);
