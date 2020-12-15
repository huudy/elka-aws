import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationStart } from '@angular/router';
import { Observable, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AlertService {
	private subject = new Subject<any>();
	private keepAfterRouteChange = false;
	constructor(private httpClient: HttpClient, private router: Router) {
		this.router.events.subscribe(event => {
			if (event instanceof NavigationStart) {
				if (this.keepAfterRouteChange) {
					this.keepAfterRouteChange = false;
				} else {
					this.clear();
				}
			}
		});
	}
	getAlert(): Observable<any> {
		return this.subject.asObservable();
	}

	success(message: string, strong: string, keepAfterRouteChange = true) {
		console.log('alert service success');
		console.log(message);

		this.keepAfterRouteChange = keepAfterRouteChange;
		this.subject.next({
			type: 'success',
			text: message,
			strong,
			icon: 'ui-2_like'
		});
	}

	error(message: string, keepAfterRouteChange = false) {
		this.keepAfterRouteChange = keepAfterRouteChange;
		console.log('alert service danger');
		console.log(message);

		this.subject.next({ type: 'danger', text: message });
	}

	clear() {
		// clear by calling subject.next() without parameters
		this.subject.next();
	}
}
