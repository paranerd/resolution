import { Component, OnInit } from '@angular/core';
import { State, StateService } from '@app/services/state.service';
import { Observable } from 'rxjs';
import { faDownload } from '@fortawesome/free-solid-svg-icons'

import { ApiService } from '@app/services/api.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})

export class HomeComponent implements OnInit {
    state: Observable<State>;
    stateSubscription: any;
    selectedCount: number = 0;
    faDownload = faDownload;
  
    constructor(private stateService: StateService, private api: ApiService) {
        this.state = this.stateService.state;
        this.stateSubscription = this.state.subscribe((val) => {
            console.log("state state", this.stateService.selectSnapshot("test"));
            this.selectedCount = this.countSelected();
        });

        this.stateService.select('test').subscribe((val) => {
            console.log("test changed", this.stateService.selectSnapshot('test'));
        });

        this.stateService.set('test', 2);
    }

    countSelected() {
        return this.stateService.items.reduce((acc, curr) => acc + ((curr.selected) ? 1 : 0), 0);
    }

    download() {
        const items = this.stateService.items.filter((item) => item.selected).map((item) => item.id);
        this.api.download(items);
    }

    unselectAll() {
        const items = this.stateService.items;
        items.forEach((item) => item.selected = false);
        this.stateService.set('items', items);
    }

    ngOnInit(): void {}
}
