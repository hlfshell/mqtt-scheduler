const mqtt = require('mqtt');
const waterfall = require('async').waterfall;
const each = require('async').each;
const fs = require('fs');
const path = require('path');
const walk = require('walk').files;

module.exports = class Scheduler {

	constructor(opts, cb){
		if(cb) this.cb;

		//Handle loading of files
		this.filesLoaded = false;
		this.scheduledTasks = [];
		this.opts.scheduleFolder = opts.scheduleFolder;
		delete this.opts.scheduleFolder;

		this._loadFiles();

		//Save options passed for potential future reference
		this.opts = opts;

		//Handle MQTT host data
		if(!this.opts.host) throw new Error("Missing required MQTT host server") 
		this.host = this.opts.host;
		delete this.opts.host;

		//Handle optional close events.
		this.onMessage =  this.opts.onMessage ? this.opts.onMessage : function(){};
		delete this.opts.onMessage;

		this.onConnect =  this.opts.onConnect ? this.opts.onConnect : function(){};
		delete this.opts.onConnect;

		this.onError =  this.opts.onError ? this.opts.onError : function(error){ throw new Error(error) };
		delete this.opts.onError;

		this.onClose =  this.opts.onClose ? this.opts.onClose : function(){};
		delete this.opts.onClose;

		//Prepare connection
		this.connected = false;

		this.client = mqtt.connect(this.host, this.opts);

		//Attach events
		client.on('connect', this._onConnect);
		client.on('message', this.onMessage);
		client.on("error", this.onError);
		client.on("close", this.onClose);
	}

	_loadFiles(){
		var self = this;
		var reads = [];
		walk(self.scheduleFolder, (baseDir, filename, stat, next)=>{
			try{
				reads.push(require(path.join(baseDir, filename)));
			} catch(err){
				next(err);
			}
		}, (err)=>{
			if(err) self._handleCallback(err);
			else {
				reads.forEach(read =>{
					if(Array.isArray(read)){
						read.forEach(read =>{
							self.scheduledTasks.push(read);
						});
					} else {
						self.scheduledTasks.push(read);
					}
				});

				self.filesLoaded = true;

				self._handleCallback();
			}

		});
	}

	_onConnect(){
		//First, call our custom on connect
		this.onConnect();

		this.connected = true;

		this._handleCallback();
	}

	_handleCallback(err){
		if(err && this.cb && !this._callbackTriggered){
			this._callbackTriggered = true;
			this.cb(err);
		} else if(err){
			this._callbackTriggered = true;
			throw new Error(err);
		} else if(this.cb && this.connected && this.filesLoaded){
			this._callbackTriggered = true;
			this.cb();
			this._handleScheduledTasks();
		}
	}

	_handleScheduledTakss(){

	}



};