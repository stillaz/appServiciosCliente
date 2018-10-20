import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, ToastController, ActionSheetController } from 'ionic-angular';
import * as DataProvider from '../../providers/constants';
import { ReservaClienteOptions } from '../../interfaces/reserva-cliente-options';
import { AngularFirestoreCollection, AngularFirestore, AngularFirestoreDocument } from 'angularfire2/firestore';
import { UsuarioProvider } from '../../providers/usuario';
import { Observable } from 'rxjs';
import moment from 'moment';
import 'rxjs/add/observable/interval';
import { ReservaOptions } from '../../interfaces/reserva-options';
import { TotalesServiciosOptions } from '../../interfaces/totales-servicios-options';

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
  todosCollection: AngularFirestoreCollection<ReservaClienteOptions>;
  pendientes: any[];
  modo: string = 'pendientes';
  finalizados: ReservaClienteOptions[];
  cancelados: ReservaClienteOptions[];
  todos: ReservaClienteOptions[];
  mostrarFiltros: boolean;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public usuarioServicio: UsuarioProvider,
    private afs: AngularFirestore,
    public alertCtrl: AlertController,
    public toastCtrl: ToastController,
    public actionSheetCtrl: ActionSheetController
  ) {
    let modo = this.navParams.get('modo');
    this.mostrarFiltros = !modo;
    this.modo = modo ? modo : 'pendientes';
    this.filePathReservas = this.usuarioServicio.getFilePathCliente() + '/servicios';
    this.reservasCollection = this.afs.collection<ReservaClienteOptions>(this.filePathReservas, ref => ref.where('estado', '==', this.constantes.ESTADOS_RESERVA.RESERVADO).orderBy('fechaInicio', 'asc'));
    this.finalizadosCollection = this.afs.collection<ReservaClienteOptions>(this.filePathReservas, ref => ref.where('estado', '==', this.constantes.ESTADOS_RESERVA.FINALIZADO).orderBy('fechaInicio', 'desc'));
    this.canceladosCollection = this.afs.collection<ReservaClienteOptions>(this.filePathReservas, ref => ref.where('estado', '==', this.constantes.ESTADOS_RESERVA.CANCELADO).orderBy('fechaInicio', 'desc'));
    this.todosCollection = this.afs.collection<ReservaClienteOptions>(this.filePathReservas, ref => ref.limit(20));
    if (!modo) {
      this.updateReservas();
    } else {
      this.updateSeleccionado();
    }
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
            reserva.dentroDe = dias === 1 ? 'mañana' : 'dentro de ' + dias + ' días';
          } else {
            reserva.dentroDe = horas === 1 ? 'dentro de una hora' : 'dentro de ' + horas + ' horas';
          }
        } else {
          reserva.dentroDe = minutos === 1 ? 'dentro de un minuto' : 'dentro de ' + minutos + ' minutos';
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

  updateTodos() {
    this.todosCollection.valueChanges().subscribe(data => {
      this.todos = data;
    });
  }

  updateSeleccionado() {
    switch (this.modo) {
      case 'todas':
        this.updateTodos();
        break;
      case 'pendientes':
        this.updateReservas();
        break;
      case 'finalizadas':
        this.updateFinalizados();
        break;
      case 'canceladas':
        this.updateCancelados();
        break;
    }
  }

  private cancelar(cita: ReservaClienteOptions) {
    this.alertCtrl.create({
      title: 'Cancelar cita',
      message: '¿Está seguro de cancelar la cita?',
      buttons: [{
        text: 'No',
        role: 'cancel'
      }, {
        text: 'Si',
        handler: () => {
          let fechaInicio: Date = cita.fechaInicio.toDate();
          let momentInicio = moment(fechaInicio);
          let textoFecha: string = momentInicio.diff(new Date(), 'days') === 0 ? 'hoy' : 'el ' + momentInicio.locale('es').format('DD [de] MMMM, YYYY');
          let id = fechaInicio.getTime().toString();
          let batch = this.afs.firestore.batch();
          let filePathEmpresa = 'negocios/' + cita.empresa.id;
          let citaDoc = this.reservasCollection.doc(id);
          batch.update(citaDoc.ref, { estado: this.constantes.ESTADOS_RESERVA.CANCELADO, fechaActualizacion: new Date() });

          let dia = moment(fechaInicio).startOf('day').toDate().getTime().toString();

          let disponibilidadDoc = this.afs.doc<ReservaOptions>(filePathEmpresa + '/usuarios/' + cita.usuario.id + '/disponibilidades/' + dia);

          let canceladoDoc: AngularFirestoreDocument<ReservaOptions> = disponibilidadDoc.collection('cancelados').doc(new Date().getTime().toString());

          let reserva: ReservaOptions = {
            cliente: this.usuarioServicio.getUsuario(),
            estado: this.constantes.ESTADOS_RESERVA.CANCELADO,
            evento: null,
            fechaFin: cita.fechaFin.toDate(),
            fechaInicio: cita.fechaInicio.toDate(),
            idcarrito: cita.idcarrito,
            idusuario: cita.usuario.id,
            nombreusuario: cita.usuario.nombre,
            servicio: cita.servicio,
            id: cita.id,
            fechaActualizacion: new Date(),
            actualiza: 'cliente'
          }

          batch.set(canceladoDoc.ref, reserva);

          let disponibilidadCancelarDoc: AngularFirestoreDocument = disponibilidadDoc.collection('disponibilidades').doc(id);

          batch.delete(disponibilidadCancelarDoc.ref);

          let mesServicio = moment(reserva.fechaInicio).startOf('month');

          let totalesServiciosDoc = this.afs.doc(filePathEmpresa + '/totalesservicios/' + mesServicio);

          let totalServiciosReserva = reserva.servicio.map(servicioReserva => Number(servicioReserva.valor)).reduce((a, b) => a + b);

          const serviciosDoc = this.afs.doc('servicioscliente/' + cita.id);

          batch.update(serviciosDoc.ref, { estado: this.constantes.ESTADOS_RESERVA.CANCELADO, fechaActualizacion: new Date(), actualiza: 'cliente' });

          disponibilidadDoc.ref.get().then(datosDiarios => {
            const totalDiarioActual = datosDiarios.get('totalServicios');
            const cantidadDiarioActual = datosDiarios.get('cantidadServicios');
            const pendientesDiarioActual = datosDiarios.get('pendientes');
            const totalDiario = Number(totalDiarioActual) - totalServiciosReserva;
            const cantidadDiario = Number(cantidadDiarioActual) - 1;
            const pendientesDiario = Number(pendientesDiarioActual) - 1;
            batch.update(disponibilidadDoc.ref, { totalServicios: totalDiario, cantidadServicios: cantidadDiario, fecha: new Date(), pendientes: pendientesDiario });

            totalesServiciosDoc.ref.get().then(() => {
            
              batch.set(totalesServiciosDoc.ref, { ultimaactualizacion: new Date() });

              let totalesServiciosUsuarioDoc = totalesServiciosDoc.collection('totalesServiciosUsuarios').doc<TotalesServiciosOptions>(cita.usuario.id);

              totalesServiciosUsuarioDoc.ref.get().then(datos => {
                let totalActual = datos.get('totalServicios');
                let cantidadActual = datos.get('cantidadServicios');
                batch.update(totalesServiciosUsuarioDoc.ref, { totalServicios: Number(totalActual) - totalServiciosReserva, cantidadServicios: Number(cantidadActual) - 1, fecha: new Date() });

                batch.commit().then(() => {
                  this.toastCtrl.create({
                    message: 'La cita en ' + cita.empresa.nombre + ' para ' + textoFecha + ' ha sido cancelada.',
                    duration: 3000
                  }).present();
                }).catch(err => alert(err));
              });
            });
          });
        }
      }]
    }).present();
  }

  ver(cita: ReservaClienteOptions) {
    this.alertCtrl.create({
      title: 'Detalle de la cita',
      subTitle: 'Cita en ' + cita.empresa.nombre,
      message: 'Fecha: ' + moment(cita.fechaInicio.toDate()).locale('es').format('DD [de] MMMM, YYYY') + '<br/> Hora: ' + moment(cita.fechaInicio.toDate()).locale('es').format('HH:mm') + ' a ' + moment(cita.fechaFin.toDate()).locale('es').format('HH:mm') + '<br/>Usuario: ' + cita.usuario.nombre + '<br/>Servicio: ' + cita.servicio[0].nombre + ' - $ ' + cita.servicio[0].valor,
      buttons: [{
        text: 'Ok'
      }]
    }).present();
  }

  opciones(cita: ReservaClienteOptions) {
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Opciones',
      buttons: [{
        text: 'Cancelar cita',
        icon: 'close',
        handler: () => {
          this.cancelar(cita)
        }
      }]
    });
    actionSheet.present();
  }

}
