# CHROME

## - Accept any certificate in chrome

type in chrome conole
```
sendCommand(SecurityInterstitialCommandId.CMD_PROCEED)
```

## - Inspect angular js element

```
angular.element($0).scope()
```

# MACBOOK

fix nvme sleep wake


`alt + command + p + r + power` 

```bash
sudo pmset -a hibernatemode 0 standby 0 autopoweroff 0
# or just ??
sudo pmset hibernatemode 0 standby 0
```

Default:
```bash
sudo pmset restoredefaults
pmset -g
```

