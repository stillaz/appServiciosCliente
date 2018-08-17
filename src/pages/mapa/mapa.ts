import { Component, ViewChild, ElementRef } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { Platform } from 'ionic-angular/platform/platform';
import { AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { EmpresaOptions } from '../../interfaces/empresa-options';
import { HomePage } from '../home/home';
import { LocalizacionProvider } from '../../providers/localizacion';

/**
 * Generated class for the MapaPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

declare var google: any;

@Component({
  selector: 'page-mapa',
  templateUrl: 'mapa.html',
})
export class MapaPage {

  @ViewChild('map') mapElement: ElementRef;
  map: any;
  geocoder: any;
  empresasCollection: AngularFirestoreCollection<EmpresaOptions>;
  empresas: EmpresaOptions[];
  watch: any;
  options = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0
  };
  myLocation: any;
  myMarker: any;
  directionsService = new google.maps.DirectionsService;
  directionsDisplay = new google.maps.DirectionsRenderer;

  constructor(
    public navCtrl: NavController,
    public platform: Platform,
    public viewCtrl: ViewController,
    public navParams: NavParams,
    private afs: AngularFirestore,
    public localizacionServicio: LocalizacionProvider
  ) {
    this.empresasCollection = this.afs.collection<EmpresaOptions>('negocios');
    platform.ready().then(() => {
      this.initMap();
    });
  }

  initMap() {
    this.geocoder = new google.maps.Geocoder;

    let miposicion = this.localizacionServicio.getPosicion();

    if (!this.map) {
      this.map = new google.maps.Map(this.mapElement.nativeElement, {
        center: { lat: miposicion.coords.latitude, lng: miposicion.coords.longitude },
        zoom: 15
      });

      this.myLocation = new google.maps.LatLng(miposicion.coords.latitude, miposicion.coords.longitude);
      this.createMarkerMyLocation(this.myLocation);
      this.directionsDisplay.setMap(this.map);

      this.empresasCollection.valueChanges().subscribe(empresas => {
        empresas.filter(empresa => empresa.id !== 'DIS').forEach(empresa => {
          this.createMarker(empresa);
        });
      });
    } else {
      this.map.center = { lat: miposicion.coords.latitude, lng: miposicion.coords.longitude };
    }
  }

  createMarkerMyLocation(location) {
    this.geocoder.geocode({ 'location': location }, () => {
      this.myMarker = new google.maps.Marker({
        map: this.map,
        position: location
      });
    });
  }

  createMarker(empresa: EmpresaOptions) {
    let latLng = empresa.direccion.latLng;
    let imagen;
    switch (empresa.negocio) {
      case 'Barbería':
        imagen = 'assets/imgs/barberia-mark.png';
        break;
    }
    let direccion = empresa.direccion.direccion.split(',');
    let texto = direccion[0] + ',' + direccion[1];
    let location = new google.maps.LatLng(Number(latLng.latitude), Number(latLng.longitude));
    this.geocoder.geocode({ 'location': location }, () => {
      var marker = new google.maps.Marker({
        map: this.map,
        position: location,
        icon: imagen
      });

      google.maps.event.addListener(marker, 'click', () => {
        let directionsDisplay = new google.maps.DirectionsRenderer;
        directionsDisplay.setMap(this.map);
        var request = {
          origin: this.myLocation,
          destination: location,
          travelMode: 'DRIVING'
        };
        this.directionsService.route(request, ((response, status) => {
          if (status == 'OK') {
            directionsDisplay.setDirections(response);
            let infowindow = new google.maps.InfoWindow;

            let totalDistance = 0;
            let totalDuration = 0;
            let legs = response.routes[0].legs;
            legs.forEach(leg => {
              totalDistance += leg.distance.value;
              totalDuration += leg.duration.value;
            });

            let distanciaTexto = Math.round((totalDistance / 1000) * 10) / 10 + " km. aprox. <br>";
            let duracionTexto = Math.round(totalDuration / 60) + " min. aprox. ";

            let informacion = "<div class='row'>" +
              "<div class='col-auto'><img src='" + empresa.imagen + "' width='50px' height='50px' /> </div>" +
              "<div class='col' style='padding-top: 0px'><strong>" + empresa.nombre + "</strong><hr style='margin-top: 0px' />" +
              texto + "<br/>" +
              "Tel:" + empresa.telefono + "<br/>" +
              "</div> </div>" +
              "<div>" + distanciaTexto + duracionTexto + "</div>" +
              "<div style='text-align: center'><input type='button' id='reservar' value='Reservar'></div>";
            infowindow.setContent(informacion);
            infowindow.open(this.map, marker);

            google.maps.event.addListener(infowindow, 'domready', () => {
              var reservar = document.getElementById('reservar');
              reservar.addEventListener('click', () => {
                this.reservar(empresa.id);
              });
            });
          }
        }));
      });
    });
  }

  cerrar() {
    this.viewCtrl.dismiss();
  }

  reservar(idempresa: string) {
    this.navCtrl.setRoot(HomePage);
    this.navCtrl.push('AgendaEmpresaPage', {
      idempresa: idempresa
    });
  }

}
