require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../server/models/User');
const UserData = require('../server/models/UserData');

(async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI not found in .env');
  await mongoose.connect(process.env.MONGODB_URI);
  
  let demo = await User.findOne({ email: 'demo@safeshelf.com' });
  const passwordHash = await bcrypt.hash('password', 12);
  
  if (!demo) {
    demo = await User.create({
      name: 'Demo Household',
      email: 'demo@safeshelf.com',
      passwordHash: passwordHash,
      role: 'user'
    });
    console.log('Created demo user:', demo.email);
  } else {
    demo.passwordHash = passwordHash;
    await demo.save();
    console.log('Updated demo user credentials:', demo.email);
  }

  const today = new Date();
  const getOffsetDate = (days) => {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    d.setDate(d.getDate() + days);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const seedInventory = [
    {
      id: 'seed-1',
      userId: demo._id.toString(),
      name: 'Organic Basmati Rice',
      category: 'Food Grains',
      quantity: '2 kg',
      expiryDate: getOffsetDate(11),
      warrantyDate: '',
      imageUrl: './images/rice.jpeg',
      description: 'Premium long grain basmati rice stored in pantry container.',
      status: 'Safe'
    },
    {
      id: 'seed-2',
      userId: demo._id.toString(),
      name: 'Natural Honey Jar',
      category: 'Condiments',
      quantity: '1 jar',
      expiryDate: getOffsetDate(3),
      warrantyDate: '',
      imageUrl: './images/honey.jpeg',
      description: 'Pure wildflower honey, glass bottle.',
      status: 'Expiring Soon'
    },
    {
      id: 'seed-3',
      userId: demo._id.toString(),
      name: 'Eco Dishwasher Liquid',
      category: 'Cleaning',
      quantity: '2 bottles',
      expiryDate: getOffsetDate(-2),
      warrantyDate: '',
      imageUrl: './images/dishwash.jpeg',
      description: 'Lemon scented environmental-friendly dishwash gel.',
      status: 'Expired'
    },
    {
      id: 'seed-4',
      userId: demo._id.toString(),
      name: 'Paracetamol 500mg',
      category: 'Medicine',
      quantity: '1 box',
      expiryDate: getOffsetDate(120),
      warrantyDate: getOffsetDate(180),
      imageUrl: './images/paracetamol.png',
      description: 'Over-the-counter pain reliever and fever reducer.',
      status: 'Safe'
    },
    {
      id: 'seed-5',
      userId: demo._id.toString(),
      name: 'Fresh Whole Milk',
      category: 'Dairy',
      quantity: '1 Litre',
      expiryDate: getOffsetDate(1),
      warrantyDate: '',
      imageUrl: './images/milk.jpeg',
      description: 'Pasteurized homogenized full-fat dairy milk.',
      status: 'Expiring Soon'
    }
  ];

  const seedShopping = [
    {
      id: 'shop_seed_1',
      name: 'Extra Virgin Olive Oil',
      category: 'Condiments',
      quantity: '1 bottle',
      source: 'auto',
      reason: 'low_stock',
      purchased: false
    },
    {
      id: 'shop_seed_2',
      name: 'Free Range Eggs',
      category: 'Dairy',
      quantity: '12 pack',
      source: 'manual',
      reason: 'manual',
      purchased: false
    }
  ];

  await UserData.findOneAndUpdate(
    { userId: demo._id },
    { $set: { inventory: seedInventory, shoppingList: seedShopping } },
    { upsert: true, new: true }
  );

  console.log('Demo user data successfully seeded in MongoDB.');
  await mongoose.disconnect();
})().catch(err => {
  console.error('Error seeding demo:', err);
  process.exit(1);
});
