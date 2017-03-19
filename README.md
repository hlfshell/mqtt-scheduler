#mqtt-scheduler
This is a node module / command line utility (depending on how you use it) to allow easier scheduling of "tasks" to be broadcasted on an MQTT network at a given time.

#Install

If you are installing this as a command line utility, use

```
npm install -g mqtt-scheduler
```

This will install the mqtt-scheduler globally and allow you to use it as a command line utility.

If you wish to use this as a module to access additional functionality, use

```
npm install --save mqtt-scheduler
```

within your node application.

#The task file

The task file is used in either use-case. The file is a simple text file where each new line is a new task, and columns between tasks are single-tab delimited.

A typical file is:

```
garden lights		9am		garden/lights	on
```

This would create a task called lights, which would broadcast the topic "garden/lights" with the body of "on" every day at 9 am.

The columns for the file are as follows:

1. Task name

2. Time. Date.js is used internally for decent human language parsing of intervals/times.

3. MQTT Topic

4. Message payload 

#Command Line Usage

The simplest way to invoke mqtt-scheduler is passing both the host and file.

```
mqtt-scheduler --file pathToFile --host mqtt_host_url
```

CLI options/flags are:

* -h / --host - Your MQTT host. Required.
* -p / --port - Your MQTT port. Defaults to 1883, the MQTT default port.
* -i / --id - Your MQTT client id - defaults to "mqtt_scheduler".
* -u / --username - Your MQTT connection username, if required.
* -P / --password - Your MQTT connection password, if required.
* -f / --file - The path to the scheduled tasks file. Required.