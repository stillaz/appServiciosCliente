import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController } from 'ionic-angular';
import { HomePage } from '../home/home';
import { CuentaPage } from '../cuenta/cuenta';
import { FavoritoPage } from '../favorito/favorito';
import { CitaPage } from '../cita/cita';
import { Tabs } from 'ionic-angular/umd/navigation/nav-interfaces';

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

  @ViewChild('mainTabs') tabRef: Tabs;

  tabs: any[];

  constructor(public navCtrl: NavController) {
    this.tabs = [
      { root: HomePage, title: 'Inicio', icon: 'home', badge: 0 },
      { root: FavoritoPage, title: 'Favoritos', icon: 'heart', badge: 0 },
      { root: CitaPage, title: 'Citas', icon: 'bookmark', badge: 0 },
      { root: CuentaPage, title: 'Cuenta', icon: 'contact', badge: 0 }
    ];
  }

}
