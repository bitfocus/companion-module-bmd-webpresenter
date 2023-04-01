module.exports = {
	
	initPresets () {
		var presets = []
	
		presets.push({
			category: 'Streaming',
			label: 'Start Stream',
			bank: {
				style: 'text',
				text: 'Start Stream',
				size: 'auto',
				color: '16777215',
				bgcolor: this.rgb(0, 0, 0),
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
						bg: this.rgb(0, 255, 0),
						fg: this.rgb(255, 255, 255),
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
				bgcolor: this.rgb(0, 0, 0),
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
						bg: this.rgb(0, 255, 0),
						fg: this.rgb(255, 255, 255),
					},
				},
			],
		})
	
		this.setPresetDefinitions(presets)
	}
}
