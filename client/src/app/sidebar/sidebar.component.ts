import { Component, OnInit } from '@angular/core';
import { faImage, faImages } from '@fortawesome/free-regular-svg-icons';

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
    styleUrls: ['./sidebar.component.scss']
})

export class SidebarComponent implements OnInit {
    faImage = faImage;
    faImages = faImages;

    constructor() { }

    ngOnInit(): void {}
}
