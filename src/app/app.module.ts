import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { Geolocation } from '@ionic-native/geolocation';

import { AngularFireModule } from 'angularfire2';
import { AngularFirestoreModule } from 'angularfire2/firestore';
import { AngularFireAuthModule } from 'angularfire2/auth';

import { firebaseConfig } from './config.firebase';

import { MyApp } from './app.component';
import { DatePickerModule } from 'ionic3-datepicker';
import { HomePage } from '../pages/home/home';
import { AngularFireStorageModule } from 'angularfire2/storage';
import { Camera } from '@ionic-native/camera';
import { UsuarioProvider } from '../providers/usuario';
import { LogueoPageModule } from '../pages/logueo/logueo.module';
import { CitaPageModule } from '../pages/cita/cita.module';
import { FavoritoPageModule } from '../pages/favorito/favorito.module';
import { MapaPage } from '../pages/mapa/mapa';
import { LocalizacionProvider } from '../providers/localizacion';
import { CuentaPageModule } from '../pages/cuenta/cuenta.module';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    MapaPage
  ],
  imports: [
    BrowserModule,
    IonicModule.forRoot(MyApp),
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFirestoreModule.enablePersistence(),
    AngularFireAuthModule,
    AngularFireStorageModule,
    CitaPageModule,
    CuentaPageModule,
    DatePickerModule,
    FavoritoPageModule,
    LogueoPageModule
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    MapaPage
  ],
  providers: [
    Camera,
    StatusBar,
    SplashScreen,
    Geolocation,
    UsuarioProvider,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    LocalizacionProvider
  ]
})
export class AppModule { }
