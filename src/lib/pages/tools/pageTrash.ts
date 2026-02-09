import { Color } from '../../const/Color';
//import * as fs from 'node:fs';
import type { CalendarComponent } from 'node-ical';
import iCal from 'node-ical';
import { type AdapterClassDefinition } from '../../controller/library';

interface ItemObject {
    icon: string;
    color: { r: number; g: number; b: number };
    text: string;
    text1: string;
}

type entry = {
    trashFile: string;
    countItems?: number;
    items: item[];
};

type item = {
    textTrash: string;
    customTrash: string;
    iconColor: string;
};

export async function getTrashDataFromState(
    trashJSON: any,
    entry: entry,
): Promise<{ messages: ItemObject[]; error?: any }> {
    const items: ItemObject[] = [];
    const countItems = entry.countItems ?? 6;

    try {
        // Parse trashJSON wenn es ein String ist
        let trashData: any[];
        if (typeof trashJSON === 'string') {
            trashData = JSON.parse(trashJSON);
        } else if (Array.isArray(trashJSON)) {
            trashData = trashJSON;
        } else {
            return { messages: items, error: new Error('trashJSON must be a string or array ') };
        }

        // Prüfen ob trashData ein Array ist
        if (!Array.isArray(trashData)) {
            return { messages: items, error: new Error('trashData is not an  array') };
        }

        for (const trashObject of trashData) {
            const result = getTrashItem(
                { start: trashObject._date, summary: trashObject.event },
                countItems,
                entry.items,
            );
            if (result) {
                items.push(result);
            }

            if (items.length >= 6) {
                break;
            }
        }

        return { messages: items };
    } catch (error) {
        return { messages: items, error };
    }
}

export async function getTrashDataFromFile(
    entry: entry,
    adapter: AdapterClassDefinition,
): Promise<{ messages: ItemObject[]; error?: any }> {
    const items: ItemObject[] = [];
    const trashFile = entry.trashFile;
    const countItems = entry.countItems ?? 6;

    try {
        // Prüfe ob Datei existiert
        if (!(await adapter.fileExistsAsync(adapter.namespace, trashFile))) {
            return { messages: items, error: `File ${trashFile} does not exist in ioBroker files` };
        }

        // Lese Datei
        let fileData: any;
        try {
            fileData = (await adapter.readFileAsync(adapter.namespace, trashFile)).file.toString('utf-8');
        } catch (readError) {
            console.error(`Error reading ${trashFile} from ioBroker files:`, readError);
            return { messages: items, error: readError };
        }

        // Parse ICS-Daten (synchron mit parseICS statt parseFile)
        const data = iCal.parseICS(fileData);

        // Filter und sortiere Events nach Startdatum
        const arrayData: CalendarComponent[] = Object.values(data).filter(
            entry =>
                entry &&
                typeof entry === 'object' &&
                entry.type === 'VEVENT' &&
                new Date(entry.start).setHours(0, 0, 0, 0) >= new Date().setHours(0, 0, 0, 0),
        );

        arrayData.sort((a: any, b: any) => {
            const dateA = new Date(a.start).getTime();
            const dateB = new Date(b.start).getTime();
            return dateA - dateB;
        });

        // Iteriere über Events
        for (const event of arrayData) {
            if (event.type === 'VEVENT') {
                const result = getTrashItem(event, countItems, entry.items);
                if (result) {
                    items.push(result);
                }

                if (items.length >= 6) {
                    break;
                }
            }
        }

        return { messages: items };
    } catch (error) {
        console.error('Error in getTrashDataFromFile:', error);
        return { messages: items, error };
    }
}

function getTrashItem(event: Partial<iCal.VEvent>, countItems: number, items: item[]): ItemObject | null {
    const eventName = event.summary;

    // Prüfen ob event existiert
    if (!eventName || eventName.trim() === '') {
        return null;
    }
    let trashIndex = -1;
    for (let i = 0; i < items.length; i++) {
        if (items[i].textTrash && items[i].textTrash.trim() !== '' && eventName.includes(items[i].textTrash)) {
            trashIndex = i;
            break;
        }
    }
    if (trashIndex === -1) {
        return null;
    }
    const item = items[trashIndex];
    const trashType = item.textTrash || '';
    const customTrash = item.customTrash || '';
    const iconColor = item.iconColor || '';
    const eventStartdatum = new Date(event.start || 1);
    let eventDatum = '';
    const tempDate = new Date(eventStartdatum).setHours(0, 0, 0, 0);
    if (tempDate === new Date().setHours(0, 0, 0, 0)) {
        eventDatum = 'today';
    } else if (tempDate === new Date(Date.now() + 24 * 60 * 60 * 1000).setHours(0, 0, 0, 0)) {
        eventDatum = 'tomorrow';
    } else {
        eventDatum =
            (countItems < 6
                ? eventStartdatum.toLocaleString('de-DE', {
                      year: '2-digit',
                      month: '2-digit',
                      day: '2-digit',
                  })
                : eventStartdatum.toLocaleString('de-DE', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                  })) || '';
    }

    return {
        icon: 'trash-can',
        color: Color.ConvertHexToRgb(iconColor),
        text: customTrash && customTrash !== '' ? customTrash : trashType,
        text1: eventDatum,
    };
}
