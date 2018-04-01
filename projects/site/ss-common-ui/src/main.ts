import { enableProdMode, Injector } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';


import {
  AppModule,
  SliderVerticalComponent as SliderVerticalComponentBaseline
} from 'baseline-ss-common-ui';
import { environment } from './environments/environment';
import 'hammerjs';
import { SliderVerticalComponentDecorator } from '../components/src/preview/preview-slider-vertical/preview-slider-vertical.component';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule, {
  providers: [ // DOESNT WORK !!!
    [
      {
        provide: SliderVerticalComponentBaseline,
        useClass: SliderVerticalComponentDecorator,
        deps: [],
      }
    ]
  ]
});
