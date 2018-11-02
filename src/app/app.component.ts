import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { LogueoPage } from '../pages/logueo/logueo';
import { AngularFireAuth } from 'angularfire2/auth';
import { ClienteOptions } from '../interfaces/cliente-options';
import { AngularFirestore } from 'angularfire2/firestore';
import { UsuarioProvider } from '../providers/usuario';
import { LocalizacionProvider } from '../providers/localizacion';
import { Geolocation } from '@ionic-native/geolocation';
import { FmcProvider } from '../providers/fmc';
import { TabsPage } from '../pages/tabs/tabs';
//import { tap } from 'rxjs/operators';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  rootPage: any = LogueoPage;

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
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      statusBar.styleDefault();
      this.afa.auth.onAuthStateChanged(user => {
        if (user) {
          this.rootPage = TabsPage;
          let clienteDoc = this.afs.doc<ClienteOptions>('clientes/' + user.email);
          clienteDoc.valueChanges().subscribe(data => {
            if (data) {
              this.usuarioServicio.setUsuario(data);
              splashScreen.hide();
              if (platform.is('cordova')) {
                fcm.getToken();
                /*fcm.listenToNotifications().pipe(
                  tap(msg => {
                    //const idmensaje = this.afs.createId();
                    //const mensajeDoc = this.afs.doc(this.usuarioServicio.getFilePathCliente() + '/mensajes/' + idmensaje);
                    //alert(JSON.stringify(msg));
                  })).subscribe();*/
              }
              const options = {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
              };
              this.geolocation.watchPosition(options).subscribe(localizacion => {
                this.localizacionServicio.setPosicion(localizacion);
              });
            } else {
              const usuario: ClienteOptions = {
                correoelectronico: user.email,
                id: user.email,
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
          splashScreen.hide();
          this.rootPage = LogueoPage;
        }
      });
    });
  }
}

