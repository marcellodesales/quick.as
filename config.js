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
config.amazon.pipelineId = "1374152639778-8jmq2b"; // change to env
config.amazon.webM = "1374088399513-l7fe4b"; // change to env
config.amazon.mp4 = "1351620000001-100070"; // change to env

config.bcrypt.secret = process.env.BCRYPT_SECRET || "artdeko";

config.redis.url = process.env.REDISCLOUD_URL || "127.0.0.1:6379";
config.redis.password = process.env.REDISCLOUD_PASSWORD || "";

module.exports = config;