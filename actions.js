export function updateActions() {
	let actions = {}

	actions['stream'] = {
		name: 'Streaming Control',
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
		callback: ({ options }) => {
			var cmd = 'STREAM STATE:\nAction: '
			if (options.stream_control === 'Toggle') {
				if (this.streaming === 'Streaming' || this.streaming === 'Connecting') {
					cmd = cmd + 'Stop\n\n'
				} else {
					cmd = cmd + 'Start\n\n'
				}
			} else {
				cmd = cmd + options.stream_control + '\n\n'
			}
			this.sendCommand(cmd)
		},
	}

	actions['stream_settings'] = {
		name: 'All Stream Settings',
		options: [
			{
				type: 'dropdown',
				label: 'Video Mode',
				id: 'video_mode',
				default: 'Auto',
				choices: this.formats,
			},
			{
				type: 'dropdown',
				label: 'Platform',
				id: 'platform',
				choices: this.platforms,
			},
			{
				type: 'textinput',
				label: 'Server',
				id: 'server',
				default: '',
				useVariables: true,
				tooltip:
					'Depends on platform.\nRefer to Blackmagic Web Presenter desktop application for possible options. You may use Companion variables.',
			},
			{
				type: 'textinput',
				label: 'Stream Key',
				id: 'key',
				default: '',
				useVariables: true,
				tooltip: 'Provided by the streaming platform. You may use Companion variables.',
			},
			{
				type: 'dropdown',
				label: 'Quality',
				id: 'quality',
				default: 'Streaming Medium',
				choices: this.quality,
			},
			{
				type: 'textinput',
				label: 'Custom URL',
				id: 'customURL',
				default: '',
				useVariables: true,
				tooltip: 'Only required for custom platforms. You may use Companion variables.',
			},
			{
				type: 'textinput',
				label: 'Passphrase',
				id: 'passphrase',
				default: '',
				useVariables: true,
				tooltip: 'Only required for SRT platforms. You may use Companion variables.',
			},
		],
		callback: async (action, context) => {
			if (action.options.server == '') {
				this.log('warn', 'Server parameter is missing from Stream Settings')
			}
			if (action.options.key == '') {
				this.log('warn', 'Stream Key parameter is missing from Stream Settings')
			}

			const server = await context.parseVariablesInString(action.options.server)
			const key = await context.parseVariablesInString(action.options.key)
			const url = await context.parseVariablesInString(action.options.customURL)
			const pass = await context.parseVariablesInString(action.options.passphrase)

			var cmd =
				'STREAM SETTINGS:\nVideo Mode: ' +
				action.options.video_mode +
				'\n' +
				'Current Platform: ' +
				action.options.platform +
				'\n' +
				'Current Server: ' +
				server +
				'\n' +
				'Current Quality Level: ' +
				action.options.quality +
				'\n' +
				'Stream Key: ' +
				key +
				'\n'

			if (url != '') {
				cmd = cmd + 'Current URL: ' + url + '\n'
			}

			if (pass != '') {
				cmd = cmd + 'Password: ' + pass + '\n'
			}

			cmd = cmd + '\n'

			this.sendCommand(cmd)
		},
	}

	actions['youtube_settings'] = {
		name: 'YouTube Simple Settings',
		options: [
			{
				type: 'static-text',
				label: 'All settings are set to YouTube defaults except for the Stream Key',
				id: 'info',
			},
			{
				type: 'textinput',
				label: 'Stream Key',
				id: 'key',
				default: '',
				useVariables: true,
				tooltip: 'Enter the Stream Key from your YouTube creator studio. You may use Companion variables.',
			},
		],
		callback: async (action, context) => {
			// find a suitable YouTube platform from available options
			var platform = 'YouTube'
			if (this.platforms.includes('YouTube RTMP') == true) {
				// changed in WebPresenter 3.3
				platform = 'YouTube RTMP'
			}

			const key = await context.parseVariablesInString(action.options.key)

			var cmd =
				'STREAM SETTINGS:\nVideo Mode: ' +
				'Auto' +
				'\n' +
				'Current Platform: ' +
				platform +
				'\n' +
				'Current Server: ' +
				'Primary' +
				'\n' +
				'Current Quality Level: ' +
				'Streaming Medium' +
				'\n' +
				'Stream Key: ' +
				key +
				'\n\n'

			this.sendCommand(cmd)
		},
	}

	actions['device'] = {
		name: 'Device Control',
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
		callback: ({ options }) => {
			var cmd = 'SHUTDOWN:\nAction: ' + options.device_control + '\n\n'
			this.sendCommand(cmd)
		},
	}

	actions['videoMode'] = {
		name: 'Change Video Mode',
		options: [
			{
				type: 'dropdown',
				label: 'Video Mode',
				id: 'video_mode',
				default: 'Auto',
				choices: this.formats,
			},
		],
		callback: ({ options }) => {
			var cmd = 'STREAM SETTINGS:\nVideo Mode: ' + options.video_mode + '\n\n'
			this.sendCommand(cmd)
		},
	}

	actions['videoQuality'] = {
		name: 'Change Video Quality',
		options: [
			{
				type: 'dropdown',
				label: 'Quality',
				id: 'quality',
				default: 'Streaming Medium',
				choices: this.quality,
			},
		],
		callback: ({ options }) => {
			var cmd = 'STREAM SETTINGS:\nCurrent Quality Level: ' + options.quality + '\n\n'
			this.sendCommand(cmd)
		},
	}

	actions['streamKey'] = {
		name: 'Change Stream Key',
		options: [
			{
				type: 'textinput',
				label: 'Stream Key',
				id: 'key',
				default: '',
				useVariables: true,
				tooltip: 'Enter the Stream Key. You may use Companion variables.',
			},
		],
		callback: async (action, context) => {
			const key = await context.parseVariablesInString(action.options.key)

			var cmd = 'STREAM SETTINGS:\nStream Key: ' + key + '\n\n'

			this.sendCommand(cmd)
		},
	}

	this.setActionDefinitions(actions)
}
