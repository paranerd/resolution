export class Item {
    id: string;
    title: string;
    created: number;
    modified: number;
    path: string;
    height: number;
    width: number;
    calcWidth: number;
    calcHeight: number;
    uiWidth: number;
    uiHeight: number;
    url: string;
    selected: boolean;

    deserialize(input: any): Item {
        Object.assign(this, input);

        this.created = this.created || Date.now();
        this.modified = this.modified || Date.now();
        this.selected = false;

        return this;
    }
}