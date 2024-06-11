import { Injectable } from '@angular/core';
import SockJS from 'sockjs-client';
import * as Stomp from 'stompjs';
import { ReplaySubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MyStompService {
  private url = "http://localhost:8085";
  private socket: any;
  public stompClient: any;
  private connectedSource = new ReplaySubject<void>(1);
  connected$ = this.connectedSource.asObservable();
  TOKEN = localStorage.getItem('token');

  constructor() {
    this.initializeWebSocketConnection();
  }

  private initializeWebSocketConnection() {
    this.socket = new SockJS(`${this.url}/ws`);
    this.stompClient = Stomp.over(this.socket);
    // this.stompClient.debug = () => {}; // Disable debug messages

    this.stompClient.connect(
      {},
      this.onConnected.bind(this),
      this.onError.bind(this)
    );
  }

  private onConnected() {
    // Reset retry count upon successful connection
    this.retryCount = 0;

    this.connectedSource.next();

    this.stompClient.ws.onclose = this.onWebSocketClose.bind(this); // Handle WebSocket close
  }

  private retryCount = 0;
  private maxRetries = 6;

  private onError(error: any) {
    console.error('WebSocket connection error:', error);
    console.error('STOMP error:', error.headers, error.body);

    // Attempt to reconnect after 1 second if retry count is less than max retries
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      setTimeout(() => {
        this.initializeWebSocketConnection();
      }, 1000);
    } else {
      console.error('Max retries reached. Stopping reconnection attempts.');
    }
  }

  private onWebSocketClose() {
    console.log('WebSocket connection closed');
    // Reconnect after WebSocket closes
    this.initializeWebSocketConnection();
  }
}
