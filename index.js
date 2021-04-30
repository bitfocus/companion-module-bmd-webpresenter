// BlackMagic Design Web Presenter HD

var tcp = require('../../tcp');
var instance_skel = require('../../instance_skel');
var debug;
var log;

function instance(system) {
	var self = this;

	// Request id counter
	self.request_id = 0;
	self.stash = [];
	self.command = null;

	// super-constructor
	instance_skel.apply(this, arguments);

	self.actions(); // export actions

	return self;
}

instance.prototype.deviceInformation = function(key,data) {
	var self = this;
	var oldHasData = self.has_data = true;
	
	self.log('debug','device information process key: ' + key)

	if (key == 'STREAM STATE') {
		
		self.log('debug','data = ' + data);

		if (data['Status'] !== undefined) {
			self.streaming = data['Status'];
			self.setVariable('stream_state', self.streaming);
			self.checkFeedbacks('streaming_state');
			self.has_data = true;
			self.log('debug',self.streaming)
		}
	}
	
	/*
	if (key == 'VIDEO ADVANCED') {
		debug('Video Advanced: ', data);
		
		if (data['Scenecut detect'] !== undefined) {
			self.streaming = data['Scenecut detect'];
			self.setVariable('stream_state', self.streaming);
			self.checkFeedbacks('streaming_state');
			self.has_data = true;
			self.log('debug',self.streaming)
		}
	}
	*/
	
	// Initial data from device
	if (oldHasData != self.has_data && self.has_data) {
		self.checkFeedbacks();
		self.update_variables();
	}

};

instance.prototype.updateConfig = function(config) {
	var self = this;

	self.config = config;
	self.init_tcp();
};

instance.prototype.init = function() {
	var self = this;

	debug = self.debug;
	log = self.log;

	self.init_tcp();

	self.update_variables(); // export variables
	self.init_presets();
};

instance.prototype.init_tcp = function() {
	var self = this;
	var receivebuffer = '';

	if (self.socket !== undefined) {
		self.socket.destroy();
		delete self.socket;
	}

	self.has_data = false;

	if (self.config.host) {
		self.socket = new tcp(self.config.host, self.config.port);

		self.socket.on('status_change', function (status, message) {
			self.status(status, message);
		});

		self.socket.on('error', function (err) {
			debug('Network error', err);
			self.log('error','Network error: ' + err.message);
		});

		self.socket.on('connect', function () {
			debug('Connected');
		});

		// separate buffered stream into lines with responses
		self.socket.on('data', function (chunk) {
			self.log('debug','data received')
			var i = 0, line = '', offset = 0;
			receivebuffer += chunk;

			while ( (i = receivebuffer.indexOf('\n', offset)) !== -1) {
				line = receivebuffer.substr(offset, i - offset);
				offset = i + 1;
				self.socket.emit('receiveline', line.toString());
				self.log('debug',line.toString())
			}

			receivebuffer = receivebuffer.substr(offset)
		});

		self.socket.on('receiveline', function (line) {

			if (self.command === null && line.match(/:/) ) {
				self.command = line;
				self.log('debug','command: ' + line)
			}
			else if (self.command !== null && line.length > 0) {
				self.stash.push(line.trim());
			}
			else if (line.length === 0 && self.command !== null) {
				var cmd = self.command.trim().split(/:/)[0];

				self.log('debug','COMMAND: ' + cmd);

				var obj = {};
				self.stash.forEach(function (val) {
					var info = val.split(/\s*:\s*/);
					obj[info.shift()] = info.join(':');
				});

				self.deviceInformation(cmd, obj);

				self.stash = [];
				self.command = null;
			}
			else {
				self.log('debug','weird response from device', line, line.length);
			}
		});
	}
};

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this;

	return [
		{
			type: 'text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'This module will allow you to control the Blackmagic Web Presenter HD.',
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'Device IP',
			width: 6,
			regex: self.REGEX_IP,
		},
		{
			type: 'textinput',
			id: 'port',
			label: 'Device Port',
			width: 6,
			default: '9977',
			regex: self.REGEX_PORT,
		},
	]
};

// When module gets deleted
instance.prototype.destroy = function() {
	var self = this

	if (self.socket !== undefined) {
		self.socket.destroy()
	}

	debug('destroy', self.id)
};

instance.prototype.update_variables = function (system) {
	var self = this
	var variables = []
	
	variables.push({
		label: 'Streaming State',
		name: 'stream_state'
	});
	
	self.setVariable('stream_state', self.streaming);
	self.setVariableDefinitions(variables);

	// feedbacks
	var feedbacks = {}

	feedbacks['streaming_state'] = {
		label: 'Device is streaming',
		description: 'Change background colour if the device is streaming',
		options: [
			{
				type: 'colorpicker',
				label: 'Foreground colour',
				id: 'fg',
				default: self.rgb(255,255,255)
			},
			{
				type: 'colorpicker',
				label: 'Background colour',
				id: 'bg',
				default: self.rgb(0,255,0)
			}
		]
	};

	self.setFeedbackDefinitions(feedbacks);
};

instance.prototype.feedback = function(feedback, bank) {
	var self = this;

	if (feedback.type == 'streaming_state') {
		self.log('debug','status: ' + self.streaming)
		if (self.streaming === 'Streaming') {
			return {
				color: feedback.options.fg,
				bgcolor: feedback.options.bg
			};
		}
	}
};

instance.prototype.init_presets = function () {
	var self = this;
	var presets = [];

	// Signal present
	presets.push({
		category: 'Streaming',
		label: 'Start Stream',
		bank: {
			style: 'text',
			text: 'Start Stream',
			size: 'auto',
			color: '16777215',
			bgcolor: self.rgb(0, 0, 0)
		},
		actions: [
			{
				action: 'stream',
				options: {
					stream_control: 'Start',
				},
			},
		],
		feedbacks: [
			{
				type: 'streaming_state',
				options: {
					bg: self.rgb(0, 255, 0),
					fg: self.rgb(255, 255, 255),
				},
			},
		],
	});
	
	presets.push({
		category: 'Streaming',
		label: 'Stop Stream',
		bank: {
			style: 'text',
			text: 'Stop Stream',
			size: 'auto',
			color: '16777215',
			bgcolor: self.rgb(0, 0, 0)
		},
		actions: [
			{
				action: 'stream',
				options: {
					stream_control: 'Stop',
				},
			},
		],
		feedbacks: [
			{
				type: 'streaming_state',
				options: {
					bg: self.rgb(0, 255, 0),
					fg: self.rgb(255, 255, 255),
				},
			},
		],
	});

	self.setPresetDefinitions(presets);
};

instance.prototype.actions = function() {
	var self = this;

	self.system.emit('instance_actions', self.id, {

		'stream': {
			label: 'Streaming Control',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'stream_control',
					default: 'Start',
					choices: [
						{ id: 'Start', label: 'Start' },
						{ id: 'Stop', label: 'Stop' },
					]
				}
			]
		},
	});
}

instance.prototype.action = function(action) {

	var self = this
	var cmd

	if (action.action === 'stream') {
		cmd = 'STREAM STATE:\nAction: ' + action.options.stream_control + '\n\n'
		self.log('debug',cmd)
	}

	if (cmd !== undefined) {
		if (self.socket !== undefined && self.socket.connected) {
			self.socket.send(cmd)
		} else {
			debug('Socket not connected :(')
		}
	}
};

instance_skel.extendedBy(instance)
exports = module.exports = instance
