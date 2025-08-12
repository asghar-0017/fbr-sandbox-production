import dotenv from 'dotenv'
dotenv.config()

const config = {
    mysql: {
        host: process.env.MYSQL_HOST ,
        port: process.env.MYSQL_PORT,
        username: process.env.MYSQL_USER ,
        password: process.env.MYSQL_PASSWORD ,
        database: process.env.MYSQL_MASTER_DB 
    }
}

export default config