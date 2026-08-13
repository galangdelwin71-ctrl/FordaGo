import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { API_BASE_URL } from '../config/api.config';

export interface Product {
  id?: number;
  name: string;
  brand?: string;
  price: number;
  stock: number;
  image_url?: string;
  created_at?: string;
}

export interface Order {
  id?: number;
  user_id?: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  total: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private apiUrl = `${API_BASE_URL}/inventory`;
  private productsSubject = new BehaviorSubject<Product[]>([]);
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  public products$ = this.productsSubject.asObservable();
  public orders$ = this.ordersSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadProducts();
    this.loadMyOrders();
  }

  loadProducts(): void {
    this.http.get<Product[]>(`${this.apiUrl}/products`).pipe(
      tap(products => this.productsSubject.next(products)),
      catchError(err => {
        console.error('Failed to load products:', err);
        return throwError(() => new Error('Failed to load products'));
      })
    ).subscribe();
  }

  loadMyOrders(): void {
    this.http.get<Order[]>(`${this.apiUrl}/my-orders`).pipe(
      tap(orders => this.ordersSubject.next(orders)),
      catchError(err => {
        console.error('Failed to load orders:', err);
        return throwError(() => new Error('Failed to load orders'));
      })
    ).subscribe();
  }

  getProducts(): Product[] {
    return this.productsSubject.value;
  }

  getOrders(): Order[] {
    return this.ordersSubject.value;
  }

  createProduct(data: Product): Observable<Product> {
    return this.http.post<Product>(`${this.apiUrl}/products`, data).pipe(
      tap(product => {
        const current = this.productsSubject.value;
        this.productsSubject.next([...current, product]);
      }),
      catchError(err => this.handleError(err))
    );
  }

  updateProduct(id: number, data: Partial<Product>): Observable<any> {
    return this.http.put(`${this.apiUrl}/products/${id}`, data).pipe(
      tap(() => {
        const current = this.productsSubject.value;
        const updated = current.map(p => p.id === id ? { ...p, ...data } : p);
        this.productsSubject.next(updated);
      }),
      catchError(err => this.handleError(err))
    );
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${id}`).pipe(
      tap(() => {
        const current = this.productsSubject.value;
        this.productsSubject.next(current.filter(p => p.id !== id));
      }),
      catchError(err => this.handleError(err))
    );
  }

  placeOrder(data: Partial<Order>): Observable<Order> {
    return this.http.post<Order>(`${this.apiUrl}/orders`, data).pipe(
      tap(order => {
        const current = this.ordersSubject.value;
        this.ordersSubject.next([...current, order]);
      }),
      catchError(err => this.handleError(err))
    );
  }

  approveOrder(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/orders/${id}/approve`, {}).pipe(
      tap(() => this.loadMyOrders()),
      catchError(err => this.handleError(err))
    );
  }

  rejectOrder(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/orders/${id}/reject`, {}).pipe(
      tap(() => this.loadMyOrders()),
      catchError(err => this.handleError(err))
    );
  }

  private handleError(err: HttpErrorResponse) {
    let message: string;
    if (err.status === 0) {
      message = 'Cannot reach the server.';
    } else {
      message = err.error?.message || 'Error with inventory operation';
    }
    return throwError(() => ({ error: { message }, status: err.status }));
  }
}