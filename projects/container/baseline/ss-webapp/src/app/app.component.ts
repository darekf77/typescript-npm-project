import { Component, OnInit } from '@angular/core';
import { AuthController } from 'ss-common-logic/src/apps/auth/AuthController';
import { Router, ActivatedRoute, NavigationEnd } from '@angular/router';
import { stringifyToQueryParams } from 'ss-helpers/components';
import { ModalService } from 'ss-components/components';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(
    public auth: AuthController,
    public router: Router,
    public route: ActivatedRoute,
    public modal: ModalService,
  ) {



  }

  ngOnInit() {


    console.log('ENV', ENV)
    this.auth.isLoggedIn.subscribe(login => {
      if (login) {
        this.router.navigateByUrl(`/dashboard?${stringifyToQueryParams(this.route.snapshot.queryParams)}`)
      } else {
        this.router.navigateByUrl('/')
      }
    })
  }

}
