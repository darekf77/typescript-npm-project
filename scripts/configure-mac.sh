xcode-select --install # Install Command Line Tools if you haven't already.
sudo xcode-select --switch /Library/Developer/CommandLineTools # Enable command line tools
# install XCode and make sure that is in /Application
sudo mdutil -a -i off # disalbe search  indexing
# or enable sudo mdutil -a -i on
nvm alias default node
nvm install 9.4
nvm use 9.4
nvm alias default
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
