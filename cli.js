#!/usr/bin/env node

const cli = require('commander');
const Scheduler = require('./scheduler.js');

cli
	.version(require('./package.json').version)
	.option('-h, --host [host]', 'Set host')
	.option('-p, --port [port]', 'Set port')
	.option('-f, --file [file]', 'Set filename')
	.option('-i, --id [id]', 'Your id when connecting to the mqtt server')
	.option('-u, --username [username]', 'Your username to the MQTT server (if it requires one)')
	.option('-P, --password [password]', 'Subscription prefix. /# is automatically appended ie: /home/lights becomes /home/lights/#')
	.parse(process.argv);


if(!cli.file){
	console.error("You must set --file [file] for us to know what tasks to fire off and when");
	process.exit(0);
}

if(!cli.host) {
	console.error("You must set the MQTT host via --host");
	cli.outputHelp();
	process.exit(0);
}
 
if(!cli.port) cli.port = 1883;
if(!cli.id) cli.id = "mqtt_scheduler";

var scheduler = new Scheduler({
	//MQTT stuff
	host: cli.host,
	port: cli.port,
	clientId: cli.id,
	username: cli.username ? cli.username : undefined,
	password: cli.password ? cli.password : undefined,
	//Scheduler stuff
	scheduleFile: cli.file
}, (err)=>{
	if(err){
		console.error("Scheduler has suffered from an error!");
		console.error(err);
		process.exit(0);
	} else{
		console.log("Scheduler is now running");
	}
});