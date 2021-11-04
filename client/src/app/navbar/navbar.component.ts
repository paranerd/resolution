import { Component, OnInit, HostListener } from '@angular/core';
import { faSearch, faTimes, faUserCircle, faUpload } from '@fortawesome/free-solid-svg-icons'

@Component({
    selector: 'app-navbar',
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.scss']
})

export class NavbarComponent implements OnInit {
    faSearch = faSearch;
    faTimes = faTimes;
    faUserCircle = faUserCircle;
    faUpload = faUpload;

    @HostListener('window:scroll', ['$event'])
    onScroll(event: any) {
        document.querySelector('nav').classList.toggle('navbar-shadow', window.scrollY > 0);
    }

    constructor() {}

    ngOnInit(): void {}

}
