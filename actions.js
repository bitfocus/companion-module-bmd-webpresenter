module.exports = {
	
	getActions() {
		var actions = {};
		
		actions['stream'] = {
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
						{ id: 'Toggle', label: 'Toggle' }
					]
				}
			]
		};
		
		actions['stream_settings'] = {
			label: 'Stream Settings',
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
					choices: this.quality
				}
			]
		};
		
		actions['device'] = {
			label: 'Device Control',
			options: [
				{
					type: 'dropdown',
					label: 'State',
					id: 'device_control',
					default: 'Reboot',
					choices: [
						{ id: 'Reboot', label: 'Reboot' },
						{ id: 'Factory Reset', label: 'Factory Reset' }
					]
				}
			]
		};
		
		return actions;
	}
}
