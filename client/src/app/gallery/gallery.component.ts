import { Component, OnInit, HostListener, Renderer2, ElementRef } from '@angular/core';
import { Router } from '@angular/router';

import { StateService, State } from '@app/services/state.service';
import { Observable } from 'rxjs';

import { Item } from '@app/models/item.model';

import { ApiService } from '@app/services/api.service';

import { environment } from '@environments/environment';

@Component({
    selector: 'app-gallery',
    templateUrl: './gallery.component.html',
    styleUrls: ['./gallery.component.scss']
})

export class GalleryComponent implements OnInit {
    items:Array<Item> = [];
    itemsFinal:Array<Item> = [];
    selectedCount: number = 0;
    state: Observable<State>;
    stateSubscription: any;
    pageSize: number;
    loading: boolean;
    error: string;
    totalResults: number;
    lazyloadCommand: number;

    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
        this.lazyload();
    }

    @HostListener('scroll', ['$event'])
    onScroll(event: any) {
        this.lazyload();
    }

    lazyload() {
        const command = Date.now();
        this.lazyloadCommand = command;

        setTimeout(() => {
            if (this.lazyloadCommand == command) {
                const items = document.querySelectorAll('#gallery .item .image');

        items.forEach((item) => {
            if (this.isInView(item)) {
                item.classList.remove('lazy');
            }
        });
            }
        }, 100);
    }

    isInView(elem): boolean {
        const viewportOffset = elem.getBoundingClientRect();

        return viewportOffset.top < window.innerHeight && viewportOffset.bottom > 0;
    }

    constructor(private stateService: StateService, private api: ApiService, private renderer: Renderer2, private el: ElementRef, public router: Router) {
        this.state = this.stateService.state;

        this.stateSubscription = this.state.subscribe((val) => {
            this.selectedCount = this.countSelected();
        });
    }

    ngOnInit(): void {
        this.fetchItems();
    }

    ngOnDestroy() {
        if (this.stateSubscription) {
            this.stateSubscription.unsubscribe();
        }
    }

    countSelected() {
        return this.items.reduce((acc, curr) => acc + ((curr.selected) ? 1 : 0), 0);
    }

    select(item: Item) {
        item.selected = true;

        this.stateService.set('items', this.items);
    }

    unselect(item: Item) {
        item.selected = false;
        this.stateService.set('items', this.items);
    }

    toggleSelect(item: Item) {
        item.selected = !item.selected;
        this.stateService.set('items', this.items);
    }

    open(index: number, item: Item) {
        if (item.selected) {
            this.unselect(item);
        }
        else if (this.countSelected()) {
            this.select(item);
        }
        else {
            this.stateService.set('current', index);
            this.router.navigateByUrl(`/item/${item.id}`);
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
                const res = await this.api.getItems({page: this.stateService.selectSnapshot('page')});
                this.items = this.items.concat(res['items']);

                this.stateService.set('items', this.items);
            }

            this.calculateGallery();
        }
        catch (err) {
            console.error(err);
            this.error = (err.status != 0 && err.status < 500) ? err.error : "Something went wrong...";
            this.totalResults = 0;
        }
        finally {
            this.loading = false;
        }
    }

    getSpaceAddition() {
        const div = this.renderer.createElement('div');
        this.renderer.addClass(div, 'item');
        this.renderer.appendChild(this.el.nativeElement, div);

        const style = getComputedStyle(div);
        const margin = parseInt(style.marginLeft) + parseInt(style.marginRight);

        const outerWidth = div.offsetWidth + margin;
        const innerWidth = parseInt(style.width);

        this.renderer.removeChild(this.el.nativeElement, div);

        return outerWidth - innerWidth;
    }

    getGalleryWidth() {
        const gallery = document.getElementById('gallery');
        const style = getComputedStyle(gallery);

        return parseInt(style.width);
    }

    async calculateGallery() {
        const galleryWidth = this.getGalleryWidth();
        const additionalSpace = this.getSpaceAddition();

        const minHeight = 500;
        const maxHeight = 550;

        let imagesFinal = [];
        let imagesForRow = [];

        for (const img of this.items) {
            // Add image to row
            imagesForRow.push(img);

            const availableWidth = galleryWidth - imagesForRow.length * additionalSpace - 20;

            // Get common height
            const allHeights = this.items.map(x => x.height);
            const commonHeight = allHeights.reduce((acc, curr) => acc * curr);

            // Get big width
            imagesForRow.forEach(img => img.calcWidth = img.width * (commonHeight / img.height));

            // Get widths sum
            const allWidths = imagesForRow.map(x => x.calcWidth);
            const widthSum = allWidths.reduce((acc, curr) => acc + curr);

            imagesForRow.forEach(img => {
                // Get width share
                const widthShare = img.calcWidth / widthSum;

                // Get UI width
                img.uiWidth = Math.floor(availableWidth * widthShare);

                // Get UI height
                img.uiHeight = Math.floor(commonHeight * (img.uiWidth / img.calcWidth));

                if (img.uiHeight > maxHeight) {
                    img.uiWidth = img.uiWidth * (maxHeight / img.uiHeight);
                    img.uiHeight = maxHeight;
                }
            });

            if (imagesForRow[0].uiHeight < minHeight) {
                imagesFinal = imagesFinal.concat(imagesForRow);

                imagesForRow = [];
            }
        }

        this.itemsFinal = imagesFinal.concat(imagesForRow);
        this.itemsFinal.forEach((item) => {
            item.url = `${environment.apiUrl}/item/${item.id}?w=${item.uiWidth}&h=${item.uiHeight}`;
        });

        setTimeout(() => {
            this.lazyload();
        }, 100);
    }
}
