import { DataTypes } from 'sequelize';
import { masterSequelize } from '../../config/mysql.js';

const ResetCode = masterSequelize.define('ResetCode', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  code: {
    type: DataTypes.STRING(6),
    allowNull: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  },
  is_used: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'reset_codes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default ResetCode; 