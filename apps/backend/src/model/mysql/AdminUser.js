import { DataTypes } from 'sequelize';
import { masterSequelize } from '../../config/mysql.js';

const AdminUser = masterSequelize.define('AdminUser', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  verify_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  is_verify: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  verify_code: {
    type: DataTypes.STRING(10),
    allowNull: true
  },
  photo_profile: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  sandbox_test_token: {
    type: DataTypes.STRING(255),
    defaultValue: '63f756ee-69e4-3b5b-a3b7-0b8656624912'
  },
  sandbox_publish_token: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  role: {
    type: DataTypes.STRING(50),
    defaultValue: 'admin'
  }
}, {
  tableName: 'admin_users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default AdminUser; 