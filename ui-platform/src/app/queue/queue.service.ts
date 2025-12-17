import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable, Subject } from "rxjs";

@Injectable({
    providedIn: 'root',
})
export class QueueService {

    private readonly GATEWAY_URL = 'http://localhost:8080';
    private wsUrl = 'ws://localhost:8080/ws/queue';

    constructor(private http: HttpClient) { }

    connectToQueue(eventId: string , userId : string) : Observable<any> {

        const subject = new Subject<any>();

        const socket = new WebSocket(this.wsUrl + `?eventId=${eventId}&userId=${userId}`);
        
        socket.onopen = () => {
            console.log('WebSocket connection established');
        }

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            subject.next(data);
        }
        socket.onerror = (error) => {
            subject.error('WebSocket error: ' + error);
        }
        socket.onclose = () => {
            console.log('WebSocket connection closed');
            subject.complete();
    }

    return subject.asObservable();
    }

    getBookingToken(loginToken: string , eventId : string) : Observable<any> {
        const headers = new HttpHeaders().set('Authorization', `Bearer ${loginToken}`);
        return this.http.post<any>(`${this.GATEWAY_URL}/api/v1/auth/queue-token?eventId=${eventId}`, {}, { headers });
    }
}