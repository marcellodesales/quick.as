var config = {};

config.production = process.env.PROD || false;

config.amazon = {};
config.bcrypt = {};
config.redis = {};
config.postgres = {};
config.postmark = {};

config.postgres.connection = process.env.DATABASE_URL;

config.sessionSecret = process.env.SESSION_SECRET;

config.amazon.accessKeyId = process.env.AWS_KEY;
config.amazon.secretAccessKey = process.env.AWS_SECRET;
config.amazon.region = process.env.AWS_REGION;
config.amazon.sourceBucket = process.env.AWS_BUCKET_SOURCE;
config.amazon.destinationBucket = process.env.AWS_BUCKET;
config.amazon.pipelineId = process.env.AWS_PIPELINE_ID;
config.amazon.webM = process.env.AWS_WEBM;
config.amazon.mp4 = process.env.AWS_MP4;
config.amazon.mp4small = process.env.AWS_MP4SMALL;

config.bcrypt.secret = process.env.BCRYPT_SECRET;

config.redis.url = process.env.REDISCLOUD_URL;
config.redis.password = process.env.REDISCLOUD_PASSWORD;

config.postmark.apiKey = process.env.POSTMARK_API_KEY;
config.postmark.from = process.env.POSTMARK_FROM;

module.exports = config;