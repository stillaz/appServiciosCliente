import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CitaPage } from './cita';

@NgModule({
  declarations: [
    CitaPage,
  ],
  imports: [
    IonicPageModule.forChild(CitaPage),
  ],
})
export class CitaPageModule {}
