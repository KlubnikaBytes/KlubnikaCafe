// backend/src/seed.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db.js');
const Product = require('./models/Product.js');

// --- This is your FULL, STATIC DISHES array ---
// All image variables have been converted to strings
// All helper functions (nextImage, genDesc) have been replaced
const DISHES = [
  // 1. Wake up and shine
  {
    name: "Wake up and shine",
    subCategories: [
      {
        name: "Hot Coffee",
        items: [
          {
            image: "assets/Menu/Wake up and shine/Hot Coffee/Espresso.jpg",
            title: "Espresso",
            description: "Your daily shot of inspiration.",
            price: "₹39",
          },
          {
            image: "assets/Menu/Wake up and shine/Hot Coffee/Café Americano.jpg",
            title: "Café Americano",
            description: "Bold, pure, and seriously smooth.",
            price: "₹55",
          },
          {
            image: "assets/Menu/Wake up and shine/Hot Coffee/Klubnika Coffee.jpg",
            title: "Klubnika Coffee",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹45",
          },
          {
            image: "assets/Menu/Wake up and shine/Hot Coffee/Cappuccino.jpg",
            title: "Cappuccino",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹75",
          },
          {
            image: "assets/Menu/Wake up and shine/Hot Coffee/Hazelnut Latte.jpg",
            title: "Hazelnut Latte",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹99",
          },
          {
            image: "assets/Menu/Wake up and shine/Hot Coffee/Caramel Latte.jpg",
            title: "Caramel Latte",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹99",
          },
          {
            image: "assets/Menu/Wake up and shine/Hot Coffee/Cocoa Mocha.jpg",
            title: "Cocoa Mocha",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹89",
          },
        ],
      },
      {
        name: "Cold Coffee",
        items: [
          {
            image: "assets/Menu/Wake up and shine/Cold Coffee/Klubnika Frappe.jpg",
            title: "Klubnika Frappe",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹119",
          },
          {
            image: "assets/Menu/Wake up and shine/Cold Coffee/Choco Frappe.jpeg",
            title: "Choco Frappe",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹99",
          },
          {
            image: "assets/Menu/Wake up and shine/Cold Coffee/Butterscotch Frappe.jpg",
            title: "Butterscotch Frappe",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹99",
          },
          {
            image: "assets/Menu/Wake up and shine/Cold Coffee/Irish Flavour Frappe.jpg",
            title: "Irish Flavour Frappe",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹119",
          },
          {
            image: "assets/Menu/Wake up and shine/Cold Coffee/Vanilla Frappe.jpg",
            title: "Vanilla Frappe",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹109",
          },
          {
            image: "assets/Menu/Wake up and shine/Cold Coffee/Rich Coffee Frappe.jpg",
            title: "Rich Coffee Frappe",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹119",
          },
        ],
      },
      {
        name: "Hot Tea",
        items: [
          {
            image: "assets/Menu/Wake up and shine/Hot Tea/Assam Tea.jpg",
            title: "Assam Tea",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹17",
          },
          {
            image: "assets/Menu/Wake up and shine/Hot Tea/Lemon Tea.jpg",
            title: "Lemon Tea",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹22",
          },
          {
            image: "assets/Menu/Wake up and shine/Hot Tea/Green Tea.jpg",
            title: "Green Tea",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹25",
          },
          {
            image: "assets/Menu/Wake up and shine/Hot Tea/Klubnika Tea.jpg",
            title: "Klubnika Tea",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹29",
          },
          {
            image: "assets/Menu/Wake up and shine/Hot Tea/Blue Pea & Chamomile Tea.jpg",
            title: "Blue Pea & Chamomile Tea",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹35",
          },
          {
            image: "assets/Menu/Wake up and shine/Hot Tea/Mint Tea.jpg",
            title: "Mint Tea",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹35",
          },
          {
            image: "assets/Menu/Wake up and shine/Hot Tea/Darjeeling Tea.jpg",
            title: "Darjeeling Tea",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹35",
          },
          {
            image: "assets/Menu/Wake up and shine/Hot Tea/Ginger and Honey Tea.jpg",
            title: "Ginger and Honey Tea",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹39",
          },
        ],
      },
      {
        name: "Iced Tea",
        items: [
          {
            image: "assets/Menu/Wake up and shine/Iced Tea/Mint Iced Tea.jpg",
            title: "Mint Iced Tea",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹65",
          },
          {
            image: "assets/Menu/Wake up and shine/Iced Tea/Lemon Iced Tea.jpg",
            title: "Lemon Iced Tea",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹55",
          },
        ],
      },
      {
        name: "Hot Chocolate",
        items: [
          {
            image: "assets/Menu/Wake up and shine/Hot Chocolate/Hot Chocolate.jpg",
            title: "Hot Chocolate",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹79",
          },
          {
            image: "assets/Menu/Wake up and shine/Hot Chocolate/Cream Hot Chocolate.jpg",
            title: "Cream Hot Chocolate",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹99",
          },
          {
            image: "assets/Menu/Wake up and shine/Hot Chocolate/Flavour Hot Chocolate.jpg",
            title: "Flavour Got Chocolate",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹89",
          },
        ],
      },
      {
        name: "Cold Chocolate",
        items: [
          {
            image: "assets/Menu/Wake up and shine/Cold Chocolate/Belgian Chocolate.jpg",
            title: "Belgian Chocolate",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹89",
          },
          {
            image: "assets/Menu/Wake up and shine/Cold Chocolate/Rich Chocolate.jpg",
            title: "Rich Chocolate",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹99",
          },
          {
            image: "assets/Menu/Wake up and shine/Cold Chocolate/Cream Cold Chocolate.jpg",
            title: "Cream Cold Chocolate",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹109",
          },
        ],
      },
    ],
  },
  // 2. Soup
  {
    name: "Soup",
    items: [
      {
        image: "assets/Menu/Soup/Tomato Soup.jpg",
        title: "Tomato Soup",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹30",
      },
      {
        image: "assets/Menu/Soup/Hot and Sour Soup.jpg",
        title: "Hot and Sour Soup",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹35",
      },
      {
        image: "assets/Menu/Soup/Veg Corn Soup.jpg",
        title: "Veg Corn Soup",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹40",
      },
      {
        image: "assets/Menu/Soup/Chicken and Corn Soup.jpg",
        title: "Chicken and Corn Soup",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹55",
      },
    ],
  },
  // 3. Starter
  {
    name: "Starter",
    items: [
      {
        image: "assets/Menu/Starters/French Fries.jpg",
        title: "French Fries",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹59",
      },
      {
        image: "assets/Menu/Starters/Fish Finger (5pcs).jpg",
        title: "Fish Finger (5pcs)",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹109",
      },
      {
        image: "assets/Menu/Starters/Fish n Chips.jpg",
        title: "Fish n Chips",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹99",
      },
      {
        image: "assets/Menu/Starters/Chicken Popcorn(10pcs).jpg",
        title: "Chicken Popcorn (10pcs)",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹99",
      },
      {
        image: "assets/Menu/Starters/Chicken Nuggets(5pcs).jpg",
        title: "Chicken Nuggets (5pcs)",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹89",
      },
      {
        image: "assets/Menu/Starters/Chicken Small Wings(3pcs).jpg",
        title: "Chicken Small Wings (3pcs)",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹149",
      },
      {
        image: "assets/Menu/Starters/Prawn Ball(5pcs).jpg",
        title: "Prawn Ball (5pcs)",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹109",
      },
      {
        image: "assets/Menu/Starters/Veg Finger(5pcs).jpg",
        title: "Veg Finger (5pcs)",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹109",
      },
      {
        image: "assets/Menu/Starters/Veg Cheese Ball(5pcs).jpg",
        title: "Veg Cheese Ball (5pcs)",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹89",
      },
      {
        image: "assets/Menu/Starters/Chicken Finger Chilli Garlic(5pcs).jpg",
        title: "Chicken Finger Chilli Garlic (5pcs)",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹89",
      },
      {
        image: "assets/Menu/Starters/Cheesy Garlic Bread.jpg",
        title: "Cheesy Garlic Bread",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹55",
      },
    ],
  },
  // 4. Cheer Up
  {
    name: "Cheer Up",
    items: [
      {
        image: "assets/Menu/Cheer Up/kiwi smoothie.jpg",
        title: "Kiwi Smoothie",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹109",
      },
      {
        image: "assets/Menu/Cheer Up/peach smoothie.jpg",
        title: "Peach Smoothie",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹99",
      },
      {
        image: "assets/Menu/Cheer Up/Klubnika Smoothie.jpg",
        title: "Klubnika Smoothie",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹109",
      },
      {
        image: "assets/Menu/Cheer Up/mango smoothie.jpg",
        title: "Mango Smoothie",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹109",
      },
    ],
  },
  // 5. Momo & Pasta
  {
    name: "Momo & Pasta",
    items: [
      {
        image: "assets/Menu/Momo & Pasta/Paneer Chilli Momo(5pcs).jpg",
        title: "Paneer Chilli Momo (5pcs)",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹69",
      },
      {
        image: "assets/Menu/Momo & Pasta/Fried Paneer Chilli Momo(5pcs).jpg",
        title: "Fried Paneer Chilli Momo (5pcs)",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹79",
      },
      {
        image: "assets/Menu/Momo & Pasta/Schezwan Pan Fried Paneer Chilli Momo.jpg",
        title: "Schezwan Pan Fried Paneer Chilli Momo",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹99",
      },
      {
        image: "assets/Menu/Momo & Pasta/Steam Chicken Momo(5pcs).jpg",
        title: "Steam Chicken Momo (5pcs)",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹65",
      },
      {
        image: "assets/Menu/Momo & Pasta/Fried Chicken Momo(5pcs).jpg",
        title: "Fried Chicken Momo (5pcs)",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹79",
      },
      {
        image: "assets/Menu/Momo & Pasta/Schezwan Pan Fried Chicken Momo.jpg",
        title: "Schezwan Pan Fried Chicken Momo",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹99",
      },
      {
        image: "assets/Menu/Momo & Pasta/White Sauce Pasta Veg.jpg",
        title: "White Sauce Pasta Veg",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹99",
      },
      {
        image: "assets/Menu/Momo & Pasta/Red Sauce Pasta Veg.jpg",
        title: "Red Sauce Pasta Veg",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹109",
      },
      {
        image: "assets/Menu/Momo & Pasta/White Sauce Pasta Non-Veg.jpg",
        title: "White Sauce Pasta Non-Veg",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹119",
      },
      {
        image: "assets/Menu/Momo & Pasta/Red Sauce Pasta Non-Veg.jpg",
        title: "Red Sauce Pasta Non-Veg",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹129",
      },
    ],
  },
  // 6. Refreshments
  {
    name: "Refreshments",
    items: [
      {
        image: "assets/Menu/Refreshments/Rich Blue Sea.jpg",
        title: "Rich Blue Sea",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹75",
      },
      {
        image: "assets/Menu/Refreshments/Fresh Lime and Lemon.jpg",
        title: "Fresh Lime and Lemon",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹59",
      },
      {
        image: "assets/Menu/Refreshments/Mint Mojito.jpg",
        title: "Mint Mojito",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹79",
      },
      {
        image: "assets/Menu/Refreshments/Sunrise.jpg",
        title: "Sunrise",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹89",
      },
      {
        image: "assets/Menu/Refreshments/Klubnika Lime Lake.jpg",
        title: "Klubnika Lime Lake",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹95",
      },
      {
        image: "assets/Menu/Refreshments/Green Apple Fizz.jpg",
        title: "Green Apple Fizz",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹89",
      },
      {
        image: "assets/Menu/Refreshments/Litchi.jpg",
        title: "Glitchi",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹85",
      },
    ],
  },
  // 7. Sandwich & Burger
  {
    name: "Sandwich & Burger",
    subCategories: [
      {
        name: "Sandwich",
        items: [
          {
            image: "assets/Menu/Sandwich & Burger/Sandwich/Cheese and Tomato Sandwich.webp",
            title: "Cheese and Tomato Sandwich",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹59",
          },
          {
            image: "assets/Menu/Sandwich & Burger/Sandwich/Paneer and Cheese Sandwich.jpg",
            title: "Paneer and Cheese Sandwich",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹79",
          },
          {
            image: "assets/Menu/Sandwich & Burger/Sandwich/Barbeque Mushroom Sandwich.jpg",
            title: "Barbeque Mushroom Sandwich",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹69",
          },
          {
            image: "assets/Menu/Sandwich & Burger/Sandwich/Thousand Island Chicken Sandwich.jpg",
            title: "Thousand Island Chicken Sandwich",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹85",
          },
          {
            image: "assets/Menu/Sandwich & Burger/Sandwich/Chicken Tikka Sandwich.jpg",
            title: "Chicken Tikka Sandwich",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹89",
          },
          {
            image: "assets/Menu/Sandwich & Burger/Sandwich/Smoke Chicken Sandwich.jpg",
            title: "Smoke Chicken Sandwich",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹79",
          },
          {
            image: "assets/Menu/Sandwich & Burger/Sandwich/Grilled Chicken and Egg Sandwich.jpg",
            title: "Grilled Chicken and Egg Sandwich",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹109",
          },
        ],
      },
      {
        name: "Burger",
        items: [
          {
            image: "assets/Menu/Sandwich & Burger/Burger/Veg Burger.webp",
            title: "Veg Burger",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹75",
          },
          {
            image: "assets/Menu/Sandwich & Burger/Burger/Aalo Tikka Burger.jpg",
            title: "Aalo Tikka Burger",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹75",
          },
          {
            image: "assets/Menu/Sandwich & Burger/Burger/Chicken Burger.jpg",
            title: "Chicken Burger",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹85",
          },
          {
            image: "assets/Menu/Sandwich & Burger/Burger/Thousand Island Burger.jpg",
            title: "Thousand Island Burger",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹99",
          },
        ],
      },
    ],
  },
  // 8. Wrap
  {
    name: "Wrap",
    items: [
      {
        image: "assets/Menu/Wrap/Paneer Wrap.jpg",
        title: "Paneer Wrap",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹75",
      },
      {
        image: "assets/Menu/Wrap/Mushroom Wrap.jpg",
        title: "Mushroom Wrap",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹65",
      },
      {
        image: "assets/Menu/Wrap/Chicken Tikka Wrap.jpg",
        title: "Chicken Tikka Wrap",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹89",
      },
      {
        image: "assets/Menu/Wrap/Smoke Chicken Wrap.jpg",
        title: "Smoke Chicken Wrap",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹75",
      },
    ],
  },
  // 9. Pizza
  {
    name: "Pizza",
    items: [
      {
        image: "assets/Menu/Pizza/Chicken Tikka Pizza.jpg",
        title: "Chicken Tikka Pizza",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹189",
        type: "pizza",
      },
      {
        image: "assets/Menu/Pizza/Chicken Sausage Pizza.jpg",
        title: "Chicken Sausage Pizza",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹189",
        type: "pizza",
      },
      {
        image: "assets/Menu/Pizza/Pepperoni Pizza.jpg",
        title: "Pepperoni Pizza",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹189",
        type: "pizza",
      },
      {
        image: "assets/Menu/Pizza/Mushroom Pizza.jpg",
        title: "Mushroom Pizza",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹159",
        type: "pizza",
      },
      {
        image: "assets/Menu/Pizza/Paneer Pizza.jpg",
        title: "Paneer Pizza",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹159",
        type: "pizza",
      },
      {
        image: "assets/Menu/Pizza/Corn & Cheeze Pizza.jpg",
        title: "Corn & Cheeze Pizza",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹139",
        type: "pizza",
      },
      {
        image: "assets/Menu/Pizza/Vegetable Garden Pizza.jpg",
        title: "Vegetable Garden Pizza",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹149",
        type: "pizza",
      },
      {
        image: "assets/Menu/Pizza/Margarita Pizza.jpg",
        title: "Margarita Pizza",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹129",
        type: "pizza",
      },
    ],
  },
  // 10. Energizer
  {
    name: "Energizer",
    subCategories: [
      {
        name: "Milkshake",
        items: [
          {
            image: "assets/Menu/Energizer/Milkshake/Mango Milkshake.jpg",
            title: "Mango Milkshake",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹75",
          },
          {
            image: "assets/Menu/Energizer/Milkshake/Chocolate Milkshake.jpg",
            title: "Chocolate Milkshake",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹79",
          },
          {
            image: "assets/Menu/Energizer/Milkshake/Klubnika Milkshake.jpg",
            title: "Klubnika Milkshake",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹89",
          },
          {
            image: "assets/Menu/Energizer/Milkshake/Vanilla Milkshake.jpg",
            title: "Vanilla Milkshake",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹75",
          },
          {
            image: "assets/Menu/Energizer/Milkshake/Pineapple Milkshake.jpg",
            title: "Pineapple Milkshake",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹69",
          },
          {
            image: "assets/Menu/Energizer/Milkshake/Kitkat Milkshake.jpg",
            title: "Kitkat Milkshake",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹85",
          },
          {
            image: "assets/Menu/Energizer/Milkshake/Oreo Milkshake.jpg",
            title: "Oreo Milkshake",
            description: "A delicious choice, freshly prepared for you.",
            price: "₹85",
          },
        ],
      },
    ],
  },
  // 11. Desserts
  {
    name: "Desserts",
    items: [
      {
        image: "assets/Menu/Desserts/Brownie.jpg",
        title: "Brownie",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹49",
      },
      {
        image: "assets/Menu/Desserts/Brownie with ice cream.jpg",
        title: "Brownie with ice cream",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹79",
      },
      {
        image: "assets/Menu/Desserts/Sizzling brownie.jpg",
        title: "Sizzling brownie",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹129",
      },
      {
        image: "assets/Menu/Desserts/Gulab Jamun with ice cream.jpg",
        title: "Gulab Jamun with ice cream",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹77",
      },
      {
        image: "assets/Menu/Desserts/Fresh Fruit Punch.jpg",
        title: "Fresh Fruit Punch",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹109",
      },
      {
        image: "assets/Menu/Desserts/Klubnika Waffy with Ice Cream.jpg",
        title: "Klubnika Waffy with Ice Cream",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹80",
      },
    ],
  },
  // 12. Combo
  {
    name: "Combo",
    items: [
      {
        image: "assets/Menu/Combos/Cappuccino + SandwichBurger + Brownie with Ice Cream.png",
        title: "Cappuccino + Sandwich/Burger + Brownie with Ice Cream",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹199",
      },
      {
        image: "assets/Menu/Combos/Choco Frappe + SandwichBurger + Brownie.png",
        title: "Choco Frappe + Sandwich/Burger + Brownie",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹179",
      },
      {
        image: "assets/Menu/Combos/Mint Mojito + Schezwan Pan Fried Chicken Momo.png",
        title: "Mint Mojito + Schezwan Pan Fried Chicken Momo",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹149",
      },
      {
        image: "assets/Menu/Combos/Cappuccino + Red Sauce Pasta.png",
        title: "Cappuccino + Red Sauce Pasta",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹169",
      },
      {
        image: "assets/Menu/Combos/Klubnika Coffee + Garlic Bread.png",
        title: "Klubnika Coffee + Garlic Bread",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹79",
      },
      {
        image: "assets/Menu/Combos/Cappuccino + CCD Cookies.png",
        title: "Cappuccino + CCD Cookies",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹90",
      },
      {
        image: "assets/Menu/Combos/Chicken Pizza + Mint Mojito.png",
        title: "Chicken Pizza + Mint Mojito",
        description: "A delicious choice, freshly prepared for you.",
        price: "₹215",
      },
    ],
  },
  // 13. Add-ons
  {
    name: "Addons",
    items: [
      {
        title: "Extra Cheese",
        description: "Add an extra layer of cheese to your pizza.",
        price: "₹39",
        // Use a static URL here because seed.js runs on the server (cannot use imports)
        image: "https://t4.ftcdn.net/jpg/05/65/22/08/360_F_565220819_F5d0t0gX1o4qVb5M3q9x9x9x9x9x9x9.jpg",
        category: "Addon",
        isInStock: true,
      }
    ]
  },
];


// Load env vars
dotenv.config();

// Connect to DB
connectDB();

const importData = async () => {
  try {
    // 1. Clear existing products
    await Product.deleteMany({});
    console.log('Old products cleared...');

    // 2. Prepare new products
    const productsToInsert = [];
    
    // We need to flatten the complex object into database documents
    for (const category of DISHES) {
      const categoryName = category.name;

      if (category.items) {
        // Handle simple categories (like Pizza, Soup)
        for (const item of category.items) {
          productsToInsert.push({
            name: item.title, // Using title as the main 'name'
            price: parseInt(item.price.replace("₹", "")),
            desc: item.description || `A delicious ${item.title}`,
            image: item.image || 'default.jpg', // Use item.image if it exists
            category: categoryName,
            subCategory: null, // No sub-category
            isInStock: true,   // Default to in stock
          });
        }
      } else if (category.subCategories) {
        // Handle complex categories (like 'Wake up and shine')
        for (const subCategory of category.subCategories) {
          const subCategoryName = subCategory.name;
          for (const item of subCategory.items) {
            productsToInsert.push({
              name: item.title,
              price: parseInt(item.price.replace("₹", "")),
              desc: item.description || `A delicious ${item.title}`,
              image: item.image || 'default.jpg', // Use item.image if it exists
              category: categoryName,
              subCategory: subCategoryName,
              isInStock: true,
            });
          }
        }
      }
    }

    // 3. Insert all new products
    await Product.insertMany(productsToInsert);

    console.log(`Successfully imported ${productsToInsert.length} products!`);
    process.exit();
  } catch (error) {
    console.error(`Error importing data: ${error.message}`);
    process.exit(1);
  }
};

// We check if the script was run with a flag '-d' to destroy data
if (process.argv[2] === '-d') {
  // A simple (optional) function to just destroy
  Product.deleteMany({}).then(() => {
    console.log('Data Destroyed!');
    process.exit();
  });
} else {
  // Default action: import data
  importData();
}