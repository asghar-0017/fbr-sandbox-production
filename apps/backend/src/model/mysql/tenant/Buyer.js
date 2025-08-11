import { DataTypes } from 'sequelize';

// This will be used as a factory function to create Buyer model for each tenant
export const createBuyerModel = (sequelize) => {
  return sequelize.define('Buyer', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    buyerNTNCNIC: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true, // Add unique constraint to prevent duplicate NTN
      validate: {
        len: [0, 50]
      }
    },
    buyerBusinessName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        len: [0, 255]
      }
    },
    buyerProvince: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    buyerAddress: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    buyerRegistrationType: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    }
  }, {
    tableName: 'buyers',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });
}; 