import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title: string = 'openphotos';
  fullscreen: boolean = false;

  constructor(private router: Router) {
    router.events.subscribe((val) => {
        if (val instanceof NavigationEnd) {
            this.fullscreen = val.url.startsWith('/item');
        }
    });
  }
}
