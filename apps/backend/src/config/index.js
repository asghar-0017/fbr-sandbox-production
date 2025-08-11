import dotenv from 'dotenv'
dotenv.config()

const config = {
    mysql: {
        host: process.env.MYSQL_HOST || '45.55.137.96',
        port: process.env.MYSQL_PORT || 3306,
        username: process.env.MYSQL_USER || 'fr_master_o',
        password: process.env.MYSQL_PASSWORD || 'noLograt$5aion',
        database: process.env.MYSQL_MASTER_DB || 'fr_master'
    }
}

export default config