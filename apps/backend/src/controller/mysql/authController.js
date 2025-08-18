import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import AdminUser from "../../model/mysql/AdminUser.js";
import AdminSession from "../../model/mysql/AdminSession.js";
import ResetCode from "../../model/mysql/ResetCode.js";
import generateResetCode from "../../utils/generateResetCode.js";
import sendResetEmail from "../../utils/sendResetEmail.js";

/**
 * Standard API response formatter
 */
const formatResponse = (success, message, data = null, statusCode = 200) => {
  return {
    success,
    message,
    data,
    timestamp: new Date().toISOString(),
    statusCode,
  };
};

/**
 * Input validation helper
 */
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Rate limiting helper (simple in-memory store - consider Redis for production)
 */
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

const checkRateLimit = (email) => {
  const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
  const now = Date.now();

  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    attempts.count = 0;
  }

  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    return false;
  }

  attempts.count++;
  attempts.lastAttempt = now;
  loginAttempts.set(email, attempts);
  return true;
};

const resetRateLimit = (email) => {
  loginAttempts.delete(email);
};

/**
 * Admin Login
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email, password);

    // Input validation
    if (!email || !password) {
      return res
        .status(400)
        .json(
          formatResponse(false, "Email and password are required", null, 400)
        );
    }

    if (!validateEmail(email)) {
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            "Please provide a valid email address",
            null,
            400
          )
        );
    }

    // Check rate limiting
    if (!checkRateLimit(email)) {
      return res
        .status(429)
        .json(
          formatResponse(
            false,
            "Too many login attempts. Please try again in 15 minutes.",
            null,
            429
          )
        );
    }

    // Find admin user
    const admin = await AdminUser.findOne({
      where: {
        email: email,
      },
    });

    if (!admin) {
      return res
        .status(401)
        .json(formatResponse(false, "Invalid email or password", null, 401));
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json(formatResponse(false, "Invalid email or password", null, 401));
    }

    // Check if account is verified
    if (!admin.is_verify) {
      return res
        .status(401)
        .json(
          formatResponse(
            false,
            "Account not verified. Please verify your email first.",
            null,
            401
          )
        );
    }

    // Check for existing sessions and limit them
    await AdminSession.findAll({
      where: { admin_id: admin.id },
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        iat: Math.floor(Date.now() / 1000),
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Create new session
    await AdminSession.create({
      admin_id: admin.id,
      token,
    });

    // Reset rate limit on successful login
    resetRateLimit(email);

    // Remove sensitive data from response
    const userData = {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      is_verify: admin.is_verify,
      photo_profile: admin.photo_profile,
      created_at: admin.created_at,
      updated_at: admin.updated_at,
    };

    return res.status(200).json(
      formatResponse(true, "Login successful", {
        token,
        user: userData,
        expiresIn: "24h",
      })
    );
  } catch (error) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json(formatResponse(false, "Internal server error", null, 500));
  }
};

/**
 * Admin Logout
 * GET /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json(formatResponse(false, "No token provided", null, 401));
    }

    // Remove session from database
    const deletedCount = await AdminSession.destroy({
      where: { token },
    });

    if (deletedCount === 0) {
      return res
        .status(401)
        .json(formatResponse(false, "Invalid or expired token", null, 401));
    }

    return res
      .status(200)
      .json(formatResponse(true, "Logged out successfully"));
  } catch (error) {
    console.error("Logout error:", error);
    return res
      .status(500)
      .json(formatResponse(false, "Internal server error", null, 500));
  }
};

/**
 * Verify Token
 * GET /api/auth/verify-token
 */
export const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json(formatResponse(false, "No token provided", null, 401));
    }

    // Check if session exists
    const session = await AdminSession.findOne({
      where: { token },
    });

    if (!session) {
      return res
        .status(401)
        .json(formatResponse(false, "Invalid or expired token", null, 401));
    }

    // Verify JWT token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user data
      const admin = await AdminUser.findByPk(decoded.id);
      if (!admin) {
        return res
          .status(401)
          .json(formatResponse(false, "User not found", null, 401));
      }

      return res.status(200).json(
        formatResponse(true, "Token is valid", {
          isValid: true,
          user: {
            id: admin.id,
            email: admin.email,
            role: admin.role,
            is_verify: admin.is_verify,
          },
        })
      );
    } catch (jwtError) {
      // Remove invalid session
      await AdminSession.destroy({ where: { token } });

      return res
        .status(401)
        .json(formatResponse(false, "Invalid or expired token", null, 401));
    }
  } catch (error) {
    console.error("Token verification error:", error);
    return res
      .status(500)
      .json(formatResponse(false, "Internal server error", null, 500));
  }
};

/**
 * Get Admin Profile
 * GET /api/auth/profile
 */
export const getProfile = async (req, res) => {
  try {
    const adminId = req.user.id;

    const admin = await AdminUser.findByPk(adminId, {
      attributes: { exclude: ["password", "verify_token", "verify_code"] },
    });

    if (!admin) {
      return res
        .status(404)
        .json(formatResponse(false, "User not found", null, 404));
    }

    return res
      .status(200)
      .json(
        formatResponse(true, "Profile retrieved successfully", { user: admin })
      );
  } catch (error) {
    console.error("Get profile error:", error);
    return res
      .status(500)
      .json(formatResponse(false, "Internal server error", null, 500));
  }
};

/**
 * Update Admin Profile
 * PUT /api/auth/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { email, photo_profile } = req.body;

    // Input validation
    if (email && !validateEmail(email)) {
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            "Please provide a valid email address",
            null,
            400
          )
        );
    }

    const admin = await AdminUser.findByPk(adminId);
    if (!admin) {
      return res
        .status(404)
        .json(formatResponse(false, "User not found", null, 404));
    }

    // Check if email is already taken by another user
    if (email && email !== admin.email) {
      const existingUser = await AdminUser.findOne({
        where: {
          email: email.toLowerCase().trim(),
          id: { [Op.ne]: adminId },
        },
      });

      if (existingUser) {
        return res
          .status(400)
          .json(formatResponse(false, "Email is already taken", null, 400));
      }
    }

    // Update profile
    const updateData = {};
    if (email) updateData.email = email.toLowerCase().trim();
    if (photo_profile !== undefined) updateData.photo_profile = photo_profile;

    await admin.update(updateData);

    // Return updated profile without sensitive data
    const updatedAdmin = await AdminUser.findByPk(adminId, {
      attributes: { exclude: ["password", "verify_token", "verify_code"] },
    });

    return res
      .status(200)
      .json(
        formatResponse(true, "Profile updated successfully", {
          user: updatedAdmin,
        })
      );
  } catch (error) {
    console.error("Update profile error:", error);
    return res
      .status(500)
      .json(formatResponse(false, "Internal server error", null, 500));
  }
};

/**
 * Change Password
 * PUT /api/auth/change-password
 */
export const changePassword = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Input validation
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            "Current password and new password are required",
            null,
            400
          )
        );
    }

    if (!validatePassword(newPassword)) {
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            "New password must be at least 8 characters long and contain uppercase, lowercase, and number",
            null,
            400
          )
        );
    }

    const admin = await AdminUser.findByPk(adminId);
    if (!admin) {
      return res
        .status(404)
        .json(formatResponse(false, "User not found", null, 404));
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      admin.password
    );
    if (!isCurrentPasswordValid) {
      return res
        .status(401)
        .json(
          formatResponse(false, "Current password is incorrect", null, 401)
        );
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await admin.update({ password: hashedNewPassword });

    // Invalidate all existing sessions
    await AdminSession.destroy({ where: { admin_id: adminId } });

    return res
      .status(200)
      .json(
        formatResponse(
          true,
          "Password changed successfully. Please login again."
        )
      );
  } catch (error) {
    console.error("Change password error:", error);
    return res
      .status(500)
      .json(formatResponse(false, "Internal server error", null, 500));
  }
};

/**
 * Forgot Password
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Input validation
    if (!email) {
      return res
        .status(400)
        .json(formatResponse(false, "Email is required", null, 400));
    }

    if (!validateEmail(email)) {
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            "Please provide a valid email address",
            null,
            400
          )
        );
    }
    const checkEmail = await AdminUser.findOne({
      where: { email: email.toLowerCase().trim() },
    });
    if (!checkEmail) {
      return res.status(200).json({
        exists: false,
        message: "This email is not registered. Please try again.",
      });
    }

    // Find user
    const user = await AdminUser.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return res
        .status(200)
        .json(
          formatResponse(
            true,
            "If the email exists, a reset code has been sent."
          )
        );
    }

    // Generate reset code
    const code = generateResetCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save or update reset code
    await ResetCode.upsert({
      email: email.toLowerCase().trim(),
      code,
      expires_at: expiresAt,
      is_used: false,
    });

    // Send email
    try {
      await sendResetEmail(email, code);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      return res
        .status(500)
        .json(
          formatResponse(
            false,
            "Failed to send reset email. Please try again later.",
            null,
            500
          )
        );
    }

    return res
      .status(200)
      .json(
        formatResponse(true, "If the email exists, a reset code has been sent.")
      );
  } catch (error) {
    console.error("Forgot password error:", error);
    return res
      .status(500)
      .json(formatResponse(false, "Internal server error", null, 500));
  }
};

/**
 * Verify Reset Code
 * POST /api/auth/verify-reset-code
 */
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    // Input validation
    if (!email || !code) {
      return res
        .status(400)
        .json(
          formatResponse(false, "Email and reset code are required", null, 400)
        );
    }

    if (!validateEmail(email)) {
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            "Please provide a valid email address",
            null,
            400
          )
        );
    }

    // Find reset code
    const resetEntry = await ResetCode.findOne({
      where: {
        email: email.toLowerCase().trim(),
        code,
        is_used: false,
      },
    });

    if (!resetEntry) {
      return res
        .status(400)
        .json(formatResponse(false, "Invalid reset code", null, 400));
    }

    // Check if code is expired
    if (new Date() > resetEntry.expires_at) {
      await resetEntry.update({ is_used: true });
      return res
        .status(400)
        .json(formatResponse(false, "Reset code has expired", null, 400));
    }

    return res
      .status(200)
      .json(formatResponse(true, "Reset code verified successfully"));
  } catch (error) {
    console.error("Verify reset code error:", error);
    return res
      .status(500)
      .json(formatResponse(false, "Internal server error", null, 500));
  }
};

/**
 * Reset Password
 * PUT /api/auth/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    // Input validation
    if (!email || !code || !newPassword) {
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            "Email, reset code, and new password are required",
            null,
            400
          )
        );
    }

    if (!validateEmail(email)) {
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            "Please provide a valid email address",
            null,
            400
          )
        );
    }

    if (!validatePassword(newPassword)) {
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            "Password must be at least 8 characters long and contain uppercase, lowercase, and number",
            null,
            400
          )
        );
    }

    // Find and verify reset code
    const resetEntry = await ResetCode.findOne({
      where: {
        email: email.toLowerCase().trim(),
        code,
        is_used: false,
      },
    });

    if (!resetEntry) {
      return res
        .status(400)
        .json(formatResponse(false, "Invalid reset code", null, 400));
    }

    // Check if code is expired
    if (new Date() > resetEntry.expires_at) {
      await resetEntry.update({ is_used: true });
      return res
        .status(400)
        .json(formatResponse(false, "Reset code has expired", null, 400));
    }

    // Find user
    const user = await AdminUser.findOne({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return res
        .status(404)
        .json(formatResponse(false, "User not found", null, 404));
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await user.update({ password: hashedPassword });

    // Mark reset code as used
    await resetEntry.update({ is_used: true });

    // Invalidate all existing sessions
    await AdminSession.destroy({ where: { admin_id: user.id } });

    return res
      .status(200)
      .json(
        formatResponse(
          true,
          "Password reset successfully. Please login with your new password."
        )
      );
  } catch (error) {
    console.error("Reset password error:", error);
    return res
      .status(500)
      .json(formatResponse(false, "Internal server error", null, 500));
  }
};

/**
 * Refresh Token
 * POST /api/auth/refresh-token
 */
export const refreshToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json(formatResponse(false, "No token provided", null, 401));
    }

    // Verify current token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res
        .status(401)
        .json(formatResponse(false, "Invalid token", null, 401));
    }

    // Check if session exists
    const session = await AdminSession.findOne({
      where: { token },
    });

    if (!session) {
      return res
        .status(401)
        .json(formatResponse(false, "Session not found", null, 401));
    }

    // Get user
    const admin = await AdminUser.findByPk(decoded.id);
    if (!admin) {
      return res
        .status(401)
        .json(formatResponse(false, "User not found", null, 401));
    }

    // Generate new token
    const newToken = jwt.sign(
      {
        id: admin.id,
        email: admin.email,
        role: admin.role,
        iat: Math.floor(Date.now() / 1000),
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Update session with new token
    await session.update({ token: newToken });

    return res.status(200).json(
      formatResponse(true, "Token refreshed successfully", {
        token: newToken,
        expiresIn: "24h",
      })
    );
  } catch (error) {
    console.error("Refresh token error:", error);
    return res
      .status(500)
      .json(formatResponse(false, "Internal server error", null, 500));
  }
};
