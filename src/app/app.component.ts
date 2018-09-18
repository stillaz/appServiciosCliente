import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { LogueoPage } from '../pages/logueo/logueo';
import { AngularFireAuth } from 'angularfire2/auth';
import { ClienteOptions } from '../interfaces/cliente-options';
import { AngularFirestore } from 'angularfire2/firestore';
import { UsuarioProvider } from '../providers/usuario';
import { HomePage } from '../pages/home/home';
import { CitaPage } from '../pages/cita/cita';
import { FavoritoPage } from '../pages/favorito/favorito';
import { LocalizacionProvider } from '../providers/localizacion';
import { Geolocation } from '@ionic-native/geolocation';
import { CuentaPage } from '../pages/cuenta/cuenta';
import { FmcProvider } from '../providers/fmc';
//import { FmcProvider } from '../providers/fmc';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage: any = LogueoPage;
  pages: any[];
  iniciar = true;

  constructor(
    platform: Platform,
    statusBar: StatusBar,
    splashScreen: SplashScreen,
    private afa: AngularFireAuth,
    private afs: AngularFirestore,
    public usuarioServicio: UsuarioProvider,
    public localizacionServicio: LocalizacionProvider,
    private geolocation: Geolocation,
    fcm: FmcProvider) {
    this.pages = [
      { title: 'Inicio', component: HomePage, icon: 'home', selected: true },
      { title: 'Mi cuenta', component: CuentaPage, icon: 'contact', selected: false },
      { title: 'Mis favoritos', component: FavoritoPage, icon: 'heart', selected: false },
      { title: 'Mis citas', component: CitaPage, icon: 'bookmark', selected: false },
      { title: 'Mensajes', component: HomePage, icon: 'mail', selected: false },
      { title: 'Ajustes', component: HomePage, icon: 'switch', selected: false },
      { title: 'Sugerencias', component: HomePage, icon: 'star', selected: false },
      { title: 'Atención al cliente', component: HomePage, icon: 'headset', selected: false }
    ];
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      splashScreen.hide();
      this.afa.auth.onAuthStateChanged(user => {
        if (user) {
          let clienteDoc = this.afs.doc<ClienteOptions>('clientes/' + user.email);
          clienteDoc.valueChanges().subscribe(data => {
            if (data) {
              fcm.getToken();
              let options = {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
              };
              this.geolocation.watchPosition(options).subscribe(localizacion => {
                if (this.iniciar) {
                  this.localizacionServicio.setPosicion(localizacion);
                  this.usuarioServicio.setUsuario(data);
                  this.rootPage = HomePage;
                  this.iniciar = false;
                }
              }, () => {
                if (this.iniciar) {
                  this.usuarioServicio.setUsuario(data);
                  this.rootPage = HomePage;
                  this.iniciar = false;
                }
              });
            } else {
              let usuario: ClienteOptions = {
                correoelectronico: user.email,
                id: user.displayName,
                nombre: user.displayName,
                imagen: user.photoURL,
                telefono: user.phoneNumber,
                uid: user.uid,
                token: null
              };
              clienteDoc.set(usuario);
            }
          });
        } else {
          this.rootPage = LogueoPage;
        }
      });
    });
  }

  openPage(page) {
    this.pages.find(item => item.selected).selected = false;
    page.selected = true;
    this.rootPage = page.component;
  }
}

