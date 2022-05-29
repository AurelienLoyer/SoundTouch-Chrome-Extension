module.exports = {
	deploy: {
	    packageName: 'SoundTouch-Chrome-Extension.zip',
	    packItems: ['!SoundTouch-Chrome-Extension/*','!npm-shrinkwrap.json','!package-lock.json','!node_modules','!node_modules/*','!gulp','!gulp/*','!dist','!dist/*','!gulpfile.js','*','*/*'],
	    appID: '%APP_ID%',
	    OAuth: {
	        "client_secret":"%client_secret%",
	        "token_uri":"https://accounts.google.com/o/oauth2/token",
	        "client_id":"%client_id%",
	        "refresh_token":"%refresh_token%"
	    }
    }
};