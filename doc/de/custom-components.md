# React Custom Components für die Admin-Konfiguration

Diese Dokumentation beschreibt, wie man eigene React-Komponenten für die Admin-Oberfläche des NSPanel Lovelace UI Adapters erstellt und verwendet.

## Übersicht

Der Adapter unterstützt nun die Verwendung von benutzerdefinierten React-Komponenten in der `jsonConfig.json5` Datei. Dies ermöglicht es, komplexere UI-Elemente zu erstellen, die über die Standard-Eingabefelder hinausgehen.

## Verzeichnisstruktur

```
src-admin/
├── src/
│   ├── CustomTextField.tsx    # Beispiel-Komponente für ein Textfeld
│   └── index.tsx               # Export aller Custom Components
├── public/
│   └── index.html              # HTML-Template für React
├── package.json                # Abhängigkeiten für React-Entwicklung
├── tsconfig.json               # TypeScript-Konfiguration
├── craco.config.js             # Build-Konfiguration
├── .gitignore                  # Git-Ignorierungen
└── README.md                   # Englische Dokumentation
```

## Erste Schritte

### 1. Abhängigkeiten installieren

Vor der ersten Verwendung müssen die Abhängigkeiten installiert werden:

```bash
npm run install:admin
```

### 2. Custom Components entwickeln

Erstellen Sie eine neue TypeScript/React-Datei in `src-admin/src/`:

```typescript
import React from 'react';
import { TextField } from '@mui/material';

interface MyCustomComponentProps {
    attr: string;
    schema: {
        label?: string;
        help?: string;
        placeholder?: string;
        disabled?: boolean;
        [key: string]: any;
    };
    data: Record<string, any>;
    onChange: (attr: string, value: any) => void;
}

/**
 * Meine benutzerdefinierte Komponente
 *
 * @param root0 - Component props
 * @param root0.attr - Attributname
 * @param root0.schema - Feld-Schema-Konfiguration
 * @param root0.data - Aktuelle Datenwerte
 * @param root0.onChange - Callback für Wertänderungen
 * @returns Komponente
 */
const MyCustomComponent: React.FC<MyCustomComponentProps> = ({ attr, schema, data, onChange }) => {
    const value = data[attr] || '';

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
        onChange(attr, event.target.value);
    };

    return (
        <TextField
            fullWidth
            label={schema.label || attr}
            value={value}
            onChange={handleChange}
            variant="outlined"
            helperText={schema.help || 'Meine Custom Component'}
            placeholder={schema.placeholder}
            disabled={schema.disabled}
        />
    );
};

export default MyCustomComponent;
```

### 3. Komponente exportieren

Fügen Sie Ihre Komponente in `src-admin/src/index.tsx` hinzu:

```typescript
import CustomTextField from './CustomTextField';
import MyCustomComponent from './MyCustomComponent';

export default {
    CustomTextField,
    MyCustomComponent,
};
```

### 4. Components bauen

Nach der Entwicklung müssen die Komponenten gebaut werden:

```bash
npm run build:admin
```

Dies kompiliert die React-Komponenten und platziert die Ausgabe in `admin/custom/customComponents.js`.

### 5. In jsonConfig.json5 verwenden

Referenzieren Sie Ihre Custom Component in `admin/jsonConfig.json5`:

```json5
{
    "type": "custom",
    "url": "custom/customComponents.js",
    "name": "admin/custom.MyCustomComponent",
    "attr": "meinCustomFeld",
    "label": "Mein Custom Feld",
    "help": "Dies ist eine benutzerdefinierte Komponente",
    "placeholder": "Text hier eingeben",
    "xs": 12,
    "sm": 12,
    "md": 6,
    "lg": 4,
    "xl": 4
}
```

## Eigenschaften

### Props der Custom Component

Jede Custom Component erhält folgende Props:

- **attr**: Der Attributname aus der Konfiguration
- **schema**: Das Schema-Objekt aus jsonConfig.json5 (enthält label, help, placeholder, etc.)
- **data**: Das gesamte Konfigurationsobjekt mit allen Werten
- **onChange**: Callback-Funktion zum Aktualisieren eines Wertes

### Schema-Eigenschaften

Im `schema` Objekt können Sie folgende Standard-Eigenschaften nutzen:

- `label`: Beschriftung des Feldes
- `help`: Hilfetext unter dem Feld
- `placeholder`: Platzhaltertext
- `disabled`: Ob das Feld deaktiviert ist
- Beliebige weitere Eigenschaften für Ihre Custom Component

## Beispiel: CustomTextField

Das mitgelieferte `CustomTextField` zeigt:

- Wie man Props von der Admin-Oberfläche empfängt
- Wie man Wertänderungen behandelt
- Wie man Material-UI Komponenten integriert
- Wie man Schema-Eigenschaften respektiert (label, help, placeholder, disabled)

## Entwicklungsmodus

Für die Entwicklung können Sie den Watch-Modus verwenden:

```bash
npm run watch:admin
```

Dies startet einen Entwicklungsserver, der Änderungen automatisch neu lädt.

## Build-Ausgabe

Die Build-Ausgabe wird nach `admin/custom/` geschrieben:

- `customComponents.js` - Die kompilierte Komponente
- `customComponents.js.map` - Source Map für Debugging
- `customComponents.js.LICENSE.txt` - Lizenzinformationen

**Wichtig**: Diese Dateien sind in `.gitignore` enthalten und werden nicht ins Repository eingecheckt. Sie müssen vor dem Deployment gebaut werden.

## Integration in ioBroker

### Automatischer Build

Um die Custom Components automatisch beim Adapter-Build zu bauen, kann man das `build` Script in der Haupt-`package.json` anpassen:

```json
"build": "build-adapter ts && npm run build:admin"
```

**Hinweis**: Aktuell ist der Build optional, da zuerst `npm run install:admin` ausgeführt werden muss.

### Deployment

Beim Deployment des Adapters:

1. Führen Sie `npm run install:admin` aus
2. Führen Sie `npm run build:admin` aus
3. Die generierten Dateien in `admin/custom/` werden automatisch mit dem Adapter verpackt

## Best Practices

1. **TypeScript verwenden**: Nutzen Sie TypeScript für Typ-Sicherheit
2. **Material-UI nutzen**: Verwenden Sie Material-UI Komponenten für konsistentes Design
3. **Props validieren**: Prüfen Sie Props auf Gültigkeit
4. **Fehlerbehandlung**: Implementieren Sie robuste Fehlerbehandlung
5. **JSDoc Kommentare**: Dokumentieren Sie Ihre Komponenten
6. **Testing**: Testen Sie Ihre Komponenten vor dem Deployment

## Fehlerbehebung

### Build schlägt fehl

Wenn der Build fehlschlägt:

1. Prüfen Sie, ob alle Abhängigkeiten installiert sind: `npm run install:admin`
2. Löschen Sie `src-admin/node_modules` und installieren Sie neu
3. Prüfen Sie die TypeScript-Fehler in der Konsole

### Component wird nicht geladen

Wenn die Component in der Admin-Oberfläche nicht geladen wird:

1. Prüfen Sie, ob der Build erfolgreich war
2. Prüfen Sie, ob `admin/custom/customComponents.js` existiert
3. Prüfen Sie die Browser-Konsole auf Fehler
4. Stellen Sie sicher, dass der Component-Name in `index.tsx` korrekt exportiert wird

### TypeScript-Fehler

Bei TypeScript-Fehlern:

1. Prüfen Sie die `tsconfig.json` Konfiguration
2. Stellen Sie sicher, dass alle Type Definitions installiert sind
3. Verwenden Sie `any` nur wenn unbedingt nötig

## Referenzen

- [ioBroker JSON Config Dokumentation](https://github.com/ioBroker/ioBroker.admin/blob/master/packages/jsonConfig/README.md#custom)
- [Material-UI Dokumentation](https://mui.com/)
- [React Dokumentation](https://react.dev/)
- [TypeScript Dokumentation](https://www.typescriptlang.org/)

## Unterstützung

Bei Fragen oder Problemen:

1. Prüfen Sie diese Dokumentation
2. Schauen Sie sich das `CustomTextField` Beispiel an
3. Erstellen Sie ein Issue auf GitHub
