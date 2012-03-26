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
  if (req.method == 'OPTIONS') {
    //console.log('OPTIONS: returning 200');
    res.writeHead(200, {'Access-Control-Allow-Origin' : '*', 'Access-Control-Allow-Methods' : 'PUT', 'Access-Control-Allow-Headers' : 'Origin, X-File-Size, X-File-Name, Content-Type, Accept, X-File-Type', 'Access-Control-Max-Age': '1728000'});
    res.end();
  } else if (req.method == 'PUT') {    
    var req_to_s3 = s3.put(req.url, {'content-length' : req.headers['content-length'], 'content-type' : req.headers['content-type']});
    req.on('data', function(chunk) {
      req_to_s3.write(chunk);
    });
    req.on('end', function() {
      req_to_s3.end();
    });    
    req_to_s3.on('response', function(res_from_s3) {
      res_from_s3.headers['access-control-allow-origin'] = '*';
      //console.log(util.inspect(res_from_s3.headers));
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