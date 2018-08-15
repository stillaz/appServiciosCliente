import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';
import * as DataProvider from '../../providers/constants';
import { ReservaClienteOptions } from '../../interfaces/reserva-cliente-options';
import { AngularFirestoreCollection, AngularFirestore } from 'angularfire2/firestore';
import { UsuarioProvider } from '../../providers/usuario';
import { Observable } from 'rxjs';
import moment from 'moment';
import 'rxjs/add/observable/interval';

/**
 * Generated class for the CitaPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-cita',
  templateUrl: 'cita.html',
})
export class CitaPage {

  constantes = DataProvider;
  filePathReservas: string;
  reservasCollection: AngularFirestoreCollection<ReservaClienteOptions>;
  finalizadosCollection: AngularFirestoreCollection<ReservaClienteOptions>;
  canceladosCollection: AngularFirestoreCollection<ReservaClienteOptions>;
  pendientes: any[];
  modo: string = 'pendientes';
  finalizados: ReservaClienteOptions[];
  cancelados: ReservaClienteOptions[];

  constructor(public navCtrl: NavController, public navParams: NavParams, public usuarioServicio: UsuarioProvider, private afs: AngularFirestore) {
    this.filePathReservas = this.usuarioServicio.getFilePathCliente() + '/servicios';
    this.reservasCollection = this.afs.collection<ReservaClienteOptions>(this.filePathReservas, ref => ref.where('estado', '==', this.constantes.ESTADOS_RESERVA.RESERVADO));
    this.finalizadosCollection = this.afs.collection<ReservaClienteOptions>(this.filePathReservas, ref => ref.where('estado', '==', this.constantes.ESTADOS_RESERVA.FINALIZADO));
    this.canceladosCollection = this.afs.collection<ReservaClienteOptions>(this.filePathReservas, ref => ref.where('estado', '==', this.constantes.ESTADOS_RESERVA.CANCELADO));
    this.updateReservas();
  }

  ionViewDidLoad() {
    Observable.interval(60000).subscribe(() => {
      this.updateDentroDe();
    });
  }

  updateReservas() {
    this.reservasCollection.valueChanges().subscribe(data => {
      this.pendientes = [];
      let grupos = [];
      data.forEach(reserva => {
        if (!grupos[reserva.empresa.id]) {
          grupos[reserva.empresa.id] = { empresa: reserva.empresa, reservas: [] };
        }

        grupos[reserva.empresa.id].reservas.push({ reserva: reserva, dentroDe: null });
      });

      for (let grupo in grupos) {
        this.pendientes.push(grupos[grupo]);
      }
      this.updateDentroDe();
    });
  }

  updateDentroDe() {
    this.pendientes.forEach(grupo => {
      grupo.reservas.forEach(reserva => {
        let ahora = new Date();
        let fecha = moment(reserva.reserva.fechaInicio.toDate());
        let minutos = fecha.diff(ahora, 'minutes');
        if (minutos >= 60) {
          let horas = fecha.diff(ahora, 'hours');
          if (horas >= 24) {
            let dias = fecha.diff(ahora, 'days');
            reserva.dentroDe = dias === 1 ? 'mañana' : 'en ' + dias + ' días';
          } else {
            reserva.dentroDe = horas === 1 ? 'en una hora' : 'en ' + horas + ' horas';
          }
        } else {
          reserva.dentroDe = minutos === 1 ? 'en un minuto' : 'en ' + minutos + ' minutos';
        }
      });
    });
  }

  updateFinalizados() {
    this.finalizadosCollection.valueChanges().subscribe(data => {
      this.finalizados = data;
    });
  }

  updateCancelados() {
    this.canceladosCollection.valueChanges().subscribe(data => {
      this.cancelados = data;
    });
  }

  updateSeleccionado() {
    switch (this.modo) {
      case 'pendientes':
        this.updateReservas();
        break;
      case 'finalizados':
        this.updateFinalizados();
        break;
      case 'cancelados':
        this.updateCancelados();
        break;
    }
  }

}
