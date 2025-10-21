import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';

export interface User {
  _id: string;
  user: string;
  gmail: string;
  birthday: Date;
  eventos: string[];
}

export interface LoginResponse {
  message: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    // Verificar si hay un usuario en localStorage al inicializar
    const savedUser = localStorage.getItem('currentUser');
  if (savedUser && savedUser !== 'undefined') {
  try {
    this.currentUserSubject.next(JSON.parse(savedUser));
  } catch (e) {
    console.error('Error parsing saved user:', e);
    localStorage.removeItem('currentUser'); // limpiar dato corrupto
  }
}

  }

  login(username: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/user/auth/login`, {username, password} ).pipe(
      tap(response => {
        if (response.user) {
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.currentUserSubject.value;
  }

  // Método para crear admin (solo desarrollo)
  createAdminUser(): Observable<any> {
    return this.http.post(`${this.apiUrl}/user/auth/create-admin`, {}, { withCredentials: true });
  }
}