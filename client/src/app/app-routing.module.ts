import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { AlbumsComponent } from './albums/albums.component';
import { ItemComponent } from './item/item.component';
import { CastReceiverComponent } from './cast-receiver/cast-receiver.component';

const routes: Routes = [
    {
        path: '',
        component: HomeComponent,
    },
    {
        path: 'albums',
        component: AlbumsComponent,
    },
    {
        path: 'item/:id',
        component: ItemComponent,
    },
    {
        path: 'cast',
        component: CastReceiverComponent,
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { relativeLinkResolution: 'legacy' })],
    exports: [RouterModule]
})
export class AppRoutingModule { }
