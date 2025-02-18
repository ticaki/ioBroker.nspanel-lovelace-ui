const cmd = {
    up:'0_userdata.0.shutter_test.shutterup',
    down:'0_userdata.0.shutter_test.shutterdown',
    stop:'0_userdata.0.shutter_test.shutterstop',
    t_up:'0_userdata.0.shutter_test.tiltup',
    t_down:'0_userdata.0.shutter_test.tiltdown',
    t_stop:'0_userdata.0.shutter_test.tiltstop',
    t_level:'0_userdata.0.shutter_test.level_tilt',
    level:'0_userdata.0.shutter_test.level_blind',
}

const state = {
    t_value:'0_userdata.0.shutter_test.value_tilt',
    value:'0_userdata.0.shutter_test.value_blind',
}
const timeouts: {
    t_timeout: any;
    timeout: any;
} = {t_timeout: null, timeout: null}

for (const a in cmd) {
    on({id: cmd[a], change:'any'}, (obj) => {
        for (const a in cmd) {
            if (obj.id === cmd[a]) {
                const tilt = a.startsWith('t_');
                if (a.endsWith('level')) {
                    if (timeouts[(tilt?'t_':'') + 'timeout']) clearInterval(timeouts[(tilt?'t_':'') + 'timeout'])
                    setState(state[(tilt?'t_':'') + 'value'], obj.state.val, true)
                } else {
                    const f = a.replace('t_', '');
                    if (timeouts[(tilt?'t_':'') + 'timeout']) clearInterval(timeouts[(tilt?'t_':'') + 'timeout'])
                    if (a.endsWith('up')) {
                        position(tilt, true)
                    } else if (a.endsWith('down')) {
                        position(tilt, false)
                    }
                }
                break;
            }
        }
    })
}

function position(tilt:boolean, up: boolean) {
    timeouts[(tilt?'t_':'') + 'timeout'] = setInterval((tilt, up) => {
        let pos = getState(state[(tilt ? 't_' : '') + 'value']).val;
        pos = Math.round(pos/10 + (up ? -1 : +1)) * 10;
        if (up && pos <= 0) {
            setState(state[(tilt ? 't_' : '') + 'value'], 0);
            if (timeouts[(tilt?'t_':'') + 'timeout']) clearInterval(timeouts[(tilt?'t_':'') + 'timeout'])
            return;
        }
        if (!up && pos >= 100) {
            setState(state[(tilt ? 't_' : '') + 'value'], 100);
            if (timeouts[(tilt?'t_':'') + 'timeout']) clearInterval(timeouts[(tilt?'t_':'') + 'timeout'])
            return;
        }
       setState(state[(tilt ? 't_' : '') + 'value'], pos);
    },1000,tilt,up)
}