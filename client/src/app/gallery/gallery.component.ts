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
    currentLoadJobTimestamp: number;

    @HostListener('window:resize', ['$event'])
    onResize(event: any) {
        this.lazyload();
    }

    @HostListener('scroll', ['$event'])
    onScroll(event: any) {
        this.lazyload();
    }

    lazyload() {
        const loadJobTimestamp = Date.now();
        this.currentLoadJobTimestamp = loadJobTimestamp;

        setTimeout(() => {
            if (this.currentLoadJobTimestamp == loadJobTimestamp) {
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

    /**
     * Calculate the number of pixels that are horizontally added to an .item div.
     * This is done dynamically, since .item margins are set using rem.
     * 
     * @returns number
     */
    getHorizontalMargin() {
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

    /**
     * Calculate the total width of the gallery.
     * 
     * @returns number
     */
    getGalleryWidth() {
        const gallery = document.getElementById('gallery');
        const style = getComputedStyle(gallery);

        return parseInt(style.width);
    }

    /**
     * Scale items to align in the gallery.
     * This takes 3 steps:
     * (1) Determine the width of all items scaled up to the largest height
     * (2) Based on that new total width determine the factor by which to
     *     scale down to reach the available gallery width
     * (3) Scale down further if the maximum row height is exceeded
     */
    calculateGallery() {
        const galleryWidth = this.getGalleryWidth();
        const horizontalMargin = this.getHorizontalMargin();

        const minHeight = 300;
        const maxHeight = 550;

        let itemsFinal = [];
        let itemsForRow = [];

        //for (const item of this.items.filter(item => ['94f75617-0c9f-4817-8328-2da08a0430bb'].includes(item.id))) {
        for (const item of this.items) {
            // Add image to row
            itemsForRow.push(item);

            // Calculate the remaining width available in the current row
            // Subtract 20px for the scrollbar
            const availableWidth = galleryWidth - itemsForRow.length * horizontalMargin - 20;

            // Get height of largest item
            const largestHeight = itemsForRow.map(item => item.height).reduce((p,v) => {return p > v ? p : v});

            // Scale up item width to match largest height
            itemsForRow.forEach(item => item.scaledUpWidth = item.width * (largestHeight / item.height));

            // Calculate total width of scaled up items
            const totalScaledUpWidth = itemsForRow.map(item => item.scaledUpWidth).reduce((acc, curr) => acc + curr);

            // Scale down that total width to the available width
            // But also make sure that the height does not exceed MaxHeight
            const scale = Math.min(availableWidth / totalScaledUpWidth, maxHeight / largestHeight, 1);

            // Calculate rowHeight so we don't have to do it for each item
            const rowHeight = largestHeight * scale;

            // Set the actual widths and heights to be displayed
            itemsForRow.forEach(item => {
                item.uiWidth = item.scaledUpWidth * scale;
                item.uiHeight = rowHeight;
            });

            // Once the number of items in the row is so large
            // that the height of the row is too small,
            // consider the row done.
            if (rowHeight < minHeight) {
                itemsFinal = itemsFinal.concat(itemsForRow);

                itemsForRow = [];
            }
        }

        this.itemsFinal = itemsFinal.concat(itemsForRow);
        this.itemsFinal.forEach((item) => {
            item.url = `${environment.apiUrl}/item/${item.id}?w=${item.uiWidth}&h=${item.uiHeight}`;
        });

        setTimeout(() => {
            this.lazyload();
        }, 100);
    }
}
