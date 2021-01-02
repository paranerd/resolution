import { Component, Input, OnInit, SimpleChanges } from '@angular/core';

import { environment } from '@environments/environment';

declare var cast: any;
declare var chrome: any;

@Component({
    selector: 'app-cast-sender',
    templateUrl: './cast-sender.component.html',
    styleUrls: ['./cast-sender.component.scss']
  })
  export class CastSenderComponent implements OnInit {
    scriptsLoaded: boolean = false;
    _id: string;
    @Input()
    set id(val: string) {
        this._id = val;
        this.load(val);
    }

    constructor() {}

    ngOnInit(): void {}

    ngAfterViewInit(): void {
        // First set up the callback function...
        window['__onGCastApiAvailable'] = (isAvailable) => {
            if (isAvailable) {
                this.initializeCastApi();
                this.checkSession();
            }
        };

        // ... then load cast framework
        if (!this.scriptsLoaded) {
            this.loadScript('https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1');
            this.scriptsLoaded = true;
        }
    }

    initializeCastApi() {
        console.log("Initializing ID", environment.castApplicationId);
        cast.framework.CastContext.getInstance().setOptions({
            receiverApplicationId: environment.castApplicationId,
            autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
        });
    };
    
    checkSession() {
        const context = cast.framework.CastContext.getInstance();
        console.log("context", context);
        context.addEventListener(
            cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
            (event) => {
                console.log("event", event);
                switch (event.sessionState) {
                    case cast.framework.SessionState.SESSION_STARTED:
                    case cast.framework.SessionState.SESSION_RESUMED:
                        console.log("Cast connected");
                        this.load(this._id);
                    break;
                    case cast.framework.SessionState.SESSION_ENDED:
                        console.log('CastContext: CastSession disconnected');
                        // Update locally as necessary
                    break;
                }
            }
        )
    }

    /**
     * Loads media.
     * 
     * @param id
     */
    load(id: string) {
        // Check if cast library is loaded
        if (typeof cast === 'undefined') {
            return;
        }

        const castSession = cast.framework.CastContext.getInstance().getCurrentSession();
        const currentMediaURL = `${environment.fullApiUrl}/item/${id}`;
        const contentType = "image/jpeg";
        const mediaInfo = new chrome.cast.media.MediaInfo(currentMediaURL, contentType);
        const request = new chrome.cast.media.LoadRequest(mediaInfo);
        request.customData = {
            'mine': 'worx',
        };
    
        castSession.loadMedia(request).then(
            function() { console.log('Load succeed'); },
            function(errorCode) { console.log('Error loading media', errorCode);
        });
    }

    /**
     * Loads script by appending <script> to <body>.
     * 
     * @param url
     */
    loadScript(url: string) {
        const body = <HTMLDivElement> document.body;
        const script = document.createElement('script');
        script.innerHTML = '';
        script.src = url;
        //script.async = true;
        //script.defer = true;
        body.appendChild(script);
    }
}
