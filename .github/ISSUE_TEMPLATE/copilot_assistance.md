---
name: Copilot Agent Assistance
about: Request help from GitHub Copilot Agent for NSPanel Lovelace UI issues
title: '[Copilot] '
labels: 'copilot-assistance'
assignees: ''
---

<!-- 
This template helps you provide all necessary information for successful Copilot Agent processing.
Please fill out all relevant sections. Both English and German descriptions are accepted.
-->

## Issue Description
**What do you want to achieve or what problem are you experiencing?**
<!-- Provide a clear, concise description of your goal or issue -->

**Expected behavior:**
<!-- What should happen? -->

**Current behavior:**
<!-- What actually happens? -->

## NSPanel Hardware & Setup
**NSPanel Model:**
- [ ] NSPanel (EU version)
- [ ] NSPanel Pro (US version)
- [ ] Other: ___________

**Firmware & Software Versions:**
- Adapter version: `x.x.x`
- Tasmota firmware version: `x.x.x`
- TFT firmware version: `x.x.x`
- ioBroker version: `x.x.x`
- Node.js version: `x.x.x`

**Panel Configuration:**
- Panel topic: `___________`
- IP address: `___________`
- MQTT broker: [ ] Built-in adapter MQTT server [ ] External broker
- Connection status: [ ] Connected [ ] Disconnected [ ] Intermittent

## Configuration Details
**Affected Components:** (check all that apply)
- [ ] Page configuration (cardGrid, cardEntities, etc.)
- [ ] PageItems (lights, shutters, buttons, etc.)
- [ ] Screensaver configuration
- [ ] MQTT communication
- [ ] External script configuration
- [ ] Device templates or state mapping
- [ ] Navigation or popup behavior
- [ ] Color themes or UI display
- [ ] Tasmota integration
- [ ] Weather integration

**Configuration Method:**
- [ ] Admin interface (JSON Config)
- [ ] External script via `sendTo()`
- [ ] Manual state configuration
- [ ] Template-based setup

## Technical Information
**Relevant State/Object IDs:**
<!-- List the specific ioBroker states or objects related to your issue -->
```
Example: hue.0.Livingroom.Lamp.level
panels.panel1.cmd.buzzer
```

**MQTT Topics:** (if relevant)
<!-- List relevant MQTT topics -->
```
Example: nspanel/panel1/cmnd/CustomSend
```

**Error Messages/Logs:**
<!-- Paste relevant log entries from ioBroker logs -->
```
[Paste logs here]
```

**Configuration Snippet:**
<!-- Share relevant parts of your panel configuration -->
```json
{
  "pages": [
    // Your configuration here
  ]
}
```

## Reproduction Steps
**If this is a bug, provide steps to reproduce:**
1. 
2. 
3. 
4. 

## Additional Context
**Screenshots:**
<!-- Attach screenshots of the NSPanel display, admin interface, or relevant UI -->

**Related Documentation:**
<!-- Link to wiki pages, forum posts, or documentation you've consulted -->
- [ ] I have checked the [NSPanel Wiki](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/wiki)
- [ ] I have reviewed existing issues and forum discussions
- [ ] I have checked the [ALIAS.md](https://github.com/ticaki/ioBroker.nspanel-lovelace-ui/blob/main/ALIAS.md) for state requirements

**Environment:**
- Operating System: ___________
- ioBroker installation type: [ ] Docker [ ] npm [ ] installer
- Other relevant adapters: ___________

**Additional Notes:**
<!-- Any other information that might help Copilot understand and address your issue -->

---
*Note: Please be as specific as possible. The more detailed information you provide, the better Copilot can assist with your NSPanel setup.*