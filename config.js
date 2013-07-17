var config = {};

config.amazon = {};
config.bcrypt = {};
config.redis = {};

config.amazon.accessKeyId = "AKIAIZYVY67XOF34ZJWQ";
config.amazon.secretAccessKey = "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";
config.amazon.region = "us-east-1";
config.amazon.sourceBucket = "quickcast-raw";
config.amazon.destinationBucket = "quickcast";

config.bcrypt.secret = "artdeko";

config.redis.port = "15364";//6379";
config.redis.host = "pub-redis-15364.us-east-1-2.2.ec2.garantiadata.com";//127.0.0.1";
config.redis.password = "7PZKMFwFiI4YBcdY";

module.exports = config;


//Private DNS: 	 redis-15364.us-east-1-2.2.ec2.garantiadata.com:15364
//Public DNS:	 pub-redis-15364.us-east-1-2.2.ec2.garantiadata.com:15364