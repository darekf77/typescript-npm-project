# Getting Started

## Supported OS-es:
- Win10, Win11 (gitbash)
- MacOS (min. High Sierra)
- Linux (min. Ubuntnu 18)


## Required version of NodeJS** 
- Windows 10/11 (gitbash): >= v16 
- MacOS: >= v16
- Linux: >= v16

*lower versions of NodeJS are unofficialy 
support for MacOS/Linux


## How to install taon
```
npm i -g taon
```

## How to install taon Visual Studio Code extension
Go to: https://marketplace.visualstudio.com/items?itemName=taon.taon-vscode-ext

(WARNING before using *taon-vscode-ext*, please at lease once 
execute **any** command of **taon** in your temrinal)

<p style="text-align: center;border: 1px solid black;"><img src="../__assets/images/vscode-ext.png" ></p>

##  How to uninstall taon from local machine
Taon stores a big global container (in ~/.taon) for npm packages that are being shared 
accros all taon apps
```
npm uninstall -g taon
rm -rf ~/.taon  # taon local packages repository
```
