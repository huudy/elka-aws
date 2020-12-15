import { Component, OnInit } from '@angular/core';
import { AlertService } from '../alert.service';
import { Subscription } from 'rxjs';

@Component({
	selector: 'alert',
	templateUrl: './alert.component.html',
	styleUrls: ['./alert.component.scss']
})
export class AlertComponent implements OnInit {
	private subscription: Subscription;
	message;
	constructor(private alertService: AlertService) {}

	ngOnInit() {
		this.subscription = this.alertService.getAlert().subscribe(message => {
			console.log('alert component');
			console.log(message);

			switch (message && message.type) {
				case 'success':
					message.cssClass = 'alert alert-success';
					break;
				case 'error':
					message.cssClass = 'alert alert-danger';
					break;
			}

			this.message = message;
		});
	}

	close() {
		this.alertService.clear();
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}
}

export default class Message {
	text: string;
	cssClass: string;
	icon: string;
}
