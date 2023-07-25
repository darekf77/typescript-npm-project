# Nodejs on windows
```
npm install --global --production windows-build-tools@4.0.0
```

# engable git long pathes
```
git config --system core.longpaths true
```

# git proper end of line of windows
```
git config --global core.autocrlf false
```

# for problem with npm i (NOT TESTED)
```
git config --global url."https://".insteadOf git://
```


# remnove xbox shit 

https://techjury.net/blog/how-to-uninstall-xbox-game-bar/#gref

To open the program:

Press the Windows Start button and search for “PowerShell.”
Right-click on it and select Run as administrator.
When the Windows PowerShell command bar opens, enter the following code to see the packages that are on your system:
```
dism /Online /Get-ProvisionedAppxPackages | Select-String PackageName | Select-String xbox
```
You can then uninstall the Xbox game bar windows 10 or 11 via DISM (Deployment Image Servicing and Management) or cmdlet commands:
DISM version
```
dism /Online /Get-ProvisionedAppxPackages | `

Select-String PackageName | `

Select-String xbox | `

ForEach-Object {$_.Line.Split(':')[1].Trim()} | `

ForEach-Object { dism /Online /Remove-ProvisionedAppxPackage /PackageName:$_}
```

# win 11 install without intenret

fn shift f10
OOBE\BYPASSNRO



