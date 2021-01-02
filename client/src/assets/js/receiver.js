const maxRetries = 10;
const retries = 0;
const timeout = setTimeout(() => {
        if (retries >= maxRetries) {
                clearTimeout(timeout);
                return;
        }

        if (cast && cast.framework) {
                clearTimeout(timeout);
                main();
        }
        else {
                console.log("still waiting...");
        }

        retries++;
}, 100);

function main() {
    const context = cast.framework.CastReceiverContext.getInstance();
    const playerManager = context.getPlayerManager();
    const castOptions = new cast.framework.CastReceiverOptions();

    //let playerElement = document.getElementsByTagName("cast-media-player")[0];
    //playerElement.style.setProperty('--splash-image', 'url("http://cast.thegermancoder.com/images/splash.jpg")');

    // Debug Logger
    const castDebugLogger = cast.debug.CastDebugLogger.getInstance();
    const LOG_TAG = 'MyAPP.LOG';

    // Enable debug logger and show a 'DEBUG MODE' overlay at top left corner.
    //castDebugLogger.setEnabled(true);

    // Show debug overlay
    //castDebugLogger.showDebugLogs(true);

    // Set verbosity level for Core events.
    /*castDebugLogger.loggerLevelByEvents = {
    'cast.framework.events.category.CORE': cast.framework.LoggerLevel.INFO,
    'cast.framework.events.EventType.MEDIA_STATUS': cast.framework.LoggerLevel.DEBUG
    }*/

    // Set verbosity level for custom tags.
    castDebugLogger.loggerLevelByTags = {
        [LOG_TAG]: cast.framework.LoggerLevel.DEBUG,
    };

    playerManager.setMessageInterceptor(
        cast.framework.messages.MessageType.LOAD,
        request => {
        castDebugLogger.info(LOG_TAG, 'Intercepting LOAD request');
        castDebugLogger.info(LOG_TAG, JSON.stringify(request));

        castDebugLogger.info(LOG_TAG, JSON.stringify(request.customData));

        document.cookie = "username=John Doe";

        request.customData = {
            headers: {
                'Authorization': 'Bearer 12349876',
            },
        };

        request.media.customData = {
            headers: {
                'Authorization': 'Bearer ABCDEFG',
            },
        };

        playbackConfig.manifestRequestHandler = requestInfo => {
            requestInfo.withCredentials = true;
            requestInfo.headers = {};
            requestInfo.headers['Authorization'] = 'Bearer does-this-work'; //request.media.customData.token;
        };

        // Resolve entity to content id
        if (request.media.entity && !request.media.contentId) {
            return getMediaByEntity(request.media.entity).then(
                media => {
                    request.media.contentId = media.url;
                    return request;
                });
        }

        return request;
    });

    let playbackConfig = (Object.assign(new cast.framework.PlaybackConfig(), playerManager.getPlaybackConfig()));

    playbackConfig.manifestRequestHandler = requestInfo => {
        requestInfo.withCredentials = true;
        requestInfo.headers['Authorization'] = 'Bearer XXXXXXXX';
    };

    playbackConfig.segmentRequestHandler = requestInfo => {
        requestInfo.withCredentials = true;
        requestInfo.headers['Authorization'] = 'Bearer YYYYYYYY';
    };

    playbackConfig.licenseRequestHandler = requestInfo => {
        requestInfo.withCredentials = true;
        requestInfo.headers['Authorization'] = 'Bearer ZZZZZZZZ';
    };

    castOptions.playbackConfig = playbackConfig;

    /*if ('serviceWorker' in navigator) {
        castDebugLogger.info(LOG_TAG, 'we have a service worker :-D!');
        //window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw2.js').then(function(registration) {
            console.log('Service worker registered with scope: ', registration.scope);
            castDebugLogger.info(LOG_TAG, 'registered');
        }, function(err) {
            //console.log('ServiceWorker registration failed: ', err);
            castDebugLogger.info(LOG_TAG, 'registration failed');
        });
        //});
    }
    else {
        castDebugLogger.info(LOG_TAG, 'No service worker...');
    }*/
    
    context.start(castOptions);
}