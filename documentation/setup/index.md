# Getting Started

## Required version of NodeJS** 
- Windows 10/11 (gitbash): >= v16 
- MacOS: >= v16
- Linux: >= v16

*lower versions of NodeJS are unofficialy 
support for MacOS/Linux


## How to install firedev
```
npm i -g firedev
```

## How to install firedev Visual Studio Code extension
Go to: https://marketplace.visualstudio.com/items?itemName=firedev.firedev-vscode-ext

(WARNING before using *firedev-vscode-ext*, please at lease once 
execute **any** command of **firedev** in your temrinal)

<p style="text-align: center;border: 1px solid black;"><img src="../__images/vscode-ext.png" ></p>

##  How to uninstall firedev from local machine
Firedev stores a big global container (in ~/.firedev) for npm packages that are being shared 
accros all firedev apps
```
npm uninstall -g firedev
rm -rf ~/.firedev  # firedev local packages repository
```
