xcode-select --install # Install Command Line Tools if you haven't already.
sudo xcode-select --switch /Library/Developer/CommandLineTools # Enable command line tools
# install XCode and make sure that is in /Application
sudo mdutil -a -i off # disalbe search  indexing
# or enable sudo mdutil -a -i on
nvm alias default node
nvm install 9.4
nvm use 9.4
npm install npm@latest -g
