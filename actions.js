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
		name: 'Stream Settings',
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
				default: 'YouTube',
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

	this.setActionDefinitions(actions)
}
