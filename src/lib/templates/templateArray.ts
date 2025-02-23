import { buttonTemplates } from './button';
import { lightTemplates } from './light';
import { shutterTemplates } from './shutter';
import { textTemplates } from './text';
import { scriptTemplates } from './script';
import { numberTemplates } from './number';

export const pageItemTemplates = Object.assign(
    textTemplates,
    shutterTemplates,
    lightTemplates,
    buttonTemplates,
    scriptTemplates,
    numberTemplates,
);
