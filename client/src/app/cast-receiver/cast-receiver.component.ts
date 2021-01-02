import { Component, OnInit } from '@angular/core';

declare var cast: any;
declare var chrome: any;

@Component({
  selector: 'app-cast-receiver',
  templateUrl: './cast-receiver.component.html',
  styleUrls: ['./cast-receiver.component.scss']
})

export class CastReceiverComponent implements OnInit {
    castSdkLoaded: boolean = false;
    customJsLoaded: boolean = false;

    constructor() {
        // Load cast resources
        /*if (!this.castSdkLoaded) {
            // Load framework
            this.loadScript('//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js');

            // Load logger
            this.loadScript('//www.gstatic.com/cast/sdk/libs/devtools/debug_layer/caf_receiver_logger.js');
            this.castSdkLoaded = true;
        }*/
  }

    ngOnInit(): void {}

    ngAfterViewInit(): void {
        if (!this.customJsLoaded) {
            this.loadScript('/assets/js/receiver.js');
        }
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
