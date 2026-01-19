import { Color } from '../../const/Color';

interface ItemObject {
    icon: string;
    color: { r: number; g: number; b: number };
    text: string;
    text1: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const data = [
    {
        date: 'Heute  ',
        event: 'Welsestraße - Gelber Sack',
        _class: 'ical_Abfall ical_today',
        _date: '2026-01-12T23:00:00.000Z',
        _end: '2026-01-13T23:00:00.000Z',
        _IDID: '593336@mymuell.de',
        _allDay: true,
        _private: false,
        _rule: ' ',
        location: '',
        _calName: 'Abfall',
        _calColor: '#000000',
        _object: {
            type: 'VEVENT',
            params: [],
            uid: '593336@mymuell.de',
            summary: 'Welsestraße - Gelber Sack',
            dtstamp: '2025-12-23T23:53:02.000Z',
            start: '2026-01-12T23:00:00.000Z',
            datetype: 'date',
            end: '2026-01-13T23:00:00.000Z',
        },
    },
    {
        date: 'In einer Woche  ',
        event: 'Welsestraße - Hausmüll',
        _class: 'ical_Abfall ical_oneweek',
        _date: '2026-01-19T23:00:00.000Z',
        _end: '2026-01-20T23:00:00.000Z',
        _IDID: '377046@mymuell.de',
        _allDay: true,
        _private: false,
        _rule: ' ',
        location: '',
        _calName: 'Abfall',
        _calColor: '#000000',
        _object: {
            type: 'VEVENT',
            params: [],
            uid: '377046@mymuell.de',
            summary: 'Welsestraße - Hausmüll',
            dtstamp: '2025-12-23T23:53:02.000Z',
            start: '2026-01-19T23:00:00.000Z',
            datetype: 'date',
            end: '2026-01-20T23:00:00.000Z',
        },
    },
    {
        date: '23.01.2026  ',
        event: 'Welsestraße - Biomüll',
        _class: 'ical_Abfall ',
        _date: '2026-01-22T23:00:00.000Z',
        _end: '2026-01-23T23:00:00.000Z',
        _IDID: '401187@mymuell.de',
        _allDay: true,
        _private: false,
        _rule: ' ',
        location: '',
        _calName: 'Abfall',
        _calColor: '#000000',
        _object: {
            type: 'VEVENT',
            params: [],
            uid: '401187@mymuell.de',
            summary: 'Welsestraße - Biomüll',
            dtstamp: '2025-12-23T23:53:02.000Z',
            start: '2026-01-22T23:00:00.000Z',
            datetype: 'date',
            end: '2026-01-23T23:00:00.000Z',
        },
    },
    {
        date: '03.02.2026  ',
        event: 'Welsestraße - Papier',
        _class: 'ical_Abfall ',
        _date: '2026-02-02T23:00:00.000Z',
        _end: '2026-02-03T23:00:00.000Z',
        _IDID: '591845@mymuell.de',
        _allDay: true,
        _private: false,
        _rule: ' ',
        location: '',
        _calName: 'Abfall',
        _calColor: '#000000',
        _object: {
            type: 'VEVENT',
            params: [],
            uid: '591845@mymuell.de',
            summary: 'Welsestraße - Papier',
            dtstamp: '2025-12-23T23:53:02.000Z',
            start: '2026-02-02T23:00:00.000Z',
            datetype: 'date',
            end: '2026-02-03T23:00:00.000Z',
        },
    },
    {
        date: '03.02.2026  ',
        event: 'Welsestraße - Gelber Sack',
        _class: 'ical_Abfall ',
        _date: '2026-02-02T23:00:00.000Z',
        _end: '2026-02-03T23:00:00.000Z',
        _IDID: '405421@mymuell.de',
        _allDay: true,
        _private: false,
        _rule: ' ',
        location: '',
        _calName: 'Abfall',
        _calColor: '#000000',
        _object: {
            type: 'VEVENT',
            params: [],
            uid: '405421@mymuell.de',
            summary: 'Welsestraße - Gelber Sack',
            dtstamp: '2025-12-23T23:53:02.000Z',
            start: '2026-02-02T23:00:00.000Z',
            datetype: 'date',
            end: '2026-02-03T23:00:00.000Z',
        },
    },
    {
        date: '06.02.2026  ',
        event: 'Welsestraße - Biomüll',
        _class: 'ical_Abfall ',
        _date: '2026-02-05T23:00:00.000Z',
        _end: '2026-02-06T23:00:00.000Z',
        _IDID: '862129@mymuell.de',
        _allDay: true,
        _private: false,
        _rule: ' ',
        location: '',
        _calName: 'Abfall',
        _calColor: '#000000',
        _object: {
            type: 'VEVENT',
            params: [],
            uid: '862129@mymuell.de',
            summary: 'Welsestraße - Biomüll',
            dtstamp: '2025-12-23T23:53:02.000Z',
            start: '2026-02-05T23:00:00.000Z',
            datetype: 'date',
            end: '2026-02-06T23:00:00.000Z',
        },
    },
    {
        date: '10.02.2026  ',
        event: 'Welsestraße - Hausmüll',
        _class: 'ical_Abfall ',
        _date: '2026-02-09T23:00:00.000Z',
        _end: '2026-02-10T23:00:00.000Z',
        _IDID: '651257@mymuell.de',
        _allDay: true,
        _private: false,
        _rule: ' ',
        location: '',
        _calName: 'Abfall',
        _calColor: '#000000',
        _object: {
            type: 'VEVENT',
            params: [],
            uid: '651257@mymuell.de',
            summary: 'Welsestraße - Hausmüll',
            dtstamp: '2025-12-23T23:53:02.000Z',
            start: '2026-02-09T23:00:00.000Z',
            datetype: 'date',
            end: '2026-02-10T23:00:00.000Z',
        },
    },
];

export async function getTrash(
    trashJSON: any,
    leftChar: number,
    rightChar: number,
    trashtype1: string = '',
    trashtype2: string = '',
    trashtype3: string = '',
    trashtype4: string = '',
    trashtype5: string = '',
    trashtype6: string = '',
    customTrash1: string = '',
    customTrash2: string = '',
    customTrash3: string = '',
    customTrash4: string = '',
    customTrash5: string = '',
    customTrash6: string = '',
    iconColor1: string = '',
    iconColor2: string = '',
    iconColor3: string = '',
    iconColor4: string = '',
    iconColor5: string = '',
    iconColor6: string = '',
): Promise<{ messages: ItemObject[]; error?: any }> {
    const items: ItemObject[] = [];

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
            return { messages: items, error: new Error('trashData is not an array') };
        }

        const currentDate = new Date();
        let entryCount = 0;

        // Direkt über das Array iterieren, nicht über Object.entries()
        for (const trashObject of trashData) {
            let eventName = trashObject.event;

            // Prüfen ob event existiert
            if (!eventName) {
                continue;
            }

            // String-Verarbeitung mit Sicherheitsprüfung
            if (leftChar > 0 || rightChar > 0) {
                const endPos = rightChar > 0 ? eventName.length - rightChar : eventName.length;
                eventName = eventName.substring(leftChar, endPos);
            }
            eventName = eventName.trim();

            const eventDatum = trashObject.date?.trim() || '';
            const eventStartdatum = new Date(trashObject._date);

            // Nur zukünftige Events
            if (currentDate.getTime() > eventStartdatum.getTime()) {
                continue;
            }

            // Prüfe ob Event zu einem der Trash-Types gehört
            const trashTypes = [trashtype1, trashtype2, trashtype3, trashtype4, trashtype5, trashtype6];
            const customTrash = [customTrash1, customTrash2, customTrash3, customTrash4, customTrash5, customTrash6];
            const iconColor = [iconColor1, iconColor2, iconColor3, iconColor4, iconColor5, iconColor6];

            // Finde passenden Trash-Type (case-insensitive und nur nicht-leere)
            let trashIndex = -1;
            for (let i = 0; i < trashTypes.length; i++) {
                if (trashTypes[i] && trashTypes[i].trim() !== '' && trashTypes[i].includes(eventName)) {
                    trashIndex = i;
                    break;
                }
            }

            if (trashIndex !== -1) {
                items.push({
                    icon: 'trash_can',
                    color: Color.ConvertHexToRgb(iconColor[trashIndex]),
                    text:
                        customTrash[trashIndex] && customTrash[trashIndex] !== '' ? customTrash[trashIndex] : eventName,
                    text1: eventDatum,
                });

                entryCount++;

                // Maximal 6 Einträge
                if (entryCount >= 6) {
                    break;
                }
            }
        }

        return { messages: items };
    } catch (error) {
        return { messages: items, error };
    }
}
