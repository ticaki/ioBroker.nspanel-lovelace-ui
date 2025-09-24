import { BaseClass, type AdapterClassDefinition } from '../controller/library';

export class Templates extends BaseClass {
    constructor(adapter: AdapterClassDefinition) {
        super(adapter, 'templates');
    }
}
