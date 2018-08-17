import { Injectable } from '@angular/core';
import { Geoposition } from '@ionic-native/geolocation';

/*
  Generated class for the LocalizacionProvider provider.

  See https://angular.io/guide/dependency-injection for more info on providers
  and Angular DI.
*/
@Injectable()
export class LocalizacionProvider {

  private posicion: Geoposition;

  constructor() {
  }

  setPosicion(posicion) {
    this.posicion = posicion;
  }

  getPosicion(): Geoposition {
    return this.posicion;
  }

}
