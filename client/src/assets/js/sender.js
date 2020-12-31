window['__onGCastApiAvailable'] = function(isAvailable) {
    if (isAvailable) {
        console.log("ServiceWorker available");
        initializeCastApi();
        checkSession();
    }
};

initializeCastApi = function() {
    cast.framework.CastContext.getInstance().setOptions({
    receiverApplicationId: '<your_cast_receiver_id',
    autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
    });
};

function load(image) {
    const castSession = cast.framework.CastContext.getInstance().getCurrentSession();
    const currentMediaURL = "https://cast.thegermancoder.com/image/" + image;
    const contentType = "image/jpeg";
    const mediaInfo = new chrome.cast.media.MediaInfo(currentMediaURL, contentType);
    const request = new chrome.cast.media.LoadRequest(mediaInfo);
    request.customData = {
        'mine': 'worx',
    };

    castSession.loadMedia(request).then(
        function() { console.log('Load succeed'); },
        function(errorCode) { console.log('Error code: ' + errorCode);
    });
}

function checkSession() {
    const context = cast.framework.CastContext.getInstance();
    context.addEventListener(
        cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
        function(event) {
            console.log(event);
            switch (event.sessionState) {
                case cast.framework.SessionState.SESSION_STARTED:
                case cast.framework.SessionState.SESSION_RESUMED:
                    console.log("Session started/resumed");
                    slideshow();
                break;
                case cast.framework.SessionState.SESSION_ENDED:
                    console.log('CastContext: CastSession disconnected');
                    // Update locally as necessary
                break;
            }
        }
    )
}

function slideshow() {
    let index = 0;

    setInterval(() => {
        load(index);

        index++;

        if (index > 8) {
            index = 0;
        }
    }, 5000);
}