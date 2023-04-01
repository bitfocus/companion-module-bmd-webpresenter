module.exports = {
	initFeedbacks() {
		var feedbacks = {}

		feedbacks['streaming_state'] = {
			label: 'Device is streaming',
			description: 'Change background colour based on streaming state',
			options: [
				{
					type: 'colorpicker',
					label: 'Foreground colour',
					id: 'fg',
					default: this.rgb(255, 255, 255),
				},
				{
					type: 'colorpicker',
					label: 'Background colour',
					id: 'bg',
					default: this.rgb(0, 255, 0),
				},
				{
					type: 'dropdown',
					label: 'Value',
					id: 'stream',
					default: 'Idle',
					choices: [
						{ id: 'Idle', label: 'Idle' },
						{ id: 'Connecting', label: 'Connecting' },
						{ id: 'Streaming', label: 'Streaming' },
						{ id: 'Interrupted', label: 'Interrupted' }
					]
				}
			],
			callback: (feedback, bank) => {
			
				if (feedback.type == 'streaming_state') {
					console.log('update feedback status: ' + this.streaming)
					if (this.streaming === feedback.options.stream) {
						return {
							color: feedback.options.fg,
							bgcolor: feedback.options.bg,
						}
					}
				}
			}
		}
		this.setFeedbackDefinitions(feedbacks)
	}
		

}