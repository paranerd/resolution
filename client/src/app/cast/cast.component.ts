import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-cast',
    templateUrl: './cast.component.html',
    styleUrls: ['./cast.component.scss']
})

export class CastComponent implements OnInit {
    scriptLoaded: boolean = false;

    constructor() {
        if (!this.scriptLoaded) {
            this.loadScript('assets/js/sender.js');
            this.scriptLoaded = true;
        }
    }

    ngOnInit(): void {}

    public loadScript(url: string) {
        const body = <HTMLDivElement> document.body;
        const script = document.createElement('script');
        script.innerHTML = '';
        script.src = url;
        script.async = true;
        script.defer = true;
        body.appendChild(script);
    }
}
