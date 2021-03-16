# CHROME

## - Accept any certificate in chrome

type in chrome conole
```
sendCommand(SecurityInterstitialCommandId.CMD_PROCEED)
```

## vscode termianl big sur fix
```
codesign --remove-signature /Applications/Visual\ Studio\ Code.app/Contents/Frameworks/Code\ Helper\ \(Renderer\).app
```

## git vpn-split
```
git config --global url."git://".insteadOf https://
git config --global http.sslVerify false
# hmmmmmmmmm git remote ls suck
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

