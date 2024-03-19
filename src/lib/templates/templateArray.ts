import { buttonTemplates } from './button';
import { lightTemplates } from './light';
import { shutterTemplates } from './shutter';
import { textTemplates } from './text';

export const pageItemTemplates = Object.assign(
    textTemplates,
    shutterTemplates,
    lightTemplates,
    buttonTemplates,
    scrpitTemplates,
);
