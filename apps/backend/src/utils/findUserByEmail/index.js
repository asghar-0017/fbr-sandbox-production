import AdminModel from '../../model/adminAuthModel/index.js';
import userModel from '../../model/registerUser/index.js';

const findUserByEmail = async (email) => {
  try {
    let user = await AdminModel.findOne({ email });
    if (user) return { user, model: AdminModel };

    user = await userModel.findOne({ email });
    if (user) return { user, model: userModel };

    return { user: null, model: null };
  } catch (error) {
    console.error('Error finding user by email:', error);
    return { user: null, model: null };
  }
};

export default findUserByEmail;
