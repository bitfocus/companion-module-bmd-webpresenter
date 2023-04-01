module.exports = {
	
	initVariables () {
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
				label: 'Streaming Duration (Hours)',
				name: 'stream_duration_HH',
			},
			{
				label: 'Streaming Duration (Minutes)',
				name: 'stream_duration_MM',
			},
			{
				label: 'Streaming Duration (Seconds)',
				name: 'stream_duration_SS',
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
		this.setVariable('stream_state', this.streaming)
		this.setVariableDefinitions(variables)
	}
}