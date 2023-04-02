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
				choices: this.quality,
			},
		],
		callback: ({ options }) => {
			var cmd =
				'STREAM SETTINGS:\nVideo Mode: ' +
				options.video_mode +
				'\n' +
				'Current Platform: ' +
				options.platform +
				'\n' +
				'Current Server: ' +
				options.server +
				'\n' +
				'Current Quality Level: ' +
				options.quality +
				'\n' +
				'Stream Key: ' +
				options.key +
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
