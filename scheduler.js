const mqtt = require('mqtt');
const waterfall = require('async').waterfall;
const each = require('async').each;
const fs = require('fs');
const path = require('path');
const forever = require('async').forever;
const datejs = require('date.js');

module.exports = class Scheduler {

	constructor(opts, cb){
		if(cb) this.cb; 

		//Save options passed for potential future reference
		this.opts = opts;

		//Handle loading of files
		this.filesLoaded = false;
		this.scheduledTasks = [];
		this.scheduleFile = this.opts.scheduleFile;
		delete this.opts.scheduleFile;

		this._loadFile();

		//Handle MQTT host data
		if(!this.opts.host) throw new Error("Missing required MQTT host server") 
		this.host = this.opts.host;

		//Handle optional close events.
		this.onMessage =  this.opts.onMessage ? this.opts.onMessage : function(){};
		delete this.opts.onMessage;

		this.onConnect =  this.opts.onConnect ? this.opts.onConnect : function(){};
		delete this.opts.onConnect;

		this.onError =  this.opts.onError ? this.opts.onError : function(error){ throw new Error(error) };
		delete this.opts.onError;

		this.onClose =  this.opts.onClose ? this.opts.onClose : function(){};
		delete this.opts.onClose;

		this.onTaskFire = this.opts.onTaskFire ? this.opts.onTaskFire : function(){};
		delete this.opts.onTaskFire;

		//Prepare connection
		this.connected = false;
		this.client = mqtt.connect(this.opts);

		//Attach events
		var self = this;
		this.client.on('connect', function(){
			self._onConnect();
		});
		this.client.on('message', this.onMessage);
		this.client.on("error", this.onError);
		this.client.on("close", this.onClose);
		this.client.on("task-fire", this.onTaskFire);

		//Setup forever checker
		this.checker = forever(done =>{
			this._checkForTasks(done);
		}, ()=>{});
	}

	_loadFile(){
		var self = this;

		fs.readFile(self.scheduleFile, (err, data)=>{
			console.log(data.toString());
			data = data.toString();
			
			//Parse the data
			var lines = data.split("\n");
			
			lines.forEach((line)=>{
				var parsedTask  = line.split("\t");
				if(parsedTask.length != 4) return;
				self.scheduledTasks.push({
					name: parsedTask[0],
					interval: parsedTask[1],
					topic: parsedTask[2],
					payload: parsedTask[3].replace(/[\r\n]/g, ''),
					nextFire: datejs(parsedTask[1])
				});
			});
		});
	}

	_onConnect(){
		// First, call our custom on connect
		this.onConnect();

		this.connected = true;
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
		}
	}

	_checkForTasks(done){
		if(!this.scheduledTasks || this.scheduledTasks.length == 0) return setTimeout(done, 10);
		var now = new Date()
		this.scheduledTasks.forEach((task, index)=>{
			if(task.nextFire <= now){
				this.scheduledTasks[index].nextFire = datejs(task.interval);
				this._handleTask(task);
			}
		});

		setTimeout(done, 10);
	}

	_handleTask(task){
		this.onTaskFire(task);
		this.client.publish(task.topic, task.payload);
	}



};
