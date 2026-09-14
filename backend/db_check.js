import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const cp = await mongoose.connection.collection('customerpayments').find({status: 'active'}).toArray();
    console.log("Customer payments:", cp.length);
    cp.forEach(e => console.log(`- Amount: ${e.amount}, Date: ${e.paymentDate}`));
    
    const ep = await mongoose.connection.collection('employeepayments').find({status: 'active'}).toArray();
    console.log("Employee payments:", ep.length);
    ep.forEach(e => console.log(`- Amount: ${e.amount}, Date: ${e.paymentDate}`));

    const cop = await mongoose.connection.collection('contractorpayments').find({status: 'active'}).toArray();
    console.log("Contractor payments:", cop.length);
    cop.forEach(e => console.log(`- Amount: ${e.amount}, Date: ${e.paymentDate}`));

    const sp = await mongoose.connection.collection('supplierpayments').find({status: 'active'}).toArray();
    console.log("Supplier payments:", sp.length);
    sp.forEach(e => console.log(`- Amount: ${e.amount}, Date: ${e.paymentDate}`));

    process.exit(0);
  });
