import { DataTypes } from 'sequelize';
import { masterSequelize } from '../../config/mysql.js';
import AdminUser from './AdminUser.js';

const AdminSession = masterSequelize.define('AdminSession', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  admin_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'admin_users',
      key: 'id'
    }
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: false
  }
}, {
  tableName: 'admin_sessions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// Define association
AdminSession.belongsTo(AdminUser, { foreignKey: 'admin_id' });
AdminUser.hasMany(AdminSession, { foreignKey: 'admin_id' });

export default AdminSession; 