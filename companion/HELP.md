# Blackmagic Design Web Presenter HD and 4K

Module to control and monitor the [Blackmagic Design Web Presenter HD and 4K](https://www.blackmagicdesign.com/products/blackmagicwebpresenter). This module does not support the discontinued USB only **Web Presenter** product.

Once connection to the device has been established the stream 'Video Mode', 'Platform' and 'Quality' action parameters will be populated with the options that the device supports. If no device connection is possible then these parameters will be unavailable. The 'Server' and 'Stream Key' will not be pre-populated. Use the Blackmagic WebPresenter desktop app to discover the valid 'Server' options for your platform. Consult your streaming platform service provider for the 'Stream Key'.

## Version 1.0.0
This first release of the module allows you to start/stop the stream and to receive the stream state as a variable and feedback. Please log issues and feature requests on [github](https://github.com/bitfocus/companion-module-bmd-webpresenter).

## Version 1.0.1
Added Reboot and Factory Reset actions

Added Stream Settings

## Version 1.0.2
Internal changes

## Version 1.0.3
Add support for both 4K and HD

Add more variables for monitoring

Retrieve the 'Video Mode', 'Quality' and 'Platform' options from device

## Version 1.0.4
Add support for custom streaming profiles

## Version 1.0.5
Add help text

## Version 1.0.6
Add streaming control 'Toggle' option

Added variables for stream duration, bitrate and cache level

## Version 2.0.0
Update for Companion 3

Add additional variables for stream durations (hours, minutes, seconds)

Add additional feedback states

