# macos cheat sheet

```
xcode-select --install # Install Command Line Tools if you haven't already.
sudo xcode-select --switch /Library/Developer/CommandLineTools # Enable command line tools
# install XCode and make sure that is in /Application
sudo mdutil -a -i off # disalbe search  indexing
# or enable sudo mdutil -a -i on
nvm install 9.4
nvm use 9.4
nvm alias default 9.4
npm install npm@latest -g
git config --global core.editor code --wait

# disable eject message
# /System/Library/LaunchDaemons/com.apple.UserNotificationCenter.plist: Operation not permitted# while System Integrity Protection is engag
sudo launchctl unload -w /System/Library/LaunchDaemons/com.apple.UserNotificationCenter.plist

# brew
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
# macports
https://guide.macports.org/#installing

# disable spotlight
 sudo launchctl unload -w /System/Library/LaunchDaemons/com.apple.metadata.mds.plist
# or enable
sudo launchctl load -w /System/Library/LaunchDaemons/com.apple.metadata.mds.plist



# disk temp
brew install smartmontools
diskutil list # slect disk
smartctl -a disk1 | grep Temperature


# disable batter plug in sound
defaults write com.apple.PowerChime ChimeOnNoHardware -bool true
killall PowerChime

# default shell bash
chsh -s /bin/bash

```

# NODE 12
brew install pkg-config cairo pango libpng jpeg giflib librsvg libvips vips
arch -x86_64 brew install pkg-config cairo pango libpng jpeg giflib librsvg libvips vips

