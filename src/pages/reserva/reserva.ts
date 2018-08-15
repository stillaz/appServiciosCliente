import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams, AlertController, ModalController, ViewController } from 'ionic-angular';
import { DisponibilidadOptions } from '../../interfaces/disponibilidad-options';
import { ServicioOptions } from '../../interfaces/servicio-options';
import { AngularFirestore, AngularFirestoreCollection, AngularFirestoreDocument } from 'angularfire2/firestore';
import { IndiceOptions } from '../../interfaces/indice-options';
import { UsuarioOptions } from '../../interfaces/usuario-options';
import { EmpresaOptions } from '../../interfaces/empresa-options';
import moment from 'moment';
import { Observable } from 'rxjs';
import * as DataProvider from '../../providers/constants';
import { ReservaOptions } from '../../interfaces/reserva-options';
import { TotalesServiciosOptions } from '../../interfaces/totales-servicios-options';
import { TotalDiarioOptions } from '../../interfaces/total-diario-options';
import { UsuarioProvider } from '../../providers/usuario';
import { ReservaClienteOptions } from '../../interfaces/reserva-cliente-options';
import { FavoritoOptions } from '../../interfaces/favorito-options';

/**
 * Generated class for the ReservaPage page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */

@IonicPage()
@Component({
  selector: 'page-reserva',
  templateUrl: 'reserva.html',
})
export class ReservaPage {

  constantes = DataProvider;
  disponibilidad: DisponibilidadOptions;
  horario: DisponibilidadOptions[];
  servicios: ServicioOptions[];
  empresa: EmpresaOptions;
  filePathEmpresa: string;
  empresaDoc: AngularFirestoreDocument<EmpresaOptions>;
  idcarrito: number;
  filePathUsuarios: string;
  usuariosCollection: AngularFirestoreCollection<UsuarioOptions>;
  tiempoDisponibilidad: number;
  disponibilidadBloquear: ReservaOptions[] = [];
  cantidad = 0;
  carrito: ReservaOptions[] = [];
  totalServicios: number = 0;
  disponibilidadDoc: AngularFirestoreDocument<ReservaOptions>;
  usuario: UsuarioOptions;
  filePathServicio: string;
  servicioDoc: AngularFirestoreDocument<ReservaClienteOptions>;
  filePathEmpresaServicio: string;
  empresaServicioDoc: AngularFirestoreDocument<FavoritoOptions>;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private afs: AngularFirestore,
    public alertCtrl: AlertController,
    public modalCtrl: ModalController,
    public viewCtrl: ViewController,
    public usuarioServicio: UsuarioProvider
  ) {
    this.disponibilidad = this.navParams.get('disponibilidad');
    let idempresa = this.navParams.get('idempresa');
    this.horario = this.navParams.get('horario');
    this.filePathEmpresa = 'negocios/' + idempresa;
    this.filePathServicio = this.usuarioServicio.getFilePathCliente() + '/servicios/' + this.disponibilidad.fechaInicio.getTime().toString();
    this.servicioDoc = this.afs.doc(this.filePathServicio);
    this.empresaDoc = this.afs.doc<EmpresaOptions>(this.filePathEmpresa);
    this.usuariosCollection = this.empresaDoc.collection('/usuarios/');
    this.updateEmpresa();
    this.updateServicios();
  }

  updateEmpresa() {
    this.empresaDoc.valueChanges().subscribe(data => {
      if (data) {
        this.empresa = data;
        this.tiempoDisponibilidad = data.configuracion ? data.configuracion.tiempoDisponibilidad : 30;
        this.filePathEmpresaServicio = this.usuarioServicio.getFilePathCliente() + '/negocios/' + this.empresa.id;
        this.empresaServicioDoc = this.afs.doc<FavoritoOptions>(this.filePathEmpresaServicio);
        this.loadIdCarrito();
      } else {
        this.alertCtrl.create({
          title: 'Ha ocurrido un error',
          message: 'La empresa no existe',
          buttons: [{
            text: 'OK',
            role: 'cancel'
          }]
        }).present();
        this.navCtrl.pop();
      }
    });
  }

  updateServicios() {
    this.servicios = [];
    let servicioMap = [];
    let perfilMap = [];
    let arraperfiles = this.disponibilidad.usuarios.map(usuario => {
      return usuario.perfiles
    });

    arraperfiles.forEach(arrperfiles => {
      arrperfiles.forEach(perfil => {
        if (!perfilMap[perfil.id]) {
          perfilMap[perfil.id] = perfil;
        }
      });
    });

    for (let perfil in perfilMap) {
      if (perfilMap[perfil].servicios) {
        perfilMap[perfil].servicios.forEach(servicio => {
          if (!servicioMap[servicio.id]) {
            servicioMap[servicio.id] = true;
            this.servicios.push(servicio);
          }
        });
      }
    }
  }

  loadIdCarrito() {
    let indiceCarritoDoc = this.afs.doc<IndiceOptions>(this.filePathEmpresa + '/indices/idcarrito');
    return new Promise(resolve => {
      indiceCarritoDoc.ref.get().then(data => {
        this.idcarrito = data.exists ? data.get('id') : 1;
        indiceCarritoDoc.set({ id: this.idcarrito + 1 });
        resolve('ok');
      });
    });
  }

  loadReservaFechaUsuario(usuario: UsuarioOptions) {
    let fecha = this.disponibilidad.fechaInicio;
    let dia = moment(fecha).startOf('day').toDate().getTime().toString();
    let usuarioDoc = this.empresaDoc.collection('usuarios').doc(usuario.id);
    let disponibilidadUsuarioDoc = usuarioDoc.collection('disponibilidades').doc(dia);
    let reservaUsuarioDoc = disponibilidadUsuarioDoc.collection('disponibilidades').doc(fecha.getTime().toString());
    return new Promise(resolve => {
      reservaUsuarioDoc.valueChanges().subscribe(data => {
        resolve(data);
      });
    });
  }

  loadNoDisponibleFechaUsuario(usuario: UsuarioOptions) {
    let fecha = this.disponibilidad.fechaInicio;
    let dia = moment(fecha).startOf('day').toDate().getTime();
    let usuarioDoc = this.empresaDoc.collection('usuarios').doc(usuario.id);
    let indisponibilidadCollection = usuarioDoc.collection('indisponibilidades');
    return new Promise<any[]>(resolve => {
      indisponibilidadCollection.valueChanges().subscribe(indisponibles => {
        let encontrados = indisponibles.filter(indisponible => {
          let fechaDesde: Date = moment(new Date(indisponible.fechaDesde)).startOf('day').toDate();
          let fechaFin: Date = indisponible.indefinido ?
            moment(new Date(indisponible.fechaDesde)).endOf('day').toDate() :
            moment(new Date(indisponible.fechaHasta)).endOf('day').toDate();

          let isFecha = moment(dia).isBetween(fechaDesde, fechaFin);

          if (isFecha && indisponible.todoDia) {
            return indisponible;
          } else if (isFecha) {
            let horaDesde = moment(indisponible.horaDesde, 'HH:mm').toDate().getHours();
            let horaHasta = moment(indisponible.horaHasta, 'HH:mm').toDate().getHours();
            let horaReserva = fecha.getHours();
            if (horaDesde <= horaReserva && horaHasta >= horaReserva) {
              return indisponible;
            }
          }
        });

        resolve(encontrados);
      });
    });
  }

  loadUsuariosDisponibles(servicio: ServicioOptions) {
    return new Observable<UsuarioOptions[]>((observer) => {
      let usuarios: UsuarioOptions[];
      this.usuariosCollection.valueChanges().subscribe(data => {
        let usuariosI: UsuarioOptions[];
        usuariosI = data.filter(usuario => usuario.perfiles.some(perfil => {
          if (perfil.servicios) {
            return perfil.servicios.some(servicioUsuario => servicioUsuario.id === servicio.id);
          }
        }));

        usuarios = usuariosI;
        usuariosI.forEach(usuario => {
          this.loadReservaFechaUsuario(usuario).then(data => {
            let item = usuarios.indexOf(usuario);
            if (data) {
              usuarios.splice(item, 1);
            } else {
              this.loadNoDisponibleFechaUsuario(usuario).then(dataNoDisponible => {
                if (dataNoDisponible) {
                  usuarios.splice(item, 1);
                }
              });
            }
          });
        });

        observer.next(usuarios);
        observer.complete();
      });

      return { unsubscribe() { } };
    });
  }

  genericAlert(titulo: string, mensaje: string) {
    let mensajeAlert = this.alertCtrl.create({
      title: titulo,
      message: mensaje,
      buttons: ['OK']
    });

    mensajeAlert.present();
  }

  validarReservaDisponible(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.carrito.forEach(reservaNueva => {
        let reservaDoc: AngularFirestoreDocument<ReservaOptions> = this.disponibilidadDoc.collection('disponibilidades').doc(reservaNueva.fechaInicio.getTime().toString());
        let read = reservaDoc.valueChanges().subscribe(data => {
          if (data) {
            reject('La disponibilidad ' + moment(reservaNueva.fechaInicio).locale('es').format('h:mm a') + ' fue reservada.');
          }
        });
        read.unsubscribe();
        resolve('ok');
      });
    });
  }

  guardar(usuario: UsuarioOptions) {
    let batch = this.afs.firestore.batch();
    this.validarReservaDisponible().then(() => {
      this.carrito.forEach(reservaNueva => {
        let reservaDoc: AngularFirestoreDocument<ReservaOptions> = this.disponibilidadDoc.collection('disponibilidades').doc(reservaNueva.fechaInicio.getTime().toString());
        batch.set(reservaDoc.ref, reservaNueva);

        let mesServicio = moment(reservaNueva.fechaInicio).startOf('month');

        let totalesServiciosDoc = this.afs.doc(this.filePathEmpresa + '/totalesservicios/' + mesServicio);

        let totalServiciosReserva = reservaNueva.servicio.map(servicioReserva => Number(servicioReserva.valor)).reduce((a, b) => a + b);

        this.disponibilidadDoc.ref.get().then(datosDiarios => {
          if (datosDiarios.exists) {
            let totalDiarioActual = datosDiarios.get('totalServicios');
            let cantidadDiarioActual = datosDiarios.get('cantidadServicios');
            let totalDiario = totalDiarioActual ? Number(totalDiarioActual) + totalServiciosReserva : totalServiciosReserva;
            let cantidadDiario = cantidadDiarioActual ? Number(cantidadDiarioActual) + 1 : 1;
            batch.update(this.disponibilidadDoc.ref, { totalServicios: totalDiario, cantidadServicios: cantidadDiario, fecha: new Date() });
          } else {
            let totalServicioUsuario: TotalDiarioOptions = {
              idusuario: usuario.id,
              usuario: reservaNueva.nombreusuario,
              imagenusuario: '',
              totalServicios: totalServiciosReserva,
              cantidadServicios: 1,
              año: reservaNueva.fechaInicio.getFullYear(),
              dia: reservaNueva.fechaInicio.getDay(),
              id: moment(reservaNueva.fechaInicio).startOf('day').toDate().getTime(),
              mes: reservaNueva.fechaInicio.getMonth(),
              fecha: new Date()
            }
            batch.set(this.disponibilidadDoc.ref, totalServicioUsuario);
          }

          totalesServiciosDoc.ref.get().then(() => {
            batch.set(totalesServiciosDoc.ref, { ultimaactualizacion: new Date() });

            let totalesServiciosUsuarioDoc = totalesServiciosDoc.collection('totalesServiciosUsuarios').doc<TotalesServiciosOptions>(usuario.id);

            totalesServiciosUsuarioDoc.ref.get().then(datos => {
              if (datos.exists) {
                let totalActual = datos.get('totalServicios');
                let cantidadActual = datos.get('cantidadServicios');
                batch.update(totalesServiciosUsuarioDoc.ref, { totalServicios: Number(totalActual) + totalServiciosReserva, cantidadServicios: Number(cantidadActual) + 1, fecha: new Date() });
              } else {
                let totalServicioUsuario: TotalesServiciosOptions = {
                  idusuario: usuario.id,
                  usuario: reservaNueva.nombreusuario,
                  imagenusuario: '',
                  totalServicios: totalServiciosReserva,
                  cantidadServicios: 1,
                  fecha: new Date()
                }
                batch.set(totalesServiciosUsuarioDoc.ref, totalServicioUsuario);
              }

              let reservaCliente: ReservaClienteOptions = {
                estado: reservaNueva.estado,
                fechaFin: reservaNueva.fechaFin,
                fechaInicio: reservaNueva.fechaInicio,
                idcarrito: reservaNueva.idcarrito,
                servicio: reservaNueva.servicio,
                usuario: this.usuario,
                empresa: this.empresa
              };

              batch.set(this.servicioDoc.ref, reservaCliente);

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

                batch.commit().then(() => {
                  this.genericAlert('Reserva registrada', 'Se ha registrado la reserva');
                }).catch(err => this.genericAlert('Error', err));

                this.navCtrl.popToRoot();
              });
            });
          });
        });
      });
    }).catch(err => {
      this.genericAlert('Error reserva', err);
      this.navCtrl.pop();
    });
  }

  reservar(servicio: ServicioOptions) {
    let dia = moment(this.disponibilidad.fechaInicio).startOf('day').toDate();
    this.disponibilidadDoc = this.usuariosCollection.doc(this.usuario.id).collection('disponibilidades').doc(dia.getTime().toString());
    let ultimoHorario = this.disponibilidad.fechaInicio;

    let disponibilidadBloquear: ReservaOptions[] = [];
    let reserva: ReservaOptions;
    let disponible: boolean = true;
    let contador = 0;
    for (let i = 0; i <= Number(Math.ceil(servicio.duracion_MIN / this.tiempoDisponibilidad) - 1); i++) {
      contador = i;
      let horaInicio = moment(ultimoHorario).add(i * this.tiempoDisponibilidad, 'minutes').toDate();

      let disponibilidadEncontrada = this.horario.find(disponibilidad =>
        disponibilidad.fechaInicio.getTime() === horaInicio.getTime()
      );

      if (!disponibilidadEncontrada || disponibilidadEncontrada.estado !== this.constantes.ESTADOS_RESERVA.DISPONIBLE) {
        disponible = false;
        break;
      } else {
        reserva = {
          cliente: this.usuarioServicio.getUsuario(),
          estado: disponibilidadEncontrada.estado,
          evento: disponibilidadEncontrada.evento,
          fechaFin: disponibilidadEncontrada.fechaFin,
          fechaInicio: disponibilidadEncontrada.fechaInicio,
          idcarrito: null,
          idusuario: this.usuario.id,
          nombreusuario: this.usuario.nombre,
          servicio: [servicio]
        }
        disponibilidadBloquear.push(reserva);
      }
    }

    if (disponible || (!reserva && contador > 0)) {
      this.disponibilidadBloquear.push.apply(this.disponibilidadBloquear, disponibilidadBloquear);
      this.cantidad++;
      this.carrito.push({
        servicio: [servicio],
        fechaInicio: disponibilidadBloquear[0].fechaInicio,
        fechaFin: disponibilidadBloquear[disponibilidadBloquear.length - 1].fechaFin,
        cliente: this.usuarioServicio.getUsuario(),
        estado: this.constantes.ESTADOS_RESERVA.RESERVADO,
        evento: this.constantes.EVENTOS.OTRO,
        idcarrito: this.idcarrito,
        idusuario: this.usuario.id,
        nombreusuario: this.usuario.nombre
      });
      ultimoHorario = disponibilidadBloquear[disponibilidadBloquear.length - 1].fechaFin;
      this.totalServicios += Number(servicio.valor);
      this.guardar(this.usuario);
    } else if (contador === 0) {
      this.genericAlert('Error al reservar', 'La cita se cruza con otra reserva, la reserva ha sido cancelada');
      this.navCtrl.pop();
    } else {
      this.genericAlert('Error al reservar', 'La cita se cruza con otra reserva, la reserva ha sido cancelada');
      this.navCtrl.pop();
    }
  }

  agregar(servicio: ServicioOptions) {
    this.loadUsuariosDisponibles(servicio).subscribe(data => {
      if (!data || !data[0]) {
        this.alertCtrl.create({
          title: 'Reservar',
          message: 'No es posible continuar, no hay usuarios disponibles a esta hora',
          buttons: [{
            text: 'Ok',
            handler: () => {
              this.viewCtrl.dismiss();
            }
          }]
        }).present();
      } else if (data[0]) {
        let usuarioModal = this.modalCtrl.create('UsuarioPage', {
          disponibilidad: this.disponibilidad,
          servicio: servicio,
          idempresa: this.empresa.id
        });

        usuarioModal.onDidDismiss(data => {
          if (data) {
            this.usuario = data;
            this.reservar(servicio);
          } else {
            this.viewCtrl.dismiss();
          }
        });

        usuarioModal.present();
      }
    });
  }
}
