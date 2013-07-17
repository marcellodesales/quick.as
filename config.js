var config = {};

config.production = process.env.PROD || false;

config.amazon = {};
config.bcrypt = {};
config.redis = {};
config.postgres = {};

config.postgres.connection = process.env.DATABASE_URL;

config.amazon.accessKeyId = process.env.AWS_KEY || "AKIAIZYVY67XOF34ZJWQ";
config.amazon.secretAccessKey = process.env.AWS_SECRET || "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";
config.amazon.region = process.env.AWS_REGION || "us-east-1";
config.amazon.sourceBucket = process.env.AWS_BUCKET_SOURCE || "quickcast-raw";
config.amazon.destinationBucket = process.env.AWS_BUCKET || "quickcast";

config.bcrypt.secret = process.env.BCRYPT_SECRET || "artdeko";

config.redis.url = process.env.REDISCLOUD_URL || "127.0.0.1:6379";
config.redis.password = process.env.REDISCLOUD_PASSWORD || "";

module.exports = config;