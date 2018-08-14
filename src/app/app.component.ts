import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { LogueoPage } from '../pages/logueo/logueo';
import { AngularFireAuth } from 'angularfire2/auth';
import { ClienteOptions } from '../interfaces/cliente-options';
import { AngularFirestore } from 'angularfire2/firestore';
import { HomePage } from '../pages/home/home';
import { UsuarioProvider } from '../providers/usuario';
@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage: any = LogueoPage;

  constructor(platform: Platform, statusBar: StatusBar, splashScreen: SplashScreen, private afa: AngularFireAuth, private afs: AngularFirestore, public usuarioService: UsuarioProvider) {
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
              this.usuarioService.setUsuario(data);
              this.rootPage = HomePage;
            } else {
              let usuario: ClienteOptions = {
                correoelectronico: user.email,
                id: user.displayName,
                nombre: user.displayName,
                imagen: user.photoURL,
                telefono: user.phoneNumber,
                uid: user.uid
              };
              clienteDoc.set(usuario);
            }
          });
        } else {
          this.rootPage = 'LogueoPage';
        }
      });
    });
  }
}

