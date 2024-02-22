import { buttonTemplates } from './button';
import { lightTemplates } from './light';
import { shutterTemplates } from './shutter';
import { textTemplates } from './text';

export const pageItemTemplates = textTemplates.concat(shutterTemplates, lightTemplates, buttonTemplates);
