import dbConnect from '@/lib/mongoose';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

async function fixAdminPassword() {
  try {
    await dbConnect();
    
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('Admin user found, updating password...');
      
      // Generate new password hash
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      
      // Update the admin user with correct password
      existingAdmin.password = hashedPassword;
      await existingAdmin.save();
      
      console.log('Admin password updated successfully!');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
    } else {
      console.log('Admin user not found, creating new admin...');
      
      // Create new admin user
      const hashedPassword = await bcrypt.hash(adminPassword, 12);
      const adminUser = new User({
        name: 'System Administrator',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      
      await adminUser.save();
      console.log('Admin user created successfully!');
      console.log('Email:', adminEmail);
      console.log('Password:', adminPassword);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

fixAdminPassword();