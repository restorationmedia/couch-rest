var _db       = require('./config/database.js');
var http      = require('http');
var pool = new http.Agent();
    pool.maxSockets = 1000;
var CouchREST = function(db_config, database){
	//dependencies
	var request = require('request');
	var extend  = require('extend');
	
	var is_doc  = function(obj, catch_null){
		catch_null = typeof catch_null !== "undefined" ? catch_null : true;
		if( this.data !== null && typeof this.data == Object ){
			obj = this.data;
		}
		if(obj === null || typeof obj === "undefined"){
			if( catch_null ){
				throw new CouchRESTException('No document data was set!');
			}

			obj = null;
		}
		
		return obj;
	};
	
	var self = this;
	
	//self
	this.config			= extend(_db, db_config);
	this.protocol   = this.config.protocol || 'http';
	this.host   		= this.config.host + ':' + this.config.port;
	this.database 	= database;
	this.endpoint   = this.protocol + "://"  + this.host + "/" + (this.database || "");


	this.data   	= null;

	this.status = function(callback){
		var url = self.protocol + "://" + self.host;
		request({
			url: url,
			method: 'GET',
			pool: pool
		}, function(error, response, body){
			body = JSON.parse(body);
			callback(body);
		});
	};

	this.create = function(path, obj, callback){
		var url = self.endpoint  + path;
		this.data = is_doc(obj, false);
        	request({
                	url: url,
                	body: JSON.stringify(obj),
                	method: 'PUT',
			pool: pool
        	}, function(error, response, body){
			body = JSON.parse(body);
        		if( body.ok == true ){
				callback(extend(new CouchCushion(body), CouchREST));
				return;
			}
			callback(null, new CouchRESTException('Failed to insert into database!', body, url));
		}); 
	};

	this.read   = function(path, info, callback){
		info = typeof info !== "undefined" ? info : false;
		var url = self.endpoint + path;
        	request({
                	url: url,
                	method: (info ? 'HEAD' : 'GET'),
			pool: pool
        	}, function(error, response, body){
			body = JSON.parse(body);
        		if( !body.hasOwnProperty('error') ){
				callback(extend(new CouchCushion(body), CouchREST));
				return;
			}

			callback(null, new CouchRESTException('Failed to read from database!', body, url));
		}); 
	};

	this.update = function(path, obj, callback){
		var url = self.endpoint + path;
		this.data = is_doc(obj);
        	request({
                	url: url,
                	body: JSON.stringify(obj),
                	method: 'PUT',
			pool: pool
        	}, function(error, response, body){
        		if( body.ok == true ){
				callback(extend(new CouchCushion(body), CouchREST));
				return;
			}

			callback(null, new CouchRESTException('Failed to update database!', body, url));
        	}); 
	};

	this.delete = function(path, callback){
		var url = self.endpoint + path;
		this.data = is_doc(obj, false);
		if( this.data !== null ){
			
		}
        	request({
                	url: url,
                	method: 'DELETE',
			pool: pool
        	}, function(error, response, body){
			body = JSON.parse(body);
        		if( body.ok == true ){
				callback(extend(new CouchCushion(body), CouchREST));
				return;
			}

			callback(null, new CouchRESTException('Failed to delete from database!', body, url));
        	}); 
	};

};

var CouchCushion = function(fabric){
	var self = this; //portable self reference

	//data object
	this.data = {};

	//build object properties
	for(var key in fabric){
		self.data[key] = fabric[key];
	}
	
	//filter object data
	this.filter = function(callback){
		for(var key in data){
			data[key] = callback(data[key]);
		}

		return self;
	};

	this.export = function(){
		return self.data;
	};

	//get data by key
	this.get = function(key){
		return self.data[key];
	};

	//set data
	this.set = function(key, val){
		self.data[key] = val;

		return self;
	};

	this.length = function(){
		return self.data.length;
	};

	return self;

};

var CouchRESTException = function(message, previous, called){
	this.name = 'CouchRESTException';
	this.message = message;
	this.previous = previous;
	this.called = called;
};

module.exports = CouchREST;
