const parse = require('pg-connection-string').parse;
const config = require('platformsh-config').config();

const dbConfig = config.credentials('postgresql');

module.exports = ({ env }) => {
    // Strapi Cloud automatically injects DATABASE_URL
    if (env('DATABASE_URL')) {
        const { host, port, database, user, password } = parse(env('DATABASE_URL'));

        return {
            connection: {
                client: 'postgres',
                connection: {
                    host,
                    port,
                    database,
                    user,
                    password,
                    ssl: { rejectUnauthorized: false }, // Required for most cloud Postgres connections
                },
                debug: false,
            },
        };
    }

    // Fallback (or alternative standard config)
    return {
        connection: {
            client: 'postgres',
            connection: {
                host: env('DATABASE_HOST', '127.0.0.1'),
                port: env.int('DATABASE_PORT', 5432),
                database: env('DATABASE_NAME', 'strapi'),
                user: env('DATABASE_USERNAME', 'strapi'),
                password: env('DATABASE_PASSWORD', 'strapi'),
                ssl: { rejectUnauthorized: false },
            },
            debug: false,
        },
    };
};
