import { Component, OnInit, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Item } from '@app/models/item.model';

import { faDownload } from '@fortawesome/free-solid-svg-icons'

import { ApiService } from '@app/services/api.service';
import { StateService } from '@app/services/state.service';

import { environment } from '@environments/environment';

@Component({
    selector: 'app-item',
    templateUrl: './item.component.html',
    styleUrls: ['./item.component.scss']
})

export class ItemComponent implements OnInit {
    id: string;
    subscription: any;
    item: Item;
    currentLoadJobTimestamp: number;
    pos: number;
    error: string;
    loading: boolean = false;
    items: Array<Item> = [];
    menuOpen: boolean = false;
    faDownload = faDownload;

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        const loadJobTimestamp = Date.now();
        this.currentLoadJobTimestamp = loadJobTimestamp;

        setTimeout(() => {
            if (this.currentLoadJobTimestamp == loadJobTimestamp) {
                this.loadItem();
            }
        }, 100);
    }

    @HostListener('document:keydown', ['$event'])
    onKeydownHandler(event: KeyboardEvent) {
        if (event.key === 'ArrowLeft') {
            this.previous();
        }
        else if (event.key === 'ArrowRight') {
            this.next();
        }
        else if (event.key === 'Escape') {
            this.close();
        }
    }

    constructor(private api: ApiService, private stateService: StateService, private route: ActivatedRoute, private router: Router) {
        this.stateService.select('current').subscribe((val) => {
            if (val) {
                setTimeout(() => {
                    this.loadItem();
                }, 0);
            }
        });
    }

    ngOnInit(): void {}

    ngAfterContentInit(): void {
        this.subscription = this.route.paramMap.subscribe(async params => {
            await this.fetchItems();
            this.id = params.get('id');
            this.pos = this.stateService.selectSnapshot('items').findIndex((item) => item.id == this.id);
            
            setTimeout(async () => {
                this.loadItem();
            }, 0);
        });
    }

    download() {
        this.api.download([this.id]);
    }

    async loadItem(): Promise<void> {
        try {
            this.loading = true;
            this.id = this.stateService.selectSnapshot('items')[this.pos].id;
            const res = await this.api.getItems({id: this.id});
            this.item = res['items'][0];

            const dimensions = this.calculateImageDimensions();
            this.item.uiHeight = dimensions['height'];
            this.item.uiWidth = dimensions['width'];
            this.item.url = `${environment.apiUrl}/item/${this.item.id}?w=${this.item.uiWidth}&h=${this.item.uiHeight}`
        }
        catch (err) {
            console.error(err);
        }
        finally {
            this.loading = false;
        }
    }

    getScreenDimensions(): Object {
        const elem = document.getElementById('image');
        const style = getComputedStyle(elem);

        return {
            width: parseInt(style.width),
            height: parseInt(style.height),
        }
    }

    calculateImageDimensions(): Object {
        const sd = this.getScreenDimensions();

        const widthRatio = sd['width'] / this.item.width;
        const heightRatio = sd['height'] / this.item.height;

        let calculatedWidth = this.item.width;
        let calculatedHeight = this.item.height;

        if (this.item.width > sd['width'] && widthRatio < heightRatio) {
            calculatedWidth = sd['width'];
            calculatedHeight = this.item.height * widthRatio;
        }
        else if (this.item.height > sd['height'] && heightRatio < widthRatio) {
            calculatedHeight = sd['height'];
            calculatedWidth = this.item.width * heightRatio;
        }

        return {
            width: calculatedWidth,
            height: calculatedHeight,
        }
    }

    async fetchItems(force?: boolean): Promise<void> {
        // Reset
        this.error = "";

        // Show progress indicator
        this.loading = true;

        try {
            if (!force && this.stateService.items.length) {
                this.items = this.stateService.items;
            }
            else {
                const res = await this.api.getItems({});
                this.items = this.items.concat(res['items']);

                this.stateService.set('items', this.items);
            }
        }
        catch (err) {
            console.error(err);
            this.error = (err.status != 0 && err.status < 500) ? err.error : "Something went wrong...";
        }
        finally {
            this.loading = false;
        }
    }

    previous() {
        if (this.pos > 0) {
            this.pos--;
            this.id = this.stateService.selectSnapshot('items')[this.pos].id;
            this.router.navigate([`/item/${this.id}`], {replaceUrl: true});
        }
    }

    next() {
        if (this.pos < this.stateService.selectSnapshot('items').length - 1) {
            this.pos++;
            this.id = this.stateService.selectSnapshot('items')[this.pos].id;
            this.router.navigate([`/item/${this.id}`], {replaceUrl: true});
        }
    }

    close() {
        this.router.navigateByUrl('/');
    }
}
