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

    constructor() {}

    ngOnInit(): void {}

    ngAfterViewInit(): void {
        // Load receiver JS
        // Note the imports in index.html which are required in <head>
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
        body.appendChild(script);
    }
}
