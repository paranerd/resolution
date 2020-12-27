import { Component, OnInit, HostListener } from '@angular/core';

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss']
})

export class NavbarComponent implements OnInit {
    @HostListener('window:scroll', ['$event'])
    onScroll(event: any) {
        document.querySelector('nav').classList.toggle('navbar-shadow', window.scrollY > 0);
    }

    constructor() {}

    ngOnInit(): void {}

}
