import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import findUserByEmail from '../../utils/findUserByEmail/index.js';
import Admin from '../../model/adminAuthModel/index.js';
import userModel from "../../model/registerUser/index.js";



dotenv.config();
const secretKey = process.env.JWT_SECRET;

const authenticationService = {

  login: async ({ email, password }) => {
    const { user, model } = await findUserByEmail(email);
    if (!user) return null;
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    if (user.sessions.length >= 3) {
      user.sessions = user.sessions.slice(-2);
    }
    const token = jwt.sign(
      { email: user.email, role: user.role },
      secretKey,
      { expiresIn: '10h' }
    );
    user.sessions.push({ token });
    user.verifyToken = token;
    await user.save();

    return { token, user };
  },

  logout: async (token) => {
    const models = [Admin];

    for (const model of models) {
      const user = await model.findOne({ 'sessions.token': token });
      if (user) {
        user.sessions = user.sessions.filter(s => s.token !== token);
        await user.save();
        return true;
      }
    }
    return false;
  },

  saveResetCode: async (code, email) => {
    const { user } = await findUserByEmail(email);
    if (user) {
      user.verifyCode = code;
      await user.save();
      return true;
    }
    return false;
  },

  validateResetCode: async (code) => {
    const models = [Admin,userModel];
    for (const model of models) {
      const user = await model.findOne({ verifyCode: code });
      if (user) {
        user.verifyCode = '';
        await user.save();
        return true;
      }
    }
    return false;
  },

  updatePassword: async (newPassword, email) => {
    try {
      const models = [Admin,userModel];
      for (const model of models) {
        const user = await model.findOne({ email });
        if (user) {
          const hashedPassword = await bcrypt.hash(newPassword, 10);
          user.password = hashedPassword;
          user.verifyCode = '';
          await user.save();
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error updating password:', error);
      throw new Error('Failed to update password');
    }
  },

  verifyToken: async (token) => {
    try {
      const decoded = jwt.verify(token, secretKey);
      const { email } = decoded;
      const { user } = await findUserByEmail(email);
      if (user && user.sessions.some(s => s.token === token)) {
        return true;
      }
    } catch (err) {
      console.error(err.message);
    }
    return false;
  }

};

export default authenticationService;
