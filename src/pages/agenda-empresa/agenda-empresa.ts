import { Component, ViewChild } from '@angular/core';
import { IonicPage, NavController, NavParams, Content, AlertController } from 'ionic-angular';
import { AngularFirestoreDocument, AngularFirestoreCollection, AngularFirestore } from '../../../node_modules/angularfire2/firestore';
import { EmpresaOptions } from '../../interfaces/empresa-options';
import moment from 'moment';
import * as DataProvider from '../../providers/constants';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { Observable } from '../../../node_modules/rxjs';
import 'rxjs/add/observable/interval';
import { ReservaOptions } from '../../interfaces/reserva-options';
import { DisponibilidadOptions } from '../../interfaces/disponibilidad-options';

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

  private filePathEmpresa: string;
  private empresaDoc: AngularFirestoreDocument<EmpresaOptions>;
  empresa: EmpresaOptions;

  constantes = DataProvider;

  horaInicio = 0;
  horaFin = 24;
  tiempoServicio = 30;
  actual: Date;
  initDate: Date = new Date();
  initDate2: Date = new Date();
  disabledDates: Date[] = [];
  maxDate: Date = moment(new Date()).add(30, 'days').toDate();
  min: Date = new Date();

  horario: any[];
  horarios: any[];

  usuariosCollection: AngularFirestoreCollection<UsuarioOptions>;
  usuarios: UsuarioOptions[];

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afs: AngularFirestore,
    public alertCtrl: AlertController
  ) {
    let idempresa = this.navParams.get('idempresa');
    this.filePathEmpresa = 'negocios/' + idempresa;
    this.empresaDoc = this.afs.doc<EmpresaOptions>(this.filePathEmpresa);
    this.usuariosCollection = this.empresaDoc.collection('usuarios')
    this.updateEmpresa();
  }

  updateEmpresa() {
    this.empresaDoc.valueChanges().subscribe(data => {
      if (data) {
        this.empresa = data;
        let configuracion = this.empresa.configuracion;
        this.horaInicio = configuracion ? configuracion.horaInicio : this.horaInicio;
        this.horaFin = configuracion ? configuracion.horaFin : this.horaFin;
        this.updateUsuarios();
      } else {
        this.alertCtrl.create({
          title: 'Empresas',
          message: 'La empresa no existe',
          buttons: [{
            text: 'OK',
            handler: () => {
              this.navCtrl.pop();
            }
          }]
        });
      }
    });
  }

  ionViewDidLoad() {
    Observable.interval(60000).subscribe(() => {
      this.initDate = new Date();
      this.initDate2 = new Date();
      this.updateAngenda();
    });
  }

  updateUsuarios() {
    this.usuariosCollection.valueChanges().subscribe(data => {
      this.usuarios = data;
    });
  }

  setDate(date: Date) {
    this.initDate = date;
    this.updateAngenda();
  }

  private loadReservasUsuario(usuario: UsuarioOptions) {
    let dia = moment(this.initDate).startOf('day').toDate().getTime().toString();

    let reservaCollection: AngularFirestoreCollection<ReservaOptions> = this.empresaDoc.collection('usuarios/' + usuario.id + '/disponibilidades/' + dia + '/disponibilidades');
    return new Promise<ReservaOptions[]>(resolve => {
      reservaCollection.valueChanges().subscribe(dataReservasUsuario => {
        resolve(dataReservasUsuario);
      });
    });
  }

  private loadNodisponibleUsuario(usuario: UsuarioOptions) {
    let indisponibilidadCollection: AngularFirestoreCollection<any> = this.empresaDoc.collection('usuarios/' + usuario.id + '/indisponibilidades');
    return new Promise<any[]>(resolve => {
      indisponibilidadCollection.valueChanges().subscribe(indisponibles => {
        let encontrados = indisponibles.filter(item => {
          let fechaDesde: Date = moment(new Date(item.fechaDesde)).startOf('day').toDate();
          let fechaFin: Date = item.indefinido ? moment(new Date(item.fechaDesde)).endOf('day').toDate() : moment(new Date(item.fechaHasta)).endOf('day').toDate();

          if (moment(this.initDate).isBetween(fechaDesde, fechaFin)) {
            return item;
          }
        });

        resolve(encontrados);
      });
    });
  }

  private loadDisponibilidadUsuario(usuario) {
    let noDisponible: any[] = [];
    return new Promise<any[]>(resolve => {
      noDisponible[usuario.id] = [];
      this.loadReservasUsuario(usuario).then(dataReservas => {
        noDisponible.push({ usuario: usuario, tipo: 'reservas', data: dataReservas });
        this.loadNodisponibleUsuario(usuario).then(dataNoDisponible => {
          noDisponible.push({ usuario: usuario, tipo: 'nodisponible', data: dataNoDisponible });

          resolve(noDisponible);
        });
      });
    });
  }

  private loadDisponibilidadUsuarios() {
    let noDisponible: any[] = [];
    return new Promise<any[]>(resolve => {
      this.usuariosCollection.valueChanges().subscribe(data => {
        data.forEach((usuario, index) => {
          this.loadDisponibilidadUsuario(usuario).then(dataUsuario => {
            noDisponible.push.apply(noDisponible, dataUsuario);
          });

          while (noDisponible.length < (index + 1) * 2) {
            console.log('hola');
            console.log(noDisponible.length);
          }
        });

        resolve(noDisponible);
      });
    });
  }

  private loadUsuarioDisponible(disponibilidad, fecha: Date): boolean {
    let datos = disponibilidad.data;
    switch (disponibilidad.tipo) {
      case 'reservas':
        return !(datos.some(item => item.fechaInicio.toDate().getTime() === fecha.getTime()));
      case 'nodisponible':
        if (datos.todoDia) {
          return false;
        } else {
          let horaDesde = moment(datos.horaDesde, 'HH:mm').toDate().getHours();
          let horaHasta = moment(datos.horaHasta, 'HH:mm').toDate().getHours();
          let horaReserva = fecha.getHours();
          return !(horaDesde <= horaReserva && horaHasta >= horaReserva);
        }
    }

    return true;
  }

  private updateUsuariosDisponible(disponibilidadesUsuarios, fecha: Date): UsuarioOptions[] {
    let usuarios = this.usuarios;
    disponibilidadesUsuarios.forEach(data => {
      data.forEach(disponibilidadUsuario => {
        let item = usuarios.indexOf(disponibilidadUsuario.usuario);
        if (item) {
          let disponible = this.loadUsuarioDisponible(disponibilidadUsuario, fecha);
          if (!disponible) {
            usuarios.splice(item, 1);
          }
        }
      });
    });
    return usuarios;
  }

  private scrollTo(element: string) {
    let yOffset = document.getElementById(element).offsetTop;
    this.content.scrollTo(0, yOffset - 50, 1000);
  }

  updateAngenda() {
    this.horario = [];
    this.horarios = [];
    let grupos = [];
    let fechaInicio = moment(this.initDate).startOf('day').hours(this.horaInicio);
    let fechaFin = moment(this.initDate).hours(this.horaFin);
    let ahora = new Date();
    this.loadDisponibilidadUsuarios().then(dataDisponibilidadUsuarios => {
      while (fechaInicio.isSameOrBefore(fechaFin.toDate())) {
        let fechaInicioReserva = fechaInicio.toDate();
        let fechaFinReserva = moment(fechaInicio).add(this.tiempoServicio, 'minutes').toDate();
        if (moment(fechaFinReserva).add(30, 'minutes').isSameOrAfter(ahora)) {
          let usuariosDisponibles = this.updateUsuariosDisponible(dataDisponibilidadUsuarios, fechaInicioReserva);
          let reserva: DisponibilidadOptions;
          if (usuariosDisponibles[0]) {
            reserva = {
              fechaInicio: fechaInicioReserva,
              fechaFin: fechaFinReserva,
              estado: this.constantes.ESTADOS_RESERVA.DISPONIBLE,
              evento: this.constantes.EVENTOS.OTRO,
              usuarios: usuariosDisponibles
            };
          }

          if (moment(ahora).isBetween(reserva.fechaInicio, reserva.fechaFin)) {
            reserva.evento = this.constantes.EVENTOS.ACTUAL;
            if (reserva.estado === this.constantes.ESTADOS_RESERVA.RESERVADO) {
              reserva.estado = this.constantes.ESTADOS_RESERVA.EJECUTANDO;
            }
          }

          let grupo = moment(reserva.fechaInicio).startOf('hours').format('h:mm a');;
          if (grupos[grupo] === undefined) {
            grupos[grupo] = [];
          }
          grupos[grupo].push(reserva);

          this.horario.push(reserva);
          fechaInicio = moment(reserva.fechaFin);
        }

        for (let grupo in grupos) {
          this.horarios.push({ grupo: grupo, disponibilidad: grupos[grupo] });
        }

        let horaAhora = ahora.getHours();

        if (horaAhora >= this.horaInicio && horaAhora <= this.horaFin && moment(ahora).diff(fechaInicio, 'days') === 0) {
          setTimeout(() => {
            this.scrollTo(this.constantes.EVENTOS.ACTUAL)
          }, 1);
        }
      }
    });
  }

}
