const { Schema, model } = require('mongoose');

const Order = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  product: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
  },
  count: Number,
  /*
  items: [
    {
      product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
      },
      count: Number,
    }
  ]

  */
  location: {
    latitude: Number,
    longitude: Number,
  },
  createdAt: Date,
  status: {
    type: Number,
    default: 0,
    /*
      0 - tugatilmagan buyurtma
      1 - tekshiruvda
      2 - qabul qilingan
      3 - bekor qilingan
    */
  },
});

module.exports = model('Order', Order);
