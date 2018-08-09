import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { AgendaEmpresaPage } from './agenda-empresa';
import { DatePickerModule } from 'ionic3-datepicker';

@NgModule({
  declarations: [
    AgendaEmpresaPage,
  ],
  imports: [
    IonicPageModule.forChild(AgendaEmpresaPage),
    DatePickerModule
  ],
})
export class AgendaEmpresaPageModule { }
