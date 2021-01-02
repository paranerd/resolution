import { BrowserModule } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { NavbarComponent } from './navbar/navbar.component';
import { GalleryComponent } from './gallery/gallery.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { AlbumsComponent } from './albums/albums.component';
import { ItemComponent } from './item/item.component';

import { ApiService } from './services/api.service';
import { StateService } from './services/state.service';
import { SpinnerComponent } from './spinner/spinner.component';
import { CastSenderComponent } from './cast-sender/cast-sender.component';
import { CastReceiverComponent } from './cast-receiver/cast-receiver.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavbarComponent,
    GalleryComponent,
    SidebarComponent,
    AlbumsComponent,
    ItemComponent,
    SpinnerComponent,
    CastSenderComponent,
    CastReceiverComponent,
  ],
  schemas: [ CUSTOM_ELEMENTS_SCHEMA ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
  ],
  providers: [
    ApiService,
    StateService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
