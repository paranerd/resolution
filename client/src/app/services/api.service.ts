import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { Item } from '@app/models/item.model';

import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
    constructor(private httpClient: HttpClient) {}

    public getItems(params: any): Promise<Object> {
        return new Promise((resolve, reject) => {
        this.httpClient.get(environment.apiUrl + '/item', {params: params})
        .subscribe((data: Array<Item>) => {
            data['items'] = data['items'].map((itemData: any) => new Item().deserialize(itemData));
            resolve(data);
        }, (error: any) => {
            reject(error);
        });
        });
    }

    public download(ids: Array<string>) {
        // Build URL
        const url = new URL(`${environment.apiUrl}/item/download`);
        ids.forEach((id) => url.searchParams.append("ids", id));
        
        // Create link
        const link = document.createElement('a');
        link.href = url.href;
        link.target = "_blank";

        // Mark as downloadable
        link.download = 'download';

        // Append to DOM
        link.setAttribute('type', 'hidden');
        document.body.appendChild(link);

        // Initialize download
        link.click();

        // Clean up
        link.remove();
  }
}