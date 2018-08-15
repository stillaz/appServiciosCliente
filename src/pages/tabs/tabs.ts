import { Component } from '@angular/core';
import { IonicPage } from 'ionic-angular';
import { HomePage } from '../home/home';
import { CitaPage } from '../cita/cita';

/**
 * Generated class for the TabsPage tabs.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-tabs',
  templateUrl: 'tabs.html'
})
export class TabsPage {
  tabs = [
    { root: HomePage, icon: 'bookmark', badge: 0 },
    { root: CitaPage, icon: 'calendar', badge: 0 }
  ];

  constructor() {
  }

}