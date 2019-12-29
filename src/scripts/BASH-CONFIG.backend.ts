import { Helpers } from '../helpers/index';
import { CLIWRAP } from './cli-wrapper.backend';

function $BASH_CONFIG_VNC_START() {
  console.log(`#!/bin/bash
xrdb $HOME/.Xresources
startxfce4 &
`);
  process.exit(0);
}

function $BASH_CONFIG_VNC_SERVICE() {
  const user = Helpers.run(`whoami`, { output: false }).sync().toString();
  // console.log('user:' + user)
  // process.exit(0);
  console.log(`[Unit]
Description=Start TightVNC server at startup
After=syslog.target network.target

[Service]
Type=forking
User=${user}
Group=${user}
WorkingDirectory=/home/${user}

PIDFile=/home/${user}/.vnc/%H:%i.pid
ExecStartPre=-/usr/bin/vncserver -kill :%i > /dev/null 2>&1
ExecStart=/usr/bin/vncserver -depth 24 -geometry 1280x800 :%i
ExecStop=/usr/bin/vncserver -kill :%i

[Install]
WantedBy=multi-user.target
  `);
  process.exit(0);
}

export default {

  $BASH_CONFIG_VNC_START: CLIWRAP($BASH_CONFIG_VNC_START, '$BASH_CONFIG_VNC_START'),
  $BASH_CONFIG_VNC_SERVICE: CLIWRAP($BASH_CONFIG_VNC_SERVICE, '$BASH_CONFIG_VNC_SERVICE'),

}
