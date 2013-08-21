/*var config = {};

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

module.exports = config;*/

var config = {};

config.production = process.env.PROD || false;

config.amazon = {};
config.bcrypt = {};
config.redis = {};
config.postgres = {};
config.postmark = {};

config.postgres.connection = process.env.DATABASE_URL;

config.sessionSecret = process.env.SESSION_SECRET;

config.amazon.accessKeyId = process.env.AWS_KEY || "AKIAIZYVY67XOF34ZJWQ";
config.amazon.secretAccessKey = process.env.AWS_SECRET || "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";
config.amazon.region = process.env.AWS_REGION || "us-east-1";
config.amazon.sourceBucket = process.env.AWS_BUCKET_SOURCE || "quickcast";
config.amazon.destinationBucket = process.env.AWS_BUCKET || "quickcast";
config.amazon.pipelineId = process.env.AWS_PIPELINE_ID || "1374152639778-8jmq2b";
config.amazon.webM = process.env.AWS_WEBM || "1375371447217-am4hmg";
config.amazon.mp4 = process.env.AWS_MP4 || "1375370896911-6ejms9";
config.amazon.mp4small = process.env.AWS_MP4SMALL || "1375387958849-apazvq";

config.bcrypt.secret = process.env.BCRYPT_SECRET || "artdeko";

config.redis.url = process.env.REDISCLOUD_URL || "redis://127.0.0.1:6379";
config.redis.password = process.env.REDISCLOUD_PASSWORD;

config.postmark.apiKey = process.env.POSTMARK_API_KEY || "7e14b87a-93ee-4180-a40b-60921be267f6";
config.postmark.from = process.env.POSTMARK_FROM || "quickcast@neilkinnish.com";

module.exports = config;