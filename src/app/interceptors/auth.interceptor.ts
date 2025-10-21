import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable, throwError, catchError } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const clone= request.clone({ withCredentials: true });
    
    return next.handle(clone).pipe(
      catchError(err => {
        if (err.status === 401) {
          // Manejar el error 401 (no autorizado)
          this.authService.logout(); // Cerrar sesión si es necesario
          // Redirigir al usuario a la página de login o mostrar un mensaje
        }        return throwError(()=> err);
    }));
  }
}