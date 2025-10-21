import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  nuevoUsuario: User = {
    username: '',
    gmail: '',
    password: '',
    birthday: new Date(),
  };

  confirmarPassword = '';
  birthdayStr = '';
  maxDate: string;
  formSubmitted = false;
  errorMessage = '';
  successMessage = '';
  isSubmitting = false;

  constructor(
    private userService: UserService,
    private router: Router
  ) {
    // Establece la fecha máxima como hoy para el input de fecha
    const today = new Date();
    this.maxDate = today.toISOString().split('T')[0];
  }


  /** Envío del formulario */
  onSubmit(form: any) {
    this.formSubmitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Validaciones básicas
    if (form.invalid) {
      this.errorMessage = 'Completa todos los campos correctamente.';
      return;
    }

    if (this.nuevoUsuario.password !== this.confirmarPassword) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.isSubmitting = true;

    // Creamos el objeto limpio
    const newUser: User = {
      username: this.nuevoUsuario.username.trim(),
      gmail: this.nuevoUsuario.gmail.trim(),
      password: this.nuevoUsuario.password.trim(),
      birthday: new Date(this.birthdayStr),
    };

    this.userService.addUser(newUser).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        console.log('Usuario registrado con éxito', response);
        // Redirige con un pequeño retraso para mostrar el mensaje
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err) => {
        console.error('Error al registrar usuario', err);
        this.isSubmitting = false;
        this.errorMessage =
          err?.error?.message ||
          'Error inesperado al registrar el usuario. Intenta nuevamente.';
      }
    });
  }

  /** Navega al login manualmente */
  goToLogin() {
    this.router.navigate(['/login']);
  }
}
