var knox   = require('knox');
var config = require('./config').config();
var http   = require('http');
//var Memcached = require('memcached');
var util = require('util');
var s3 = knox.createClient({
    key:    config.aws.key,
    secret: config.aws.secret,
    bucket: config.aws.bucket
});

//TODO: Add SASL support to memcached for Node.  Can't believe this doesn't exist yet, for now we won't provide any authorization.

//var cache = config.memcache.options ? new Memcached(config.memcache.servers ,config.memcache.options) : new Memcached(config.memcache.servers);
var server = http.createServer(function(req, res) {
  if (req.method == 'GET') {
    s3.get(req.url).on('response', function(res_from_s3){
      res.writeHead(res_from_s3.statusCode,
	{ 'content-type': res_from_s3.headers['Content-Type'] });
      res_from_s3.on('data', function(chunk){
        res.write(chunk);
      });
      res_from_s3.on('end', function(){ res.end() });
    }).end();      
  } else if (req.method == 'PUT') {    
    console.log(req.headers['content-type']);
    var req_to_s3 = s3.put(req.url, {'content-length' : req.headers['content-length'], 'content-type' : req.headers['content-type']});
    req.on('data', function(chunk) {
      req_to_s3.write(chunk);
    });
    req.on('end', function() {
      req_to_s3.end();
    });    
    req_to_s3.on('response', function(res_from_s3) {
      res.writeHead(res_from_s3.statusCode, res_from_s3.headers);		   
      res_from_s3.on('data', function(chunk) {
	res.write(chunk);
      });
      res_from_s3.on('end', function() {
	res.end();		       
      });
    });
  }
});

server.listen(config.aws.port);