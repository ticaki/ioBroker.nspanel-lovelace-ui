import { BaseClass, type AdapterClassDefinition } from './library';

export class Templates extends BaseClass {
    constructor(adapter: AdapterClassDefinition) {
        super(adapter, 'templates');
    }
}
