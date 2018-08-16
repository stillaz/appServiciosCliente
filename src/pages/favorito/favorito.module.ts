import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { FavoritoPage } from './favorito';

@NgModule({
  declarations: [
    FavoritoPage,
  ],
  imports: [
    IonicPageModule.forChild(FavoritoPage),
  ],
})
export class FavoritoPageModule {}
