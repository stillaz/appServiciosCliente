import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Content, AlertController, LoadingController } from 'ionic-angular';
import { AngularFirestoreDocument, AngularFirestore, AngularFirestoreCollection } from 'angularfire2/firestore';
import { EmpresaOptions } from '../../interfaces/empresa-options';
import moment from 'moment';
import * as DataProvider from '../../providers/constants';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { Observable } from 'rxjs';
import 'rxjs/add/observable/interval';
import { ReservaOptions } from '../../interfaces/reserva-options';
import { ServicioOptions } from '../../interfaces/servicio-options';
import { UsuarioProvider } from '../../providers/usuario';
import { TotalDiarioOptions } from '../../interfaces/total-diario-options';
import { IndiceOptions } from '../../interfaces/indice-options';
import { TotalesServiciosOptions } from '../../interfaces/totales-servicios-options';
import { ReservaClienteOptions } from '../../interfaces/reserva-cliente-options';
import { FavoritoOptions } from '../../interfaces/favorito-options';
import { ClienteOptions } from '../../interfaces/cliente-options';

/**
 * Generated class for the AgendaEmpresaPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-agenda-empresa',
  templateUrl: 'agenda-empresa.html',
})
export class AgendaEmpresaPage {

  @ViewChild(Content) content: Content;

  private empresaDoc: AngularFirestoreDocument<EmpresaOptions>;
  servicio: ServicioOptions;
  private usuarioDoc: AngularFirestoreDocument<UsuarioOptions>;
  private empresaServicioDoc: AngularFirestoreDocument<FavoritoOptions>;
  private empresa: EmpresaOptions;
  private usuario: UsuarioOptions;
  reservas: ReservaOptions[];
  horario: ReservaOptions[];
  horarios: any[];
  private indisponibles;
  cliente: ClienteOptions;
  constantes = DataProvider;
  horaInicio = 0;
  horaFin = 24;
  tiempoServicio = 30;
  actual: Date = new Date();
  initDate: Date = new Date();
  initDate2: Date = new Date();
  disabledDates: Date[] = [];
  maxDate: Date = moment(new Date()).add(30, 'days').toDate();
  min: Date = new Date();
  private disponibilidadDoc: AngularFirestoreDocument<ReservaOptions>;
  idcarrito: number;
  private reservasCollection: AngularFirestoreCollection<ReservaClienteOptions>;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afs: AngularFirestore,
    public alertCtrl: AlertController,
    private usuarioServicio: UsuarioProvider,
    public loadingCtrl: LoadingController
  ) {
    this.servicio = this.navParams.get('servicio');
    const idusuario = this.navParams.get('idusuario');
    const idempresa = this.navParams.get('idempresa');
    const filePathEmpresa = 'negocios/' + idempresa;
    const filePathEmpresaServicio = this.usuarioServicio.getFilePathCliente() + '/negocios/' + idempresa;
    const filePathReservas = this.usuarioServicio.getFilePathCliente() + '/servicios';

    this.reservasCollection = this.afs.collection<ReservaClienteOptions>(filePathReservas, ref => ref.where('estado', '==', this.constantes.ESTADOS_RESERVA.RESERVADO));
    this.empresaDoc = this.afs.doc<EmpresaOptions>(filePathEmpresa);
    this.usuarioDoc = this.empresaDoc.collection('usuarios').doc<UsuarioOptions>(idusuario);
    this.empresaServicioDoc = this.afs.doc<FavoritoOptions>(filePathEmpresaServicio);

    this.cliente = this.usuarioServicio.getUsuario();
    this.updateEmpresa();
    this.updateUsuario();
  }

  genericAlert(titulo: string, mensaje: string) {
    let mensajeAlert = this.alertCtrl.create({
      title: titulo,
      message: mensaje,
      buttons: ['OK']
    });

    mensajeAlert.present();
  }

  ionViewDidLoad() {
    Observable.interval(60000).subscribe(() => {
      this.actual = new Date();
      this.updateAgenda();
    });
  }

  setDate(date: Date) {
    this.initDate = date;
    this.updateAgenda();
  }

  loadIdCarrito() {
    let indiceCarritoDoc = this.empresaDoc.collection<IndiceOptions>('indices').doc('carrito');
    return new Promise(resolve => {
      indiceCarritoDoc.ref.get().then(data => {
        this.idcarrito = data.exists ? data.get('id') : 1;
        indiceCarritoDoc.set({ id: this.idcarrito + 1 });
        resolve('ok');
      });
    });
  }

  loadHorarioNoDisponible(fecha: Date): ServicioOptions {
    let encontrado = this.indisponibles.find(item => {
      if (item.repetir.id === -1 || item.repetir.id === 10 || fecha.getDay() + 1 === item.repetir.id) {
        let fechaDesde: Date = moment(new Date(item.fechaDesde)).startOf('day').toDate();
        let fechaFin: Date = item.indefinido ? moment(fecha).endOf('day').toDate() : moment(new Date(item.fechaHasta)).endOf('day').toDate();

        if (moment(fecha).isBetween(fechaDesde, fechaFin)) {
          let horaInicio = item.todoDia ? this.horaInicio : moment(item.horaDesde, 'HH:mm').toDate().getHours();
          let horaFin = item.todoDia ? this.horaFin : moment(item.horaHasta, 'HH:mm').toDate().getHours() - 1;
          let horaReserva = fecha.getHours();
          if (horaReserva >= horaInicio && horaReserva <= horaFin) {
            return item;
          }
        }
      }
    });

    let servicio: ServicioOptions;

    if (encontrado) {
      servicio = {} as ServicioOptions;
      servicio.nombre = encontrado.descripcion;
    }

    return servicio;
  }

  updateHorarioNoDisponible() {
    let indisponibilidadCollection = this.usuarioDoc.collection('indisponibilidades');
    indisponibilidadCollection.valueChanges().subscribe(indisponibilidades => {
      this.indisponibles = indisponibilidades;
      this.updateAgenda();
    });
  }

  calcularDentroDe(fechaInicio: Date): string {
    let ahora = new Date();
    let fecha = moment(fechaInicio);
    let minutos = fecha.diff(ahora, 'minutes');
    if (minutos >= 60) {
      let horas = fecha.diff(ahora, 'hours');
      if (horas >= 24) {
        let dias = fecha.diff(ahora, 'days');
        return dias + (dias === 1 ? ' día' : ' días');
      } else {
        return horas + (horas === 1 ? ' hora' : ' horas');
      }
    } else {
      return minutos + (minutos === 1 ? ' minuto' : ' minutos');
    }
  }

  updateAgenda() {
    const inicioReserva = moment(this.actual).add(1, 'hours').toDate();
    const fecha: Date = moment(this.initDate).startOf('day').toDate();
    this.disponibilidadDoc = this.usuarioDoc.collection('disponibilidades').doc(fecha.getTime().toString());
    this.disponibilidadDoc.collection<ReservaOptions>('disponibilidades').valueChanges().subscribe(data => {
      this.reservas = data;
      this.horario = [];
      this.horarios = [];
      let grupos = [];
      let fechaInicio = moment(this.initDate).startOf('day').hours(this.horaInicio);
      let fechaFin = moment(this.initDate).hours(this.horaFin);
      while (fechaInicio.isSameOrBefore(fechaFin.toDate())) {
        let fechaInicioReserva = fechaInicio.toDate();
        let fechaFinReserva = moment(fechaInicio).add(this.tiempoServicio, 'minutes').toDate();
        let noDisponible = this.loadHorarioNoDisponible(fechaInicioReserva);
        let reserva: any;
        if (!noDisponible && moment(fechaInicioReserva).isSameOrAfter(inicioReserva)) {
          let reservaEnc = this.reservas.find(item => item.fechaInicio.toDate().getTime() === fechaInicioReserva.getTime());
          if (!reservaEnc) {
            reserva = {
              fechaInicio: fechaInicioReserva,
              fechaFin: fechaFinReserva,
              estado: this.constantes.ESTADOS_RESERVA.DISPONIBLE,
              idcarrito: null,
              cliente: null,
              servicio: null,
              idusuario: null,
              nombreusuario: null,
              id: null,
              fechaActualizacion: null,
              actualiza: null,
              evento: null,
              dentroDe: this.calcularDentroDe(fechaInicioReserva)
            };

            let grupo = moment(reserva.fechaInicio).startOf('hours').format('h:mm a');;
            if (!grupos[grupo]) {
              grupos[grupo] = [];
            }
            grupos[grupo].push(reserva);

            this.horario.push(reserva);
          }
        }
        fechaInicio = moment(fechaFinReserva);
      }

      for (let grupo in grupos) {
        this.horarios.push({ grupo: grupo, disponibilidad: grupos[grupo] });
      }
    });
  }

  updateEmpresa() {
    this.empresaDoc.valueChanges().subscribe(data => {
      if (data) {
        this.empresa = data;
      } else {
        this.genericAlert('Error', 'La empresa no existe.');
        this.navCtrl.popToRoot();
      }
    });
  }

  updateUsuario() {
    this.usuarioDoc.valueChanges().subscribe(data => {
      if (data) {
        this.usuario = data;
        let configuracion = this.usuario.configuracion;
        if (configuracion) {
          this.horaInicio = configuracion.horaInicio;
          this.horaFin = configuracion.horaFin;
          this.tiempoServicio = configuracion.tiempoDisponibilidad;
        }
        this.updateHorarioNoDisponible();
      }
    });
  }

  guardar(reserva: any) {
    const batch = this.afs.firestore.batch();
    const reservaDoc: AngularFirestoreDocument<ReservaOptions> = this.disponibilidadDoc.collection('disponibilidades').doc(reserva.fechaInicio.getTime().toString());
    batch.set(reservaDoc.ref, reserva);

    const mesServicio = moment(reserva.fechaInicio).startOf('month').toDate().getTime().toString();

    const totalesServiciosDoc = this.empresaDoc.collection('totalesservicios').doc(mesServicio);

    const totalServiciosReserva = reserva.servicio.map(servicioReserva => Number(servicioReserva.valor)).reduce((a, b) => a + b);

    this.disponibilidadDoc.ref.get().then(datosDiarios => {
      if (datosDiarios.exists) {
        let totalDiarioActual = datosDiarios.get('totalServicios');
        let cantidadDiarioActual = datosDiarios.get('cantidadServicios');
        let pendientesDiarioActual = datosDiarios.get('pendientes');
        let totalDiario = totalDiarioActual ? Number(totalDiarioActual) + totalServiciosReserva : totalServiciosReserva;
        let cantidadDiario = cantidadDiarioActual ? Number(cantidadDiarioActual) + 1 : 1;
        let pendientesDiario = pendientesDiarioActual ? Number(pendientesDiarioActual) + 1 : 1;
        batch.update(this.disponibilidadDoc.ref, { totalServicios: totalDiario, cantidadServicios: cantidadDiario, fecha: new Date(), pendientes: pendientesDiario });
      } else {
        let totalServicioUsuario: TotalDiarioOptions = {
          idusuario: this.usuario.id,
          usuario: reserva.nombreusuario,
          imagenusuario: reserva.imagenusuario,
          totalServicios: totalServiciosReserva,
          cantidadServicios: 1,
          año: reserva.fechaInicio.getFullYear(),
          dia: reserva.fechaInicio.getDay(),
          id: moment(reserva.fechaInicio).startOf('day').toDate().getTime(),
          mes: reserva.fechaInicio.getMonth(),
          fecha: new Date(),
          pendientes: 1
        }
        batch.set(this.disponibilidadDoc.ref, totalServicioUsuario);
      }

      totalesServiciosDoc.ref.get().then(() => {
        batch.set(totalesServiciosDoc.ref, { ultimaactualizacion: new Date() });

        let totalesServiciosUsuarioDoc = totalesServiciosDoc.collection('totalesServiciosUsuarios').doc<TotalesServiciosOptions>(this.usuario.id);

        totalesServiciosUsuarioDoc.ref.get().then(datos => {
          if (datos.exists) {
            const totalActual = datos.get('totalServicios');
            const cantidadActual = datos.get('cantidadServicios');
            const pendientesActual = datos.get('pendientes');
            const totalServicios = Number(totalActual) + totalServiciosReserva;
            const cantidadTotal = Number(cantidadActual) + 1;
            const totalPendientes = Number(pendientesActual) + 1;
            const fechaActualizacion = new Date();

            batch.update(totalesServiciosUsuarioDoc.ref, { totalServicios: totalServicios, cantidadServicios: cantidadTotal, fecha: fechaActualizacion, pendientes: totalPendientes });
          } else {
            let totalServicioUsuario: TotalesServiciosOptions = {
              idusuario: this.usuario.id,
              usuario: reserva.nombreusuario,
              imagenusuario: reserva.imagenusuario,
              totalServicios: totalServiciosReserva,
              cantidadServicios: 1,
              fecha: new Date(),
              pendientes: 1
            }
            batch.set(totalesServiciosUsuarioDoc.ref, totalServicioUsuario);
          }

          let reservaCliente: ReservaClienteOptions = {
            estado: this.constantes.ESTADOS_RESERVA.RESERVADO,
            fechaFin: reserva.fechaFin,
            fechaInicio: reserva.fechaInicio,
            idcarrito: reserva.idcarrito,
            servicio: reserva.servicio,
            usuario: this.usuario,
            empresa: this.empresa,
            fechaActualizacion: new Date(),
            id: reserva.id
          };
          const filePathServicio = this.usuarioServicio.getFilePathCliente() + '/servicios/' + reserva.fechaInicio.getTime().toString();
          const servicioDoc = this.afs.doc(filePathServicio);
          batch.set(servicioDoc.ref, reservaCliente);

          this.empresaServicioDoc.ref.get().then(data => {
            let cantidad = 1;
            if (data.exists) {
              cantidad += Number(data.get('servicios'));
            }

            let favorito: FavoritoOptions = {
              actualizacion: new Date(),
              empresa: this.empresa,
              servicios: cantidad
            };

            batch.set(this.empresaServicioDoc.ref, favorito);

            const serviciosDoc = this.afs.doc('servicioscliente/' + reserva.id);

            batch.set(serviciosDoc.ref, reserva);

            batch.commit().then(() => {
              const mfecha = moment(reserva.fechaInicio);
              const esHoy = mfecha.diff(moment(this.actual).startOf('day'), 'day') === 0;
              let textoFecha = esHoy ? 'hoy' : mfecha.locale('es').format('DD [de] MMMM [de] YYYY');
              textoFecha += mfecha.locale('es').format(' [a las] hh:mm a.');
              this.genericAlert('Cita registrada', 'La cita ha sido asignada con ' + reservaCliente.usuario.nombre + ' para ' + textoFecha);
            }).catch(err => this.genericAlert('Error', err));

            this.navCtrl.popToRoot();
          });
        });
      });
    }).catch(err => {
      this.genericAlert('Error reserva', err);
      this.navCtrl.pop();
    });
  }

  loadReservas(fecha: Date) {
    return new Promise<boolean>(resolve => {
      this.reservasCollection.valueChanges().subscribe(data => {
        resolve(data.some(reserva => reserva.fechaInicio.toDate() === fecha));
      });
    });
  }

  reservar(reserva: ReservaOptions) {
    this.loadingCtrl.create({
      content: 'Registrando la cita...',
      dismissOnPageChange: true
    }).present();
    this.loadReservas(reserva.fechaInicio).then(data => {
      if (data) {
        this.genericAlert('No se puede asignar la cita', 'La fecha y hora de la cita coincide con otra cita que tienes asignada.');
      } else {
        this.loadIdCarrito().then(() => {
          const servicioId = this.afs.createId();
          const disponible: boolean = !this.reservas.some(data => moment(data.fechaInicio.toDate()).isSame(reserva.fechaInicio));
          if (disponible) {
            const reservaNueva = {
              cliente: this.usuarioServicio.getUsuario(),
              estado: this.constantes.ESTADOS_RESERVA.RESERVADO,
              evento: reserva.evento,
              fechaFin: reserva.fechaFin,
              fechaInicio: reserva.fechaInicio,
              idcarrito: this.idcarrito,
              idusuario: this.usuario.id,
              nombreusuario: this.usuario.nombre,
              servicio: [this.servicio],
              id: servicioId,
              actualiza: 'cliente',
              fechaActualizacion: new Date(),
              imagenusuario: this.usuario.imagen
            }

            this.guardar(reservaNueva);
          } else {
            this.genericAlert('Error al reservar', 'La cita ya se encuentra reservada para otro usuario.');
            this.navCtrl.pop();
          }
        }).catch(err => alert('No fue posible procesar la cita. Inténtelo más tarde, error: ' + err));
      }
    });
  }

}
