// BlackMagic Design Web Presenter HD and 4K

var tcp = require('../../tcp')
var instance_skel = require('../../instance_skel')

var actions = require('./actions')
var feedback = require('./feedback')
var presets = require('./presets')
var variables = require('./variables')

var debug
var log

class instance extends instance_skel {
	
	constructor(system, id, config) {
		super(system, id, config)
	
		this.request_id = 0
		this.stash = []
		this.command = null
		this.formats = []
		this.quality = []
		this.platforms = []
	
		Object.assign(this, {
			...actions,
			...feedback,
			...presets,
			...variables
		})
	}
	
	actions(system) {
		this.setActions(this.getActions());
	}

	action(action) {
		var cmd
	
		if (action.action === 'stream') {
			if (action.options.stream_control === 'Toggle') {
				if (this.streaming === 'Streaming' || this.streaming === 'Connecting') {
					cmd = 'STREAM STATE:\nAction: Stop\n\n'
				} else {
					cmd = 'STREAM STATE:\nAction: Start\n\n'
				}
			} else {
				cmd = 'STREAM STATE:\nAction: ' + action.options.stream_control + '\n\n'
			}
			this.log('debug', cmd)
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
			// this.log('debug', cmd)
			console.log(cmd)
		}
	
		if (action.action === 'device') {
			cmd = 'SHUTDOWN:\nAction: ' + action.options.device_control + '\n\n'
			// this.log('debug', cmd)
		}
	
		if (cmd !== undefined) {
			if (this.socket !== undefined && this.socket.connected) {
				this.socket.send(cmd)
			} else {
				debug('Socket not connected')
			}
		}
	}

	config_fields() {

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
				regex: this.REGEX_IP,
			},
			{
				type: 'textinput',
				id: 'port',
				label: 'Device Port',
				width: 6,
				default: '9977',
				regex: this.REGEX_PORT,
			},
		]
	}
	
	destroy() {
		if (this.timer) {
			clearInterval(this.timer)
			delete this.timer
		}
	
		if (this.socket !== undefined) {
			this.socket.destroy()
		}
	
		debug('destroy', this.id)
	}
	
	// getConfig() {
	// 	if (this.configuration === undefined) {
	// 		this.configuration = {
	// 			// set some default config here?
	// 		}
	// 	}
	// 	return this.configuration
	// }
	
	init() {
			console.log('init WebPresenter')

			debug = this.debug
			log = this.log

			this.timer = undefined

			this.initVariables()
			this.initFeedbacks()
			this.initPresets()
			this.init_tcp()

	}
	
	init_tcp() {
		var receivebuffer = ''
	
		if (this.socket !== undefined) {
			this.socket.destroy()
			delete this.socket
		}
	
		this.has_data = false
	
		if (this.config.host) {
			this.socket = new tcp(this.config.host, this.config.port)
	
			this.socket.on('status_change', (status, message) => {
				this.status(status, message);
			})
			
			this.socket.on('error', (err) => {
				this.debug("Network error", err);
				this.log('error',"Network error: " + err.message);
			})

			this.socket.on('connect', () => {
				this.debug("Connected")
				// poll every second
				this.timer = setInterval(this.dataPoller.bind(this), 1000)
			})
	
			// separate buffered stream into lines with responses
			this.socket.on('data', (chunk) => {
				// console.log('data received')
				var i = 0,
					line = '',
					offset = 0
				receivebuffer += chunk
	
				while ((i = receivebuffer.indexOf('\n', offset)) !== -1) {
					line = receivebuffer.substr(offset, i - offset)
					offset = i + 1
					if (line.toString() != 'ACK') {
						this.socket.emit('receiveline', line.toString())
						// console.log(line.toString())
					}
				}
	
				receivebuffer = receivebuffer.substr(offset)
			})
	
			this.socket.on('receiveline', (line) => {
				if (this.command === null && line.match(/:/)) {
					this.command = line
					// console.log('command: ' + line)
				} else if (this.command !== null && line.length > 0) {
					this.stash.push(line.trim())
				} else if (line.length === 0 && this.command !== null) {
					var cmd = this.command.trim().split(/:/)[0]
	
					var obj = {}
					this.stash.forEach(function (val) {
						var info = val.split(/\s*:\s*/)
						obj[info.shift()] = info.join(':')
					})
	
					this.processDeviceInformation(cmd, obj)
	
					this.stash = []
					this.command = null
				} else if (line.length > 0) {
					console.log('weird response from device: ' + line.toString() + ' ' + line.length)
				}
			})
		}
	}
	
	processDeviceInformation(key, data) {

		var oldHasData = (this.has_data = true)
	
		console.log('device information process key : ' + key)
		console.log('device information process data:')
		console.info(data)
	
		if (key == 'IDENTITY') {
			if (data['Label'] !== undefined) {
				this.setVariable('label', data['Label'])
				this.has_data = true
			}
	
			if (data['Model'] !== undefined) {
				this.setVariable('model', data['Model'])
				this.has_data = true
			}
		}
	
		if (key == 'STREAM SETTINGS') {
			if (data['Available Video Modes'] !== undefined) {
				var m = data['Available Video Modes'].split(',')
				this.formats = []
				for (var i = 0; i < m.length; i++) {
					this.formats.push({ id: m[i].trim(), label: m[i].trim() })
				}
				this.has_data = true
	
				console.log('formats available from device:')
				console.log(this.formats)
				this.actions()
			}
	
			if (data['Available Quality Levels'] !== undefined) {
				var q = data['Available Quality Levels'].split(',')
				this.quality = []
				for (var i = 0; i < q.length; i++) {
					this.quality.push({ id: q[i].trim(), label: q[i].trim() })
				}
				this.has_data = true
	
				console.log('quality levels available from device:')
				console.log(this.quality)
				this.actions()
			}
	
			if (data['Available Default Platforms'] !== undefined) {
				var p = data['Available Default Platforms'].split(',')
				this.platforms = []
				for (var i = 0; i < p.length; i++) {
					this.platforms.push({ id: p[i].trim(), label: p[i].trim() })
				}
				this.has_data = true
	
				console.log('platforms available from device:')
				console.log(this.platforms)
				this.actions()
			}
	
			// also list custom platforms in select list
			if (data['Available Custom Platforms'] !== undefined) {
				var p = data['Available Custom Platforms'].split(',')
				if (!this.platforms) {
					this.platforms = []
				}
				// add custom platforms to the list of default platforms
				for (var i = 0; i < p.length; i++) {
					this.platforms.push({ id: p[i].trim(), label: p[i].trim() })
				}
				this.has_data = true
	
				console.log('platforms available from device:')
				console.log(this.platforms)
				this.actions()
			}
	
			if (data['Video Mode'] !== undefined) {
				this.setVariable('video_mode', data['Video Mode'])
				this.has_data = true
			}
	
			if (data['Current Quality Level'] !== undefined) {
				this.setVariable('quality', data['Current Quality Level'])
				this.has_data = true
			}
	
			if (data['Current Server'] !== undefined) {
				this.setVariable('server', data['Current Server'])
				this.has_data = true
			}
	
			if (data['Current Platform'] !== undefined) {
				this.setVariable('platform', data['Current Platform'])
				this.has_data = true
			}
	
			if (data['Stream Key'] !== undefined) {
				this.setVariable('key', data['Stream Key'])
				this.has_data = true
			}
		}
	
		if (key == 'STREAM STATE') {
			// console.log('stream state = ' + data)
	
			if (data['Status'] !== undefined) {
				this.streaming = data['Status']
				this.setVariable('stream_state', this.streaming)
				this.checkFeedbacks('streaming_state')
	
				this.duration = data['Duration']
				this.setVariable('stream_duration', this.duration)
				this.setVariable('stream_duration_HH', this.duration.substring(3, 5))
				this.setVariable('stream_duration_MM', this.duration.substring(6, 8))
				this.setVariable('stream_duration_SS', this.duration.substring(9, 11))
	
				this.bitrate = data['Bitrate']
				this.setVariable('stream_bitrate', this.bitrate)
	
				this.cache = data['Cache Used']
				this.setVariable('cache', this.cache)
	
				this.has_data = true
			}
		}
	}
	
	updateConfig(config) {
		var resetConnection = false
		
		if (this.config.host != config.host)
		{
			resetConnection = true
		}
	
		this.config = config

		this.actions()
		this.initFeedbacks()
		this.initVariables()
		
		if (resetConnection === true || this.socket === undefined) {
			this.init_tcp()
		}
	}

	dataPoller() {
	
		if (this.socket === undefined) {
			return
		}
	
		if (this.socket.connected) {
			this.socket.send('STREAM STATE:\n\n')
		} else {
			debug('Socket not connected')
		}
	}
}
exports = module.exports = instance
