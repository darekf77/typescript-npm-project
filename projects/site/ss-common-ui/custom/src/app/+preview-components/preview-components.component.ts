import {  menuLeft as baselineMenuLeft } from 'baseline/ss-common-ui/src/app/+preview-components/preview-components.component';

baselineMenuLeft.push(
  {
    group: 'Custom Site Components'
  }, {
    name: 'buildtnpprocess',
    href: '/previewcomponents/buildtnpprocess',
  });

export const menuLeft = baselineMenuLeft;

export {
  PreviewComponents
} from 'baseline/ss-common-ui/src/app/+preview-components/preview-components.component';
