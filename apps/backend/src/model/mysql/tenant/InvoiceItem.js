import { DataTypes } from 'sequelize';

// This will be used as a factory function to create InvoiceItem model for each tenant
export const createInvoiceItemModel = (sequelize) => {
  return sequelize.define('InvoiceItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    invoice_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'id'
      }
    },
    hsCode: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    productDescription: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rate: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    uoM: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    unitPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    totalValues: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    valueSalesExcludingST: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    fixedNotifiedValueOrRetailPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    salesTaxApplicable: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    salesTaxWithheldAtSource: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    extraTax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    furtherTax: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    sroScheduleNo: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    fedPayable: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    discount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    saleType: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    sroItemSerialNo: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    billOfLadingUoM: {
      type: DataTypes.STRING(50),
      allowNull: true
    }
  }, {
    tableName: 'invoice_items',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });
}; 