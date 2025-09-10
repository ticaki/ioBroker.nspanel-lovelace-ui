'use strict';

if (typeof goog !== 'undefined') {
    goog.provide('Blockly.JavaScript.Sendto');
    goog.require('Blockly.JavaScript');
}

// --- NSPanel Lovelace UI - PopupNotification
Blockly.Words['nspanel_popup_notification'] = {
    en: 'Show NSPanel popup',
    de: 'NSPanel Popup anzeigen',
    ru: 'Показать всплывающее окно NSPanel',
    pt: 'Mostrar popup NSPanel',
    nl: 'Toon NSPanel popup',
    fr: 'Afficher popup NSPanel',
    it: 'Mostra popup NSPanel',
    es: 'Mostrar popup NSPanel',
    pl: 'Pokaż popup NSPanel',
    'zh-cn': '显示NSPanel弹窗',
};

Blockly.Words['nspanel_popup_notification_instance'] = {
    en: 'Instance',
    de: 'Instanz',
    ru: 'Экземпляр',
    pt: 'Instância',
    nl: 'Instantie',
    fr: 'Instance',
    it: 'Istanza',
    es: 'Instancia',
    pl: 'Instancja',
    'zh-cn': '实例',
};

Blockly.Words['nspanel_popup_notification_panel'] = {
    en: 'Panel Topic (optional)',
    de: 'Panel Topic (optional)',
    ru: 'Тема панели (опционально)',
    pt: 'Tópico do Painel (opcional)',
    nl: 'Panel Onderwerp (optioneel)',
    fr: 'Sujet du panneau (optionnel)',
    it: 'Argomento del pannello (opzionale)',
    es: 'Tema del panel (opcional)',
    pl: 'Temat panelu (opcjonalny)',
    'zh-cn': '面板主题（可选）',
};

Blockly.Words['nspanel_popup_notification_headline'] = {
    en: 'Headline',
    de: 'Überschrift',
    ru: 'Заголовок',
    pt: 'Título',
    nl: 'Koptekst',
    fr: 'Titre',
    it: 'Titolo',
    es: 'Título',
    pl: 'Nagłówek',
    'zh-cn': '标题',
};

Blockly.Words['nspanel_popup_notification_text'] = {
    en: 'Text',
    de: 'Text',
    ru: 'Текст',
    pt: 'Texto',
    nl: 'Tekst',
    fr: 'Texte',
    it: 'Testo',
    es: 'Texto',
    pl: 'Tekst',
    'zh-cn': '文本',
};

Blockly.Words['nspanel_popup_notification_button_left'] = {
    en: 'Left Button',
    de: 'Linker Button',
    ru: 'Левая кнопка',
    pt: 'Botão Esquerdo',
    nl: 'Linker Knop',
    fr: 'Bouton Gauche',
    it: 'Pulsante Sinistro',
    es: 'Botón Izquierdo',
    pl: 'Lewy Przycisk',
    'zh-cn': '左按钮',
};

Blockly.Words['nspanel_popup_notification_button_right'] = {
    en: 'Right Button',
    de: 'Rechter Button',
    ru: 'Правая кнопка',
    pt: 'Botão Direito',
    nl: 'Rechter Knop',
    fr: 'Bouton Droit',
    it: 'Pulsante Destro',
    es: 'Botón Derecho',
    pl: 'Prawy Przycisk',
    'zh-cn': '右按钮',
};

Blockly.Words['nspanel_popup_notification_timeout'] = {
    en: 'Timeout (0 = no timeout)',
    de: 'Timeout (0 = kein Timeout)',
    ru: 'Таймаут (0 = без таймаута)',
    pt: 'Timeout (0 = sem timeout)',
    nl: 'Timeout (0 = geen timeout)',
    fr: "Délai d'attente (0 = pas de délai)",
    it: 'Timeout (0 = nessun timeout)',
    es: 'Tiempo de espera (0 = sin tiempo de espera)',
    pl: 'Timeout (0 = bez limitu czasu)',
    'zh-cn': '超时（0 = 无超时）',
};

Blockly.Words['nspanel_popup_notification_tooltip'] = {
    en: 'Send popup notification to NSPanel',
    de: 'Popup-Benachrichtigung an NSPanel senden',
    ru: 'Отправить всплывающее уведомление на NSPanel',
    pt: 'Enviar notificação popup para NSPanel',
    nl: 'Verzend popup notificatie naar NSPanel',
    fr: 'Envoyer une notification popup à NSPanel',
    it: 'Invia notifica popup a NSPanel',
    es: 'Enviar notificación popup a NSPanel',
    pl: 'Wyślij powiadomienie popup do NSPanel',
    'zh-cn': '向NSPanel发送弹窗通知',
};

Blockly.Words['nspanel_popup_notification_help'] = {
    en: 'https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/blob/main/README.md',
    de: 'https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/blob/main/README.md',
    ru: 'https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/blob/main/README.md',
};

Blockly.Blocks['nspanel_popup_notification'] = {
    init: function () {
        var options = [];
        if (typeof main !== 'undefined' && main.instances) {
            for (var i = 0; i < main.instances.length; i++) {
                if (main.instances[i].common.name === 'nspanel-lovelace-ui') {
                    options.push([
                        main.instances[i]._id.substring('system.adapter.'.length),
                        main.instances[i]._id.substring('system.adapter.'.length),
                    ]);
                }
            }
        }
        if (!options.length) {
            for (var j = 0; j <= 4; j++) {
                options.push([`nspanel-lovelace-ui.${j}`, `nspanel-lovelace-ui.${j}`]);
            }
        }

        this.appendDummyInput('INSTANCE')
            .appendField(Blockly.Words['nspanel_popup_notification'][systemLang])
            .appendField(new Blockly.FieldDropdown(options), 'INSTANCE');

        this.appendValueInput('PANEL').appendField(Blockly.Words['nspanel_popup_notification_panel'][systemLang]);

        this.appendValueInput('HEADLINE').appendField(Blockly.Words['nspanel_popup_notification_headline'][systemLang]);

        this.appendValueInput('TEXT').appendField(Blockly.Words['nspanel_popup_notification_text'][systemLang]);

        this.appendValueInput('BUTTON_LEFT').appendField(
            Blockly.Words['nspanel_popup_notification_button_left'][systemLang],
        );

        this.appendValueInput('BUTTON_RIGHT').appendField(
            Blockly.Words['nspanel_popup_notification_button_right'][systemLang],
        );

        this.appendValueInput('TIMEOUT').appendField(Blockly.Words['nspanel_popup_notification_timeout'][systemLang]);

        this.setInputsInline(false);
        this.setPreviousStatement(true, null);
        this.setNextStatement(true, null);
        this.setColour(Blockly.Sendto.HUE);
        this.setTooltip(Blockly.Words['nspanel_popup_notification_tooltip'][systemLang]);
        this.setHelpUrl(Blockly.Words['nspanel_popup_notification_help'][systemLang]);
    },
};

Blockly.JavaScript['nspanel_popup_notification'] = function (block) {
    var dropdown_instance = block.getFieldValue('INSTANCE');
    var value_panel = Blockly.JavaScript.valueToCode(block, 'PANEL', Blockly.JavaScript.ORDER_ATOMIC);
    var value_headline = Blockly.JavaScript.valueToCode(block, 'HEADLINE', Blockly.JavaScript.ORDER_ATOMIC);
    var value_text = Blockly.JavaScript.valueToCode(block, 'TEXT', Blockly.JavaScript.ORDER_ATOMIC);
    var value_button_left = Blockly.JavaScript.valueToCode(block, 'BUTTON_LEFT', Blockly.JavaScript.ORDER_ATOMIC);
    var value_button_right = Blockly.JavaScript.valueToCode(block, 'BUTTON_RIGHT', Blockly.JavaScript.ORDER_ATOMIC);
    var value_timeout = Blockly.JavaScript.valueToCode(block, 'TIMEOUT', Blockly.JavaScript.ORDER_ATOMIC);

    var code = `sendTo("${dropdown_instance}", "popupNotification", {\n`;
    if (value_panel) {
        code += `   panelTopic: ${value_panel},\n`;
    }
    if (value_headline) {
        code += `   headline: ${value_headline},\n`;
    }
    if (value_text) {
        code += `   text: ${value_text},\n`;
    }
    if (value_button_left) {
        code += `   buttonLeft: ${value_button_left},\n`;
    }
    if (value_button_right) {
        code += `   buttonRight: ${value_button_right},\n`;
    }
    if (value_timeout) {
        code += `   timeout: ${value_timeout}\n`;
    }
    code += '});\n';

    return code;
};
