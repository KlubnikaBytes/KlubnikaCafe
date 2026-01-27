const Product = require('../models/Product.js');

// GET /api/products (Publicly viewable menu)
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    
    // Re-format flat DB data into the nested structure the frontend expects
    const nestedDishes = [];
    const categories = {}; 

    for (const product of products) {
      if (!categories[product.category]) {
        categories[product.category] = {
          name: product.category,
          items: [],
          subCategories: {}, 
        };
        nestedDishes.push(categories[product.category]);
      }

      const categoryRef = categories[product.category];
      
      // --- DATA FORMATTING FIX ---
      const item = {
        title: product.name,
        price: `₹${product.price}`,
        description: product.desc,
        image: product.image, 
        isInStock: product.isInStock, 
        _id: product._id, 
        category: product.category, // <--- Critical for frontend logic
      };
      // -----------------------

      if (product.subCategory) {
        if (!categoryRef.subCategories[product.subCategory]) {
          categoryRef.subCategories[product.subCategory] = {
            name: product.subCategory,
            items: [],
          };
        }
        categoryRef.subCategories[product.subCategory].items.push(item);
      } else {
        categoryRef.items.push(item);
      }
    }

    // Clean up the structure (remove empty subCategories objects)
    for (const category of nestedDishes) {
      if (Object.keys(category.subCategories).length > 0) {
        category.subCategories = Object.values(category.subCategories);
      } else {
        delete category.subCategories;
      }
    }

    res.json(nestedDishes); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching products' });
  }
};

// PUT /api/products/stock (Admin only)
exports.updateStockStatus = async (req, res) => {
  const { productId, isInStock } = req.body;
  
  // Access the 'io' instance attached in server.js
  const io = req.io; 

  try {
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update Database
    product.isInStock = isInStock;
    await product.save();
    
    // --- CRITICAL: EMIT THE UPDATE TO ALL CLIENTS ---
    // This makes the frontend update instantly without refreshing
    io.emit('stockUpdate', { 
      productId: product._id, 
      isInStock: product.isInStock 
    });

    res.json(product); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating stock' });
  }
};