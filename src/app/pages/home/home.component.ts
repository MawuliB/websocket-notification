import { Component } from '@angular/core';
import { MyStompService } from '../../services/my-stomp.service';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  notifications: any[] = [];
  count = 0;
  successMessage = '';
  id: string | null = null;
  isNotificationVisible = false;

  constructor(
    private myStompService: MyStompService,
    private fb: FormBuilder,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.myStompService.connected$.subscribe(() => {});
  }
  onConnected() {
    // Subscriptions
    this.myStompService.stompClient.subscribe(
      `/user/public`,
      this.onMessageReceived.bind(this)
    );
  }

  setNotificationToSeen(notificationId: string) {
    if (this.id !== null) {
      this.http
        .post(`http://localhost:8085/notification/seen/${notificationId}`, {})
        .subscribe(
          (response: any) => {
            console.log(response, this.id);
            this.fetchNotifications(this.id!);
          },
          (error) => {
            console.error('Error setting notification to seen:', error);
          }
        );
    }
  }

  markAllAsSeen() {
    if (this.id !== null) {
      this.http
        .post(`http://localhost:8085/notification/seen/all/${this.id}`, {})
        .subscribe(
          (response: any) => {
            console.log(response, this.id);
            this.fetchNotifications(this.id!);
          },
          (error) => {
            console.error('Error setting all notifications to seen:', error);
          }
        );
    }
  }

  deleteNotification(notificationId: string) {
    console.log('Deleting notification:', notificationId);
    if (this.id !== null) {
      this.http
        .delete(`http://localhost:8085/notification/${notificationId}`)
        .subscribe(
          (response: any) => {
            console.log(response, this.id);
            this.fetchNotifications(this.id!);
          },
          (error) => {
            console.error('Error deleting notification:', error);
          }
        );
    }
  }

  fetchNotifications(id: string) {
    this.http.get(`http://localhost:8085/notification/${id}`).subscribe(
      (response: any) => {
        this.notifications = response;
        this.count = this.handleNotificationCount();
      },
      (error) => {
        console.error('Error fetching notifications:', error);
      }
    );
  }

  handleNotification(notification: {
    ownerId: string;
    content: string | null;
    timestamp: Date;
  }) {
    if (notification.content !== null) {
      notification.timestamp = new Date();
      if (this.myStompService.stompClient.connected) {
        this.myStompService.stompClient.send(
          '/app/notification',
          {},
          JSON.stringify(notification)
        );
      }
    } else {
      console.log('Invalid notification content');
    }
  }

  private addNotification(notification: {
    id: string;
    content: string | null;
    typeOfNotification: string;
    seen: boolean;
    timestamp: number;
  }) {
    this.notifications.unshift(notification);
    this.count = this.handleNotificationCount();
  }

  handleNotificationCount() {
    return this.notifications.length;
  }

  // Handle the notification received event
  async onMessageReceived(payload: any) {
    const message = JSON.parse(payload.body);
    console.log('Message received:', message);
    this.addNotification(message);
  }

  subscribeNotificationForm = this.fb.group({
    id: [''],
  });

  subscribeNotification() {
    const id = this.subscribeNotificationForm.value.id;
    console.log('Subscribing to topic:', id);
    if (id) {
      this.myStompService.stompClient.subscribe(
        `/user/${id}/topic/notification`,
        this.onMessageReceived.bind(this)
      );
      this.id = id;
      this.successMessage = `Subscribed to topic: ${id}`;
      this.fetchNotifications(id);
      this.subscribeNotificationForm.reset();
    }
  }

  // Subscription to the notification topic
  subscribeToNotifications(id: string) {
    this.myStompService.stompClient.subscribe(
      `/user/${id}/topic/notification`,
      this.onMessageReceived.bind(this)
    );
  }

  sendNotificationForm = this.fb.group({
    content: [''],
  });

  sendNotification() {
    const content = this.sendNotificationForm.value.content;
    console.log('Sending notification:', content);
    console.log('ID:', this.id);
    if (content && this.id) {
      const notification = {
        ownerId: this.id,
        content: content,
        timestamp: new Date(),
      };
      this.handleNotification(notification);
      this.sendNotificationForm.reset();
    } else {
      console.log('Invalid notification content or id');
    }
  }

  showNotification() {
    this.isNotificationVisible = !this.isNotificationVisible;
    this.handleNotificationCount();
  }
}
