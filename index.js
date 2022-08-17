// BlackMagic Design Web Presenter HD and 4K

var tcp = require('../../tcp')
var instance_skel = require('../../instance_skel')
var debug
var log

function instance(system) {
	var self = this

	// Request id counter
	self.request_id = 0
	self.stash = []
	self.command = null
	self.formats = []
	self.quality = []
	self.platforms = []

	// super-constructor
	instance_skel.apply(this, arguments)

	self.actions() // export actions

	return self
}

instance.prototype.deviceInformation = function (key, data) {
	var self = this
	var oldHasData = (self.has_data = true)

	// self.log('debug', 'device information process key: ' + key)

	if (key == 'IDENTITY') {
		if (data['Label'] !== undefined) {
			self.setVariable('label', data['Label'])
			self.has_data = true
		}

		if (data['Model'] !== undefined) {
			self.setVariable('model', data['Model'])
			self.has_data = true
		}
	}

	if (key == 'STREAM SETTINGS') {
		if (data['Available Video Modes'] !== undefined) {
			m = data['Available Video Modes'].split(',')
			self.formats = []
			for (var i = 0; i < m.length; i++) {
				self.formats.push({ id: m[i].trim(), label: m[i].trim() })
			}
			self.has_data = true

			console.log('formats available from device:')
			console.log(self.formats)
			self.actions()
		}

		if (data['Available Quality Levels'] !== undefined) {
			q = data['Available Quality Levels'].split(',')
			self.quality = []
			for (var i = 0; i < q.length; i++) {
				self.quality.push({ id: q[i].trim(), label: q[i].trim() })
			}
			self.has_data = true

			console.log('quality levels available from device:')
			console.log(self.quality)
			self.actions()
		}

		if (data['Available Default Platforms'] !== undefined) {
			p = data['Available Default Platforms'].split(',')
			self.platforms = []
			for (var i = 0; i < p.length; i++) {
				self.platforms.push({ id: p[i].trim(), label: p[i].trim() })
			}
			self.has_data = true

			console.log('platforms available from device:')
			console.log(self.platforms)
			self.actions()
		}

		// also list custom platforms in select list
		if (data['Available Custom Platforms'] !== undefined) {
			p = data['Available Custom Platforms'].split(',')
			if (!self.platforms) {
				self.platforms = []
			}
			// add custom platforms to the list of default platforms
			for (var i = 0; i < p.length; i++) {
				self.platforms.push({ id: p[i].trim(), label: p[i].trim() })
			}
			self.has_data = true

			console.log('platforms available from device:')
			console.log(self.platforms)
			self.actions()
		}

		if (data['Video Mode'] !== undefined) {
			self.setVariable('video_mode', data['Video Mode'])
			self.has_data = true
		}

		if (data['Current Quality Level'] !== undefined) {
			self.setVariable('quality', data['Current Quality Level'])
			self.has_data = true
		}

		if (data['Current Server'] !== undefined) {
			self.setVariable('server', data['Current Server'])
			self.has_data = true
		}

		if (data['Current Platform'] !== undefined) {
			self.setVariable('platform', data['Current Platform'])
			self.has_data = true
		}

		if (data['Stream Key'] !== undefined) {
			self.setVariable('key', data['Stream Key'])
			self.has_data = true
		}
	}

	if (key == 'STREAM STATE') {
		console.log('stream state = ' + data);

		if (data['Status'] !== undefined) {
			
			self.streaming = data['Status']
			self.setVariable('stream_state', self.streaming)
			self.checkFeedbacks('streaming_state')
			
			self.duration = data['Duration']
			self.setVariable('stream_duration', self.duration)
			
			self.bitrate = data['Bitrate']
			self.setVariable('stream_bitrate', self.bitrate)
			
			self.cache = data['Cache Used']
			self.setVariable('cache', self.cache)
			
			self.has_data = true
		}
	}

	// Initial data from device
	if (oldHasData != self.has_data && self.has_data) {
		self.checkFeedbacks()
		self.update_variables()
	}
}

instance.prototype.updateConfig = function (config) {
	var self = this

	self.config = config
	self.init_tcp()
}

instance.prototype.init = function () {
	var self = this

	debug = self.debug
	log = self.log
	self.timer = undefined
	self.init_tcp()

	self.update_variables() // export variables
	self.init_presets()
}

instance.prototype.dataPoller = function () {
	const self = this

	if (self.socket === undefined) {
		return
	}

	if (self.socket.connected) {
		self.socket.send('STREAM STATE:\n\n')
	} else {
		debug('Socket not connected')
	}
}

instance.prototype.init_tcp = function () {
	var self = this
	var receivebuffer = ''

	if (self.socket !== undefined) {
		self.socket.destroy()
		delete self.socket
	}

	self.has_data = false

	if (self.config.host) {
		self.socket = new tcp(self.config.host, self.config.port)

		self.socket.on('status_change', function (status, message) {
			self.status(status, message)
		})

		self.socket.on('error', function (err) {
			debug('Network error', err)
			self.log('error', 'Network error: ' + err.message)
		})

		self.socket.on('connect', function () {
			debug('Connected')
			// poll every second
			self.timer = setInterval(self.dataPoller.bind(self), 1000)
		})

		// separate buffered stream into lines with responses
		self.socket.on('data', function (chunk) {
			console.log('data received')
			var i = 0,
				line = '',
				offset = 0
			receivebuffer += chunk

			while ((i = receivebuffer.indexOf('\n', offset)) !== -1) {
				line = receivebuffer.substr(offset, i - offset)
				offset = i + 1
				if (line.toString() != 'ACK') {
					self.socket.emit('receiveline', line.toString())
					console.log(line.toString())
				}
			}

			receivebuffer = receivebuffer.substr(offset)
		})

		self.socket.on('receiveline', function (line) {
			if (self.command === null && line.match(/:/)) {
				self.command = line
				console.log('command: ' + line)
			} else if (self.command !== null && line.length > 0) {
				self.stash.push(line.trim())
			} else if (line.length === 0 && self.command !== null) {
				var cmd = self.command.trim().split(/:/)[0]

				var obj = {}
				self.stash.forEach(function (val) {
					var info = val.split(/\s*:\s*/)
					obj[info.shift()] = info.join(':')
				})

				self.deviceInformation(cmd, obj)

				self.stash = []
				self.command = null
			} else if (line.length > 0) {
				console.log('weird response from device: ' + line.toString() + ' ' + line.length)
			}
		})
	}
}

// Return config fields for web config
instance.prototype.config_fields = function () {
	var self = this

	return [
		{
			type: 'text',
			id: 'info',
			width: 12,
			label: 'Information',
			value: 'This module will allow you to control the Blackmagic Web Presenter HD or 4K.',
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
}

// When module gets deleted
instance.prototype.destroy = function () {
	var self = this

	if (self.socket !== undefined) {
		self.socket.destroy()
	}

	debug('destroy', self.id)
}

instance.prototype.update_variables = function (system) {
	var self = this
	var variables = []

	variables.push(
		{
			label: 'Device Model',
			name: 'model',
		},
		{
			label: 'Device Label',
			name: 'label',
		},
		{
			label: 'Video Mode',
			name: 'video_mode',
		},
		{
			label: 'Platform',
			name: 'platform',
		},
		{
			label: 'Server',
			name: 'server',
		},
		{
			label: 'Stream Key',
			name: 'key',
		},
		{
			label: 'Stream Quality',
			name: 'quality',
		},
		{
			label: 'Streaming State',
			name: 'stream_state',
		},
		{
			label: 'Streaming Duration',
			name: 'stream_duration',
		},
		{
			label: 'Stream Bitrate',
			name: 'stream_bitrate',
		},
		{
			label: 'Cache Used',
			name: 'cache',
		}
	)

	self.setVariable('stream_state', self.streaming)
	self.setVariableDefinitions(variables)

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
				default: self.rgb(255, 255, 255),
			},
			{
				type: 'colorpicker',
				label: 'Background colour',
				id: 'bg',
				default: self.rgb(0, 255, 0),
			},
		],
	}

	self.setFeedbackDefinitions(feedbacks)
}

instance.prototype.feedback = function (feedback, bank) {
	var self = this

	if (feedback.type == 'streaming_state') {
		console.log('update feedback status: ' + self.streaming)
		if (self.streaming === 'Streaming') {
			return {
				color: feedback.options.fg,
				bgcolor: feedback.options.bg,
			}
		}
	}
}

instance.prototype.init_presets = function () {
	var self = this
	var presets = []

	// Signal present
	presets.push({
		category: 'Streaming',
		label: 'Start Stream',
		bank: {
			style: 'text',
			text: 'Start Stream',
			size: 'auto',
			color: '16777215',
			bgcolor: self.rgb(0, 0, 0),
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
	})

	presets.push({
		category: 'Streaming',
		label: 'Stop Stream',
		bank: {
			style: 'text',
			text: 'Stop Stream',
			size: 'auto',
			color: '16777215',
			bgcolor: self.rgb(0, 0, 0),
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
	})

	self.setPresetDefinitions(presets)
}

instance.prototype.actions = function () {
	var self = this

	self.setActions({
		stream: {
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
						{ id: 'Toggle', label: 'Toggle' },
					],
				},
			],
		},
		stream_settings: {
			label: 'Stream Settings',
			options: [
				{
					type: 'dropdown',
					label: 'Video Mode',
					id: 'video_mode',
					default: 'Auto',
					choices: self.formats,
				},
				{
					type: 'dropdown',
					label: 'Platform',
					id: 'platform',
					default: 'YouTube',
					choices: self.platforms,
				},
				{
					type: 'textinput',
					label: 'Server',
					id: 'server',
					default: '',
					tooltip: 'Depends on platform.\nRefer to Blackmagic Web Presenter desktop application for possible options.',
				},
				{
					type: 'textinput',
					label: 'Stream Key',
					id: 'key',
					default: '',
					tooltip: 'Provided by the streaming platform.',
				},
				{
					type: 'dropdown',
					label: 'Quality',
					id: 'quality',
					default: 'Streaming Medium',
					choices: self.quality,
				},
			],
		},
		device: {
			label: 'Device Control',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'device_control',
					default: 'Reboot',
					choices: [
						{ id: 'Reboot', label: 'Reboot' },
						{ id: 'Factory Reset', label: 'Factory Reset' },
					],
				},
			],
		},
	})
}

instance.prototype.action = function (action) {
	var self = this
	var cmd

	if (action.action === 'stream') {
		if (action.options.stream_control === 'Toggle') {
			if (self.streaming === 'Streaming' || self.streaming === 'Connecting') {
				cmd = 'STREAM STATE:\nAction: Stop\n\n'
			} else {
				cmd = 'STREAM STATE:\nAction: Start\n\n'
			}
		} else {
			cmd = 'STREAM STATE:\nAction: ' + action.options.stream_control + '\n\n'
		}
		self.log('debug', cmd)
	}

	if (action.action === 'stream_settings') {
		cmd =
			'STREAM SETTINGS:\nVideo Mode: ' +
			action.options.video_mode +
			'\n' +
			'Current Platform: ' +
			action.options.platform +
			'\n' +
			'Current Server: ' +
			action.options.server +
			'\n' +
			'Current Quality Level: ' +
			action.options.quality +
			'\n' +
			'Stream Key: ' +
			action.options.key +
			'\n\n'
		// self.log('debug', cmd)
		console.log(cmd)
	}

	if (action.action === 'device') {
		cmd = 'SHUTDOWN:\nAction: ' + action.options.device_control + '\n\n'
		// self.log('debug', cmd)
	}

	if (cmd !== undefined) {
		if (self.socket !== undefined && self.socket.connected) {
			self.socket.send(cmd)
		} else {
			debug('Socket not connected')
		}
	}
}

instance_skel.extendedBy(instance)
exports = module.exports = instance
