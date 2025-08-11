import bcrypt from "bcryptjs";
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Auth from '../../model/adminAuthModel/index.js';
import dbConnector from '../../dbConnector/index.js';
import { logger } from '../../app.js';
import config from "../../config/index.js";

dotenv.config();

const initializeAdmin = async () => {
  try {
    await dbConnector(config.db, logger);
    const admin = await Auth.findOne({ email: process.env.ADMIN_EMAIL });

    if (!admin) {
      const hashedPassword = await bcrypt.hash('invoice@321', 10);

      const newAdmin = new Auth({
        password: hashedPassword,
        email: process.env.ADMIN_EMAIL,
        adminId: 786,
      });

      await newAdmin.save();
      console.log('Initial admin user created');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error initializing admin user:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

initializeAdmin();
