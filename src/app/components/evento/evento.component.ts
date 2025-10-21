import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Evento } from '../../models/evento.model';
import { EventoService } from '../../services/evento.service';
import { User } from '../../models/user.model';
import { UserService } from '../../services/user.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-evento',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './evento.component.html',
  styleUrls: ['./evento.component.css']
})
export class EventoComponent implements OnInit {
  eventos: Evento[] = [];
  users: User[] = [];
  availableUsers: User[] = [];
  selectedUsers: User[] = [];

  newEvent: Evento = { name: '', schedule: '', address: '', participantes: [] };
  dateStr: string = '';
  timeStr: string = '';
  errorMessage = '';

  // control de modales
  showDeleteModal = false;
  showUpdateModal = false;
  pendingDeleteIndex: number | null = null;
  pendingUpdateEvent: Evento | null = null;
  pendingUpdateIndex: number | null = null;

  // control de formulario
  formSubmitted = false;

  // paginación
  availablePage = 1;
  availablePageSize = 6;
  selectedPage = 1;
  selectedPageSize = 6;

  constructor(
    private eventoService: EventoService,
    private userService: UserService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.loadEventos();
    this.loadUsers();
  }

  // ===== CARGA DE DATOS =====
  private loadEventos(): void {
    this.eventoService.getEventos().subscribe({
      next: (evts) => {
        this.eventos = evts.map(e => ({
          ...e,
          // Normalizamos schedule para que siempre sea string
          schedule: Array.isArray(e.schedule)
            ? (e.schedule.length ? e.schedule[0] : '')
            : (e.schedule ?? ''),
          participantes: Array.isArray((e as any).participantes)
            ? (e as any).participantes
            : ((e as any).participants || [])
        }));
      },
      error: () => this.errorMessage = 'Error al cargar eventos.'
    });
  }

  private loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.availableUsers = [...this.users];
      },
      error: () => this.errorMessage = 'Error al cargar usuarios.'
    });
  }

  // ===== NAVEGACIÓN =====
  goHome(): void {
    this.location.back();
  }

  // ===== HORARIO =====
  setSchedule(): void {
    this.errorMessage = '';
    if (!this.dateStr || !this.timeStr) {
      this.errorMessage = 'Selecciona fecha y hora.';
      return;
    }
    // Guardamos como string (formato backend)
    this.newEvent.schedule = `${this.dateStr} ${this.timeStr}`;
  }

  clearSchedule(): void {
    this.newEvent.schedule = '';
    this.dateStr = '';
    this.timeStr = '';
  }

  // ===== PARTICIPANTES =====
  addParticipant(u: User): void {
    if (!u?._id) return;
    this.availableUsers = this.availableUsers.filter(x => x._id !== u._id);
    if (!this.selectedUsers.find(x => x._id === u._id)) this.selectedUsers.push(u);
    this.syncParticipantsIds();
  }

  removeParticipant(u: User): void {
    if (!u?._id) return;
    this.selectedUsers = this.selectedUsers.filter(x => x._id !== u._id);
    if (!this.availableUsers.find(x => x._id === u._id)) this.availableUsers.push(u);
    this.syncParticipantsIds();
  }

  private syncParticipantsIds(): void {
    this.newEvent.participantes = this.selectedUsers.map(u => u._id!).filter(Boolean);
  }

  // ===== CREAR / EDITAR EVENTO =====
  onSubmit(): void {
    this.formSubmitted = true;
    this.errorMessage = '';
    this.syncParticipantsIds();

    if (!this.newEvent.name?.trim()) {
      this.errorMessage = 'El título del evento es obligatorio.';
      return;
    }
    if (!this.newEvent.schedule?.toString().trim()) {
      this.errorMessage = 'Selecciona el horario del evento.';
      return;
    }
    if (!this.newEvent.address?.trim()) {
      this.errorMessage = 'La dirección es obligatoria.';
      return;
    }

    // si estamos editando
    if (this.pendingUpdateEvent && this.pendingUpdateIndex !== null) {
      const actualizado: Evento = { ...this.newEvent, _id: this.pendingUpdateEvent._id };
      this.pendingUpdateEvent = actualizado;
      this.showUpdateModal = true;
      return;
    }

    // crear evento nuevo
    this.eventoService.addEvento(this.newEvent).subscribe({
      next: (created) => {
        this.eventos.push(created);
        this.resetForm();
      },
      error: () => this.errorMessage = 'Error al crear evento.'
    });
  }

  confirmarUpdate(): void {
    if (!this.pendingUpdateEvent || this.pendingUpdateIndex == null) {
      this.closeUpdateModal();
      return;
    }

    this.eventoService.updateEvento(this.pendingUpdateEvent._id!, this.pendingUpdateEvent).subscribe({
      next: (updated: Evento) => {
        this.eventos[this.pendingUpdateIndex!] = { ...updated };
        this.closeUpdateModal();
        this.resetForm();
      },
      error: () => {
        this.errorMessage = 'Error al actualizar el evento.';
        this.closeUpdateModal();
      }
    });
  }

  prepararEdicion(evt: Evento, index: number): void {
    this.pendingUpdateEvent = { ...evt };
    this.pendingUpdateIndex = index;
    this.newEvent = { ...evt };

    const sched = Array.isArray(evt.schedule)
      ? (evt.schedule.length ? evt.schedule[0] : '')
      : evt.schedule;

    if (sched) {
      const [date, time] = sched.split(' ');
      this.dateStr = date;
      this.timeStr = time;
    }

    const participantes = evt.participantes ?? [];
    this.selectedUsers = this.users.filter(u => participantes.includes(u._id!));
    this.availableUsers = this.users.filter(u => !participantes.includes(u._id!));
  }

  cancelarEdicion(): void {
    this.pendingUpdateEvent = null;
    this.pendingUpdateIndex = null;
    this.resetForm();
  }

  closeUpdateModal(): void {
    this.showUpdateModal = false;
    this.pendingUpdateEvent = null;
    this.pendingUpdateIndex = null;
  }

  // ===== ELIMINAR EVENTO =====
  openDeleteModal(index: number): void {
    this.pendingDeleteIndex = index;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.pendingDeleteIndex = null;
    this.showDeleteModal = false;
  }

  confirmarEliminar(): void {
    if (this.pendingDeleteIndex == null) {
      this.closeDeleteModal();
      return;
    }
    const idx = this.pendingDeleteIndex;
    const evt = this.eventos[idx];

    if (!evt._id) {
      alert('El evento no está guardado en la base de datos.');
      this.closeDeleteModal();
      return;
    }

    this.eventoService.deleteEvento(evt._id).subscribe({
      next: () => {
        this.eventos.splice(idx, 1);
        this.closeDeleteModal();
      },
      error: () => {
        this.errorMessage = 'Error al eliminar evento.';
        this.closeDeleteModal();
      }
    });
  }

  // ===== FORMATEADORES =====
  getScheduleText(e: Evento): string {
    return this.formatSchedule(e.schedule);
  }

  formatSchedule(s: string | string[] | undefined | null): string {
    if (!s) return '-';
    if (Array.isArray(s)) s = s[0];
    if (typeof s !== 'string') return '-';

    const sep = s.includes('T') ? 'T' : ' ';
    const [d, t = ''] = s.split(sep);
    const [y, m, d2] = d.split('-');
    const hhmm = t.slice(0, 5);
    return `${d2}-${m}-${y}${hhmm ? ' ' + hhmm : ''}`;
  }

  getEventAddress(e: any): string {
    return e?.address ?? '-';
  }

  getParticipantsNames(e: any): string {
    const ids = e.participantes ?? [];
    const names = ids.map((id: string | any) => this.getUserNameById(id)).filter(Boolean);
    return names.length ? names.join(', ') : '-';
  }

  private getUserNameById(idOrObj: any): string {
    if (idOrObj && typeof idOrObj === 'object') {
      if (idOrObj.username) return idOrObj.username;
      if (idOrObj._id) {
        const u = this.users.find(x => x._id === idOrObj._id);
        return u ? u.username : idOrObj._id;
      }
    }
    const u = this.users.find(x => x._id === idOrObj);
    return u ? u.username : (idOrObj || '');
  }

  // ===== PAGINACIÓN =====
  get availableTotalPages(): number {
    return Math.max(1, Math.ceil(this.availableUsers.length / this.availablePageSize));
  }
  get selectedTotalPages(): number {
    return Math.max(1, Math.ceil(this.selectedUsers.length / this.selectedPageSize));
  }

  get availablePageItems(): User[] {
    const start = (this.availablePage - 1) * this.availablePageSize;
    return this.availableUsers.slice(start, start + this.availablePageSize);
  }
  get selectedPageItems(): User[] {
    const start = (this.selectedPage - 1) * this.selectedPageSize;
    return this.selectedUsers.slice(start, start + this.selectedPageSize);
  }

  availablePrevPage(): void {
    if (this.availablePage > 1) this.availablePage--;
  }
  availableNextPage(): void {
    if (this.availablePage < this.availableTotalPages) this.availablePage++;
  }
  setAvailablePageSize(v: string): void {
    this.availablePageSize = parseInt(v, 10) || 5;
    this.availablePage = 1;
  }

  selectedPrevPage(): void {
    if (this.selectedPage > 1) this.selectedPage--;
  }
  selectedNextPage(): void {
    if (this.selectedPage < this.selectedTotalPages) this.selectedPage++;
  }
  setSelectedPageSize(v: string): void {
    this.selectedPageSize = parseInt(v, 10) || 5;
    this.selectedPage = 1;
  }

  private resetForm(): void {
    this.newEvent = { name: '', schedule: '', address: '', participantes: [] };
    this.dateStr = '';
    this.timeStr = '';
    this.selectedUsers = [];
    this.availableUsers = [...this.users];
    this.errorMessage = '';
    this.formSubmitted = false;
  }
}
